import { describe, it, expect, afterEach, vi } from "vitest";
import { tick } from "svelte";
import LibraryView from "../src/components/LibraryView.svelte";
import { WordService } from "../src/services/WordService";
import { InMemoryWordRepository } from "../src/services/WordRepository";
import { TransferService, buildExport } from "../src/services/TransferService";
import { AIService } from "../src/services/AIService";
import type { Word } from "../src/types";

let target: HTMLElement | null = null;
afterEach(() => {
  target?.remove();
  target = null;
});

function setup() {
  const repo = new InMemoryWordRepository();
  const service = new WordService(repo);
  const downloads: { blob: Blob; name: string }[] = [];
  const transfer = new TransferService(repo, (blob, name) =>
    downloads.push({ blob, name }),
  );
  const ai = new AIService((async () => {
    throw new Error("no ai in test");
  }) as unknown as typeof fetch);
  return { repo, service, transfer, ai, downloads };
}

async function mount(service: WordService, transfer: TransferService, ai: AIService) {
  target = document.createElement("div");
  document.body.appendChild(target);
  const instance = new LibraryView({ target, props: { service, transfer, ai } });
  await (instance as any).reload();
  await tick();
  return { t: target!, instance };
}

function makeWord(spelling: string): Word {
  const ns = spelling.toLowerCase();
  return {
    id: ns,
    spelling,
    normalizedSpelling: ns,
    phonetic: "",
    translation: "",
    homophone: "",
    syllables: [],
    group: "",
    createdAt: 1,
    updatedAt: 1,
  };
}

describe("LibraryView", () => {
  it("列表展示并可删除", async () => {
    const { service, transfer, ai } = setup();
    await service.addWord({ spelling: "alpha" });
    await service.addWord({ spelling: "beta" });
    const { t, instance } = await mount(service, transfer, ai);
    expect(t.querySelectorAll('[data-testid="word-list"] li').length).toBe(2);
    t.querySelector<HTMLButtonElement>('[data-testid="btn-del-alpha"]')!.click();
    await (instance as any).reload();
    await tick();
    expect(await service.listWords()).toHaveLength(1);
  });

  it("可直接编辑单词分组", async () => {
    const { service, transfer, ai } = setup();
    await service.addWord({ spelling: "alpha" });
    const { t, instance } = await mount(service, transfer, ai);
    const input = t.querySelector<HTMLInputElement>('[data-testid="group-edit-alpha"]')!;
    input.value = "第一单元";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    // 等待异步更新与刷新
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 5));
      await tick();
      const w = await service.getWord("alpha");
      if (w?.group === "第一单元") break;
    }
    expect((await service.getWord("alpha"))?.group).toBe("第一单元");
  });

  it("导出调用 transfer 并产生下载", async () => {
    const { service, transfer, ai, downloads } = setup();
    await service.addWord({ spelling: "alpha" });
    const { t } = await mount(service, transfer, ai);
    t.querySelector<HTMLButtonElement>('[data-testid="btn-export"]')!.click();
    await tick();
    expect(downloads.length).toBe(1);
    expect(downloads[0].name).toMatch(/^wordlib-\d{8}\.json$/);
  });

  it("导入合法文件显示结果统计", async () => {
    const { service, transfer, ai } = setup();
    const { t, instance } = await mount(service, transfer, ai);
    const exp = buildExport([makeWord("gamma"), makeWord("delta")]);
    const file = new File([JSON.stringify(exp)], "lib.json", {
      type: "application/json",
    });
    const input = t.querySelector<HTMLInputElement>('[data-testid="in-file"]')!;
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    input.dispatchEvent(new Event("change", { bubbles: true }));
    // 轮询等待异步导入完成（含 file.text() 链路）与 DOM 刷新
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 5));
      await tick();
      if (
        t.querySelector('[data-testid="import-result"]') ||
        t.querySelector('[data-testid="import-error"]')
      ) {
        break;
      }
    }
    const err = t.querySelector('[data-testid="import-error"]');
    expect(err, err?.textContent ?? "").toBeNull();
    expect(t.querySelector('[data-testid="import-result"]')!.textContent).toContain(
      "新增 2",
    );
    expect(await service.listWords()).toHaveLength(2);
  });
});
