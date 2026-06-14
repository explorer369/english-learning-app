// DictionaryService：只输入单词，自动获取音标、中文翻译，并本地生成音节拆分与谐音。
// 仅在"添加单词"时联网；获取结果存入本地后，学习过程完全离线。

import type { SyllableUnit } from "../types";
import { syllabify } from "../utils/syllabify";
import { generateHomophone } from "../utils/homophone";
import { normalizeSpelling } from "../utils/word";

export interface LookupResult {
  phonetic: string;
  translation: string;
  /** 仅含 text 与占位 colorGroup；最终颜色由 SyllableService 统一分配 */
  syllables: SyllableUnit[];
  homophone: string;
  /** 联网获取是否成功（音标/翻译） */
  online: boolean;
  /** 若有提示信息（如离线、未查到） */
  notice?: string;
}

type FetchFn = typeof fetch;

const DICT_API = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const TRANSLATE_API = "https://api.mymemory.translated.net/get";

export class DictionaryService {
  constructor(private fetchFn: FetchFn = globalThis.fetch?.bind(globalThis)) {}

  /** 查询单词，返回尽力而为的补全结果（部分字段可能为空） */
  async lookup(spelling: string): Promise<LookupResult> {
    const word = spelling.trim();
    const ns = normalizeSpelling(word);

    // 本地可离线生成的部分：音节拆分 + 谐音
    const segs = syllabify(ns);
    const syllables: SyllableUnit[] = segs.map((text) => ({ text, colorGroup: 0 }));
    const homophone = generateHomophone(segs);

    let phonetic = "";
    let translation = "";
    let online = false;
    let notice: string | undefined;

    try {
      phonetic = await this.fetchPhonetic(word);
      online = true;
    } catch {
      notice = "未能联网获取音标，可手动补充。";
    }

    try {
      translation = await this.fetchTranslation(word);
      online = online || translation !== "";
    } catch {
      notice = notice
        ? notice + " 翻译也未获取到。"
        : "未能联网获取翻译，可手动补充。";
    }

    return { phonetic, translation, syllables, homophone, online, notice };
  }

  private async fetchPhonetic(word: string): Promise<string> {
    const res = await this.fetchFn(`${DICT_API}${encodeURIComponent(word)}`);
    if (!res.ok) return "";
    const data = (await res.json()) as Array<{
      phonetic?: string;
      phonetics?: Array<{ text?: string }>;
    }>;
    if (!Array.isArray(data) || data.length === 0) return "";
    const entry = data[0];
    if (entry.phonetic) return entry.phonetic;
    const withText = entry.phonetics?.find((p) => p.text && p.text.trim());
    return withText?.text ?? "";
  }

  private async fetchTranslation(word: string): Promise<string> {
    const url = `${TRANSLATE_API}?q=${encodeURIComponent(word)}&langpair=en|zh-CN`;
    const res = await this.fetchFn(url);
    if (!res.ok) return "";
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
    };
    const t = data.responseData?.translatedText ?? "";
    // MyMemory 偶尔返回大写的原词或提示语，简单过滤明显无效结果
    if (!t || t.toLowerCase() === word.toLowerCase()) return "";
    return t;
  }
}
