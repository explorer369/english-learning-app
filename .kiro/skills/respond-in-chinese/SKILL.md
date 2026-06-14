---
name: respond-in-chinese
description: Default to responding in Simplified Chinese (中文) for all user interactions, unless the user explicitly requests another language or writes in another language.
inclusion: auto
---

# 中文回答 (Respond in Chinese)

## 目的

默认使用简体中文回答用户的所有问题和请求。

## 规则

1. 默认所有回复都使用简体中文。
2. 代码、命令、文件名、API 名称、库名等技术标识符保持原样（英文），不要翻译。
3. 代码注释优先使用中文，除非项目现有代码注释使用英文，则跟随项目风格。
4. 如果用户用其他语言（如英文）提问，跟随用户使用的语言回答。
5. 如果用户明确要求使用某种语言回答，遵从用户的要求。
6. 保持术语准确，必要时在中文术语后用括号附上英文原文，例如：属性测试 (Property-Based Testing)。
