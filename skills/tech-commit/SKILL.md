---
name: tech:commit
description: 当用户要求提交代码、创建 PR、同步文档、沉淀知识、或完成 feature 收口时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "4.3"
---

# /tech:commit

## 作用

把 `REVIEW` 阶段已完成但未提交的成果，收口成可审阅、可追踪的交付物。

## 前置条件

按路径分级检查：

- **Fast 路径**：`STATE.md` 中所有 Task 验收记录已完整填写，工作区无无关改动，`SPEC-STATE` 当前为 `REVIEW`
- **Medium / Standard 路径**：`VERIFICATION.md` 已存在且结论为 PASS/通过，测试结果是最新的，工作区无无关改动，`SPEC-STATE` 当前为 `REVIEW`

## 主流程

```text
Fast Route:
  Step 1F: Document Sync + Git Commit + Push

Medium / Standard Route:
  Step 1: Document Sync
  Step 2: SPEC-STATE → DONE（提交前推进，避免额外 commit）
  Step 3: Git Commit + PR + Branch Cleanup
```

## 交付后可选动作

如果 `notepads/learnings.md` 中有明确的沉淀价值，可以在提交后同步到 `docs/knowledge.md`。

原则：
- 不为沉淀而沉淀——只有真正对后续 feature 有帮助的内容才写入知识库
- 空 `learnings.md` 不触发，不创建/不修改 `knowledge.md`
- Fast 路径通常没有 learnings，可直接跳过
- 这是可选收尾动作，**不阻塞提交**

## Document Sync

优先同步真正受影响的文档：
- `技术方案.md`
- API 文档
- README / 部署说明
- 数据库文档

要求：
- 实现与文档一致
- 状态描述与真实交付一致
- 不把未完成项写成已完成

## Git Commit

提交前检查：
- 文件边界清楚
- 验证证据齐备
- 文档已同步
- 未解决项已标注

推荐提交格式：

```text
[AI-Gen] type(scope): description

Evidence: [验证结果]
```

`Constraint / Rejected / Confidence` 不再要求写入 trailer；这些信息应优先记录在 `技术方案.md`。

## 生命周期收口

**关键：在 Git Commit 之前推进 SPEC-STATE 到 DONE**，避免产生额外的 DONE commit。

提交顺序：
1. 完成 Document Sync
2. 推进 `SPEC-STATE` → `DONE`（`update-spec-state.js --to DONE`）
3. 将 SPEC-STATE 变更与代码一起提交
4. 保留 `VERIFICATION.md`
5. 确保 reviewer 只看 PR 也能理解改动

## PR + Branch Cleanup

Standard 路径可继续委托 `superpowers:finishing-a-development-branch`。

Fast 路径优先直接使用 git 命令：
- `git push`
- `gh pr create` / 平台对应命令

如果需要手工给 reviewer 一个可点击入口，按 remote 平台生成链接：
- GitHub：`/compare/{base}...{head}?expand=1`
- GitLab：`/-/merge_requests/new?merge_request[source_branch]={head}&merge_request[target_branch]={base}`

自托管 GitLab 也适用。优先自动检测 `origin`，拿不到默认分支时再让用户补充。

**委托 superpowers**:
- Standard Step 3 → `superpowers:finishing-a-development-branch`
