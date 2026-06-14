// SyllableService：按读音拆分与配色

import type { SyllableUnit, Word } from "../types";

/** 调色板（相邻单元循环取色，保证相邻不同色） */
export const PALETTE = ["#e6194B", "#3cb44b", "#4363d8", "#f58231"];

/**
 * 为单元序列分配 colorGroup：colorGroup = i % PALETTE.length。
 * 当 PALETTE.length >= 2 时，相邻单元的 colorGroup 必不相等。
 */
export function assignColorGroups(units: SyllableUnit[]): SyllableUnit[] {
  const size = PALETTE.length;
  return units.map((u, i) => ({ ...u, colorGroup: i % size }));
}

export class SyllableService {
  /**
   * 拆分单词为读音单元。
   * 优先使用人工录入的 word.syllables；为空时返回整词作为单一单元（不报错）。
   * 返回的单元一定带有正确的 colorGroup。
   */
  split(word: Word): SyllableUnit[] {
    const base =
      word.syllables && word.syllables.length > 0
        ? word.syllables
        : [{ text: word.spelling, colorGroup: 0 }];
    return assignColorGroups(base);
  }

  /** 把 colorGroup 映射为具体颜色（循环取色）。 */
  colorOf(colorGroup: number): string {
    const size = PALETTE.length;
    const idx = ((colorGroup % size) + size) % size;
    return PALETTE[idx];
  }
}
