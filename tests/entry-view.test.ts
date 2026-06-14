import { describe, it, expect, afterEach, beforeEach } from "vitest";
import EntryView from "../src/components/EntryView.svelte";
import { WordService } from "../src/services/WordService";
import { InMemoryWordRepository } from "../src/services/WordRepository";
import { DictionaryService } from "../src/services/DictionaryService";

let target: HTMLElement | null = null;
let service: WordService;
let dictionary: DictionaryService;

// 离线 fetch：始终失败，使 lookup 回落到本地拆分/谐音（不联网）
const offlineFetch = (async () => {
  throw new Error("offline");
}) as unknown as typeof fetch;

// 在线 fetch：返回固定音标与翻译
const onlineFetch = (async (url: string) => {
  if (String(url).includes("dictionaryapi")) {
    return { ok: true, json: async () => [{ phonetic: "/auto/" }] } as unknown as Response;
  }
  return {
    ok: true,
    json: async () => ({ responseData: { translatedText: "自动翻译" } }),
  } as unknown as Response;
}) as unknown as typeof fetch;

beforeEach(() => {
  service = new WordService(new InMemoryWordRepository());
  dictionary = new DictionaryService(offlineFetch);
});
afterEach(() => {
  target?.remove();
  target = null;
});

function mount() {
  target = document.createElement("div");
  document.body.appendChild(target);
  new EntryView({ target, props: { service, dictionary } });
  return target!;
}

function setInput(t: HTMLElement, testid: string, value: string) {
  const el = t.querySelector<HTMLInputElement>(`[data-testid="${testid}"]`)!;
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

async function waitMsg(t: HTMLElement) {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 5));
    if (t.querySelector('[data-testid="msg"]')) break;
  }
}

describe("EntryView 自动补全", () => {
  it("仅输入单词即可添加，自动生成拆分与谐音（离线）", async () => {
    const t = mount();
    setInput(t, "in-spelling", "banana");
    t.querySelector<HTMLButtonElement>('[data-testid="btn-add"]')!.click();
    await waitMsg(t);
    expect(t.querySelector('[data-testid="msg"]')!.textContent).toContain("已添加");
    const list = await service.listWords();
    expect(list).toHaveLength(1);
    // 离线也能本地拆分与生成谐音
    expect(list[0].syllables.length).toBeGreaterThanOrEqual(2);
    expect(list[0].homophone.length).toBeGreaterThan(0);
  });

  it("在线时自动填充音标与翻译", async () => {
    dictionary = new DictionaryService(onlineFetch);
    const t = mount();
    setInput(t, "in-spelling", "banana");
    t.querySelector<HTMLButtonElement>('[data-testid="btn-add"]')!.click();
    await waitMsg(t);
    const list = await service.listWords();
    expect(list[0].phonetic).toBe("/auto/");
    expect(list[0].translation).toBe("自动翻译");
  });

  it("空拼写提示不能为空", async () => {
    const t = mount();
    setInput(t, "in-spelling", "   ");
    t.querySelector<HTMLButtonElement>('[data-testid="btn-add"]')!.click();
    await waitMsg(t);
    expect(t.querySelector('[data-testid="msg"]')!.textContent).toContain("不能为空");
  });

  it("手动填写的字段覆盖自动结果", async () => {
    dictionary = new DictionaryService(onlineFetch);
    const t = mount();
    setInput(t, "in-spelling", "banana");
    t.querySelector<HTMLButtonElement>('[data-testid="toggle-advanced"]')!.click();
    await new Promise((r) => setTimeout(r, 0));
    setInput(t, "in-translation", "香蕉手动");
    t.querySelector<HTMLButtonElement>('[data-testid="btn-add"]')!.click();
    await waitMsg(t);
    const list = await service.listWords();
    expect(list[0].translation).toBe("香蕉手动");
  });

  it("重复拼写提示并可改为更新", async () => {
    await service.addWord({ spelling: "apple" });
    const t = mount();
    setInput(t, "in-spelling", "Apple");
    t.querySelector<HTMLButtonElement>('[data-testid="btn-add"]')!.click();
    await waitMsg(t);
    expect(t.querySelector('[data-testid="msg"]')!.textContent).toContain("已存在");
    expect(t.querySelector('[data-testid="btn-update"]')).not.toBeNull();
  });
});
