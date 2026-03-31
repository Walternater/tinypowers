---
name: tech:feature
description: 当用户开始新功能需求、需求模糊不完整、或需要先做技术方案和任务拆解时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "5.0"
---

# /tech:feature

## 作用

把一个模糊需求整理成"可执行的需求定义"。本 skill 是**薄编排层**——定义 WHAT（门禁、产物、决策锁定），需求探索委托 `superpowers:brainstorming`，任务拆解委托 `superpowers:writing-plans`。

## 最终产物

```text
features/{需求编号}-{需求名称}/
├── CHANGESET.md
├── SPEC-STATE.md
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

## 主流程

```text
Phase 0: 准备（tinypowers 独有）
Phase 1: 需求理解（tinypowers 独有）
Phase 2: 歧义检测 + 多方案探索（委托 superpowers:brainstorming）
Phase 3: 技术方案（tinypowers agents/architect）
Phase 4: 任务拆解（委托 superpowers:writing-plans）
Phase 5: 任务表验证（tinypowers agents/tech-plan-checker）
```

## 硬约束

- SPEC-STATE 阶段推进禁止跳步
- 技术方案完成后必须显式确认，不能用普通文字代替
- 已确认决策在 `/tech:code` 阶段不能被擅自推翻
- 任务拆解完成后必须显式确认，不能直接流入 `/tech:code`

## Phase 0: 准备

### 种子扫描

开始新需求前，先扫描已有 `features/*/seeds/`：
- 找出和当前需求相关的 dormant 种子
- 询问用户是否纳入本次需求
- 如果纳入，更新种子状态并合并到分析上下文

### 解析需求

从输入中提炼：需求 ID、简短描述、对应目录名。

### 创建目录和分支

```bash
node .claude/skills/tinypowers/scripts/scaffold-feature.js --id {id} --name {name}
```

## Phase 1: 需求理解

读取 PRD，形成理解摘要，逐项确认。详见 `requirements-guide.md`。

要回答的问题：
- 为什么做这个需求
- 谁会使用
- 本次范围
- 验收标准
- 非功能需求

## Phase 2: 歧义检测 + 多方案探索

**委托 `superpowers:brainstorming` 完成。**

歧义检测先消除模糊点（详见 `ambiguity-check.md`），然后 brainstorming 探索 2-3 种可行方案并给出推荐。

brainstorming 的输出直接作为技术方案的输入。

## Phase 3: 技术方案

调用 `agents/architect` 生成技术方案。详见 `tech-design-guide.md`、`@agents/decision-guardian.md`。

### 决策锁定

方案确认后，关键决策写入持久化记忆并同步记录到 `技术方案.md`：

- D-01 架构 / 框架选型
- D-02 数据结构 / 表结构
- D-03 对外接口契约
- D-04 中间件或依赖选型
- D-05 特殊安全方案

## Phase 4: 任务拆解

**委托 `superpowers:writing-plans` 完成。**

writing-plans 接收技术方案 + 决策锁定的上下文，产出可执行的任务拆解表。

tinypowers 的补充要求（注入到 writing-plans 的上下文中）：
- 拆解层级：Epic → Story → Task
- 每个 Task ≤ 1 人天（8h）
- 必须有依赖关系和可验证的验收标准
- 验收标准不允许"功能正常"等模糊描述

## Phase 5: 任务表验证

调用 `agents/tech-plan-checker` 验证任务表格式、依赖关系、任务粒度。

验证通过后 SPEC-STATE 推进到 `TASKS`，可以进入 `/tech:code`。

## 完成标准

- `PRD.md` 已存在且可读
- 已形成需求理解确认
- 高优先级歧义已澄清或被显式记录
- `技术方案.md` 已确认
- 关键决策已锁定
- `任务拆解表.md` 已确认可执行

## 配套文档

`requirements-guide.md` | `ambiguity-check.md` | `tech-design-guide.md` | `verification.md` | `@configs/templates/tech-design.md`

## Gotchas

- 歧义检测高优先级项必须清零才能进 DESIGN
- 技术方案完成后必须显式确认
- Task 必须 ≤ 1 人天
- Phase 1 必须先了解项目上下文
- 必须提出 2-3 方案 + trade-offs
