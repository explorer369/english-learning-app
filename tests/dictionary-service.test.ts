import { describe, it, expect, vi } from "vitest";
import { DictionaryService } from "../src/services/DictionaryService";

function jsonRes(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as unknown as Response;
}

describe("DictionaryService.lookup", () => {
  it("联网成功时填充音标与翻译，并本地生成拆分与谐音", async () => {
    const fetchFn = vi.fn(async (url: string) => {
      if (url.includes("dictionaryapi")) {
        return jsonRes([{ phonetic: "/bəˈnɑːnə/" }]);
      }
      return jsonRes({ responseData: { translatedText: "香蕉" } });
    }) as unknown as typeof fetch;

    const svc = new DictionaryService(fetchFn);
    const r = await svc.lookup("banana");
    expect(r.phonetic).toBe("/bəˈnɑːnə/");
    expect(r.translation).toBe("香蕉");
    expect(r.syllables.length).toBeGreaterThanOrEqual(2);
    expect(r.syllables.map((s) => s.text).join("")).toBe("banana");
    expect(r.homophone.length).toBeGreaterThan(0);
    expect(r.online).toBe(true);
  });

  it("从 phonetics 数组兜底取音标", async () => {
    const fetchFn = vi.fn(async (url: string) => {
      if (url.includes("dictionaryapi")) {
        return jsonRes([{ phonetics: [{}, { text: "/ˈæpl/" }] }]);
      }
      return jsonRes({ responseData: { translatedText: "苹果" } });
    }) as unknown as typeof fetch;
    const svc = new DictionaryService(fetchFn);
    const r = await svc.lookup("apple");
    expect(r.phonetic).toBe("/ˈæpl/");
  });

  it("联网失败时仍返回本地生成的拆分与谐音", async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    const svc = new DictionaryService(fetchFn);
    const r = await svc.lookup("computer");
    expect(r.phonetic).toBe("");
    expect(r.translation).toBe("");
    expect(r.online).toBe(false);
    expect(r.notice).toBeTruthy();
    expect(r.syllables.map((s) => s.text).join("")).toBe("computer");
    expect(r.homophone.length).toBeGreaterThan(0);
  });

  it("翻译接口返回原词时视为无效翻译", async () => {
    const fetchFn = vi.fn(async (url: string) => {
      if (url.includes("dictionaryapi")) return jsonRes([{ phonetic: "/test/" }]);
      return jsonRes({ responseData: { translatedText: "WORD" } });
    }) as unknown as typeof fetch;
    const svc = new DictionaryService(fetchFn);
    const r = await svc.lookup("word");
    expect(r.translation).toBe("");
  });
});
