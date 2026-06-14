import { describe, it, expect, beforeEach } from "vitest";
import { WordService } from "../src/services/WordService";
import { InMemoryWordRepository } from "../src/services/WordRepository";
import { migrateWord, normalizeGroup, validateWord } from "../src/utils/word";
import type { Word } from "../src/types";

describe("分组工具", () => {
  it("normalizeGroup 去空格、缺省为空串", () => {
    expect(normalizeGroup("  单元一 ")).toBe("单元一");
    expect(normalizeGroup(undefined)).toBe("");
  });

  it("migrateWord 为旧数据补 group=''", () => {
    const old = {
      id: "a",
      spelling: "a",
      normalizedSpelling: "a",
      phonetic: "",
      translation: "",
      homophone: "",
      syllables: [],
      createdAt: 1,
      updatedAt: 1,
    } as unknown as Word;
    expect(migrateWord(old).group).toBe("");
  });

  it("validateWord 接受缺省 group 与字符串 group", () => {
    const base = {
      id: "a",
      spelling: "a",
      normalizedSpelling: "a",
      phonetic: "",
      translation: "",
      homophone: "",
      syllables: [],
      createdAt: 1,
      updatedAt: 1,
    } as unknown as Word;
    expect(validateWord(base)).toBe(true); // 无 group
    expect(validateWord({ ...base, group: "U1" })).toBe(true);
    expect(validateWord({ ...base, group: 123 as unknown as string })).toBe(false);
  });
});

describe("WordService 分组", () => {
  let svc: WordService;
  beforeEach(() => {
    svc = new WordService(new InMemoryWordRepository());
  });

  it("录入时保存分组（去空格）", async () => {
    const w = await svc.addWord({ spelling: "banana", group: " 水果 " });
    expect(w.group).toBe("水果");
  });

  it("listGroups 返回去重且排序的非空分组", async () => {
    await svc.addWord({ spelling: "a", group: "B组" });
    await svc.addWord({ spelling: "b", group: "A组" });
    await svc.addWord({ spelling: "c", group: "B组" });
    await svc.addWord({ spelling: "d" }); // 无分组
    const groups = await svc.listGroups();
    expect(groups).toEqual(["A组", "B组"]);
  });

  it("updateWord 可修改分组且不影响其它字段", async () => {
    const w = await svc.addWord({ spelling: "x", translation: "原译", group: "旧组" });
    const u = await svc.updateWord(w.id, { group: "新组" });
    expect(u.group).toBe("新组");
    expect(u.translation).toBe("原译");
  });

  it("updateWord 不传 group 时保留原分组", async () => {
    const w = await svc.addWord({ spelling: "y", group: "保留组" });
    const u = await svc.updateWord(w.id, { translation: "翻译" });
    expect(u.group).toBe("保留组");
  });
});
