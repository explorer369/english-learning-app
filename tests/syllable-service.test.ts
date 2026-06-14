import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  SyllableService,
  assignColorGroups,
  PALETTE,
} from "../src/services/SyllableService";
import type { SyllableUnit, Word } from "../src/types";

function makeWord(spelling: string, syllables: SyllableUnit[]): Word {
  const ns = spelling.toLowerCase();
  return {
    id: ns,
    spelling,
    normalizedSpelling: ns,
    phonetic: "",
    translation: "",
    homophone: "",
    syllables,
    group: "",
    createdAt: 1,
    updatedAt: 1,
  };
}

describe("SyllableService 基本行为", () => {
  const svc = new SyllableService();

  it("无拆分数据时返回整词单元", () => {
    const units = svc.split(makeWord("banana", []));
    expect(units).toHaveLength(1);
    expect(units[0].text).toBe("banana");
  });

  it("有拆分数据时分配相邻不同色", () => {
    const units = svc.split(
      makeWord("banana", [
        { text: "ba", colorGroup: 0 },
        { text: "na", colorGroup: 0 },
        { text: "na", colorGroup: 0 },
      ]),
    );
    expect(units.map((u) => u.colorGroup)).toEqual([0, 1, 2]);
  });

  it("colorOf 循环取色且不越界", () => {
    expect(svc.colorOf(0)).toBe(PALETTE[0]);
    expect(svc.colorOf(PALETTE.length)).toBe(PALETTE[0]);
  });
});

describe("SyllableService 属性测试 (PBT)", () => {
  const unitArb = fc.record({
    text: fc.string({ minLength: 1, maxLength: 4 }),
    colorGroup: fc.integer({ min: 0, max: 9 }),
  });

  it("Property 6: 相邻单元 colorGroup 不相等", () => {
    fc.assert(
      fc.property(fc.array(unitArb, { minLength: 1, maxLength: 20 }), (units) => {
        const colored = assignColorGroups(units);
        for (let i = 1; i < colored.length; i++) {
          if (colored[i].colorGroup === colored[i - 1].colorGroup) return false;
        }
        return true;
      }),
    );
  });

  it("Property 5: 各单元 text 顺序拼接等于原拼写", () => {
    fc.assert(
      fc.property(fc.array(unitArb, { minLength: 1, maxLength: 20 }), (units) => {
        const spelling = units.map((u) => u.text).join("");
        const word = makeWord(spelling, units);
        const svc = new SyllableService();
        const result = svc.split(word);
        return result.map((u) => u.text).join("") === spelling;
      }),
    );
  });
});
