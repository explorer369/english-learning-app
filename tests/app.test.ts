import { describe, it, expect, afterEach } from "vitest";
import { tick } from "svelte";
import App from "../src/App.svelte";

let target: HTMLElement | null = null;
afterEach(() => {
  target?.remove();
  target = null;
});

async function mount() {
  target = document.createElement("div");
  document.body.appendChild(target);
  new App({ target });
  // 等待 {#await} 初始化完成（学习页空态或卡片出现）
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 5));
    await tick();
    if (target.querySelector('[data-testid="empty"]') || target.querySelector('[data-testid="word-card"]')) {
      break;
    }
  }
  return target!;
}

describe("App 外壳与导航", () => {
  it("渲染三个导航标签", async () => {
    const t = await mount();
    expect(t.querySelector('[data-testid="tab-study"]')).not.toBeNull();
    expect(t.querySelector('[data-testid="tab-entry"]')).not.toBeNull();
    expect(t.querySelector('[data-testid="tab-library"]')).not.toBeNull();
  });

  it("切换到添加单词页显示录入表单", async () => {
    const t = await mount();
    t.querySelector<HTMLButtonElement>('[data-testid="tab-entry"]')!.click();
    await tick();
    expect(t.querySelector('[data-testid="in-spelling"]')).not.toBeNull();
  });

  it("切换到词库页显示导入导出", async () => {
    const t = await mount();
    t.querySelector<HTMLButtonElement>('[data-testid="tab-library"]')!.click();
    await tick();
    expect(t.querySelector('[data-testid="btn-export"]')).not.toBeNull();
  });
});
