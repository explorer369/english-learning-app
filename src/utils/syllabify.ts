// 轻量英文音节拆分：把拼写切成若干片段，保证各片段顺序拼接 === 原拼写。
// 这是启发式算法（非语言学严格），用于学习配色，可被人工拆分覆盖。

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);

function isVowel(ch: string): boolean {
  return VOWELS.has(ch.toLowerCase());
}

/**
 * 返回拆分片段数组（仅 text），各片段拼接等于原 word。
 * 规则：以元音组为核心；两元音组之间的辅音，1 个归后一音节(V|CV)，
 * 多个则首辅音归前、其余归后(VC|CV)；首尾辅音分别并入首/末音节。
 */
export function syllabify(word: string): string[] {
  if (!word) return [];
  const chars = [...word];

  // 标记每个字符是否元音
  const vowelFlags = chars.map((c) => isVowel(c));

  // 找元音组的起止区间
  const vowelGroups: Array<{ start: number; end: number }> = [];
  let i = 0;
  while (i < chars.length) {
    if (vowelFlags[i]) {
      const start = i;
      while (i < chars.length && vowelFlags[i]) i++;
      vowelGroups.push({ start, end: i - 1 });
    } else {
      i++;
    }
  }

  // 无元音（如缩写）或仅一个元音组：整词一个音节
  if (vowelGroups.length <= 1) return [word];

  // 计算各音节边界（在字符索引之间切分）
  const cuts: number[] = []; // cut 表示在索引 cut 之前切开（即 chars[cut] 起属于下一音节）
  for (let g = 0; g < vowelGroups.length - 1; g++) {
    const consStart = vowelGroups[g].end + 1;
    const consEnd = vowelGroups[g + 1].start - 1;
    const consCount = consEnd - consStart + 1;
    if (consCount <= 0) {
      // 两元音组相邻：在它们之间切（V|V）
      cuts.push(vowelGroups[g + 1].start);
    } else if (consCount === 1) {
      // V|CV：辅音归后一音节
      cuts.push(consStart);
    } else {
      // VC|CV：首辅音归前，其余归后
      cuts.push(consStart + 1);
    }
  }

  // 依据 cuts 切分
  const segments: string[] = [];
  let prev = 0;
  for (const c of cuts) {
    segments.push(chars.slice(prev, c).join(""));
    prev = c;
  }
  segments.push(chars.slice(prev).join(""));
  return segments.filter((s) => s.length > 0);
}
