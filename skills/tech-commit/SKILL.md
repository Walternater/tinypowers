---
name: tech:commit
description: 当用户要求提交代码、创建 PR、同步文档、或完成 feature 收口时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "2.0"
---

# /tech:commit

## 作用

把 `/tech:code` 阶段已完成但未提交的成果，收口成可审阅、可追踪的交付物。

## 前置条件

- `/tech:code` 已完成（VERIFICATION.md 存在）
- 所有测试通过
- 工作区中无无关改动

<HARD-GATE>
**提交前门禁** - 上述条件必须全部满足才能提交。
</HARD-GATE>

## 输入

已通过验证的代码变更、技术方案、任务拆解表、STATE.md、审查与验证产物。

## 主流程

```text
Document Sync
  -> Commit Preparation
  -> Git Commit
  -> PR Workflow
  -> Changelog Update
```

## 硬约束

- 只提交已通过验证的改动
- 提交信息必须可读、可追溯
- PR 只在分支、远程和工作区状态都正确时创建
- CHANGELOG 只记录面向版本的有效变化

## 1. Document Sync

确认代码落地后需要同步的说明文档（技术方案、API 文档、README 等）。不是重写，而是保持一致。详见 `documenter-guide.md`。

## 2. Commit Preparation

收口检查：测试/验证结果最新、工作区无无关改动、文件边界清楚、提交信息准确。

交接完整性确认：关键决策已记录、验证证据已附、未解决项已标注。

## 3. Git Commit

提交信息默认遵循 Conventional Commits，并结合项目自己的来源前缀使用。

### Commit Trailer 格式

推荐包含结构化 trailer 记录决策上下文（不强制）：

```
type(scope): description

Constraint: [设计约束或特殊情况]
Rejected: [被拒绝的替代方案及原因]
Evidence: [验证结果或测试通过证据]
Confidence: [high/medium/low]
```

示例：
```
feat(auth): prevent silent session drops

Constraint: Auth service does not support token introspection
Rejected: Extend token TTL to 24h | security policy violation
Evidence: 127 tests passed, coverage 94%
Confidence: high
```

### 常见场景

- 新功能：`[AI-Gen] feat({id}): ...`
- 审查修复：`[AI-Review] fix({id}): ...`
- 文档同步：`[AI-Gen] docs({id}): ...`

提交格式细则见 `commit-message-format.md`。

## 4. PR Workflow

如果仓库使用 PR 流程，提交后进入此阶段。PR 目标是帮 reviewer 快速理解改动范围、原因和验证程度。

完成选项：Merge locally / Push and create PR / Keep branch / Discard。详见 `pr-workflow.md`。

## 5. Changelog Update

仅在以下情况更新 `CHANGELOG.md`：仓库明确维护 changelog、本次变更进入版本说明、对外行为发生可感知变化。详见 `changelog-update.md`。

## 输出

```text
features/{id}/: 技术方案.md, code-review.md, 测试报告.md, VERIFICATION.md
Git: commit history (含 trailers) + pushed branch
PR: pull request (如适用)
```

## 判断标准

- 代码、文档和验证结论一致
- commit history 能说明交付内容
- reviewer 可以只看 PR 就理解改动

## 配套文档

`documenter-guide.md` | `commit-message-format.md` | `pr-workflow.md` | `changelog-update.md`

## Gotchas

- Commit 前必须确认本地验证通过
- PR 描述必须包含改动范围和测试结论
- 确认当前分支正确再提交
- 所有 commit 应包含决策上下文 trailer
