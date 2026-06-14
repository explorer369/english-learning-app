import { describe, it, expect, beforeEach } from "vitest";
import {
  IndexedDbWordRepository,
  InMemoryWordRepository,
} from "../src/services/WordRepository";
import type { Word } from "../src/types";

function makeWord(spelling: string, updatedAt = 1000): Word {
  const ns = spelling.trim().toLowerCase();
  return {
    id: ns,
    spelling,
    normalizedSpelling: ns,
    phonetic: "",
    translation: "",
    homophone: "",
    syllables: [],
    group: "",
    createdAt: 1000,
    updatedAt,
  };
}

// 在 IndexedDB（fake-indexeddb）与内存实现上跑同一套契约测试
const factories = {
  IndexedDb: async () => {
    // 每个用例使用全新数据库名以隔离
    const repo = new IndexedDbWordRepository();
    await repo.open();
    // 清空（fake-indexeddb 在每次 import 后保持，需删除）
    const all = await repo.getAll();
    for (const w of all) await repo.delete(w.id);
    return repo;
  },
  InMemory: async () => new InMemoryWordRepository(),
};

for (const [name, factory] of Object.entries(factories)) {
  describe(`WordRepository (${name})`, () => {
    let repo: Awaited<ReturnType<typeof factory>>;

    beforeEach(async () => {
      repo = await factory();
    });

    it("put 与 get 往返一致", async () => {
      const w = makeWord("banana");
      await repo.put(w);
      expect(await repo.get("banana")).toEqual(w);
    });

    it("getByNormalizedSpelling 命中", async () => {
      await repo.put(makeWord("Apple"));
      const found = await repo.getByNormalizedSpelling("apple");
      expect(found?.spelling).toBe("Apple");
    });

    it("getAll 与 count 一致", async () => {
      await repo.put(makeWord("a"));
      await repo.put(makeWord("b"));
      expect(await repo.count()).toBe(2);
      expect((await repo.getAll()).length).toBe(2);
    });

    it("bulkUpsert 批量写入与覆盖", async () => {
      await repo.put(makeWord("a", 1000));
      await repo.bulkUpsert([makeWord("a", 2000), makeWord("b", 1000)]);
      expect(await repo.count()).toBe(2);
      expect((await repo.get("a"))?.updatedAt).toBe(2000);
    });

    it("delete 删除", async () => {
      await repo.put(makeWord("a"));
      await repo.delete("a");
      expect(await repo.get("a")).toBeUndefined();
    });
  });
}
