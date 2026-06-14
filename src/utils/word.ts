// 单词相关的纯函数工具

import type { Word } from "../types";

/** 规范化拼写：去首尾空格 + 转小写。用于去重与派生稳定 id。 */
export function normalizeSpelling(spelling: string): string {
  return spelling.trim().toLowerCase();
}

/** 校验单词是否满足业务约束。 */
export function validateWord(word: Word): boolean {
  if (typeof word !== "object" || word === null) return false;
  if (typeof word.spelling !== "string" || word.spelling.trim() === "") {
    return false;
  }
  if (typeof word.normalizedSpelling !== "string") return false;
  if (word.normalizedSpelling !== normalizeSpelling(word.spelling)) return false;
  if (typeof word.id !== "string" || word.id === "") return false;
  if (
    typeof word.phonetic !== "string" ||
    typeof word.translation !== "string" ||
    typeof word.homophone !== "string"
  ) {
    return false;
  }
  if (!Array.isArray(word.syllables)) return false;
  for (const u of word.syllables) {
    if (typeof u.text !== "string" || u.text === "") return false;
    if (typeof u.colorGroup !== "number" || u.colorGroup < 0) return false;
  }
  // group 允许缺省（旧数据），存在时必须是字符串
  if (word.group !== undefined && typeof word.group !== "string") return false;
  if (typeof word.createdAt !== "number" || typeof word.updatedAt !== "number") {
    return false;
  }
  if (word.createdAt > word.updatedAt) return false;
  return true;
}

/** 规范化分组名：去首尾空格 */
export function normalizeGroup(group: string | undefined): string {
  return (group ?? "").trim();
}

/** 为从存储/导入读取的单词补齐缺省字段（如 group），保证向后兼容 */
export function migrateWord(word: Word): Word {
  if (typeof word.group === "string") return word;
  return { ...word, group: "" };
}
