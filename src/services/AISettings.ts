// AI 设置：OpenAI 兼容接口配置，仅保存在浏览器本地 localStorage。

export interface AISettings {
  baseUrl: string; // 例如 https://api.openai.com/v1
  apiKey: string;
  model: string; // 例如 gpt-4o-mini
}

const KEY = "elearn-ai-settings";

export const DEFAULT_AI_SETTINGS: AISettings = {
  baseUrl: "https://api.moonshot.cn/v1",
  apiKey: "sk-06lhJ1qHsivwudlF4TDUosU8uREVFiiGqJ6s7veMpDW40RG9",
  model: "kimi-k2.6",
};

export function loadAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_AI_SETTINGS };
    const parsed = JSON.parse(raw);
    // 空字段回退到默认值，保证默认 Kimi 配置可用
    return {
      baseUrl:
        typeof parsed.baseUrl === "string" && parsed.baseUrl.trim() !== ""
          ? parsed.baseUrl
          : DEFAULT_AI_SETTINGS.baseUrl,
      apiKey:
        typeof parsed.apiKey === "string" && parsed.apiKey.trim() !== ""
          ? parsed.apiKey
          : DEFAULT_AI_SETTINGS.apiKey,
      model:
        typeof parsed.model === "string" && parsed.model.trim() !== ""
          ? parsed.model
          : DEFAULT_AI_SETTINGS.model,
    };
  } catch {
    return { ...DEFAULT_AI_SETTINGS };
  }
}

export function saveAISettings(s: AISettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* localStorage 不可用时忽略 */
  }
}

export function isAIConfigured(s: AISettings): boolean {
  return s.baseUrl.trim() !== "" && s.apiKey.trim() !== "" && s.model.trim() !== "";
}
