import { describe, it, expect, vi } from "vitest";
import {
  AIService,
  buildHomophonePrompt,
  parseHomophoneResponse,
  chatCompletionsUrl,
} from "../src/services/AIService";
import type { AISettings } from "../src/services/AISettings";

const settings: AISettings = {
  baseUrl: "https://api.example.com/v1",
  apiKey: "sk-test",
  model: "test-model",
};

describe("chatCompletionsUrl", () => {
  it("Base URL 仅到 /v1 时自动补全路径", () => {
    expect(chatCompletionsUrl("https://api.moonshot.cn/v1")).toBe(
      "https://api.moonshot.cn/v1/chat/completions",
    );
  });
  it("Base URL 末尾带斜杠也正确", () => {
    expect(chatCompletionsUrl("https://api.moonshot.cn/v1/")).toBe(
      "https://api.moonshot.cn/v1/chat/completions",
    );
  });
  it("Base URL 已含 /chat/completions 时不重复拼接", () => {
    expect(chatCompletionsUrl("https://api.moonshot.cn/v1/chat/completions")).toBe(
      "https://api.moonshot.cn/v1/chat/completions",
    );
  });
});

describe("buildHomophonePrompt", () => {
  it("包含单词且强调只要谐音/JSON", () => {
    const p = buildHomophonePrompt(["banana", "apple"]);
    expect(p).toContain("banana");
    expect(p).toContain("apple");
    expect(p).toContain("谐音");
    expect(p).toContain("JSON");
  });
});

describe("parseHomophoneResponse", () => {
  it("解析纯 JSON", () => {
    expect(parseHomophoneResponse('{"banana":"拔那那"}')).toEqual({ banana: "拔那那" });
  });
  it("解析被代码块包裹的 JSON", () => {
    const c = "```json\n{\"hello\":\"哈喽\"}\n```";
    expect(parseHomophoneResponse(c)).toEqual({ hello: "哈喽" });
  });
  it("去掉空值", () => {
    expect(parseHomophoneResponse('{"apple":"爱剖","x":""}')).toEqual({ apple: "爱剖" });
  });
  it("非法内容返回空对象", () => {
    expect(parseHomophoneResponse("no json here")).toEqual({});
  });
});

describe("AIService", () => {
  function fetchReturning(content: string) {
    return vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content } }] }),
    })) as unknown as typeof fetch;
  }

  it("requestHomophones 返回映射并发到正确 URL", async () => {
    const fetchFn = fetchReturning('{"banana":"拔那那","apple":"爱剖"}');
    const svc = new AIService(fetchFn);
    const map = await svc.requestHomophones(["banana", "apple"], settings);
    expect(map).toEqual({ banana: "拔那那", apple: "爱剖" });
    const call = (fetchFn as any).mock.calls[0];
    expect(call[0]).toBe("https://api.example.com/v1/chat/completions");
    expect(call[1].headers.Authorization).toBe("Bearer sk-test");
  });

  it("接口报错时抛异常", async () => {
    const fetchFn = vi.fn(async () => ({ ok: false, status: 401 })) as unknown as typeof fetch;
    const svc = new AIService(fetchFn);
    await expect(svc.requestHomophones(["x"], settings)).rejects.toThrow("401");
  });

  it("generateHomophonesFor 分批并汇总、上报进度", async () => {
    const fetchFn = vi.fn(async (_url: string, init: any) => {
      const body = JSON.parse(init.body);
      const userMsg = body.messages[1].content as string;
      const map: Record<string, string> = {};
      for (const w of ["a", "b", "c"]) {
        if (userMsg.includes(w)) map[w] = "音" + w;
      }
      return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(map) } }] }) };
    }) as unknown as typeof fetch;
    const svc = new AIService(fetchFn);
    const progress: Array<{ done: number; total: number }> = [];
    const map = await svc.generateHomophonesFor(
      ["a", "b", "c"],
      settings,
      (p) => progress.push(p),
      2,
    );
    expect(map).toEqual({ a: "音a", b: "音b", c: "音c" });
    expect((fetchFn as any).mock.calls.length).toBe(2);
    expect(progress[progress.length - 1]).toEqual({ done: 3, total: 3 });
  });
});
