// SpeechService：基于浏览器内置 Web Speech API 的发音能力

export interface SpeechService {
  isSupported(): boolean;
  speak(text: string, lang?: string): void;
  cancel(): void;
}

export class WebSpeechService implements SpeechService {
  private synth: SpeechSynthesis | null;

  constructor(synth?: SpeechSynthesis) {
    this.synth =
      synth ??
      (typeof window !== "undefined" && "speechSynthesis" in window
        ? window.speechSynthesis
        : null);
    // 移动端语音可能异步加载，触发一次加载
    if (this.synth && typeof this.synth.getVoices === "function") {
      try {
        this.synth.getVoices();
      } catch {
        /* ignore */
      }
    }
  }

  isSupported(): boolean {
    return this.synth !== null;
  }

  private pickEnglishVoice(): SpeechSynthesisVoice | undefined {
    if (!this.synth) return undefined;
    const voices = this.synth.getVoices() ?? [];
    return (
      voices.find((v) => v.lang?.toLowerCase().startsWith("en")) ?? undefined
    );
  }

  speak(text: string, lang = "en-US"): void {
    if (!this.synth) return; // 不支持时静默返回，UI 已置灰
    this.synth.cancel(); // 取消上一条，避免叠加
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const voice = this.pickEnglishVoice();
    if (voice) u.voice = voice;
    u.rate = 0.9; // 略放慢便于跟读
    this.synth.speak(u);
  }

  cancel(): void {
    this.synth?.cancel();
  }
}
