---
name: tech:code
description: 当用户要求执行已规划的任务、开始编码实现、或继续未完成的 wave 执行时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "9.0"
---

# /tech:code

## 作用

把 `PLAN` 阶段的需求落成可恢复、可审查、可验证的实现过程。

## 输入

- `features/{id}-{name}/PRD.md`
- `features/{id}-{name}/技术方案.md`
- `features/{id}-{name}/任务拆解表.md`
- `features/{id}-{name}/SPEC-STATE.md`

## 生命周期约束

- 进入本 skill 时，`SPEC-STATE` 必须为 `PLAN` 或 `EXEC`
- 开始执行后推进到 `EXEC`
- 完成审查和验证后推进到 `REVIEW`
- 禁止在 `/tech:commit` 前自动提交

## 主流程

```text
Fast / Medium Route:
  Phase 0F: Gate Check
  Phase 1F: Context Preparation
  Phase 2F: Execute
  Phase 3F: Review + Verify

Standard Route:
  Phase 0: Gate Check
  Phase 1: Context Preparation
  Phase 2: Execute
  Phase 3: Review + Verify
  Phase 4: Test Report
```

> Fast 和 Medium 共用同一条执行路径，区别仅在于任务数量（Medium 允许 3-5 个）。
> Standard 路由增加独立的测试报告阶段。

## Gate Check

进入执行前确认：
- `PRD.md` 非空且包含验收标准
- `技术方案.md` 存在且包含至少 1 条「已确认」决策
- `任务拆解表.md` 存在且包含明确任务和验收标准
- `SPEC-STATE.track` 已明确

推进到 `EXEC` 时：
- 在 `SPEC-STATE.md` 中更新 `current_wave` 和 `exec_progress` 字段
- 从 `任务拆解表.md` 提取 Wave / Task 信息，写入 `SPEC-STATE.md` 的 `current_wave` 字段

进入 EXEC 命令（实质内容门禁，无需 `--note`）：

```bash
node "${TINYPOWERS_DIR}/scripts/update-spec-state.js" \
  --root . \
  --feature "{feature-dir-name}" \
  --to EXEC
```

## Context Preparation

执行前加载必要上下文：
- 当前任务相关的方案片段
- 锁定决策（D-0N）
- 任务验收标准
- 参考实现锚点（搜索已有相似实现，GREENFIELD 项目跳过）
- 相关 learnings（如果存在）
- 相关 `docs/knowledge.md` 片段

缝合策略：
- 先复用已有骨架
- 再替换业务字段
- 只在差异点写新逻辑
- 没有参考实现时明确标记 `GREENFIELD`

## Fast / Medium Route

Fast/Medium 路径目标是减少委托和切换成本：
- 默认不新建 worktree
- 默认不展开重型 subagent 链
- 本地直接执行
- Review + Verify 合并收口

但这些底线不变：
- 缝合优先
- TDD 优先
- 验证证据必须保留

## Standard Route

Standard 路径保留完整治理能力：
- Execute 可使用 `superpowers:subagent-driven-development`
- Review 可使用 `compliance-reviewer` + `superpowers:requesting-code-review`
- Verify 可使用 `superpowers:verification-before-completion`
- 测试阶段需产出测试计划和测试报告

### Worktree（可选）

当用户明确要求隔离开发环境时，可使用 `superpowers:using-git-worktrees`。
默认不启用 worktree。

## 审查与验证

无论哪条路径，都必须至少完成：
- 方案符合性检查
- 安全风险检查
- 代码质量检查
- 验证证据产出（`VERIFICATION.md`）

建议顺序：

```text
compliance-reviewer（方案符合性 + 安全） -> superpowers:requesting-code-review（代码质量） -> verification（验证）
```

## 测试（Standard 路由）

Standard 路由在审查验证之后、进入 REVIEW 之前，需完成：
1. 按测试计划执行测试
2. 产出 `测试报告.md`，填写执行结果
3. 更新 `SPEC-STATE.md` 的产物清单状态

## 输出

```text
features/{id}-{name}/
├── SPEC-STATE.md（更新 current_wave / exec_progress）
├── VERIFICATION.md
├── 测试计划.md（Standard 路由）
├── 测试报告.md（Standard 路由）
└── notepads/learnings.md
```

代码和文档的最终收口统一交给 `/tech:commit`。

## 配套说明

- `SPEC-STATE.md` 是唯一状态源（PLAN 阶段用 `plan_step`，EXEC 阶段用 `current_wave` / `exec_progress`）
- `VERIFICATION.md` 是进入 `/tech:commit` 的前置条件
- 同一问题连续失败 3 次，应停止并上升到架构讨论
- 知识库沉淀：执行过程中的关键发现记录到 `notepads/learnings.md`

**委托 superpowers**:
- Standard Execute → `superpowers:subagent-driven-development`
- Standard Review → `compliance-reviewer` + `superpowers:requesting-code-review`
- All Routes Verify → `superpowers:verification-before-completion`

**委托 tinypowers agents**:
- Review 阶段 → `compliance-reviewer`（方案符合性 + 安全审查合一）
