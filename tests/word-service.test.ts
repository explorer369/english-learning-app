import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";
import { InMemoryWordRepository } from "../src/services/WordRepository";
import {
  WordService,
  DuplicateWordError,
  EmptySpellingError,
} from "../src/services/WordService";
import { normalizeSpelling } from "../src/utils/word";

function newService() {
  return new WordService(new InMemoryWordRepository());
}

describe("WordService 基本行为", () => {
  let svc: WordService;
  beforeEach(() => {
    svc = newService();
  });

  it("录入成功并规范化、createdAt==updatedAt", async () => {
    const w = await svc.addWord({ spelling: "  Banana " });
    expect(w.spelling).toBe("Banana");
    expect(w.normalizedSpelling).toBe("banana");
    expect(w.id).toBe("banana");
    expect(w.createdAt).toBe(w.updatedAt);
  });

  it("空白拼写抛 EmptySpellingError", async () => {
    await expect(svc.addWord({ spelling: "   " })).rejects.toBeInstanceOf(
      EmptySpellingError,
    );
  });

  it("重复拼写（忽略大小写）抛 DuplicateWordError", async () => {
    await svc.addWord({ spelling: "Apple" });
    await expect(svc.addWord({ spelling: "apple" })).rejects.toBeInstanceOf(
      DuplicateWordError,
    );
  });

  it("更新单词刷新 updatedAt", async () => {
    const w = await svc.addWord({ spelling: "cat" });
    const u = await svc.updateWord(w.id, { translation: "猫" });
    expect(u.translation).toBe("猫");
    expect(u.updatedAt).toBeGreaterThanOrEqual(w.updatedAt);
  });

  it("删除单词", async () => {
    const w = await svc.addWord({ spelling: "dog" });
    await svc.deleteWord(w.id);
    expect(await svc.getWord(w.id)).toBeUndefined();
  });

  it("listWords 按 createdAt 排序", async () => {
    await svc.addWord({ spelling: "a" });
    await svc.addWord({ spelling: "b" });
    const list = await svc.listWords();
    expect(list.map((w) => w.spelling)).toEqual(["a", "b"]);
  });
});

describe("WordService 属性测试 (PBT)", () => {
  // 生成非空拼写
  const spellingArb = fc
    .string({ minLength: 1, maxLength: 12 })
    .filter((s) => s.trim() !== "");

  it("Property 7: 空白拼写必拒绝；成功录入 createdAt==updatedAt", async () => {
    await fc.assert(
      fc.asyncProperty(fc.stringMatching(/^\s*$/), async (blank) => {
        const svc = newService();
        await expect(svc.addWord({ spelling: blank })).rejects.toBeInstanceOf(
          EmptySpellingError,
        );
      }),
    );
    await fc.assert(
      fc.asyncProperty(spellingArb, async (s) => {
        const svc = newService();
        const w = await svc.addWord({ spelling: s });
        return w.createdAt === w.updatedAt;
      }),
    );
  });

  it("Property 3: 批量录入大小写/空格变体后 normalizedSpelling 全库唯一", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(spellingArb, { maxLength: 30 }), async (arr) => {
        const svc = newService();
        for (const s of arr) {
          try {
            await svc.addWord({ spelling: s });
          } catch {
            /* 重复拼写被拒绝是预期行为 */
          }
        }
        const list = await svc.listWords();
        const nsSet = new Set(list.map((w) => w.normalizedSpelling));
        return nsSet.size === list.length;
      }),
    );
  });

  it("Property 8: 同一拼写忽略大小写与首尾空格派生相同 id", async () => {
    await fc.assert(
      fc.property(spellingArb, fc.array(fc.constantFrom(" ", "\t")), (s, pads) => {
        const pad = pads.join("");
        const variant = pad + s.toUpperCase() + pad;
        return normalizeSpelling(s) === normalizeSpelling(variant);
      }),
    );
  });
});
