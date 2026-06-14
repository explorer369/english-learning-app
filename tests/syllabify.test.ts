import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { syllabify } from "../src/utils/syllabify";

describe("syllabify", () => {
  it("常见词拆分为多个片段", () => {
    expect(syllabify("banana").length).toBeGreaterThanOrEqual(2);
    expect(syllabify("computer").length).toBeGreaterThanOrEqual(2);
  });

  it("片段拼接等于原词", () => {
    for (const w of ["banana", "computer", "apple", "education", "rhythm"]) {
      expect(syllabify(w).join("")).toBe(w);
    }
  });

  it("无元音或单元音返回整词", () => {
    expect(syllabify("cat")).toEqual(["cat"]);
    expect(syllabify("hmm")).toEqual(["hmm"]);
  });

  it("空串返回空数组", () => {
    expect(syllabify("")).toEqual([]);
  });

  it("Property: 任意小写字母串拆分后拼接还原", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z]{1,15}$/),
        (w) => syllabify(w).join("") === w,
      ),
    );
  });
});
