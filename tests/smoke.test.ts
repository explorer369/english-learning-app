import { describe, it, expect } from "vitest";

// 脚手架占位测试：验证测试运行器、fake-indexeddb 与 fast-check 工具链均可用。
describe("脚手架冒烟测试", () => {
  it("测试运行器工作正常", () => {
    expect(1 + 1).toBe(2);
  });

  it("fake-indexeddb 已注入全局 indexedDB", () => {
    expect(typeof indexedDB).not.toBe("undefined");
  });

  it("fast-check 可正常导入并运行属性", async () => {
    const fc = await import("fast-check");
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => a + b === b + a),
    );
  });
});
