---
name: tech:feature
description: 从 PRD 分析到技术方案再到任务拆解的完整需求定义流程。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "3.0"
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

### 输入

- `features/{id}/PRD.md`
- 相关 seed 或已有上下文

### 要回答的问题

- 这个需求为什么做
- 谁会使用它
- 本次范围是什么
- 验收标准是什么
- 非功能需求有哪些

### 交互方式

采用 one question at a time：
- 每次只确认一个主题
- 优先消除关键理解偏差
- 不要一口气抛出一大串问题

细节见：
- `requirements-guide.md`

## Phase 2：歧义检测

### 目标

技术方案前，先消除会导致设计跑偏的模糊点。

重点看：
- 模糊描述词
- 边界条件
- 异常场景
- 数据量级
- 性能要求

### 输出

应至少形成：
- 已澄清问题
- 待澄清问题
- 需求理解确认文档

原则：
- 高优先级歧义不应带入技术方案阶段

细节见：
- `ambiguity-check.md`

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
