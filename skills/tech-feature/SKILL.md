---
name: tech:feature
description: 当用户开始新功能需求、需求模糊不完整、或需要先做技术方案和任务拆解时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "4.0"
  references:
    - "@superpowers/brainstorming"  # 方法论引用
---

# /tech:feature

## 作用

`/tech:feature` 用于把一个模糊需求整理成“可执行的需求定义”。

它的目标不是直接产出代码，而是依次产出：
- 需求理解
- 歧义澄清
- 技术方案
- 决策锁定
- 任务拆解

## 最终产物

单个需求完成后，通常至少应有：

```text
features/{需求编号}-{需求名称}/
├── CHANGESET.md
├── SPEC-STATE.md          # 生命周期状态（各阶段产物追踪）
├── PRD.md
├── 需求理解确认.md
├── 技术方案.md
├── 任务拆解表.md
├── 评审记录.md
├── notes/
├── todos/
├── seeds/
└── archive/
```

## Spec 状态机

每个 Feature 必须在 Phase 0 创建 `SPEC-STATE.md`，并在每个 Phase 完成后更新阶段标记。

阶段推进规则（禁止跳步）：

```text
INIT → REQ → DESIGN → TASKS → EXEC → REVIEW → VERIFY → CLOSED
```

前置条件：

| 推进到 | 必须存在的产物 |
|--------|--------------|
| REQ | PRD.md 非空 |
| DESIGN | 需求理解确认.md 含"已确认" |
| TASKS | 技术方案.md 含已锁定决策 |
| EXEC | 任务拆解表.md 通过 plan-check |

模板见 `@configs/templates/spec-state.md`。

## 主流程

```text
Phase 0: 准备
  -> 解析需求
  -> 扫描相关 seed
  -> 创建目录和分支

Phase 1: 需求理解
  -> 读取 PRD
  -> 形成理解摘要
  -> One question at a time 确认

Phase 2: 歧义检测
  -> 找出模糊点
  -> 生成澄清问题
  -> 输出需求理解确认

Phase 3: 技术方案
  -> 设计方案
  -> ask_followup_question 确认
  -> update_memory 锁定决策

Phase 4: 任务拆解
  -> 拆成 Epic / Story / Task
  -> 确认可执行性
```

## Phase 0：准备

### 种子扫描

开始新需求前，应先扫描已有 `features/*/seeds/`：
- 找出和当前需求相关的 dormant 种子
- 询问用户是否纳入本次需求
- 如果纳入，更新种子状态并合并到分析上下文

### 解析需求

输入通常是：
- 需求 ID
- 需求标题
- 或两者组合

目标是提炼出：
- 需求 ID
- 简短描述
- 对应目录名

### 创建目录和分支

默认会为需求准备工作目录和分支，例如：

```text
features/CSS-1234-用户登录/
feature/CSS-1234-用户登录
```

推荐直接用脚手架创建 change set 骨架：

```bash
node .claude/skills/tinypowers/scripts/scaffold-feature.js --id CSS-1234 --name 用户登录
```

如果只手动创建，也至少应从模板补齐 `CHANGESET.md` 和 `SPEC-STATE.md`：

```bash
cp {tinypowers}/configs/templates/change-set.md features/{id}/CHANGESET.md
cp {tinypowers}/configs/templates/spec-state.md features/{id}/SPEC-STATE.md
```

将模板变量替换为实际值。

## Phase 1：需求理解

> **方法论引用**: brainstorming (superpowers)
> - 核心：探索上下文 → one at a time 澄清 → 提出多方案对比

### 输入

- `features/{id}/PRD.md`
- 相关 seed 或已有上下文

### 前置：探索项目上下文

在开始提问前，先了解现有代码结构：
- 检查相关模块的文件布局
- 了解已有的设计模式和约定
- 扫描是否有可复用的能力

### 要回答的问题

- 这个需求为什么做
- 谁会使用它
- 本次范围是什么
- 验收标准是什么
- 非功能需求有哪些

### 交互方式

采用 **one question at a time** + **优先多选**：
- 每次只确认一个主题
- 优先消除关键理解偏差
- 多选优于开放式问题（更容易回答）
- 不要一口气抛出一大串问题

### Visual Companion（涉及 UI 时）

如果需求涉及界面设计，按需提供可视化辅助：
- 先问："有些内容用浏览器展示会更直观，需要我提供可视化辅助吗？"
- 如同意，使用浏览器展示 mockup、布局对比等
- 非视觉内容（概念选择、trade-off 列表）仍在终端完成

细节见：
- `requirements-guide.md`
- `@superpowers/brainstorming/SKILL.md` (方法论来源)

## Phase 2：歧义检测 + 多方案探索

> **方法论引用**: brainstorming (superpowers)
> - 核心：Propose 2-3 approaches + Section-by-section 确认 + Spec Self-Review

### 目标

技术方案前，先消除会导致设计跑偏的模糊点。

重点看：
- 模糊描述词
- 边界条件
- 异常场景
- 数据量级
- 性能要求

### 多方案对比（from brainstorming）

在技术方案正式设计前，**必须**先探索 2-3 种可行方案：

1. **提出方案**：概述每种方案的思路
2. **Trade-offs 分析**：对比各方案的优劣
3. **推荐建议**：说明为什么推荐某方案
4. **用户确认**：确认后再进入详细设计

```text
方案 A: [简述]
  优点：...
  缺点：...
  适用场景：...

方案 B: [简述]
  ...

推荐：方案 X（原因：...）
```

### Section 分区确认（from brainstorming）

设计方案时分区块展示，逐步确认：
- 架构概览 → 用户确认
- 数据模型 → 用户确认
- 接口设计 → 用户确认
- 异常处理 → 用户确认

每完成一个 section，都问："这部分看起来 OK 吗？"

### Spec Self-Review（from brainstorming）

设计方案写完后，**必须**进行 inline 自检：

| 检查项 | 要找的问题 |
|--------|-----------|
| Placeholder | TBD、TODO、不完整的地方 |
| 内部矛盾 | 各 section 描述是否冲突 |
| 范围检查 | 是否聚焦单一实现计划 |
| 歧义 | 是否有多种解释的可能 |

发现问题时：**立即 inline 修复**，不需要重新 review。

### 输出

应至少形成：
- 已澄清问题
- 待澄清问题
- **多方案对比结论**
- 需求理解确认文档

原则：
- 高优先级歧义不应带入技术方案阶段
- 多方案必须获得用户确认才能进入详细设计

细节见：
- `ambiguity-check.md`
- `@superpowers/brainstorming/SKILL.md` (方法论来源)

## Phase 3：技术方案

### 输入

- 已确认的需求理解
- 已澄清的高优先级问题

### 输出

- `features/{id}/技术方案.md`

### 关键确认

技术方案完成后，必须通过 `ask_followup_question` 获得明确确认，不能用普通文字代替。

### 决策锁定

方案确认后，必须把关键决策写入持久化记忆，并同步记录到方案文档。

典型决策包括：
- 架构或框架选型
- 数据模型或表结构
- 对外接口契约
- 中间件和依赖选型
- 特殊安全方案

原则：
- 已确认决策在 `/tech:code` 阶段不能被擅自推翻

细节见：
- `tech-design-guide.md`
- `@agents/decision-guardian.md`

## Phase 4：任务拆解

### 目标

把技术方案拆成真正可执行的任务序列，而不是停留在“设计已经有了”。

默认拆解层级：

```text
Epic -> Story -> Task
```

### 基本要求

- Task 粒度合理
- 依赖关系明确
- 每个 Story 或 Task 都有可验证标准
- 能够为后续 Wave 执行提供输入

### 关键确认

任务拆解完成后，也必须显式确认，不能直接流入 `/tech:code`。

细节见：
- `task-breakdown.md`

## 完成标准

`/tech:feature` 完成时，至少应满足：
- `PRD.md` 已存在且可读
- 已形成需求理解确认
- 高优先级歧义已澄清或被显式记录
- `技术方案.md` 已确认
- 关键决策已锁定
- `任务拆解表.md` 已确认可执行

## 相关文档

- `requirements-guide.md`
- `ambiguity-check.md`
- `tech-design-guide.md`
- `task-breakdown.md`
- `verification.md`
- `@docs/guides/prd-analysis-guide.md`
- `@docs/guides/change-set-model.md`
- `@configs/templates/tech-design.md`

## Gotchas

> 已知失败模式，从实际使用中发现，有机增长。

- **跳过歧义检测直接做技术方案**：觉得歧义"基本清楚"就开始设计 → 方案在实现时发现需求冲突：歧义检测的高优先级项必须清零才能进入 DESIGN
- **技术方案不做用户确认就拆任务**：用 AI 自己的理解替代用户意图 → 返工：方案完成后必须通过 `ask_followup_question` 获得明确确认
- **任务粒度过大**：把"实现订单模块"当一个 Task → 执行时无法评估进度：Task 必须 ≤ 1 人天（8h）
- **不探索上下文直接设计**：对现有代码结构不熟悉就提出方案 → 可能与现有模式冲突或重复造轮子：Phase 1 必须先了解项目上下文
- **单方案直接实现**：只提一个方案没有对比 → 用户失去选择权且容易选错：必须提出 2-3 方案 + trade-offs
