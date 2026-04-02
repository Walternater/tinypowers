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

把 `PLAN` 阶段的需求落成可恢复、可审查、可验证的实现过程。

## 输入

- `features/{id}-{name}/PRD.md`
- `features/{id}-{name}/技术方案.md`
- `features/{id}-{name}/任务拆解表.md`
- `features/{id}-{name}/SPEC-STATE.md`
- `features/{id}-{name}/STATE.md`（不存在时进入 `EXEC` 自动生成）

## 生命周期约束

- 进入本 skill 时，`SPEC-STATE` 必须为 `PLAN` 或 `EXEC`
- 开始执行后推进到 `EXEC`
- 完成审查和验证后推进到 `REVIEW`
- 禁止在 `/tech:commit` 前自动提交

## 主流程

```text
Fast / Medium Route:
  Phase 0F: Gate Check
  Phase 1F: Pattern Scan + Context Preparation
  Phase 2F: Execute
  Phase 3F: Review + Verify

Standard Route:
  Phase 0: Gate Check
  Phase 1: Worktree Setup
  Phase 2: Context Preparation + Pattern Scan
  Phase 3: Execute
  Phase 4: Review + Verify
```

> `Medium` 和 `Fast` 共用同一条执行路径（0F→1F→2F→3F），区别仅在于任务数量（Medium 允许 3-5 个）。

## Gate Check

进入执行前确认：
- `PRD.md` 非空且包含验收标准
- `技术方案.md` 存在且包含至少 1 条「已确认」决策
- `任务拆解表.md` 存在且包含明确任务和验收标准
- `SPEC-STATE.track` 已明确
- （`plan_step = ready` 可视为规划完成的可选信号）

推进到 `EXEC` 时：
- 自动生成 `STATE.md`
- `STATE.md` 应从 `任务拆解表.md` 自动提取 Wave / Task 初稿

进入 EXEC 命令（实质内容门禁，无需 `--note`）：

```bash
node "${TINYPOWERS_DIR}/scripts/update-spec-state.js" \
  --root . \
  --feature "{feature-dir-name}" \
  --to EXEC
```

## Pattern Scan + Context Preparation

执行前先做两件事：

1. **Pattern Scan**：搜索最相似的已有实现
   - 若 `features/` 目录无其他同类实现文件，或项目处于 GREENFIELD 状态，直接标记 `GREENFIELD` 并跳过扫描
   - 有参考实现时：提取可复用的骨架和模式

2. **Context Preparation**：只加载当前任务真正需要的上下文

必须注入的上下文：
- 当前任务相关的方案片段
- 锁定决策（D-0N）
- 任务验收标准
- 参考实现锚点
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
- Phase 1 可使用 `superpowers:using-git-worktrees`
- Execute 可使用 `superpowers:subagent-driven-development`
- Review 可使用 `superpowers:requesting-code-review`
- Verify 可使用 `superpowers:verification-before-completion`

## 审查与验证

无论哪条路径，都必须至少完成：
- 方案符合性检查
- 安全风险检查
- 代码质量检查
- 验证证据产出（`VERIFICATION.md`）

建议顺序：

```text
方案符合性 -> 安全审查 -> 代码质量 -> 验证
```

## 输出

```text
features/{id}-{name}/
├── STATE.md
├── VERIFICATION.md
└── notepads/learnings.md
```

代码和文档的最终收口统一交给 `/tech:commit`。

## 配套说明

- `STATE.md` 是执行期唯一真相源
- `VERIFICATION.md` 是进入 `/tech:commit` 的前置条件
- 同一问题连续失败 3 次，应停止并上升到架构讨论

**委托 superpowers**:
- Standard Phase 1 → `superpowers:using-git-worktrees`
- Standard Phase 3 → `superpowers:subagent-driven-development`
- Standard Phase 4 → `superpowers:requesting-code-review`
- Standard / Fast Verify → `superpowers:verification-before-completion`
