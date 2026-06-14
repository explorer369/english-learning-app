import { describe, it, expect, afterEach, vi } from "vitest";
import { tick } from "svelte";
import StudyView from "../src/components/StudyView.svelte";
import { WordService } from "../src/services/WordService";
import { InMemoryWordRepository } from "../src/services/WordRepository";
import type { SpeechService } from "../src/services/SpeechService";

let target: HTMLElement | null = null;
afterEach(() => {
  target?.remove();
  target = null;
});

function fakeSpeech(supported = true): SpeechService & { speak: ReturnType<typeof vi.fn> } {
  return {
    isSupported: () => supported,
    speak: vi.fn(),
    cancel: vi.fn(),
  };
}

async function mount(service: WordService, speech: SpeechService) {
  target = document.createElement("div");
  document.body.appendChild(target);
  const instance = new StudyView({ target, props: { service, speech } });
  // 显式触发加载并等待 Svelte DOM 刷新，避免依赖 onMount 时机
  await (instance as any).reload();
  await tick();
  return target!;
}

const flush = () => tick();

describe("StudyView", () => {
  it("空词库显示提示", async () => {
    const svc = new WordService(new InMemoryWordRepository());
    const t = await mount(svc, fakeSpeech());
    expect(t.querySelector('[data-testid="empty"]')).not.toBeNull();
  });

  it("导航切换单词并更新进度", async () => {
    const svc = new WordService(new InMemoryWordRepository());
    await svc.addWord({ spelling: "alpha" });
    await svc.addWord({ spelling: "beta" });
    const t = await mount(svc, fakeSpeech());
    expect(t.querySelector('[data-testid="progress"]')!.textContent).toContain("1 / 2");
    t.querySelector<HTMLButtonElement>('[data-testid="btn-next"]')!.click();
    await flush();
    expect(t.querySelector('[data-testid="progress"]')!.textContent).toContain("2 / 2");
    expect(t.querySelector('[data-testid="row-word"]')!.textContent).toContain("beta");
  });

  it("点击单词调用 speech.speak", async () => {
    const svc = new WordService(new InMemoryWordRepository());
    await svc.addWord({ spelling: "gamma" });
    const speech = fakeSpeech();
    const t = await mount(svc, speech);
    (t.querySelector('[data-testid="row-word"]') as HTMLElement).click();
    expect(speech.speak).toHaveBeenCalledWith("gamma");
  });

  it("侧栏列出单词，点击切换到该词", async () => {
    const svc = new WordService(new InMemoryWordRepository());
    await svc.addWord({ spelling: "alpha", translation: "甲" });
    await svc.addWord({ spelling: "beta", translation: "乙" });
    await svc.addWord({ spelling: "gamma", translation: "丙" });
    const t = await mount(svc, fakeSpeech());
    const sidebar = t.querySelector('[data-testid="word-sidebar"]')!;
    expect(sidebar.querySelectorAll("li").length).toBe(3);
    // 点击侧栏中的 alpha，主区应显示 alpha
    t.querySelector<HTMLButtonElement>('[data-testid="list-item-alpha"]')!.click();
    await flush();
    expect(t.querySelector('[data-testid="row-word"]')!.textContent).toContain("alpha");
    expect(t.querySelector('[data-testid="progress"]')!.textContent).toContain("1 / 3");
  });

  it("按分组筛选只显示该组单词", async () => {
    const svc = new WordService(new InMemoryWordRepository());
    await svc.addWord({ spelling: "apple", group: "水果" });
    await svc.addWord({ spelling: "banana", group: "水果" });
    await svc.addWord({ spelling: "dog", group: "动物" });
    const t = await mount(svc, fakeSpeech());
    const select = t.querySelector<HTMLSelectElement>('[data-testid="group-filter"]')!;
    // 选择“动物”组
    select.value = "动物";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    const sidebar = t.querySelector('[data-testid="word-sidebar"]')!;
    expect(sidebar.querySelectorAll("li").length).toBe(1);
    expect(t.querySelector('[data-testid="row-word"]')!.textContent).toContain("dog");
    expect(t.querySelector('[data-testid="progress"]')!.textContent).toContain("1 / 1");
  });
});
