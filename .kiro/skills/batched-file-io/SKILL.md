---
name: batched-file-io
description: When file reads/writes or sub-agent calls get aborted or interrupted (e.g. "aborted. The agent has seen this error...", connection reset, proxy timeout on long responses), recover by splitting the work into small batches — read in chunks and write/append in small pieces instead of one large operation.
inclusion: auto
---

# 分批读写以应对操作中断 (Batched File I/O)

## 目的

在网络代理不稳定或对长响应有超时限制的环境中，**一次性读写大段内容**容易被中途掐断，常见报错形如：

> `aborted. The agent has seen this error and will try a different approach to write the file if needed.`

根因通常是单次操作的响应过长、耗时过久，被网络代理或超时机制中断，而不是文件本身或逻辑有问题。

## 触发场景

出现以下任一情况时，应用本 skill：

1. 写入或生成大文件（如完整的设计/需求/任务文档、长代码文件）时反复中断。
2. 一次性读取超大文件时中断。
3. 调用子代理（sub-agent）执行需要长输出的任务时反复返回 cancelled / aborted。
4. 报错信息中出现 aborted、cancelled、connection reset、proxy、timeout 等字样。

## 解决策略

### 写入：分小批追加

1. 先用 `fs_write` 创建文件，只写入**开头一小段**（如标题 + 第一节）。
2. 之后用 `fs_append` **逐段追加**，每次只追加一个小节或一小块内容。
3. 控制单次写入体量（建议每批几十行以内），宁可多次调用，也不要一次写完。
4. 对已存在文件的局部修改，优先用 `str_replace` 做**小范围精确替换**，而不是整文件重写。

### 读取：分段读取

1. 对大文件用 `read_file` 的 `start_line` / `end_line` 参数分段读取，而不是一次读全文。
2. 需要多文件时，按需逐个读取关键片段，避免单次拉取过多内容。

### 子代理：避免长输出单次调用

1. 如果子代理因长输出反复被中断，改为**自己分批**用上述 `fs_append` / `str_replace` 直接完成产物。
2. 或将大任务拆成多个小的子任务分别调用。

## 验证

- 每写完一批后，可用 `get_diagnostics` 或 `read_file` 抽查，确认内容正确落盘再继续下一批。
- 全部写完后做一次整体校验（如文档格式诊断、编译/lint）。

## 要点

- 失败两次以上不要用同样的大块方式重试 —— 立即切换为分批读写。
- 分批是为绕开传输层中断，不改变最终产物内容。
- 优先选择幂等、可续写的操作（append、局部 replace），便于中断后从断点继续。
