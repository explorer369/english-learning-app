import { describe, it, expect } from "vitest";
import { normalizeSpelling, validateWord } from "../src/utils/word";
import type { Word } from "../src/types";

function makeWord(overrides: Partial<Word> = {}): Word {
  const spelling = overrides.spelling ?? "Banana";
  const ns = spelling.trim().toLowerCase();
  return {
    id: ns,
    spelling,
    normalizedSpelling: ns,
    phonetic: "/bəˈnɑːnə/",
    translation: "香蕉",
    homophone: "拔那那",
    syllables: [
      { text: "ba", colorGroup: 0 },
      { text: "na", colorGroup: 1 },
      { text: "na", colorGroup: 2 },
    ],
    group: "",
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

describe("normalizeSpelling", () => {
  it("去除首尾空格并转小写", () => {
    expect(normalizeSpelling("  Banana ")).toBe("banana");
    expect(normalizeSpelling("HELLO")).toBe("hello");
  });
});

describe("validateWord", () => {
  it("合法单词通过校验", () => {
    expect(validateWord(makeWord())).toBe(true);
  });

  it("空白拼写不通过", () => {
    expect(validateWord(makeWord({ spelling: "   ", normalizedSpelling: "" }))).toBe(false);
  });

  it("createdAt 大于 updatedAt 不通过", () => {
    expect(validateWord(makeWord({ createdAt: 2000, updatedAt: 1000 }))).toBe(false);
  });

  it("音节 text 为空不通过", () => {
    expect(validateWord(makeWord({ syllables: [{ text: "", colorGroup: 0 }] }))).toBe(false);
  });

  it("colorGroup 为负不通过", () => {
    expect(validateWord(makeWord({ syllables: [{ text: "ba", colorGroup: -1 }] }))).toBe(false);
  });

  it("normalizedSpelling 与拼写不一致不通过", () => {
    expect(validateWord(makeWord({ normalizedSpelling: "wrong" }))).toBe(false);
  });
});
