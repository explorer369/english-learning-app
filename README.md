# 英语单词学习（english-learning-app）

一个纯前端的渐进式 Web 应用（PWA），帮助你录入单词、学习读音并管理个人词库。电脑和手机用浏览器打开同一个网址即可使用，可安装到桌面/主屏并离线使用，数据保存在浏览器本地，无需服务器与登录。

## 功能

- **单词录入**：随时添加单词（拼写、音标、音节拆分、谐音、翻译）。
- **学习界面（固定纵向布局，从上到下）**：
  1. 单词（点击即朗读发音）
  2. 颜色拆分（按读音音节用不同颜色区分）
  3. 音标（IPA）
  4. 谐音（中文辅助记忆）
  5. 翻译（中文释义）
- **发音**：点击单词用浏览器内置语音合成朗读（免费，电脑手机通用）。
- **词库导入导出**：电脑导出 JSON 文件，发到手机导入即可跨设备迁移，反向亦然；导入自动去重合并。

## 开发与构建

```bash
npm install      # 安装依赖
npm run dev      # 本地开发（浏览器打开提示的地址）
npm test         # 运行全部单元测试与属性测试
npm run build    # 类型检查 + 生产构建，产物在 dist/
npm run preview  # 预览生产构建
```

## 部署

`npm run build` 后，将 `dist/` 目录里的静态文件部署到任意静态托管（GitHub Pages、Netlify、Vercel、对象存储等）即可。无需后端。

## 跨设备使用

1. 在电脑上录入单词，到"词库"页点击"导出词库"，得到一个 JSON 文件。
2. 通过微信/网盘/邮件把文件发到手机。
3. 手机浏览器打开应用，到"词库"页选择该文件导入。
4. 反向操作同理（手机导出 → 电脑导入）。

`examples/sample-wordlib.json` 是一份示例词库，可直接导入体验。

## 技术栈

Vite + TypeScript + Svelte；测试用 Vitest + fast-check（属性测试）+ fake-indexeddb；持久化用 IndexedDB；发音用 Web Speech API；PWA 用 Service Worker + Web App Manifest。
