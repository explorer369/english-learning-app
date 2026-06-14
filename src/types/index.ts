// 核心数据模型与类型定义

/** 读音单元（一个音节或读音片段） */
export interface SyllableUnit {
  /** 该单元对应的字母片段，例如 "ba" */
  text: string;
  /** 该单元对应的音标片段（可选），例如 "bə" */
  phoneme?: string;
  /** 配色分组索引（0..N）。用于决定高亮颜色，相邻单元颜色不同 */
  colorGroup: number;
}

/** 单词实体 */
export interface Word {
  /** 唯一 ID，跨设备稳定（基于规范化拼写） */
  id: string;
  /** 拼写（原始大小写保留用于展示） */
  spelling: string;
  /** 规范化拼写（小写、去首尾空格），用于去重与索引 */
  normalizedSpelling: string;
  /** 标准音标 IPA，例如 "/ˈbænənə/" */
  phonetic: string;
  /** 中文翻译 */
  translation: string;
  /** 中文谐音（辅助记忆发音），例如 "拔那那" */
  homophone: string;
  /** 按读音拆分的单元序列；空数组表示尚未拆分 */
  syllables: SyllableUnit[];
  /** 分组/标签（像课本单元），空字符串表示未分组 */
  group: string;
  /** 创建时间（epoch 毫秒） */
  createdAt: number;
  /** 最后更新时间（epoch 毫秒），用于导入合并时择新 */
  updatedAt: number;
}

/** 导入合并策略 */
export type MergeStrategy = "keepNewer" | "keepLocal" | "keepImported";

/** 导出文件顶层结构 */
export interface LibraryExport {
  /** 格式版本，便于未来兼容升级 */
  schemaVersion: 1;
  /** 应用标识 */
  app: "english-learning-app";
  /** 导出时间（epoch 毫秒） */
  exportedAt: number;
  /** 单词列表 */
  words: Word[];
}

/** 导入结果统计 */
export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/** 学习页的瞬时 UI 状态 */
export interface StudyViewState {
  /** 当前单词在词库列表中的索引 */
  currentIndex: number;
}

/** 录入单词的输入 */
export interface NewWordInput {
  spelling: string;
  phonetic?: string;
  translation?: string;
  homophone?: string;
  syllables?: SyllableUnit[];
  group?: string;
}
