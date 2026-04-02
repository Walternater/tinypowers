---
name: tech:code
description: 当用户要求执行已规划的任务、开始编码实现、或继续未完成的 wave 执行时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "8.0"
---

# /tech:code

## 作用

把 `tech-feature` 产出的任务表和技术方案，落成可恢复、可审查、可验证的实现过程。

本 skill 是**薄编排层**——定义 WHAT（门禁、缝合策略、上下文），委托 superpowers 定义 HOW（怎么派 subagent、怎么做 review、怎么验证）。

## 复杂度路由

| 维度 | Fast | Standard |
|------|------|----------|
| 任务数 | 1-3 个简单任务 | 4+ 任务或有复杂依赖 |
| 变更范围 | 单文件或 2-3 文件小改动 | 多模块、跨层变更 |
| 架构影响 | 无新决策、无接口变更 | 涉及新决策或接口变更 |
| 隔离需求 | 可直接在当前分支编码 | 需要 worktree 隔离 |

**判断规则**：所有维度都满足 Fast 才走 Fast 路径；任一维度需要 Standard 则走 Standard。

## 输入

- `features/{id}-{name}/任务拆解表.md`、`技术方案.md`、`STATE.md`、`SPEC-STATE.md`
- `STATE.md` 不存在则启动时创建
- `SPEC-STATE.md` 存在时，当前 phase 必须为 `PLAN` 或 `EXEC`

<HARD-GATE>
**执行前门禁检查** - 以下条件必须全部满足才能进入执行：
1. `SPEC-STATE.md` 存在且当前 phase 为 `PLAN` 或 `EXEC`
2. `任务拆解表.md` 存在且非空
3. `技术方案.md` 存在且包含已锁定决策（D-0N 格式）

如果不满足上述任一条件，禁止进入执行，必须先完成对应阶段。
</HARD-GATE>

## 主流程

### Standard

```text
Phase 0: Gate Check
Phase 1: Worktree Setup
Phase 2: Context Preparation
Phase 3: Execute (delegate to superpowers)
Phase 4: Test
Phase 5: Review (tinypowers agents → superpowers)
Phase 6: Verify (delegate to superpowers)
```

### Fast

```text
Phase 0: Gate Check
Phase 1: Context + Execute
Phase 2: Test + Review
Phase 3: Verify
```

## 硬约束

- 禁止在 `/tech:commit` 之前自动执行 `git commit`
- **缝合优先**：有相似已有实现时，复制骨架 → 替换业务字段 → 只在差异点写新代码。纯新模块标记 `GREENFIELD` 后可从零编写
- **偏差 3 次升级**：同一问题连续失败 3 次后停止同方向尝试，上升到架构层讨论

## Phase 0: Gate Check

确认可以进入执行。

- 如果 `SPEC-STATE.md` 存在，更新 phase 为 `EXEC`
- 对照 `技术方案.md` 锁定决策，确认无偏离 D-0N 约束
- 最多重试 3 次，仍失败则暂停

## Phase 1: Worktree Setup（Standard only）

委托 `superpowers:using-git-worktrees` 创建或复用隔离环境。

- `/tech:feature` 默认不建 worktree
- 如果当前已经在正确的隔离 worktree 中，直接复用
- 如果不存在隔离环境，完成 Gate Check 后再创建

## Phase 2: Context Preparation（Standard）

一次性读取共享文档：

- `技术方案.md`、`任务拆解表.md`、`STATE.md`
- `notepads/learnings.md`（如果存在）
- `docs/knowledge.md`（如果存在）

按当前任务裁剪注入：技术方案只注入相关章节，接口和数据库只注入涉及部分，决策记录全量注入。

## Phase 3: Execute（Standard）

**委托 `superpowers:subagent-driven-development` 执行。**

每个 subagent 的 task prompt 必须包含：
- 任务描述和验收标准
- 涉及文件和依赖接口
- 锁定决策（D-0N）
- 领域知识（按任务裁剪）

有相似参考实现时，在 task prompt 中注明参考锚点和缝合策略。

执行过程中发现的 learnings 实时记录到 `notepads/learnings.md`。

## Phase 4: Test

编码完成后、Review 之前，执行测试阶段。

- 编写测试用例（委托 `superpowers:test-driven-development` 或直接编写）
- 运行测试并记录结果
- 产出 `测试报告.md`（覆盖：测试范围、用例数、通过率、失败原因）

这是关键确认点——测试报告输出后暂停，等待确认后再进入 Review。

## Phase 5: Review（Standard）

先做 tinypowers 专项审查（确认"做对了东西"），再做 superpowers 代码质量审查。

```text
1. 方案符合性检查 — 实现是否匹配技术方案的锁定决策
2. 安全检查 — 输入校验、权限控制、SQL 注入等
3. superpowers:requesting-code-review — 代码质量审查
```

每步最多重试 3 次，仍失败则暂停。

## Phase 6: Verify（Standard）

**委托 `superpowers:verification-before-completion` 执行。**

铁律：没有验证证据就不算完成。

## Fast Phase 1: Context + Execute

合并 Context Preparation 和编码，简化执行。

- 读取 `技术方案.md`、`任务拆解表.md`，按当前任务裁剪
- 有相似参考文件时先读后改，无参考时从零编写
- 不派 subagent，直接编码
- learnings 实时记录到 `notepads/learnings.md`

## Fast Phase 2: Test + Review

合并测试和审查。

- 编写测试并运行，确保通过
- 做一轮综合自审：方案符合性 + 安全检查 + 代码质量
- 发现问题直接修复

## Fast Phase 3: Verify

**委托 `superpowers:verification-before-completion` 执行。**

与 Standard Phase 6 相同。铁律：没有验证证据就不算完成。

## 输出

```text
features/{id}-{name}/
├── STATE.md
├── VERIFICATION.md
├── 测试报告.md
└── notepads/learnings.md
```

代码变更统一由 `/tech:commit` 收口。

## 失败与恢复

- 门禁失败：先修复再进
- 执行失败：Fast 路径直接修复重试；Standard 路径按 superpowers 的 subagent 失败处理
- 连续 3 次失败：停止，转入架构质疑

**委托 superpowers**:
- Phase 1 (Standard) → `superpowers:using-git-worktrees`
- Phase 3 (Standard) → `superpowers:subagent-driven-development`
- Phase 4 → `superpowers:test-driven-development`（可选）
- Phase 5 (Standard) → `superpowers:requesting-code-review`
- Phase 6 / Fast Phase 3 → `superpowers:verification-before-completion`

## Gotchas

- **Fast 路径不应建 worktree**：小改动建 worktree 的开销大于收益，直接在当前分支编码
- **Fast 不等于跳过测试**：Fast 路径也必须写测试并确保通过
- **测试报告是交付物**：不是可选的中间产物，它是进入 Review 的前置条件
- **Fast→Standard 升级**：编码过程中发现任务比预期复杂，应切换到 Standard 路径
