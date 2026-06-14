// WordService：单词业务逻辑（录入校验、查重、规范化、增删改查）

import type { NewWordInput, Word } from "../types";
import type { WordRepository } from "./WordRepository";
import { normalizeSpelling, normalizeGroup, migrateWord } from "../utils/word";

/** 录入重复拼写时抛出 */
export class DuplicateWordError extends Error {
  constructor(public spelling: string) {
    super(`单词已存在：${spelling}`);
    this.name = "DuplicateWordError";
  }
}

/** 拼写为空时抛出 */
export class EmptySpellingError extends Error {
  constructor() {
    super("拼写不能为空");
    this.name = "EmptySpellingError";
  }
}

export class WordService {
  constructor(private repo: WordRepository) {}

  async addWord(input: NewWordInput): Promise<Word> {
    const spelling = input.spelling.trim();
    if (spelling === "") throw new EmptySpellingError();
    const ns = normalizeSpelling(spelling);
    const existing = await this.repo.getByNormalizedSpelling(ns);
    if (existing) throw new DuplicateWordError(spelling);
    const now = Date.now();
    const word: Word = {
      id: ns,
      spelling,
      normalizedSpelling: ns,
      phonetic: input.phonetic ?? "",
      translation: input.translation ?? "",
      homophone: input.homophone ?? "",
      syllables: input.syllables ?? [],
      group: normalizeGroup(input.group),
      createdAt: now,
      updatedAt: now,
    };
    await this.repo.put(word);
    return word;
  }

  async updateWord(id: string, patch: Partial<NewWordInput>): Promise<Word> {
    const existing = await this.repo.get(id);
    if (!existing) throw new Error(`单词不存在：${id}`);
    const updated: Word = {
      ...migrateWord(existing),
      phonetic: patch.phonetic ?? existing.phonetic,
      translation: patch.translation ?? existing.translation,
      homophone: patch.homophone ?? existing.homophone,
      syllables: patch.syllables ?? existing.syllables,
      group: patch.group !== undefined ? normalizeGroup(patch.group) : migrateWord(existing).group,
      updatedAt: Date.now(),
    };
    await this.repo.put(updated);
    return updated;
  }

  async deleteWord(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async getWord(id: string): Promise<Word | undefined> {
    const w = await this.repo.get(id);
    return w ? migrateWord(w) : undefined;
  }

  async listWords(): Promise<Word[]> {
    const all = await this.repo.getAll();
    return all.map(migrateWord).sort((a, b) => a.createdAt - b.createdAt);
  }

  /** 返回所有非空分组名（去重，按名称排序） */
  async listGroups(): Promise<string[]> {
    const all = await this.repo.getAll();
    const set = new Set<string>();
    for (const w of all) {
      const g = normalizeGroup(w.group);
      if (g !== "") set.add(g);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "zh"));
  }
}
