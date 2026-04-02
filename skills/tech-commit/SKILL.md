---
name: tech:commit
description: 当用户要求提交代码、创建 PR、同步文档、沉淀知识、或完成 feature 收口时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "4.0"
---

# /tech:commit

## 作用

把 `REVIEW` 阶段已完成但未提交的成果，收口成可审阅、可追踪的交付物。

## 前置条件

- `VERIFICATION.md` 已存在且结论为 PASS/通过
- 测试结果是最新的
- 工作区无无关改动
- `SPEC-STATE` 当前为 `REVIEW`

## 主流程

```text
Fast Route:
  Step 1F: Document Sync + minimal Knowledge Capture
  Step 2F: Git Commit + Push/PR

Medium Route:
  Step 1M: Document Sync + targeted Knowledge Capture
  Step 2M: Pre-close SPEC-STATE + Git Commit + Push/PR

Standard Route:
  Step 1: Document Sync
  Step 2: Knowledge Capture
  Step 3: Git Commit
  Step 4: PR + Branch Cleanup
```

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

## Knowledge Capture

从 `notepads/learnings.md` 中挑出值得沉淀的内容写入 `docs/knowledge.md`。

值得沉淀的内容：
- 内部组件的非显而易见用法
- 平台级硬约束
- 隐蔽 bug 模式和调试经验

Fast 路径可以跳过“没有复用价值”的 learnings。

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

## DONE 收口时机

为避免功能提交后再补一个纯状态提交，推荐在真正 `git commit` 前完成：

```bash
node "${TINYPOWERS_DIR}/scripts/update-spec-state.js" --feature {feature_dir} --to DONE --note "ready to commit"
```

然后将功能代码、文档同步和 `SPEC-STATE.md` 一起进入同一个 commit。

## PR + Branch Cleanup

Standard 路径可继续委托 `superpowers:finishing-a-development-branch`。

Fast 路径优先直接使用 git 命令：
- `git push`
- `gh pr create` / 平台对应命令

如果需要手工给 reviewer 一个可点击入口，按 remote 平台生成链接：
- GitHub：`/compare/{base}...{head}?expand=1`
- GitLab：`/-/merge_requests/new?merge_request[source_branch]={head}&merge_request[target_branch]={base}`

自托管 GitLab 也适用。优先自动检测 `origin`，拿不到默认分支时再让用户补充。

## 生命周期收口

提交完成后：
- `SPEC-STATE` 应已在同一个提交中处于 `DONE`
- 保留 `VERIFICATION.md`
- 确保 reviewer 只看 PR 也能理解改动

**委托 superpowers**:
- Standard Step 4 → `superpowers:finishing-a-development-branch`
