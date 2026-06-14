// WordRepository：IndexedDB 持久化封装，IndexedDB 不可用时降级为内存存储。

import type { Word } from "../types";

export interface WordRepository {
  open(): Promise<void>;
  get(id: string): Promise<Word | undefined>;
  getByNormalizedSpelling(ns: string): Promise<Word | undefined>;
  getAll(): Promise<Word[]>;
  put(word: Word): Promise<void>;
  bulkUpsert(words: Word[]): Promise<void>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}

const DB_NAME = "english-learning-app";
const STORE = "words";
const DB_VERSION = 1;

/** 基于 IndexedDB 的实现 */
export class IndexedDbWordRepository implements WordRepository {
  private db: IDBDatabase | null = null;

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("by_normalizedSpelling", "normalizedSpelling", {
            unique: true,
          });
          store.createIndex("by_updatedAt", "updatedAt", { unique: false });
        }
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  private tx(mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error("Repository not opened");
    return this.db.transaction(STORE, mode).objectStore(STORE);
  }

  private wrap<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  get(id: string): Promise<Word | undefined> {
    return this.wrap(this.tx("readonly").get(id) as IDBRequest<Word | undefined>);
  }

  getByNormalizedSpelling(ns: string): Promise<Word | undefined> {
    const index = this.tx("readonly").index("by_normalizedSpelling");
    return this.wrap(index.get(ns) as IDBRequest<Word | undefined>);
  }

  getAll(): Promise<Word[]> {
    return this.wrap(this.tx("readonly").getAll() as IDBRequest<Word[]>);
  }

  put(word: Word): Promise<void> {
    return this.wrap(this.tx("readwrite").put(word) as IDBRequest).then(() => undefined);
  }

  bulkUpsert(words: Word[]): Promise<void> {
    if (!this.db) throw new Error("Repository not opened");
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const w of words) store.put(w);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  delete(id: string): Promise<void> {
    return this.wrap(this.tx("readwrite").delete(id) as IDBRequest).then(() => undefined);
  }

  count(): Promise<number> {
    return this.wrap(this.tx("readonly").count() as IDBRequest<number>);
  }
}

/** 内存实现：IndexedDB 不可用时的降级方案（数据不持久化） */
export class InMemoryWordRepository implements WordRepository {
  private map = new Map<string, Word>();

  async open(): Promise<void> {
    /* no-op */
  }

  async get(id: string): Promise<Word | undefined> {
    return this.map.get(id);
  }

  async getByNormalizedSpelling(ns: string): Promise<Word | undefined> {
    for (const w of this.map.values()) {
      if (w.normalizedSpelling === ns) return w;
    }
    return undefined;
  }

  async getAll(): Promise<Word[]> {
    return [...this.map.values()];
  }

  async put(word: Word): Promise<void> {
    this.map.set(word.id, word);
  }

  async bulkUpsert(words: Word[]): Promise<void> {
    for (const w of words) this.map.set(w.id, w);
  }

  async delete(id: string): Promise<void> {
    this.map.delete(id);
  }

  async count(): Promise<number> {
    return this.map.size;
  }
}

/** 检测 IndexedDB 是否可用 */
export function isIndexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

/** 工厂：优先 IndexedDB，不可用时降级内存。 */
export async function createWordRepository(): Promise<WordRepository> {
  if (isIndexedDbAvailable()) {
    try {
      const repo = new IndexedDbWordRepository();
      await repo.open();
      return repo;
    } catch {
      // 打开失败时降级
    }
  }
  return new InMemoryWordRepository();
}
