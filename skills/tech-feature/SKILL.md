---
name: tech:feature
description: 当用户开始新功能需求、需求模糊不完整、或需要先做技术方案和任务拆解时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "6.0"
---

# /tech:feature

## 作用

把一个模糊需求整理成"可执行的需求定义"。本 skill 是**薄编排层**——定义 WHAT（门禁、产物、决策锁定），需求探索遵循 `superpowers:brainstorming` 方法论，任务拆解委托 `superpowers:writing-plans`。

## 复杂度分级

Phase 0 结束时自动判定路由，不可跳过。

| 级别 | 判定条件 | 流程 |
|------|---------|------|
| Fast | 同时满足：单模块、<=2 人天、无 DB 变更、无安全敏感 | 2 Phase |
| Standard | 不满足 Fast 的任意一条 | 5 Phase |

判定原则：有疑问时走 Standard。Fast 是快速通道而非默认路径。

## 最终产物

### Standard 产物

```text
features/{id}-{name}/
├── CHANGESET.md
├── SPEC-STATE.md
├── PRD.md
├── 需求理解确认.md
├── 技术方案.md
├── 任务拆解表.md
├── 评审记录.md
├── notepads/
│   └── learnings.md
├── seeds/
└── archive/
```

### Fast 产物（精简版）

```text
features/{id}-{name}/
├── CHANGESET.md
├── SPEC-STATE.md
├── PRD.md              # 精简版（<=30 行）：目标 + 范围 + 验收标准
└── 任务拆解表.md        # 精简版（<=20 行）：任务列表 + 验收标准
```

## Spec 状态机

每个 Feature 必须在 Phase 0 创建 `SPEC-STATE.md`（模板见 `configs/templates/spec-state.md`），并在每个 Phase 完成后更新阶段标记。

```text
PLAN → EXEC → REVIEW → DONE
```

| 推进到 | 必须存在的产物 |
|--------|--------------|
| EXEC | 任务拆解表.md 存在且非空 |

Fast 路径允许 PLAN → EXEC 直达（使用 `--mode relaxed`）。

## 主流程 — Standard（5 Phase）

```text
Phase 0: 准备（种子扫描 + 复杂度分级 + change set 骨架）
Phase 1: 需求理解（tinypowers 独有）
Phase 2: 歧义检测 + 多方案探索（方法论: superpowers:brainstorming）
Phase 3: 技术方案（tinypowers agents/architect）
Phase 4: 任务拆解 + 验证（委托 superpowers:writing-plans → tech-plan-checker）
```

## 主流程 — Fast（2 Phase）

```text
Phase 0: 准备（种子扫描 + 复杂度分级 + change set 骨架）
Phase 1: 快速确认 + 轻量方案 + 任务拆解 → SPEC-STATE 推到 EXEC
```

Fast 跳过：歧义检测（Phase 2）、architect agent（Phase 3）、brainstorming 委托、writing-plans 委托、tech-plan-checker 验证。

## 硬约束

- SPEC-STATE 阶段推进禁止跳步（Fast 路径除外）
- 技术方案完成后必须显式确认（Standard），不能用普通文字代替
- 已确认决策在 `/tech:code` 阶段不能被擅自推翻
- 任务拆解完成后必须显式确认（Standard），不能直接流入 `/tech:code`
- Fast 路径的复杂度判定必须在 Phase 0 完成，不得中途切换

## Phase 0: 准备

### 种子扫描

开始新需求前，先扫描已有 `features/*/seeds/`：
- 找出和当前需求相关的 dormant 种子
- 询问用户是否纳入本次需求
- 如果纳入，更新种子状态并合并到分析上下文

### 解析需求

从输入中提炼：需求 ID、简短描述、对应目录名。

### 创建目录骨架

```bash
node "${TINYPOWERS_DIR}/scripts/scaffold-feature.js" --root . --id {id} --name {name}
```

如果未设置 `TINYPOWERS_DIR`，有两个 fallback：
- 把 `TINYPOWERS_DIR` 替换成 tinypowers 的实际安装目录
- 项目级安装时直接运行 `node .claude/skills/tinypowers/scripts/scaffold-feature.js --root . --id {id} --name {name}`

默认**不**在 `/tech:feature` 阶段创建 worktree。隔离环境由 `/tech:code` Phase 0 在正式开工前创建。

### 复杂度判定

根据上面的分级表，判定本次需求走 Fast 还是 Standard。将判定结果（含判定理由）告知用户并获得确认。

## Phase 1: 需求理解（Standard）

读取 PRD，形成理解摘要，逐项确认。详见 `requirements-guide.md`。

要回答的问题：
- 为什么做这个需求
- 谁会使用
- 本次范围
- 验收标准
- 非功能需求

## Phase 2: 歧义检测 + 多方案探索（Standard）

**遵循 `superpowers:brainstorming` 方法论。**

歧义检测先消除模糊点（详见 `ambiguity-check.md`），然后按 brainstorming 方法论探索 2-3 种可行方案并给出推荐。

brainstorming 的输出直接作为技术方案的输入。

## Phase 3: 技术方案（Standard）

调用 `agents/architect` 生成技术方案，参照 `@agents/decision-guardian.md`。

### 方案自检清单

方案完成后，至少检查：

- [ ] 架构边界清晰
- [ ] 接口设计完整
- [ ] 数据模型合理
- [ ] 异常与风险已考虑
- [ ] 依赖系统已识别
- [ ] 替代方案和 trade-offs 已说明

### 决策锁定

方案确认后，关键决策写入持久化记忆并同步记录到 `技术方案.md`：

- D-01 架构 / 框架选型
- D-02 数据结构 / 表结构
- D-03 对外接口契约
- D-04 中间件或依赖选型
- D-05 特殊安全方案

已确认决策在 `/tech:code` 阶段不能被擅自推翻，如需修改应重新确认。

## Phase 4: 任务拆解 + 验证（Standard）

**委托 `superpowers:writing-plans` 完成。**

writing-plans 接收技术方案 + 决策锁定的上下文，产出可执行的任务拆解表。

tinypowers 的补充要求（注入到 writing-plans 的上下文中）：
- 拆解层级：Epic → Story → Task
- 每个 Task <= 1 人天（8h）
- 必须有依赖关系和可验证的验收标准
- 验收标准不允许"功能正常"等模糊描述

拆解完成后调用 `agents/tech-plan-checker` 验证任务表格式、依赖关系、任务粒度。验证通过后 SPEC-STATE 推进到 `EXEC`，可以进入 `/tech:code`。

## Fast Phase 1: 快速确认

Fast 路径在一轮交互中完成需求确认、轻量方案和任务拆解。

### 步骤

1. **需求摘要**：从用户输入提炼目标 + 范围 + 验收标准，写入精简版 PRD.md（<=30 行）
2. **轻量方案**：AI 直接写出实现思路（不调用 architect agent），包含：
   - 核心改动点（<=5 条）
   - 涉及文件预估
   - 潜在风险
3. **任务拆解**：AI 直接拆任务（不委托 writing-plans），写入精简版任务拆解表.md（<=20 行），每条包含任务描述 + 验收标准
4. **一轮确认**：用 `ask_followup_question` 展示上述全部内容，获得用户一次性确认

### 确认后推进

```bash
node "${TINYPOWERS_DIR}/scripts/update-spec-state.js" \
  --feature {id}-{name} --to EXEC --mode relaxed \
  --note "Fast path: confirmed in single round"
```

Fast 路径 SPEC-STATE 从 PLAN 直达 EXEC，然后进入 `/tech:code`。

## 完成标准

- `PRD.md` 已存在且可读
- 需求理解已确认（Standard）或一轮确认通过（Fast）
- 高优先级歧义已澄清或被显式记录（Standard）
- `技术方案.md` 已确认、决策已锁定（Standard）
- `任务拆解表.md` 已确认可执行
- SPEC-STATE 已推进到 EXEC

## 配套文档

| 文档 | 作用 |
|------|------|
| `requirements-guide.md` | 需求理解引导 |
| `ambiguity-check.md` | 歧义检测规则 |

**委托 superpowers**:
- Phase 4 → `superpowers:writing-plans`

**方法论引用**:
- Phase 1+2 → `superpowers:brainstorming`

## Gotchas

- **跳过歧义检测直接做方案**：觉得"基本清楚"就开始设计 → 方案在实现时发现需求冲突 → 歧义检测高优先级项必须清零才能进 Phase 3
- **方案不做用户确认就拆任务**：AI 自己的理解替代用户意图 → 返工 → 方案完成后必须显式确认
- **任务粒度过大**：把"实现订单模块"当一个 Task → 无法评估进度 → Task 必须 <= 1 人天
- **不探索上下文直接设计**：对现有代码结构不熟悉就提方案 → 与现有模式冲突或重复造轮子 → Phase 1 必须先了解项目上下文
- **单方案直接实现**：只提一个方案 → 用户失去选择权且容易选错 → 必须提出 2-3 方案 + trade-offs（Standard）
- **Fast 路径滥用**：把多模块需求硬塞 Fast → 方案遗漏和返工 → 有疑问就走 Standard，Fast 是快速通道而非默认
- **Fast 跳过确认**：Fast 虽然精简但确认不能省 → 必须用 `ask_followup_question` 获得显式确认
