---
name: tech:commit
description: 文档同步、代码提交、PR 创建和 Changelog 收口流程。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "2.0"
---

# /tech:commit

## 作用

`/tech:commit` 负责把 `/tech:code` 阶段已经完成但尚未提交的成果，收口成一组可审阅、可追踪、可合并的交付物。

它回答四个问题：
- 哪些文档需要随实现一起同步
- 这次改动应该怎么提交
- 什么时候适合创建 PR
- `CHANGELOG.md` 是否需要更新

## 前置条件

进入 `/tech:commit` 之前，默认已经满足：
- `/tech:code` 已完成
- 代码和文档变更已经稳定
- 审查和验证结果可追溯
- 工作区中的改动都是本次准备交付的内容

如果这些条件还没满足，不建议提前进入提交阶段。

## 输入

- 已通过验证的代码变更
- `features/{id}/技术方案.md`
- `features/{id}/任务拆解表.md`
- `features/{id}/STATE.md`
- 审查与验证产物，例如 `code-review.md`、`测试报告.md`、`VERIFICATION.md`

## 主流程

```text
Document Sync
  -> Commit Preparation
  -> Git Commit
  -> PR Workflow
  -> Changelog Update
```

## 硬约束

- 只提交已经通过验证的改动，禁止把“待修问题”混进正式提交
- 提交信息必须可读、可追溯，禁止使用无意义 message
- PR 只在分支、远程和工作区状态都正确时创建
- `CHANGELOG.md` 只记录面向项目或版本的有效变化，不把所有内部噪音都写进去

## 1. Document Sync

先确认代码落地后，哪些说明文档需要同步更新。

典型范围包括：
- `features/{id}/技术方案.md`
- API 或接口说明
- README 或接入说明
- 数据库或部署文档

这一阶段的目标不是重写文档，而是让文档和当前实现保持一致。具体方法见 `documenter-guide.md`。

## 2. Commit Preparation

提交之前先做一次收口检查：
- 确认测试和验证结果是最新的
- 确认工作区里没有无关改动
- 确认本次提交的文件边界清楚
- 确认提交信息能够准确描述这次变更

如果当前变更太杂，应先整理再提交，而不是用一个大 commit 淹没上下文。

## 3. Git Commit

提交信息默认遵循 Conventional Commits，并结合项目自己的来源前缀使用。

常见场景：
- 新功能：`[AI-Gen] feat({id}): ...`
- 审查修复：`[AI-Review] fix({id}): ...`
- 文档同步：`[AI-Gen] docs({id}): ...`

提交格式细则见 `commit-message-format.md`。

## 4. PR Workflow

如果当前仓库使用 Pull Request 流程，就在提交完成后进入 PR 阶段。

PR 的目标不是重复 commit message，而是帮助 reviewer 快速理解：
- 这次改了什么
- 为什么这样改
- 已经验证到什么程度
- 还有哪些风险或待确认事项

具体流程见 `pr-workflow.md`。

## 5. Changelog Update

只有在以下情况之一成立时，才建议更新 `CHANGELOG.md`：
- 仓库明确维护 changelog
- 本次变更会进入版本说明
- 对外行为、接口或使用方式发生了可感知变化

如果只是局部重构、内部修复或过程性提交，不一定要写进 changelog。规则见 `changelog-update.md`。

## 输出

`/tech:commit` 完成后，通常应留下：

```text
features/{id}/
├── 技术方案.md
├── code-review.md
├── 测试报告.md
└── VERIFICATION.md

Git:
├── commit history
└── pushed branch

PR:
└── pull request (如果仓库采用 PR 流程)
```

如果项目维护 `CHANGELOG.md`，此阶段也会把它一起更新。

## 判断标准

一轮合格的 `/tech:commit` 应该满足：
- 代码、文档和验证结论一致
- commit history 能说明本次交付内容
- reviewer 可以只看 PR 就理解改动范围
- 后续发布或追溯时能找到对应证据

## 配套文档

- `documenter-guide.md`：代码落地后怎么同步说明文档
- `commit-message-format.md`：commit message 的格式约束
- `pr-workflow.md`：PR 创建和合并前检查
- `changelog-update.md`：什么时候更新 changelog、怎么更新
