---
name: tech:commit
description: 当用户要求提交代码、创建 PR、同步文档、或完成 feature 收口时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "5.0"
---

# /tech:commit

## 作用

把已经通过审查和验证的成果，收口成可审阅、可追踪的提交和 PR。

这个阶段只做交付动作，不再把知识沉淀或状态机细节当作主流程。

## 前置条件

按路径分级检查：

- **Fast 路径**：`STATE.md` 中所有 Task 验收记录已完整填写，工作区无无关改动，`SPEC-STATE` 当前为 `REVIEW`
- **Medium / Standard 路径**：`VERIFICATION.md` 已存在且结论为 PASS/通过，`测试计划.md` 与 `测试报告.md` 已更新到最新，工作区无无关改动，`SPEC-STATE` 当前为 `REVIEW`

## 对外流程

```text
1. Document Sync
2. Git Commit
3. Push / PR
4. SPEC-STATE → DONE（提交成功后推进）
```

### 1. Document Sync

优先同步真正受影响的文档：
- `技术方案.md`
- `测试计划.md`
- `测试报告.md`
- README / 部署说明
- API 或数据库文档

要求：
- 实现与文档一致
- 不把未完成项写成已完成
- reviewer 只看 PR 也能理解改动

### 2. Git Commit

提交前检查：
- 验证证据齐备
- 文档已同步
- 未解决项已标注

推荐提交格式：

```text
[AI-Gen] type(scope): description

Evidence: [验证结果]
```

### 3. Push / PR

Standard 路径可继续委托 `superpowers:finishing-a-development-branch`。

如果需要手工给 reviewer 入口，按 remote 平台生成可点击链接：
- GitHub：`/compare/{base}...{head}?expand=1`
- GitLab：`/-/merge_requests/new?merge_request[source_branch]={head}&merge_request[target_branch]={base}`

### 4. SPEC-STATE → DONE

**关键：SPEC-STATE 推进到 DONE 必须在 Git Commit 成功之后**，避免 commit 失败但状态已变成 DONE 的不一致。

提交顺序：
1. 完成 Document Sync
2. 执行 Git Commit + PR
3. **确认提交成功后**，推进 `SPEC-STATE` → `DONE`（`update-spec-state.js --to DONE`）
4. 将 SPEC-STATE 变更作为独立 commit 提交（`[AI-Gen] chore: update spec state to DONE`）

## 交付后可选动作

如果 `notepads/learnings.md` 中有明确的沉淀价值，可以在提交后同步到 `docs/knowledge.md`。

原则：
- 不为沉淀而沉淀——只有真正对后续 feature 有帮助的内容才写入知识库
- 空 `learnings.md` 不触发，不创建/不修改 `knowledge.md`
- Fast 路径通常没有 learnings，可直接跳过
- 这是可选收尾动作，**不阻塞提交**

## 生命周期说明

`SPEC-STATE → DONE` 仍然需要在提交成功后收口，但这是脚本一致性动作，不应喧宾夺主。

**委托 superpowers**:
- Standard 提交收口 → `superpowers:finishing-a-development-branch`
