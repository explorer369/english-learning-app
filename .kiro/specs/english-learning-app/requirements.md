# Requirements Document

（需求文档：english-learning-app — 英语单词学习 PWA）

## Introduction

（引言）

本功能是一个纯前端的渐进式 Web 应用（PWA），帮助用户录入单词、学习单词发音并管理个人词库。应用一套代码在电脑与手机浏览器通用，数据保存在浏览器本地（IndexedDB），通过 JSON 文件导入导出实现跨设备迁移，无需后端服务器与实时同步。本文档的需求编号与设计文档中的 `Validates: Requirements X.Y` 引用保持一致。

## Requirements

### Requirement 1: 单词录入

**User Story:** 作为一名英语学习者，我希望能在电脑或手机上随时把单词添加到词库，以便后续学习。

#### Acceptance Criteria

1. WHEN 用户提交一个去除首尾空格后非空的拼写 THEN 系统 SHALL 以规范化拼写（小写、去首尾空格）派生稳定 `id` 并将单词写入本地词库。
2. WHEN 用户提交的拼写去除首尾空格后为空 THEN 系统 SHALL 拒绝录入并提示拼写不能为空。
3. WHEN 用户录入的单词的规范化拼写已存在于词库 THEN 系统 SHALL 提示该单词已存在，并提供"改为更新"的选项。
4. WHEN 用户录入单词 THEN 系统 SHALL 允许音标、翻译、谐音、音节拆分为空（可先录入拼写、后补充）。
5. WHEN 单词成功录入 THEN 系统 SHALL 设置其 `createdAt` 等于 `updatedAt`。

### Requirement 2: 单词按读音拆分与颜色区分

**User Story:** 作为一名英语学习者，我希望看到单词按读音拆分成的音节并以不同颜色区分，以便学会怎么读这个单词。

#### Acceptance Criteria

1. WHEN 学习页展示某个单词 THEN 系统 SHALL 显示其按读音拆分的音节单元序列。
2. WHEN 系统渲染音节拆分 THEN 系统 SHALL 为相邻音节单元分配不同的颜色，且各单元 `text` 顺序拼接后等于原始拼写（采用基于拼写的拆分时）。
3. WHEN 单词尚未提供音节拆分数据 THEN 系统 SHALL 显示原始单词且不报错。
4. WHEN 显示音节单元 THEN 系统 SHALL 在单元之间使用分隔符（如 `·`）加以区分。

### Requirement 3: 单词发音

**User Story:** 作为一名英语学习者，我希望点击单词时能听到它的读音，以便模仿和跟读。

#### Acceptance Criteria

1. WHEN 用户点击学习页顶部的单词 AND 浏览器支持语音合成 THEN 系统 SHALL 使用 Web Speech API 朗读该单词。
2. WHEN 朗读单词 THEN 系统 SHALL 优先选择英语语音，并以略慢的语速朗读以便跟读。
3. WHEN 当前浏览器不支持语音合成 THEN 系统 SHALL 将发音控件置为不可用并提示"当前浏览器不支持朗读"。
4. WHEN 用户连续点击发音 THEN 系统 SHALL 先取消上一条朗读再播放新的，避免叠加。

### Requirement 4: 词库导入导出（跨设备迁移）

**User Story:** 作为一名英语学习者，我希望把电脑上的词库导出文件并导入到手机（反之亦然），以便在不同设备上学习同一份词库，且无需联网同步。

#### Acceptance Criteria

1. WHEN 用户点击导出 THEN 系统 SHALL 将全部单词序列化为带 `schemaVersion`、`app`、`exportedAt`、`words` 字段的 JSON 文件并触发下载。
2. WHEN 用户选择一个本应用导出的 JSON 文件导入 THEN 系统 SHALL 解析、校验并按合并策略（默认 keepNewer：取 `updatedAt` 较大者）去重合并到本地词库，且不产生重复的规范化拼写。
3. WHEN 用户对同一文件连续导入两次 THEN 系统 SHALL 在第二次导入时不新增任何单词（导入幂等）。
4. WHEN 导入文件无法解析或 `app`/`schemaVersion` 不匹配 THEN 系统 SHALL 拒绝导入并提示文件格式不正确。
5. WHEN 导入过程中某条单词校验失败 THEN 系统 SHALL 跳过该条并计入失败统计，且不影响其余单词导入。
6. WHEN 导入完成 THEN 系统 SHALL 显示新增、更新、跳过、失败的数量。

### Requirement 5: 学习界面固定纵向布局

**User Story:** 作为一名英语学习者，我希望在一个页面里从上到下同时看到单词的全部信息，而不需要切换模式，以便专注学习单个单词。

#### Acceptance Criteria

1. WHEN 学习页展示某个单词 THEN 系统 SHALL 按从上到下的固定顺序同屏展示：① 单词 ② 颜色拆分 ③ 音标 ④ 谐音 ⑤ 翻译。
2. WHEN 展示学习页 THEN 系统 SHALL 始终显示全部五个区块，不提供展示模式切换或"点击展开拆分"的交互。
3. WHEN 某个字段（音标、谐音、翻译等）为空 THEN 系统 SHALL 以占位符（如 `—`）显示该区块且不破坏整体布局。
4. WHEN 用户操作上一词/下一词 THEN 系统 SHALL 切换到相应单词并重新渲染五个区块。

### Requirement 6: 跨端通用与离线可用（PWA）

**User Story:** 作为一名英语学习者，我希望在电脑和手机上用同一套应用学习，并能安装到桌面/主屏、离线使用，以便随时随地学习。

#### Acceptance Criteria

1. WHEN 用户在电脑或手机浏览器打开应用 THEN 系统 SHALL 以同一套代码提供一致的功能与自适应布局。
2. WHEN 浏览器支持 PWA THEN 系统 SHALL 提供 Web App Manifest 与 Service Worker，使应用可安装到桌面/主屏。
3. WHEN 应用已加载过且处于离线状态 THEN 系统 SHALL 通过缓存的静态资源正常打开，并可访问本地 IndexedDB 中的词库。
4. WHEN 应用运行 THEN 系统 SHALL 不依赖任何后端服务器或实时网络连接即可完成录入、学习与导入导出。

## Glossary

（术语表）

- **PWA（渐进式 Web 应用）**：可安装到桌面/主屏、支持离线、用一套 Web 代码在电脑与手机通用的应用形态。
- **IndexedDB**：浏览器内置的本地数据库，用于持久化保存词库，无需后端服务器。
- **音标（IPA）**：国际音标，描述单词标准读音的符号系统。
- **音节单元（SyllableUnit）**：按读音对单词拆分得到的片段，带颜色分组用于区分展示。
- **谐音**：用中文近似音辅助记忆英文单词读音的字符串（如 banana → 拔那那）。
- **规范化拼写（normalizedSpelling）**：拼写去除首尾空格并转小写后的形式，用于去重与作为稳定 `id`。
- **合并策略（MergeStrategy）**：导入时解决同一单词冲突的方式，默认 keepNewer（取 `updatedAt` 较大者）。
- **Web Speech API**：浏览器内置的语音合成接口，用于免费朗读单词。
- **Service Worker / Web App Manifest**：实现 PWA 离线缓存与可安装的浏览器机制。
