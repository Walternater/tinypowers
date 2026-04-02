---
name: tech:feature
description: 当用户开始新功能需求、需求模糊不完整、或需要先做技术方案和任务拆解时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "5.1"
---

# /tech:feature

## 作用

把一个模糊需求整理成"可执行的需求定义"。本 skill 是**薄编排层**——定义 WHAT（门禁、产物、决策锁定），需求探索遵循 `superpowers:brainstorming` 方法论，任务拆解委托 `superpowers:writing-plans`。

## 复杂度路由

在 Phase 0 自动判定需求复杂度：

| 模式 | 判定条件（全部满足） | 流程差异 |
|------|---------------------|---------|
| **Fast** | 单模块改动、无新表/新外部依赖、预估 ≤ 2 人天、不涉及安全敏感操作 | 跳过 Phase 2（歧义检测+多方案）、跳过 Phase 5（独立验证），Phase 1+3 合并为简化规划 |
| **Standard** | 不满足 Fast 条件 | 完整 5 Phase 流程 |

## 最终产物

```text
features/{需求编号}-{需求名称}/
├── SPEC-STATE.md
├── PRD.md
├── 需求理解确认.md
├── 技术方案.md
├── 任务拆解表.md
└── notepads/
    └── learnings.md
```

> CHANGESET.md、评审记录.md、seeds/、archive/ 按需创建，不预生成。

## Spec 状态机

每个 Feature 必须在 Phase 0 创建 `SPEC-STATE.md`，并在每个 Phase 完成后更新阶段标记。

```text
PLAN → EXEC → REVIEW → DONE
```

| 状态 | 含义 | 必须存在的产物 |
|------|------|--------------|
| PLAN | 规划中（需求理解 + 技术方案 + 任务拆解） | PRD.md 非空 |
| EXEC | 执行中 | 技术方案.md 含已锁定决策 + 任务拆解表.md 通过 plan-check |
| REVIEW | 审查中 | 代码实现完成、测试通过 |
| DONE | 已完成 | VERIFICATION.md 结论 = PASS |

## 主流程

```text
Phase 0: 准备（种子扫描 + change set 骨架 + 复杂度判定）
Phase 1: 需求理解（Fast: 简化确认 / Standard: 逐项确认）
Phase 2: 歧义检测 + 多方案探索（Standard only）
Phase 3: 技术方案（Fast: 简化方案 / Standard: 完整方案 + 决策锁定）
Phase 4: 任务拆解（委托 superpowers:writing-plans）
Phase 5: 任务表验证（Standard only）
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

### 复杂度判定

检查以下条件，决定走 Fast 还是 Standard 模式：

```
Fast 模式条件（全部满足）：
- 单模块改动（不跨 Controller/Service/Repository 以外的层）
- 无新表或新外部依赖
- 预估 ≤ 2 人天
- 不涉及安全敏感操作（支付、权限、数据导出）
```

### 创建目录骨架

```bash
node "${TINYPOWERS_DIR}/scripts/scaffold-feature.js" --root . --id {id} --name {name}
```

如果未设置 `TINYPOWERS_DIR`，有两个 fallback：
- 把 `TINYPOWERS_DIR` 替换成 tinypowers 的实际安装目录
- 项目级安装时直接运行 `node .claude/skills/tinypowers/scripts/scaffold-feature.js --root . --id {id} --name {name}`

默认**不**在 `/tech:feature` 阶段创建 worktree。隔离环境由 `/tech:code` Phase 0 在正式开工前创建。

## Phase 1: 需求理解

读取 PRD，形成理解摘要，逐项确认。详见 `requirements-guide.md`。

要回答的问题：
- 为什么做这个需求
- 谁会使用
- 本次范围
- 验收标准
- 非功能需求

**Fast 模式**：只需确认背景、范围、验收标准 3 项，输出简化确认稿。

## Phase 2: 歧义检测 + 多方案探索（Standard only）

> Fast 模式跳过此 Phase。

**遵循 `superpowers:brainstorming` 方法论。**

歧义检测先消除模糊点（详见 `ambiguity-check.md`），然后按 brainstorming 方法论探索 2-3 种可行方案并给出推荐。

brainstorming 的输出直接作为技术方案的输入。

## Phase 3: 技术方案

调用 `agents/architect` 生成技术方案。详见 `tech-design-guide.md`、`@agents/decision-guardian.md`。

**Fast 模式**：技术方案只需包含接口设计、数据设计、决策记录 3 个章节，不需要完整的风险分析、灰度回滚等章节。

### 决策锁定

方案确认后，关键决策写入持久化记忆并同步记录到 `技术方案.md`：

- D-01 架构 / 框架选型
- D-02 数据结构 / 表结构
- D-03 对外接口契约
- D-04 中间件或依赖选型
- D-05 特殊安全方案

> Fast 模式：只锁定实际涉及的决策，不需要填满 5 个。

## Phase 4: 任务拆解

**委托 `superpowers:writing-plans` 完成。**

writing-plans 接收技术方案 + 决策锁定的上下文，产出可执行的任务拆解表。

tinypowers 的补充要求（注入到 writing-plans 的上下文中）：
- 拆解层级：Epic → Story → Task
- 每个 Task ≤ 1 人天（8h）
- 必须有依赖关系和可验证的验收标准
- 验收标准不允许"功能正常"等模糊描述

## Phase 5: 任务表验证（Standard only）

> Fast 模式跳过此 Phase，任务拆解完成后直接推进到 EXEC。

调用 `agents/tech-plan-checker` 验证任务表格式、依赖关系、任务粒度。

验证通过后 SPEC-STATE 推进到 `EXEC`，可以进入 `/tech:code`。

## 完成标准

- `PRD.md` 已存在且可读
- 已形成需求理解确认
- 高优先级歧义已澄清或被显式记录（Standard 模式）
- `技术方案.md` 已确认
- 关键决策已锁定
- `任务拆解表.md` 已确认可执行

## 配套文档

| 文档 | 作用 |
|------|------|
| `requirements-guide.md` | 需求理解引导 |
| `ambiguity-check.md` | 歧义检测规则 |
| `tech-design-guide.md` | 技术方案设计引导 |

> verification.md 已删除，验证标准已内联到本文件的完成标准中。

**委托 superpowers**:
- Phase 4 → `superpowers:writing-plans`

**方法论引用**:
- Phase 1+2 → `superpowers:brainstorming`

## Gotchas

- **跳过歧义检测直接做方案**：觉得"基本清楚"就开始设计 → 方案在实现时发现需求冲突 → Standard 模式歧义检测高优先级项必须清零才能进 DESIGN
- **方案不做用户确认就拆任务**：AI 自己的理解替代用户意图 → 返工 → 方案完成后必须显式确认
- **任务粒度过大**：把"实现订单模块"当一个 Task → 无法评估进度 → Task 必须 ≤ 1 人天
- **不探索上下文直接设计**：对现有代码结构不熟悉就提方案 → 与现有模式冲突或重复造轮子 → Phase 1 必须先了解项目上下文
- **单方案直接实现**：只提一个方案 → 用户失去选择权且容易选错 → Standard 模式必须提出 2-3 方案 + trade-offs
