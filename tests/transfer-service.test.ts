import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  mergeWords,
  resolveConflict,
  parseLibrary,
  buildExport,
  ParseError,
} from "../src/services/TransferService";
import type { MergeStrategy, Word } from "../src/types";

function makeWord(spelling: string, updatedAt: number, translation = ""): Word {
  const ns = spelling.trim().toLowerCase();
  return {
    id: ns,
    spelling,
    normalizedSpelling: ns,
    phonetic: "",
    translation,
    homophone: "",
    syllables: [],
    group: "",
    createdAt: 1,
    updatedAt,
  };
}

describe("parseLibrary", () => {
  it("非 JSON 抛 ParseError", () => {
    expect(() => parseLibrary("not json")).toThrow(ParseError);
  });
  it("app/version 不匹配抛 ParseError", () => {
    expect(() => parseLibrary(JSON.stringify({ app: "x", schemaVersion: 1, words: [] }))).toThrow(
      ParseError,
    );
  });
  it("合法导出可解析", () => {
    const exp = buildExport([makeWord("a", 1)]);
    expect(parseLibrary(JSON.stringify(exp))).toHaveLength(1);
  });
});

describe("mergeWords 合并计数", () => {
  it("新增、更新、跳过、失败计数正确", () => {
    const local = [makeWord("a", 1000)];
    const imported = [
      makeWord("a", 2000), // 更新（keepNewer）
      makeWord("b", 1000), // 新增
      { spelling: "  ", normalizedSpelling: "", id: "x" } as unknown as Word, // 失败
    ];
    const { result } = mergeWords(local, imported, "keepNewer");
    expect(result.added).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.failed).toBe(1);
  });

  it("keepLocal 保留本地", () => {
    const w = resolveConflict(makeWord("a", 1000), makeWord("a", 5000), "keepLocal");
    expect(w.updatedAt).toBe(1000);
  });
  it("keepImported 采用导入", () => {
    const w = resolveConflict(makeWord("a", 1000), makeWord("a", 5000), "keepImported");
    expect(w.updatedAt).toBe(5000);
  });
});

describe("TransferService 属性测试 (PBT)", () => {
  const wordArb = fc
    .tuple(
      fc.string({ minLength: 1, maxLength: 6 }).filter((s) => s.trim() !== ""),
      fc.integer({ min: 1, max: 1_000_000 }),
    )
    .map(([s, t]) => makeWord(s.trim().toLowerCase(), t));

  // 生成 normalizedSpelling 唯一的词库
  const libraryArb = fc.array(wordArb, { maxLength: 20 }).map((words) => {
    const seen = new Map<string, Word>();
    for (const w of words) seen.set(w.normalizedSpelling, w);
    return [...seen.values()];
  });

  it("Property 1: 导出-导入往返等价（合并到空库）", () => {
    fc.assert(
      fc.property(libraryArb, (lib) => {
        const text = JSON.stringify(buildExport(lib));
        const parsed = parseLibrary(text);
        const { toWrite } = mergeWords([], parsed, "keepNewer");
        const a = [...toWrite].sort((x, y) => x.id.localeCompare(y.id));
        const b = [...lib].sort((x, y) => x.id.localeCompare(y.id));
        return JSON.stringify(a) === JSON.stringify(b);
      }),
    );
  });

  it("Property 2: 导入幂等（第二次 added==0 且无变化）", () => {
    fc.assert(
      fc.property(libraryArb, (lib) => {
        const first = mergeWords([], lib, "keepNewer");
        const second = mergeWords(first.toWrite, lib, "keepNewer");
        return second.result.added === 0 && second.toWrite.length === 0;
      }),
    );
  });

  it("Property 4: keepNewer 保留 updatedAt 较大者", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (t1, t2) => {
          const local = makeWord("same", t1);
          const imported = makeWord("same", t2);
          const winner = resolveConflict(local, imported, "keepNewer");
          return winner.updatedAt === Math.max(t1, t2);
        },
      ),
    );
  });
});
