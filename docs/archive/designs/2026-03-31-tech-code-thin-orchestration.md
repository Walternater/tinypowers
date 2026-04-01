# tech:code 薄编排层重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 tech:code 从 240 行自建流程精简为 ~100 行薄编排层，执行/审查/验证委托给 superpowers。

**Architecture:** tinypowers 只保留 SPEC-STATE 门禁、Pattern Scan、上下文预加载、硬约束定义。Wave 执行、代码审查、完成验证全部改为引用 superpowers 技能。删除 3 个与 superpowers 重叠的 agent 和 4 个冗余子文档。

**Tech Stack:** Node.js (tinypowers 框架自身)

**Design doc:** `docs/archive/designs/2026-03-31-thin-orchestration-refactor-design.md`

---

## File Structure

```text
DELETE:
  agents/code-reviewer.md          → superpowers:code-reviewer 替代
  agents/planner.md                 → superpowers:writing-plans 替代
  agents/tech-verifier.md           → superpowers:verification-before-completion 替代
  skills/tech-code/wave-execution.md → 拆为 pattern-scan.md
  skills/tech-code/state-management.md → superpowers 自管理
  skills/tech-code/session-recovery.md → superpowers 自管理
  skills/tech-code/quality-gate.md  → 并入 SKILL.md 硬约束
  skills/tech-code/deviation-handling.md → 并入 SKILL.md 硬约束

CREATE:
  skills/tech-code/pattern-scan.md  ← 从 wave-execution.md 提取

MODIFY:
  skills/tech-code/SKILL.md         ← 重写为薄编排层
  skills/tech-code/context-preload.md ← 保持，已在胶水编程中更新
  agents/spec-compliance-reviewer.md ← 删除对 code-reviewer 的引用
  agents/security-reviewer.md       ← 删除对 code-reviewer 的引用
  docs/guides/capability-map.md     ← 删除 3 个重叠 agent 条目
  README.md                         ← 删除 3 个重叠 agent 描述
```

---

### Task 1: Delete 3 overlapping agents

**Files:**
- Delete: `agents/code-reviewer.md`
- Delete: `agents/planner.md`
- Delete: `agents/tech-verifier.md`

- [ ] **Step 1: Delete the files**

```bash
rm agents/code-reviewer.md agents/planner.md agents/tech-verifier.md
```

- [ ] **Step 2: Validate**

Run: `npm run validate && npm test`
Expected: 0 errors, 0 warnings, 12 tests pass

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "refactor: delete 3 agents overlapping with superpowers

Removed: code-reviewer → superpowers:code-reviewer
Removed: planner → superpowers:writing-plans
Removed: tech-verifier → superpowers:verification-before-completion

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Update references in kept agents

**Files:**
- Modify: `agents/spec-compliance-reviewer.md:165`
- Modify: `agents/security-reviewer.md:110`

- [ ] **Step 1: Update spec-compliance-reviewer.md**

将第 165 行的 `code-reviewer` 引用替换：

Old: `- `/tech:code` Phase 3 的**第一步**（在 security-reviewer 和 code-reviewer 之前）`
New: `- `/tech:code` Phase 3 的**第一步**（在 security-reviewer 和 superpowers:code-review 之前）`

- [ ] **Step 2: Update security-reviewer.md**

将第 110 行的 `code-reviewer` 引用替换：

Old: `- `/tech:code` 执行时（先于 code-reviewer 运行）`
New: `- `/tech:code` 执行时（先于 superpowers:code-review 运行）`

- [ ] **Step 3: Validate**

Run: `npm run validate && npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add agents/spec-compliance-reviewer.md agents/security-reviewer.md && git commit -m "refactor: update agent references from code-reviewer to superpowers

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Update docs and README

**Files:**
- Modify: `docs/guides/capability-map.md:36-42`
- Modify: `README.md:63-71`

- [ ] **Step 1: Update capability-map.md**

将 Agents 表中的 3 行删除（planner、code-reviewer、tech-verifier），保留其余。同时添加一行说明：

Old (lines 36-42):
```markdown
| `architect` | 技术方案设计 |
| `planner` | 任务拆解、Wave 规划 |
| `decision-guardian` | 锁定关键决策，防止实现漂移 |
| `tech-plan-checker` | 编码前检查任务表和依赖关系 |
| `spec-compliance-reviewer` | 先审是否符合技术方案 |
| `security-reviewer` | 再审安全风险 |
| `code-reviewer` | 最后审代码质量 |
| `tech-verifier` | 回到目标和验收标准做最终验证 |
```

New:
```markdown
| `architect` | 技术方案设计 |
| `decision-guardian` | 锁定关键决策，防止实现漂移 |
| `tech-plan-checker` | 编码前检查任务表和依赖关系 |
| `spec-compliance-reviewer` | 先审是否符合技术方案 |
| `security-reviewer` | 再审安全风险 |

> **已委托 superpowers:** 任务拆解 → `superpowers:writing-plans`，代码审查 → `superpowers:code-reviewer`，完成验证 → `superpowers:verification-before-completion`
```

- [ ] **Step 2: Update README.md**

将 README.md 中「规划与设计」和「审查与验证」部分的重叠 agent 描述更新：

Old (lines 61-71):
```markdown
#### 规划与设计
- `architect`：技术方案设计
- `planner`：任务拆解和 Wave 规划
- `decision-guardian`：锁定关键决策，防止编码阶段擅自漂移

#### 审查与验证
- `tech-plan-checker`：执行前验证任务拆解表（含拓扑排序）
- `spec-compliance-reviewer`：先审"是不是实现了方案要求的东西"
- `security-reviewer`：再审安全风险
- `code-reviewer`：最后审代码质量与可维护性
- `tech-verifier`：目标回溯验证（4-Level 证据验证）
```

New:
```markdown
#### 规划与设计
- `architect`：技术方案设计
- `decision-guardian`：锁定关键决策，防止编码阶段擅自漂移

#### 审查与验证
- `tech-plan-checker`：执行前验证任务拆解表（含拓扑排序）
- `spec-compliance-reviewer`：先审"是不是实现了方案要求的东西"
- `security-reviewer`：再审安全风险

> 委托 superpowers：`writing-plans`（任务拆解）、`code-reviewer`（代码审查）、`verification-before-completion`（完成验证）
```

- [ ] **Step 3: Validate**

Run: `npm run validate && npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add docs/guides/capability-map.md README.md && git commit -m "docs: remove overlapping agent references, note superpowers delegation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Extract pattern-scan.md from wave-execution.md

**Files:**
- Create: `skills/tech-code/pattern-scan.md`
- Delete: `skills/tech-code/wave-execution.md`
- Delete: `skills/tech-code/state-management.md`
- Delete: `skills/tech-code/session-recovery.md`
- Delete: `skills/tech-code/quality-gate.md`
- Delete: `skills/tech-code/deviation-handling.md`

- [ ] **Step 1: Create pattern-scan.md**

从 `wave-execution.md` 提取 Pattern Scan 和 Wave 内学习捕获部分，丢弃 Wave 调度逻辑。新建文件内容：

```markdown
# pattern-scan.md

## 作用

定义 `/tech:code` 的缝合扫描和 Wave 内学习捕获规则。

## Pattern Scan（缝合扫描）

任务执行前，为每个任务在项目中搜索最相似的已有实现。

### 搜索策略

| 搜索维度 | 方法 | 示例 |
|---------|------|------|
| 同类型文件 | 按文件类型/层匹配 | 新建 Controller → 搜现有 Controller |
| 同业务域 | 按目录名、模块名、接口路径匹配 | 用户模块 → 搜 src/user/ 下文件 |
| 同模式 | 按功能模式匹配 | CRUD → 找最近的 CRUD 实现；列表+分页 → 找最近的分页实现 |

### 输出

每个任务至少找到一个参考锚点，标记为任务的「参考实现」。没有可参考的实现时标记 `GREENFIELD`。

```text
T-002 参考实现: src/user/UserController.java（同类型 CRUD Controller）
T-003 参考实现: src/order/OrderService.java（同层 Service，含分页查询）
T-004 GREENFIELD（全新认证模块，无同类实现）
```

### 缝合执行规则

非 GREENFIELD 任务必须先读取参考实现全文，理解其结构后再编码。编码顺序为：复制骨架 → 替换业务字段和接口地址 → 在差异点编写新逻辑。

## Wave 内学习捕获

执行过程中发现的经验，实时记录到 `notepads/learnings.md`。

### 捕获时机

| 信号 | 记录内容 |
|------|---------|
| 任务失败后修复成功 | 问题现象 → 根因 → 解法 |
| 发现组件/库的非显而易见用法 | 组件名 → 用法要点 → 代码片段 |
| 遇到平台约束导致的坑 | 约束描述 → 违反后果 → 正确做法 |
| 方案偏离后纠正 | 偏离点 → 为什么偏离 → 纠正理由 |

### 记录格式

```markdown
### [日期] 简要描述
- **类型**: 踩坑 / 组件用法 / 平台约束 / 方案纠正
- **发现于**: T-XXX（任务 ID）
- **内容**: 具体描述
```

### 不记录的内容

- 公开文档能查到的通用知识
- 纯粹的 typos 或格式问题
- 重复已有的 learnings 条目

这些学习在 `/tech:commit` Step 2（知识沉淀）时评估是否沉淀到 `docs/knowledge.md`。
```

- [ ] **Step 2: Delete old sub-documents**

```bash
rm skills/tech-code/wave-execution.md skills/tech-code/state-management.md skills/tech-code/session-recovery.md skills/tech-code/quality-gate.md skills/tech-code/deviation-handling.md
```

- [ ] **Step 3: Validate**

Run: `npm run validate && npm test`
Expected: PASS（SKILL.md 中对已删文件的引用会在 Task 5 修复）

注意：此步 validate 可能报 WARN（引用已删文件），属于预期。Task 5 会修复。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor: extract pattern-scan.md, delete 5 redundant sub-docs

wave-execution → pattern-scan (keep Pattern Scan + learning capture only)
Deleted: state-management, session-recovery, quality-gate, deviation-handling
(superpowers handles execution, state, and quality)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Rewrite SKILL.md as thin orchestration layer

**Files:**
- Modify: `skills/tech-code/SKILL.md`（完整重写）

- [ ] **Step 1: Write new SKILL.md**

完整替换 `skills/tech-code/SKILL.md` 为以下内容：

```markdown
---
name: tech:code
description: 当用户要求执行已规划的任务、开始编码实现、或继续未完成的 wave 执行时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "6.0"
---

# /tech:code

## 作用

把 `tech-feature` 产出的任务表和技术方案，落成可恢复、可审查、可验证的实现过程。

本 skill 是**薄编排层**——定义 WHAT（门禁、缝合策略、上下文），委托 superpowers 定义 HOW（怎么派 subagent、怎么做 review、怎么验证）。

## 输入

- `features/{id}/任务拆解表.md`、`技术方案.md`、`STATE.md`、`SPEC-STATE.md`
- `STATE.md` 不存在则启动时创建
- `SPEC-STATE.md` 存在时，当前 phase 必须为 `TASKS` 或 `EXEC`

<HARD-GATE>
**执行前门禁检查** - 以下条件必须全部满足才能进入执行：
1. `SPEC-STATE.md` 存在且当前 phase 为 `TASKS` 或 `EXEC`
2. `任务拆解表.md` 存在且通过 `tech-plan-checker` 验证
3. `技术方案.md` 存在且包含已锁定决策（D-0N 格式）
4. 上一阶段（Phase 3 审查）已通过

如果不满足上述任一条件，禁止进入执行，必须先完成对应阶段。
</HARD-GATE>

## 主流程

```text
Phase 0: Gate Check
Phase 1: Context Preparation
Phase 2: Pattern Scan
Phase 3: Execute (delegate to superpowers)
Phase 4: Review (delegate to superpowers + tinypowers agents)
Phase 5: Verify (delegate to superpowers)
```

## 硬约束

- 禁止在 `/tech:commit` 之前自动执行 `git commit`
- **缝合优先**：任务执行前必须搜索项目中最相似的已有实现作为锚点，复制骨架 → 替换业务字段 → 只在差异点写新代码。纯新模块标记 `GREENFIELD` 后可从零编写
- **TDD 强制门禁**：每个任务的实现必须遵循 RED-GREEN-REFACTOR 循环。例外：`tech:quick` 模式、纯配置变更、文档更新、基础设施代码、原型探索
- **偏差 3 次升级**：同一问题连续失败 3 次后停止同方向尝试，上升到架构层讨论

## Phase 0: Gate Check

确认可以进入执行。

- 如果 `SPEC-STATE.md` 存在，更新 phase 为 `EXEC`
- 调用 `agents/tech-plan-checker` 验证任务表格式、依赖关系、任务粒度
- 对照 `技术方案.md` 锁定决策，确认无偏离 D-0N 约束
- 最多重试 3 次，仍失败则暂停

## Phase 1: Context Preparation

为后续 Phase 预加载上下文。详见 `context-preload.md`。

- 读取 `技术方案.md`、`任务拆解表.md`、`STATE.md`
- 加载领域知识（`docs/knowledge.md`）
- 加载 feature 级 learnings（`notepads/learnings.md`）

## Phase 2: Pattern Scan

为每个任务搜索最相似的已有实现。详见 `pattern-scan.md`。

- 按文件类型、业务域、功能模式三个维度搜索
- 每个任务产出参考锚点或 `GREENFIELD` 标记
- 缝合策略：标注保留/替换/新增

## Phase 3: Execute

**委托 `superpowers:subagent-driven-development` 执行。**

每个 subagent 的 task prompt 必须包含：
- 任务描述和验收标准
- 涉及文件和依赖接口
- 锁定决策（D-0N）
- Pattern Scan 结果（参考实现 + 缝合策略）
- 领域知识（按任务裁剪）
- TDD 要求

执行过程中发现的 learnings 实时记录到 `notepads/learnings.md`（格式见 `pattern-scan.md`）。

## Phase 4: Review

先委托 superpowers 审查，再追加 tinypowers 专项审查。

```text
1. superpowers:requesting-code-review    — 代码质量审查
2. agents/spec-compliance-reviewer      — 技术方案符合性（tinypowers 独有）
3. agents/security-reviewer             — 安全风险审查（tinypowers 独有）
```

每步最多重试 3 次，仍失败则暂停。

## Phase 5: Verify

**委托 `superpowers:verification-before-completion` 执行。**

铁律：没有验证证据就不算完成。

默认覆盖率目标：行覆盖率 >= 80%，分支覆盖率 >= 70%，核心业务 >= 90%。项目有更严门槛则以项目为准。

## 输出

```text
features/{id}/
├── STATE.md
├── VERIFICATION.md
└── notepads/learnings.md
```

代码变更统一由 `/tech:commit` 收口（包括知识沉淀）。

## 失败与恢复

- 门禁失败：先修复再进
- 执行失败：按 superpowers 的 subagent 失败处理
- 连续 3 次失败：停止，转入架构质疑

## 配套文档

`pattern-scan.md` | `context-preload.md`

## Gotchas

- 修复后必须重跑对应审查步骤，不能跳步
- STATE.md 以 `技术方案.md` 的锁定决策为准

## Anti-Rationalization 自检

| 你可能在想 | 更可靠的判断 |
|-----------|--------------|
| 这只是个小改动 | 小改动同样可能破坏边界条件 |
| 我已经检查过了 | 自查不等于独立验证 |
| 用户催得急 | 带着已知风险继续，返工成本更高 |
| 这一步应该不会出问题 | "应该"不是证据，跑完检查才是 |

## 交接检查清单

- [ ] **关键决策及依据**：列出所有 D-XXX 决策及其理由
- [ ] **被拒绝方案及原因**：记录否决的替代方案及否决理由
- [ ] **已识别风险**：当前已知的技术风险和阻塞项
- [ ] **未完成项**：明确哪些任务/Wave 尚未完成
- [ ] **验证证据**：附上测试通过、覆盖率、审查结论等证据
- [ ] **偏差记录**：汇总已发生的偏差类型和处理结果
- [ ] **下一步行动**：交接后应立即执行的第一个动作
```

- [ ] **Step 2: Validate**

Run: `npm run validate && npm test`
Expected: 0 errors, 0 warnings, 12 tests pass

- [ ] **Step 3: Commit**

```bash
git add skills/tech-code/SKILL.md && git commit -m "refactor(tech-code): rewrite as thin orchestration layer (v5→v6)

240 lines → ~100 lines. Keeps: SPEC-STATE gate, Pattern Scan, context preload,
hard constraints. Delegates: execution → superpowers:subagent-driven-development,
review → superpowers:requesting-code-review + tinypowers agents,
verification → superpowers:verification-before-completion.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Final verification

- [ ] **Step 1: Full validate + test**

```bash
npm run validate && npm test
```

Expected: 0 errors, 0 warnings, 12 tests pass

- [ ] **Step 2: Verify file structure**

```bash
ls skills/tech-code/ && echo "---" && ls agents/ && echo "---" && git diff --stat HEAD~5
```

Expected:
```text
skills/tech-code/SKILL.md  (重写)
skills/tech-code/context-preload.md  (保持)
skills/tech-code/pattern-scan.md  (新建)
agents/architect.md  (保留)
agents/decision-guardian.md  (保留)
agents/security-reviewer.md  (更新引用)
agents/spec-compliance-reviewer.md  (更新引用)
agents/tech-plan-checker.md  (保留)
agents/java/java-reviewer.md  (保留)
agents/java/springboot-reviewer.md  (保留)
```

Deleted (confirmed gone):
- agents/code-reviewer.md, planner.md, tech-verifier.md
- skills/tech-code/wave-execution.md, state-management.md, session-recovery.md, quality-gate.md, deviation-handling.md

---

## Self-Review

**Spec coverage:**
- [x] 3 overlapping agents deleted → Task 1
- [x] Agent references updated → Task 2
- [x] Docs/README updated → Task 3
- [x] Sub-documents extracted/deleted → Task 4
- [x] SKILL.md rewritten as thin layer → Task 5
- [x] Final verification → Task 6

**Placeholder scan:** No TBD/TODO found. All steps have exact content.

**Type consistency:** Agent names consistent throughout (spec-compliance-reviewer, security-reviewer, tech-plan-checker).
