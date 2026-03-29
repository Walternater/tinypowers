---
name: tech:progress
description: 当用户询问当前进度、查看 feature 执行状态、或要求推荐下一步动作时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "1.0"
---

# /tech:progress

## 作用

`/tech:progress` 用来快速回答两个问题：
- 现在有哪些 Feature 在推进
- 下一步最合理的动作是什么

它本身不推进工作，只做状态读取和导航。

## 输入来源

默认读取：
- `features/*/STATE.md`
- 相关的 `notes/`、`todos/`、`seeds/`（如存在）

## 主流程

```text
检查 features/ 是否存在
  -> 扫描所有 STATE.md
  -> 生成进度摘要
  -> 推荐下一步
  -> 可选展示待触发种子
```

## 1. 扫描 Feature 状态

如果 `features/` 不存在，说明项目还没初始化，应直接提示先执行 `/tech:init`。

如果存在 `features/` 但没有 `STATE.md`，说明当前没有明确的执行主线，应提示可以开始 `/tech:feature`。

## 2. 读取关键信息

从每个 `STATE.md` 中提取至少这些字段：
- Feature ID
- 当前阶段
- 当前 Wave 或当前步骤
- 已完成任务数量
- 总任务数量
- 阻塞项
- 偏差项

这些信息足够支撑一份轻量进度报告。

## 3. 生成进度摘要

建议输出包含：
- 当前进行中的 Feature 列表
- 每个 Feature 的阶段和进度
- 是否存在阻塞
- 项目层面的总体状态

例如可以汇总成：
- 进行中多少个
- 阻塞多少个
- 哪个 Feature 最值得优先继续

## 4. 推荐下一步

推荐应直接基于当前阶段，而不是给泛泛建议。

常见映射：
- 需求分析中：继续 `/tech:feature`
- Wave 执行中：继续 `/tech:code`
- 审查阶段：继续当前审查步骤
- 验证阶段：完成最终验证
- 所有实现已完成：进入 `/tech:commit`

如果有阻塞项，优先推荐先解除阻塞，而不是继续往后推流程。

## 5. 可选显示种子

如果相关 Feature 下存在未触发的 `seed`，可以在报告末尾提醒：
- 有哪些 dormant seed
- 它们的大致触发条件是什么

这一步是补充信息，不应盖过主线进度。

## 输出边界

`/tech:progress` 默认只读，不修改任何文件。

它的职责是让人快速恢复上下文，而不是替代 `/tech:feature`、`/tech:code` 或 `/tech:commit`。

## 判断标准

一份好的进度报告，应当让读者在很短时间内知道：
- 当前项目是否有活跃 Feature
- 每个 Feature 卡在哪一段
- 下一步应该做什么
- 是否存在必须先处理的阻塞项

## Gotchas

> 已知失败模式，从实际使用中发现，有机增长。

- **STATE.md 为空或过时**：但仍在报告进度 → 报告与实际不符：progress 默认从 STATE.md 读取，如果 STATE.md 不存在则静默跳过，不生成误导信息
- **只读不推进**：反复查看进度但不实际推进 → 状态不变：progress 是信息工具，不是推进工具；读完应主动决策下一步
- **多个活跃 Feature 时混淆**：没有指定具体是哪个 Feature → 报告不精准：progress 默认显示所有活跃 Feature 的汇总，加 `--feature <id>` 可以只看单个
