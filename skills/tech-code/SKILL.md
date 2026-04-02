---
name: tech:code
description: 当用户要求执行已规划的任务、开始编码实现、或继续未完成的 wave 执行时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "8.3"
---

# /tech:code

## 作用

把 `PLAN` 阶段的需求落成可恢复、可审查、可验证的实现过程。

## 输入

- `features/{id}-{name}/PRD.md`
- `features/{id}-{name}/技术方案.md`
- `features/{id}-{name}/任务拆解表.md`
- `features/{id}-{name}/SPEC-STATE.md`
- `features/{id}-{name}/STATE.md`（可选，多任务/跨 Wave/跨会话时维护）

## 生命周期约束

- 进入本 skill 时，`SPEC-STATE` 必须为 `PLAN` 或 `EXEC`
- 开始执行后推进到 `EXEC`
- **★ 测试报告输出后暂停，等待用户确认**，确认后继续 Verify，再推进到 `REVIEW`
- 禁止在 `/tech:commit` 前自动提交

## 主流程

```text
Fast / Medium Route:
  Phase 0F: Gate Check
  Phase 1F: Context Preparation（含快速参考扫描）
  Phase 2F: Execute
  Phase 3F: Review（代码审查）
  Phase 4F: Test（测试计划 + 测试报告）
  ★ 人工确认：测试报告输出后暂停，等待用户确认后继续
  Phase 5F: Verify → SPEC-STATE → REVIEW

Standard Route:
  Phase 0: Gate Check
  Phase 1: Worktree Setup（可选，视需求规模决定）
  Phase 2: Context Preparation（含参考扫描）
  Phase 3: Execute
  Phase 4: Review（代码审查）
  Phase 5: Test（测试计划 + 测试报告）
  ★ 人工确认：测试报告输出后暂停，等待用户确认后继续
  Phase 6: Verify → SPEC-STATE → REVIEW
```

> `Medium` 和 `Fast` 共用同一条执行路径，区别仅在于任务数量（Medium 允许 3-5 个）。

## Gate Check

进入执行前确认：
- `PRD.md` 非空且包含验收标准
- `技术方案.md` 存在且包含至少 1 条「已确认」决策
- `任务拆解表.md` 存在且包含明确任务和验收标准
- `SPEC-STATE.track` 已明确
- （`plan_step = ready` 可视为规划完成的可选信号）

推进到 `EXEC` 时，如果决定维护 `STATE.md`，从 `任务拆解表.md` 提取 Wave / Task 初稿。

进入 EXEC 命令（实质内容门禁，无需 `--note`）：

```bash
node "${TINYPOWERS_DIR}/scripts/update-spec-state.js" \
  --root . \
  --feature "{feature-dir-name}" \
  --to EXEC
```

## Context Preparation（含参考扫描）

执行前加载当前任务真正需要的上下文：

1. **参考扫描**：快速浏览是否有同类已有实现可复用
   - 有参考实现时：提取可复用的骨架和模式
   - 无参考实现时（或 GREENFIELD 项目）：直接标记 `GREENFIELD` 并跳过

2. **必须注入的上下文**：
   - 当前任务相关的方案片段
   - 锁定决策（D-0N）
   - 任务验收标准
   - 参考实现锚点
   - 相关 learnings（如果存在）
   - 相关 `docs/knowledge.md` 片段

缝合策略：先复用已有骨架，再替换业务字段，只在差异点写新逻辑。

## Test（所有路径）

Review 完成后，执行测试阶段：

- 编写测试计划（覆盖范围、用例列表），产出 `测试计划.md`
- 执行测试用例，产出 `测试报告.md`（覆盖：测试范围、用例数、通过率、失败原因）

**Fast 路径**：测试计划可简化为内联描述，不单独创建 `测试计划.md`；`测试报告.md` 可选，但测试结论须在交付前明确。

**Medium / Standard 路径**：必须产出 `测试计划.md` 和 `测试报告.md`，覆盖核心路径。

> 这是关键确认点——测试报告输出后，**暂停等待用户确认**，再进入 Verify。

## Fast / Medium Route

Fast/Medium 路径目标是减少委托和切换成本：
- 默认不新建 worktree
- 本地直接执行

Fast 路径审查（一轮快速检查）：
- 方案符合性 + 代码质量合并为一次自检
- 安全风险检查（仅关注输入验证、权限、敏感信息泄露）
- 审查结论须明确（可内联记录，**不单独创建 `VERIFICATION.md`**）

Medium 路径审查与验证：
- Review 用 `compliance-reviewer` 统一审查
- Verify 用 `superpowers:verification-before-completion`

这些底线不变：
- 缝合优先
- TDD 优先
- 验证证据必须保留（Fast 写入 STATE.md，Medium/Standard 独立文档）

## Standard Route

Standard 路径保留完整治理能力：
- Phase 1 可使用 `superpowers:using-git-worktrees`（跨模块或需要隔离时推荐）
- Execute 可使用 `superpowers:subagent-driven-development`（任务 >5 个时可选）
- Review 使用 `compliance-reviewer` + `superpowers:requesting-code-review`
- Verify 使用 `superpowers:verification-before-completion`

## 审查与验证

按路径分级执行：

| 路径 | Review | Test | Verify | 验证文档 |
|------|--------|------|--------|---------|
| Fast | 自检（方案符合性 + 代码质量合并） | 核心逻辑正向 + 反向用例，结论须明确 | 本地验证 | 内联记录（可选文档） |
| Medium | `compliance-reviewer` | 测试计划 + 测试报告（核心路径覆盖） | `superpowers:verification-before-completion` | 测试计划.md + 测试报告.md |
| Standard | `compliance-reviewer` + `requesting-code-review` | 测试计划 + 单元 + 集成测试 + 测试报告 | `superpowers:verification-before-completion` | `VERIFICATION.md` + 测试计划.md + 测试报告.md |

所有路径都必须完成安全风险检查。

建议顺序（Medium/Standard）：

```text
compliance-reviewer（方案符合性 + 安全） -> superpowers:requesting-code-review（代码质量） -> verification（验证）
```

## 输出

```text
features/{id}-{name}/
├── STATE.md                 # 可选，多任务/跨 Wave/跨会话时维护
├── VERIFICATION.md          # Medium/Standard 产出，Fast 路径不创建
├── 测试计划.md              # Medium/Standard 产出，Fast 路径可内联
├── 测试报告.md              # Medium/Standard 产出，Fast 路径可选
└── notepads/
    └── learnings.md
```

代码和文档的最终收口统一交给 `/tech:commit`。

## 配套说明

- `STATE.md` 是可选的执行期跟踪文档；建议在多任务、跨 Wave、跨会话执行时维护
- Fast 路径：审查结论和测试结论可内联记录，无需额外文档
- Medium/Standard 路径：`VERIFICATION.md` 是进入 `/tech:commit` 的前置条件
- 同一问题连续失败 3 次，应停止并上升到架构讨论

**委托 superpowers（Standard 路径）**:
- Phase 1 → `superpowers:using-git-worktrees`（可选，视需求规模）
- Phase 3 → `superpowers:subagent-driven-development`（可选，任务 >5 个时）
- Phase 4 → `compliance-reviewer` + `superpowers:requesting-code-review`
- Phase 6 → `superpowers:verification-before-completion`

**委托 tinypowers agents**:
- Review 阶段 → `compliance-reviewer`（方案符合性 + 安全审查合一）
