---
name: tech:commit
description: 当用户要求提交代码、创建 PR、同步文档、或完成 feature 收口时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "3.0"
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

<HARD-GATE>
**提交前门禁检查** - 以下条件必须全部满足才能进入提交：
1. `/tech:code` 已完成（VERIFICATION.md 存在）
2. 所有测试通过（本地验证命令成功）
3. 没有未解决的严重问题
4. 工作区中无无关改动

如果不满足，禁止提交，必须先完成对应修复。
</HARD-GATE>

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

- 只提交已经通过验证的改动，禁止把"待修问题"混进正式提交
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

### NEXUS 标准化交接检查

使用 NEXUS 交接协议检查交接完整性：

```markdown
## NEXUS Handoff Check
- **Decided**: [关键决策摘要]
- **Rejected**: [被拒绝的方案及原因]
- **Risks**: [已识别风险]
- **Remaining**: [未完成项（如果有）]
- **Evidence**: [验证证据清单]
```

每个 feature 的交接必须包含：
- 锁定决策清单（来自技术方案.md）
- 拒绝替代方案记录
- 验证证据（测试结果、覆盖率报告）
- 未解决项（如果有）

## 3. Git Commit

提交信息默认遵循 Conventional Commits，并结合项目自己的来源前缀使用。

### Commit Trailer 格式

每个 commit 必须包含结构化的 trailer，记录决策上下文：

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

如果当前仓库使用 Pull Request 流程，就在提交完成后进入 PR 阶段。

PR 的目标不是重复 commit message，而是帮助 reviewer 快速理解：
- 这次改了什么
- 为什么这样改
- 已经验证到什么程度
- 还有哪些风险或待确认事项

### PR Description 模板

```markdown
## Summary
[1-3 句话概括改动]

## Changes
- [改动点 1]
- [改动点 2]
- [改动点 3]

## Verification
- [x] Tests passed: [测试命令和结果]
- [x] Coverage: [覆盖率数据]
- [x] L1-L4 verification: [验证级别]

## Constraints & Decisions
- Constraint: [设计约束]
- Rejected: [被拒绝的方案]
- Confidence: [high/medium/low]

## Risks
- [已识别风险及缓解措施]
```

### 完成选项

PR 创建后，用户有 4 个选项：
1. **Merge locally** - 直接合并到目标分支
2. **Push and create PR** - 推送到远程并创建 PR
3. **Keep branch for later** - 保留分支待后续处理
4. **Discard** - 丢弃（需要输入 "discard" 确认）

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
├── VERIFICATION.md
├── nexus-handoff.md        # 交接文档（NEXUS 格式）
└── deviation-log.md        # 偏差日志

Git:
├── commit history (含 trailers)
└── pushed branch

PR:
└── pull request (如果仓库采用 PR 流程)
```

如果项目维护 `CHANGELOG.md`，此阶段也会把它一起更新。

## 判断标准

一轮合格的 `/tech:commit` 应该满足：
- 代码、文档和验证结论一致
- commit history 能说明本次交付内容
- commit 包含决策上下文 trailer
- reviewer 可以只看 PR 就理解改动范围
- 后续发布或追溯时能找到对应证据

## 配套文档

- `documenter-guide.md`：代码落地后怎么同步说明文档
- `commit-message-format.md`：commit message 的格式约束（含 trailer 格式）
- `pr-workflow.md`：PR 创建和合并前检查
- `changelog-update.md`：什么时候更新 changelog、怎么更新
- `nexus-handoff.md`：标准化交接协议格式

## Gotchas

> 已知失败模式，从实际使用中发现，有机增长。

- **Commit 缺少验证就推送**：没有先跑 `mvn test` 或 `npm test` 就 push → 测试失败阻断 CI：commit 前必须确认本地验证通过
- **PR 描述过于简略**：只写"功能完成"而不写 scope → reviewer 不知道改了什么：PR description 必须包含改动范围和测试结论
- **在 feature 分支上直接 commit main**：没有切回 feature 分支 → commit 落入错误的分支：确认当前分支后再执行 commit
- **缺少 Decision Trailer**：提交信息没有记录决策上下文 → 后期追溯困难：所有 commit 必须包含 Constraint/Rejected/Evidence trailer
- **跳过 NEXUS 检查**：没有核对交接完整性就提交 → 遗漏关键信息：必须完成 NEXUS Handoff Check
