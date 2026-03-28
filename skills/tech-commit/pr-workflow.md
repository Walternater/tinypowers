# pr-workflow.md

## 作用

这份文档定义 `/tech:commit` 在需要 Pull Request 流程时，如何把一组已提交改动转换成可审阅的 PR。

## 前提

创建 PR 之前，至少应满足：
- 本地改动已经提交
- 验证结果是最新的
- 工作区干净
- 当前分支已经推送到远程
- 仓库确实采用 PR 工作流

如果仓库没有远程、没有 `gh`、或者不是通过 PR 合并，就不需要强行套这一步。

## 标准流程

```text
Pre-flight Check
  -> Sync & Push
  -> Draft PR Body
  -> Create PR
  -> Handle Review
```

## 1. Pre-flight Check

创建 PR 前先确认：
- 测试和验证仍然通过
- 没有未提交的无关改动
- 当前分支名称和用途一致
- 远程配置正常

如果这些前提不成立，先修好再提 PR。

## 2. Sync & Push

PR 基于的是远程分支，不是本地幻觉。

这一阶段需要确保：
- 已同步目标基线分支
- 当前分支能正常推送
- 推送后远程内容和本地一致

如果同步基线后出现冲突，应先解决冲突，再创建 PR。

## 3. Draft PR Body

PR 描述的目标是降低 reviewer 理解成本。

建议至少包含：
- `Summary`：一句话说清改动目标
- `Changes`：列出最重要的改动点
- `Testing`：说明测试方式和结果
- `Docs`：说明是否已同步文档
- `Risks` 或 `Notes`：如果还有注意事项，在这里说明

一个最小结构可以是：

```markdown
## Summary
<一句话概括>

## Changes
- 改动点 1
- 改动点 2

## Testing
- <命令或验证方式>

## Docs
- [x] relevant docs updated
```

## 4. Create PR

标题通常应与本次主 commit 的语义一致，但更偏向“供 reviewer 阅读”。

例如：
- `feat(CSS-1234): add login flow`
- `fix(CSS-1234): close auth validation gap`

如果仓库使用 `gh pr create`，就用仓库当前模板和约定创建；如果使用别的平台，也保持同样的信息结构。

## 5. Handle Review

PR 创建后，重点不是“等别人批”，而是继续维护这条交付链的可读性。

处理 review 时建议：
- 先分类问题：阻断项、建议项、讨论项
- 修复后用新的 commit 明确表达目的
- 在回复中说明哪些意见已处理、哪些需要进一步讨论

如果 review 导致实现方向改变，记得同步文档和验证结果，不要只改代码。

## 合并前检查

准备合并前，再确认一次：
- reviewer 已经完成必要审查
- 关键反馈已处理
- CI 或项目门禁状态正常
- PR 描述没有过期

## 判断标准

一个好的 PR 应该让 reviewer 快速回答这几个问题：
- 这次改动想解决什么问题
- 改了哪些关键内容
- 有没有验证过
- 还有没有已知风险
