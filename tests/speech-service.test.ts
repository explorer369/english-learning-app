import { describe, it, expect, vi, beforeEach } from "vitest";
import { WebSpeechService } from "../src/services/SpeechService";

// 构造一个可控的 SpeechSynthesis mock
function makeSynthMock() {
  return {
    cancel: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => [
      { lang: "zh-CN", name: "中文" } as SpeechSynthesisVoice,
      { lang: "en-US", name: "English" } as SpeechSynthesisVoice,
    ]),
  } as unknown as SpeechSynthesis & {
    cancel: ReturnType<typeof vi.fn>;
    speak: ReturnType<typeof vi.fn>;
    getVoices: ReturnType<typeof vi.fn>;
  };
}

// jsdom 没有 SpeechSynthesisUtterance，提供一个最简实现
beforeEach(() => {
  (globalThis as any).SpeechSynthesisUtterance = class {
    text: string;
    lang = "";
    rate = 1;
    voice: unknown = null;
    constructor(text: string) {
      this.text = text;
    }
  };
});

describe("WebSpeechService", () => {
  it("有 synth 时 isSupported 为 true", () => {
    const svc = new WebSpeechService(makeSynthMock());
    expect(svc.isSupported()).toBe(true);
  });

  it("无 synth 时 isSupported 为 false 且 speak 不抛错", () => {
    const svc = new WebSpeechService(null as unknown as SpeechSynthesis);
    expect(svc.isSupported()).toBe(false);
    expect(() => svc.speak("hello")).not.toThrow();
  });

  it("speak 先取消上一条再朗读", () => {
    const synth = makeSynthMock();
    const svc = new WebSpeechService(synth);
    svc.speak("banana");
    expect(synth.cancel).toHaveBeenCalledTimes(1);
    expect(synth.speak).toHaveBeenCalledTimes(1);
    const utt = synth.speak.mock.calls[0][0];
    expect(utt.text).toBe("banana");
    expect(utt.rate).toBeCloseTo(0.9);
  });

  it("优先选择英语语音", () => {
    const synth = makeSynthMock();
    const svc = new WebSpeechService(synth);
    svc.speak("apple");
    const utt = synth.speak.mock.calls[0][0];
    expect((utt.voice as SpeechSynthesisVoice).lang).toBe("en-US");
  });

  it("cancel 调用底层 cancel", () => {
    const synth = makeSynthMock();
    const svc = new WebSpeechService(synth);
    svc.cancel();
    expect(synth.cancel).toHaveBeenCalled();
  });
});
