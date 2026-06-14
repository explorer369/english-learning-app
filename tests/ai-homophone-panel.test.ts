import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { tick } from "svelte";
import AiHomophonePanel from "../src/components/AiHomophonePanel.svelte";
import { WordService } from "../src/services/WordService";
import { InMemoryWordRepository } from "../src/services/WordRepository";
import { AIService } from "../src/services/AIService";

let target: HTMLElement | null = null;

beforeEach(() => {
  // 预置已配置的 AI 设置
  localStorage.setItem(
    "elearn-ai-settings",
    JSON.stringify({ baseUrl: "https://api.x/v1", apiKey: "sk-1", model: "m" }),
  );
});
afterEach(() => {
  target?.remove();
  target = null;
  localStorage.clear();
});

function mount(service: WordService, ai: AIService) {
  target = document.createElement("div");
  document.body.appendChild(target);
  new AiHomophonePanel({ target, props: { service, ai } });
  return target!;
}

describe("AiHomophonePanel", () => {
  it("点击后用 AI 仅更新谐音，保留音标与翻译", async () => {
    const service = new WordService(new InMemoryWordRepository());
    await service.addWord({
      spelling: "banana",
      phonetic: "/bəˈnɑːnə/",
      translation: "香蕉",
      homophone: "旧谐音",
    });

    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"banana":"拔那那"}' } }],
      }),
    })) as unknown as typeof fetch;
    const ai = new AIService(fetchFn);

    const t = mount(service, ai);
    t.querySelector<HTMLButtonElement>('[data-testid="btn-ai-run"]')!.click();

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 5));
      await tick();
      if (t.querySelector('[data-testid="ai-result"]') || t.querySelector('[data-testid="ai-error"]')) break;
    }

    expect(t.querySelector('[data-testid="ai-result"]')).not.toBeNull();
    const w = await service.getWord("banana");
    expect(w?.homophone).toBe("拔那那"); // 谐音被 AI 更新
    expect(w?.phonetic).toBe("/bəˈnɑːnə/"); // 音标不变
    expect(w?.translation).toBe("香蕉"); // 翻译不变
  });

  it("清空 API Key 后运行会提示填写设置", async () => {
    localStorage.clear(); // 加载默认（Kimi）配置
    const service = new WordService(new InMemoryWordRepository());
    await service.addWord({ spelling: "x" });
    const ai = new AIService((async () => {
      throw new Error("should not call");
    }) as unknown as typeof fetch);
    const t = mount(service, ai);
    // 先展开设置面板，再清空 API Key，使其变为未配置
    t.querySelector<HTMLButtonElement>('[data-testid="btn-ai-settings"]')!.click();
    await tick();
    const keyInput = t.querySelector<HTMLInputElement>('[data-testid="ai-apikey"]')!;
    keyInput.value = "";
    keyInput.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    t.querySelector<HTMLButtonElement>('[data-testid="btn-ai-run"]')!.click();
    await tick();
    expect(t.querySelector('[data-testid="ai-error"]')!.textContent).toContain("设置");
  });
});
