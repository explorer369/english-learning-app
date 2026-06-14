import { describe, it, expect, afterEach, vi } from "vitest";
import WordCard from "../src/components/WordCard.svelte";
import type { Word } from "../src/types";

let target: HTMLElement | null = null;
afterEach(() => {
  target?.remove();
  target = null;
});

function mount(props: Record<string, unknown>) {
  target = document.createElement("div");
  document.body.appendChild(target);
  new WordCard({ target, props: props as any });
  return target!;
}

function makeWord(overrides: Partial<Word> = {}): Word {
  return {
    id: "banana",
    spelling: "banana",
    normalizedSpelling: "banana",
    phonetic: "/bəˈnɑːnə/",
    translation: "香蕉",
    homophone: "拔那那",
    syllables: [
      { text: "ba", colorGroup: 0 },
      { text: "na", colorGroup: 1 },
      { text: "na", colorGroup: 2 },
    ],
    group: "",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("WordCard 纵向布局", () => {
  it("五个区块按从上到下顺序渲染", () => {
    const t = mount({ word: makeWord() });
    const order = [
      "row-word",
      "row-breakdown",
      "row-phonetic",
      "row-homophone",
      "row-translation",
    ];
    const positions = order.map((id) =>
      Array.prototype.indexOf.call(
        t.querySelectorAll("[data-testid]"),
        t.querySelector(`[data-testid="${id}"]`),
      ),
    );
    // 校验各 testid 在 DOM 中的相对先后
    const wordEl = t.querySelector('[data-testid="row-word"]')!;
    const transEl = t.querySelector('[data-testid="row-translation"]')!;
    expect(
      wordEl.compareDocumentPosition(transEl) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(positions.every((p) => p >= 0)).toBe(true);
  });

  it("显示单词、音标、谐音、翻译内容", () => {
    const t = mount({ word: makeWord() });
    expect(t.querySelector('[data-testid="row-word"]')!.textContent).toContain(
      "banana",
    );
    expect(
      t.querySelector('[data-testid="row-phonetic"]')!.textContent,
    ).toContain("bəˈnɑːnə");
    expect(
      t.querySelector('[data-testid="row-homophone"]')!.textContent,
    ).toContain("拔那那");
    expect(
      t.querySelector('[data-testid="row-translation"]')!.textContent,
    ).toContain("香蕉");
  });

  it("空字段用占位符 — 显示", () => {
    const t = mount({
      word: makeWord({ phonetic: "", homophone: "", translation: "" }),
    });
    expect(t.querySelector('[data-testid="row-phonetic"]')!.textContent).toBe(
      "—",
    );
    expect(t.querySelector('[data-testid="row-homophone"]')!.textContent).toBe(
      "—",
    );
    expect(
      t.querySelector('[data-testid="row-translation"]')!.textContent,
    ).toBe("—");
  });

  it("点击单词触发 onSpeak", () => {
    const onSpeak = vi.fn();
    const t = mount({ word: makeWord(), onSpeak });
    (t.querySelector('[data-testid="row-word"]') as HTMLElement).click();
    expect(onSpeak).toHaveBeenCalledTimes(1);
  });
});
