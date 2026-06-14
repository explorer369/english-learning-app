// TransferService：词库 JSON 导入 / 导出与合并去重

import type {
  ImportResult,
  LibraryExport,
  MergeStrategy,
  Word,
} from "../types";
import type { WordRepository } from "./WordRepository";
import { validateWord, migrateWord } from "../utils/word";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

const APP_ID = "english-learning-app";
const SCHEMA_VERSION = 1;

/** 决定冲突时保留哪个单词 */
export function resolveConflict(
  local: Word,
  imported: Word,
  strategy: MergeStrategy,
): Word {
  if (strategy === "keepLocal") return local;
  if (strategy === "keepImported") return imported;
  // keepNewer：取 updatedAt 较大者，相等则保留本地
  return imported.updatedAt > local.updatedAt ? imported : local;
}

/** 把词库组装为导出对象 */
export function buildExport(words: Word[]): LibraryExport {
  return {
    schemaVersion: SCHEMA_VERSION,
    app: APP_ID,
    exportedAt: Date.now(),
    words,
  };
}

/** 解析并校验导出文件内容，返回单词列表（结构非法时抛 ParseError） */
export function parseLibrary(text: string): Word[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ParseError("文件不是合法的 JSON");
  }
  const obj = data as Partial<LibraryExport>;
  if (obj.app !== APP_ID || obj.schemaVersion !== SCHEMA_VERSION) {
    throw new ParseError("文件来源或版本不匹配");
  }
  if (!Array.isArray(obj.words)) {
    throw new ParseError("文件缺少 words 列表");
  }
  return obj.words as Word[];
}

/**
 * 纯函数式合并：给定本地词库与导入单词，返回需要写入的单词与统计。
 * 便于属性测试与单元测试。
 */
export function mergeWords(
  local: Word[],
  imported: Word[],
  strategy: MergeStrategy,
): { toWrite: Word[]; result: ImportResult } {
  const result: ImportResult = {
    added: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };
  const byNs = new Map<string, Word>();
  for (const w of local) byNs.set(w.normalizedSpelling, w);

  const toWrite: Word[] = [];
  for (const raw of imported) {
    if (!validateWord(raw)) {
      result.failed++;
      result.errors.push(raw?.spelling ?? "(无效条目)");
      continue;
    }
    // 补齐缺省字段（旧导出可能没有 group）
    const w = migrateWord(raw);
    const existing = byNs.get(w.normalizedSpelling);
    if (!existing) {
      toWrite.push(w);
      byNs.set(w.normalizedSpelling, w);
      result.added++;
    } else {
      const winner = resolveConflict(existing, w, strategy);
      if (winner === existing) {
        result.skipped++;
      } else {
        toWrite.push(winner);
        byNs.set(w.normalizedSpelling, winner);
        result.updated++;
      }
    }
  }
  return { toWrite, result };
}

/** 触发浏览器下载（可注入以便测试） */
export type Downloader = (blob: Blob, filename: string) => void;

function defaultDownloader(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function dateStamp(ts = Date.now()): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export class TransferService {
  constructor(
    private repo: WordRepository,
    private downloader: Downloader = defaultDownloader,
  ) {}

  async exportLibrary(): Promise<void> {
    const words = await this.repo.getAll();
    const payload = buildExport(words);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    this.downloader(blob, `wordlib-${dateStamp()}.json`);
  }

  async importLibrary(
    file: File,
    strategy: MergeStrategy = "keepNewer",
  ): Promise<ImportResult> {
    const text = await file.text();
    const importedWords = parseLibrary(text);
    const local = await this.repo.getAll();
    const { toWrite, result } = mergeWords(local, importedWords, strategy);
    if (toWrite.length > 0) await this.repo.bulkUpsert(toWrite);
    return result;
  }
}
