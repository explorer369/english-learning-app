import { describe, it, expect, afterEach, vi } from "vitest";
import SpeakButton from "../src/components/SpeakButton.svelte";
import SyllableBreakdown from "../src/components/SyllableBreakdown.svelte";
import { PALETTE } from "../src/services/SyllableService";

let target: HTMLElement | null = null;
afterEach(() => {
  target?.remove();
  target = null;
});

function mount(Component: any, props: Record<string, unknown>) {
  target = document.createElement("div");
  document.body.appendChild(target);
  const instance = new Component({ target, props });
  return { instance, target: target! };
}

describe("SpeakButton", () => {
  it("启用时点击触发回调", () => {
    const onClick = vi.fn();
    const { target } = mount(SpeakButton, { enabled: true, onClick });
    const btn = target.querySelector<HTMLButtonElement>(
      '[data-testid="speak-button"]',
    )!;
    expect(btn.disabled).toBe(false);
    btn.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("禁用时置灰且不触发回调", () => {
    const onClick = vi.fn();
    const { target } = mount(SpeakButton, { enabled: false, onClick });
    const btn = target.querySelector<HTMLButtonElement>(
      '[data-testid="speak-button"]',
    )!;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain("不支持");
    btn.click();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("SyllableBreakdown", () => {
  it("按 colorGroup 着色并插入分隔符", () => {
    const { target } = mount(SyllableBreakdown, {
      units: [
        { text: "ba", colorGroup: 0 },
        { text: "na", colorGroup: 1 },
        { text: "na", colorGroup: 2 },
      ],
    });
    const units = target.querySelectorAll(".unit");
    expect(units.length).toBe(3);
    expect(units[0].textContent).toBe("ba");
    // 第一个单元用调色板第 0 色
    expect((units[0] as HTMLElement).style.color).not.toBe("");
    const seps = target.querySelectorAll(".sep");
    expect(seps.length).toBe(2); // 三个单元之间两个分隔符
  });

  it("空单元列表不报错", () => {
    const { target } = mount(SyllableBreakdown, { units: [] });
    expect(target.querySelectorAll(".unit").length).toBe(0);
  });
});

describe("PALETTE", () => {
  it("至少两种颜色以保证相邻不同色", () => {
    expect(PALETTE.length).toBeGreaterThanOrEqual(2);
  });
});
