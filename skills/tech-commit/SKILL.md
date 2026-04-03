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
正常 feature 收口应尽量保持为一个最终交付 commit。

## 前置条件

按路径分级检查：

- **Fast 路径**：
  - 工作区无无关改动
  - `SPEC-STATE` 当前为 `REVIEW`
  - `VERIFICATION.md` 已存在且结论为 PASS/通过
  - 如果存在 `STATE.md`，其中 Task 验收记录须完整填写
- **Medium / Standard 路径**：
  - 工作区无无关改动
  - `SPEC-STATE` 当前为 `REVIEW`
  - `VERIFICATION.md` 已存在且结论为 PASS/通过
  - `测试计划.md` 与 `测试报告.md` 已更新到最新

## 对外流程

```text
1. Document Sync
2. SPEC-STATE → DONE
3. Git Commit
4. Push / PR
```

### 1. Document Sync

优先同步真正受影响的文档：
- `技术方案.md`
- `VERIFICATION.md`
- `测试计划.md`（仅 `medium / standard` 路径）
- `测试报告.md`（仅 `medium / standard` 路径）
- README / 部署说明
- ReDoc / OpenAPI / 接口说明
- API 或数据库文档

要求：
- 实现与文档一致
- 不把未完成项写成已完成
- reviewer 只看 PR 也能理解改动
- Fast 路径不为凑齐模板而补写 `测试计划.md` / `测试报告.md`

### 2. SPEC-STATE → DONE

`DONE` 的语义改为“最终交付快照的一部分”，不再单独补一个状态 commit。

执行方式：
1. 完成 Document Sync
2. 确认 `VERIFICATION.md` 结论仍为 PASS / 通过
3. 将 `SPEC-STATE` 推进到 `DONE`
4. 立刻创建最终 feature commit，把代码、文档和 `SPEC-STATE.md` 一次性提交

约束：
- 不要提前很久把 `SPEC-STATE` 改成 `DONE`
- 如果最终 commit 失败，保持工作区待修复状态，修好后重试提交
- 不再创建 `[AI-Gen] chore: update spec state to DONE` 这类独立 meta commit

### 3. Git Commit

目标：
- 一次性提交最终交付快照
- 让 reviewer 在同一个 commit 中看到代码、验证证据和 `DONE` 状态

提交前检查：
- 验证证据齐备
- 文档已同步
- 未解决项已标注
- `CHECK-2` 摘要已经能说明变更、测试、审查结论与残留风险

验证证据口径：
- `fast`：至少核对 `VERIFICATION.md`
- `medium / standard`：核对 `VERIFICATION.md`、`测试计划.md`、`测试报告.md`

推荐提交格式：

```text
[AI-Gen] type(scope): description

Evidence: [验证结果]
```

### 4. Push / PR

Standard 路径可继续委托 `superpowers:finishing-a-development-branch`。

如果需要手工给 reviewer 入口，按 remote 平台生成可点击链接：
- GitHub：`/compare/{base}...{head}?expand=1`
- GitLab：`/-/merge_requests/new?merge_request[source_branch]={head}&merge_request[target_branch]={base}`

## 交付后可选动作

只有在 `notepads/learnings.md` 里出现明确复用价值时，才推荐做 knowledge capture。

推荐触发条件：
- 解决了非显而易见的 bug
- 发现了框架自身限制或项目特殊约束
- 形成了后续 feature 会复用的决策经验
- 补充了不容易从公开资料直接获得的项目内知识

推荐信号：
- `notepads/learnings.md` 中出现 `[PERSIST]`
- learnings 条目已经写清“适用场景 / 约束 / 反例”

原则：
- 空或低价值 `learnings.md` 直接忽略
- Fast 路径通常直接跳过 knowledge capture
- promotion 是“从 feature 暂存区提升到项目知识库”，不是自动同步
- knowledge capture **不阻塞提交**

## 生命周期说明

`SPEC-STATE → DONE` 仍然是明确的生命周期动作，但它应和最终交付内容处于同一个版本面。
换句话说：状态要显式，但不再额外制造一个只改状态的提交噪音。

**委托 superpowers**:
- Standard 提交收口 → `superpowers:finishing-a-development-branch`
