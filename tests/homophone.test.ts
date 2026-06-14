import { describe, it, expect } from "vitest";
import { generateHomophone } from "../src/utils/homophone";

describe("generateHomophone", () => {
  it("为音节生成非空中文近似音", () => {
    const h = generateHomophone(["ba", "na", "na"]);
    expect(h.length).toBeGreaterThan(0);
    // 含中文字符
    expect(/[\u4e00-\u9fff]/.test(h)).toBe(true);
  });

  it("空输入返回空串", () => {
    expect(generateHomophone([])).toBe("");
  });

  it("用·分隔多个音节", () => {
    const h = generateHomophone(["com", "pu", "ter"]);
    expect(h).toContain("·");
  });
});
