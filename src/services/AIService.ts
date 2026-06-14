// AIService：调用 OpenAI 兼容接口，为单词批量生成更准确的中文谐音。

import type { AISettings } from "./AISettings";

type FetchFn = typeof fetch;

export interface HomophoneProgress {
  done: number;
  total: number;
}

/** 构造请求 AI 的提示词（要求返回 JSON：拼写 -> 谐音） */
export function buildHomophonePrompt(words: string[]): string {
  return [
    "你是中文谐音助记专家。下面给你一组英文单词，请为每个单词生成用于帮助中国人记忆其英语发音的中文谐音。",
    "要求：",
    "1. 谐音要尽量贴近英语真实发音，朗朗上口，便于记忆。",
    "2. 只用中文字符，可用·分隔音节。",
    "3. 严格只返回一个 JSON 对象，键为原单词（与输入完全一致），值为谐音字符串，不要任何多余文字。",
    "单词列表：",
    JSON.stringify(words),
  ].join("\n");
}

/** 从 AI 返回的文本中解析出 拼写->谐音 映射（容忍代码块包裹） */
export function parseHomophoneResponse(content: string): Record<string, string> {
  let text = content.trim();
  // 去除可能的 ```json ... ``` 包裹
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  // 截取第一个 { 到最后一个 }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return {};
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string" && v.trim() !== "") result[k] = v.trim();
    }
    return result;
  } catch {
    return {};
  }
}

/** 由 Base URL 推导出 chat/completions 端点，兼容用户是否已带该路径 */
export function chatCompletionsUrl(baseUrl: string): string {
  let b = baseUrl.trim().replace(/\/+$/, "");
  if (/\/chat\/completions$/i.test(b)) return b; // 已包含完整路径
  return b + "/chat/completions";
}

export class AIService {
  constructor(private fetchFn: FetchFn = globalThis.fetch?.bind(globalThis)) {}

  /** 单批请求：返回 拼写->谐音 */
  async requestHomophones(
    words: string[],
    settings: AISettings,
  ): Promise<Record<string, string>> {
    const url = chatCompletionsUrl(settings.baseUrl);
    const res = await this.fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        temperature: 1,
        messages: [
          { role: "system", content: "你只输出 JSON，不要解释。" },
          { role: "user", content: buildHomophonePrompt(words) },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`AI 请求失败：HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    return parseHomophoneResponse(content);
  }

  /**
   * 分批为全部单词生成谐音，合并返回 拼写->谐音。
   * batchSize 控制每次请求的单词数量，onProgress 报告进度。
   */
  async generateHomophonesFor(
    words: string[],
    settings: AISettings,
    onProgress?: (p: HomophoneProgress) => void,
    batchSize = 20,
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    const total = words.length;
    let done = 0;
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      const map = await this.requestHomophones(batch, settings);
      Object.assign(result, map);
      done += batch.length;
      onProgress?.({ done, total });
    }
    return result;
  }
}
