// 谐音（中文近似音）自动生成：基于音节做粗略的"声母+韵母→汉字"近似映射。
// 仅作辅助记忆，质量有限，用户可在录入后手动修改。

// 韵母（元音组）近似
const VOWEL_MAP: Array<[RegExp, string]> = [
  [/^(igh|ie|y)/, "艾"],
  [/^(ee|ea|e)/, "伊"],
  [/^(oo|ou|ow)/, "乌"],
  [/^(oa|ow|o)/, "欧"],
  [/^(ai|ay|a)/, "诶"],
  [/^(au|aw)/, "奥"],
  [/^(oi|oy)/, "奥伊"],
  [/^(u)/, "呃"],
  [/^(i)/, "伊"],
];

// 声母（起始辅音）近似
const ONSET_MAP: Record<string, string> = {
  b: "布",
  c: "克",
  d: "德",
  f: "弗",
  g: "格",
  h: "赫",
  j: "杰",
  k: "克",
  l: "勒",
  m: "姆",
  n: "恩",
  p: "普",
  q: "克",
  r: "若",
  s: "斯",
  t: "特",
  v: "弗",
  w: "屋",
  x: "克斯",
  z: "兹",
};

const DIGRAPH_ONSET: Record<string, string> = {
  ch: "切",
  sh: "什",
  th: "斯",
  ph: "弗",
  wh: "屋",
};

function isVowel(ch: string): boolean {
  return "aeiou".includes(ch);
}

/** 把单个音节片段映射为近似中文音 */
function syllableToChinese(seg: string): string {
  const s = seg.toLowerCase();
  if (!s) return "";

  // 起始辅音
  let onset = "";
  let rest = s;
  const two = s.slice(0, 2);
  if (DIGRAPH_ONSET[two]) {
    onset = DIGRAPH_ONSET[two];
    rest = s.slice(2);
  } else if (s[0] && !isVowel(s[0])) {
    onset = ONSET_MAP[s[0]] ?? "";
    rest = s.slice(1);
  }

  // 元音部分
  let vowel = "";
  for (const [re, zh] of VOWEL_MAP) {
    if (re.test(rest)) {
      vowel = zh;
      break;
    }
  }
  // 找不到元音规则时，取第一个元音字母兜底
  if (!vowel) {
    const firstVowel = [...rest].find(isVowel);
    if (firstVowel) {
      const m = VOWEL_MAP.find(([re]) => re.test(firstVowel));
      vowel = m ? m[1] : "呃";
    }
  }

  return (onset + vowel) || onset;
}

/** 由音节数组生成近似谐音 */
export function generateHomophone(syllables: string[]): string {
  return syllables
    .map(syllableToChinese)
    .filter((s) => s !== "")
    .join("·");
}
