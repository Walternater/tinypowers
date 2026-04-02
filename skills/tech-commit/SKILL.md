---
name: tech:commit
description: 当用户要求提交代码、创建 PR、同步文档、沉淀知识、或完成 feature 收口时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "3.1"
---

# /tech:commit

## 作用

把 `/tech:code` 阶段已完成但未提交的成果，收口成可审阅、可追踪的交付物。v3.1 继承 `Fast / Standard` 双路由。

本 skill 是 **tinypowers 独有**（无 superpowers 方法论引用），仅 Step 4 委托 `superpowers:finishing-a-development-branch`。

## 前置条件

- `/tech:code` 已完成（VERIFICATION.md 存在）
- 所有测试通过
- 工作区中无无关改动

<HARD-GATE>
**提交前门禁** - 上述条件必须全部满足才能提交。

不满足时：暂停提交，先修复对应前置条件：
- `VERIFICATION.md` 不存在 → 先完成 `/tech:code` Phase 5 Verify
- 测试未通过 → 修复失败测试，重新运行验证
- 工作区有无关改动 → `git stash` 或 discard 无关变更后再提交
</HARD-GATE>

## 输入

已通过验证的代码变更、技术方案、任务拆解表、STATE.md、审查与验证产物。

## 主流程

```text
Fast Route:
  Step 1F: Document Sync + minimal Knowledge Capture
  Step 2F: Git Commit + Push/PR

Standard Route:
  Step 1: Document Sync
  Step 2: Knowledge Capture / 物料飞轮
  Step 3: Git Commit
  Step 4: PR + Branch Cleanup
```

## 硬约束

- 只提交已通过验证的改动
- 提交信息必须可读、可追溯
- PR 只在分支、远程和工作区状态都正确时创建
- CHANGELOG 只记录面向版本的有效变化

## 1. Document Sync

确认代码落地后需要同步的说明文档。不是重写，而是保持一致。

检查项：
- 技术方案中的接口定义是否与实现一致
- API 文档是否反映最新变更
- README 中的示例代码是否可运行
- 配置说明是否匹配实际配置项

不同步的文档会在后续产生误导，比没有文档更危险。

优先同步这些文档：

| 文档 | 触发条件 |
|------|----------|
| `features/{id}-{name}/技术方案.md` | 实现细节、验收状态或决策落地发生变化 |
| API 文档 | Controller、路由、请求响应结构变更 |
| README | 用法、入口、配置、能力边界发生变化 |
| 数据库文档 | 表结构、字段、索引、迁移方式变更 |
| 部署文档 | 启动方式、环境变量、依赖服务变更 |

推荐顺序：

```text
实现变更
  -> 技术方案
  -> 接口/数据结构文档
  -> README / 部署说明
```

文档同步完成后至少再确认：
- 接口签名和代码一致
- 状态描述和实际交付一致
- 没有继续引用旧路径或旧命令
- 没有把未完成项写成已完成
- 没有明显拼写或结构错误

## 路由继承

- `track: fast` 时优先走最小收口路径
- `track: standard` 时保持完整知识沉淀和分步收口

## Fast Route

### Step 1F: Document Sync + minimal Knowledge Capture

- 只同步真正受影响的文档
- 若 `notepads/learnings.md` 没有跨需求可复用内容，可跳过项目级知识沉淀
- 仍需确保 `技术方案.md`、`VERIFICATION.md` 与实际交付一致

### Step 2F: Git Commit + Push/PR

- 保持同样的提交门禁
- trailer 可简化为最关键的 `Evidence`
- 若没有 remote，可只完成本地提交并记录后续动作

## 2. Knowledge Capture（知识沉淀）

把 `/tech:code` Wave 内捕获的学习经验沉淀到项目级知识库，形成物料飞轮。

### 做什么

1. 读取 `features/{id}-{name}/notepads/learnings.md`，评估每条学习是否值得沉淀到项目级
2. 对值得沉淀的条目，归类写入 `docs/knowledge.md`（不存在则用模板创建）
3. 不值得沉淀的条目保留在 feature 级 learnings 中不删除

### 沉淀判断标准

| 值得沉淀 | 不值得沉淀 |
|---------|-----------|
| 内部组件的非显而易见用法 | 公开文档可查的知识 |
| 平台/框架级别的约束和陷阱 | 仅本次需求特有的业务逻辑 |
| 调试发现的隐蔽 bug 模式 | 一次性的 typos 和格式问题 |
| 跨需求可复用的编码模式 | 已在 `docs/knowledge.md` 中存在的条目 |

### 沉淀格式

按 `docs/knowledge.md` 的三类分区写入：

```text
## 组件用法 ← 内部组件的非标用法
## 平台约束 ← 违反后会出问题的硬约束
## 踩坑记录 ← 隐蔽 bug 模式和调试经验
```

每条沉淀附带来源标记：`→ 发现于 {feature_id}`

### 设计原则

- **增量追加**，不覆盖已有知识
- **人确认**：沉淀内容应展示给用户，用户可删除或修改
- **不阻断**：knowledge.md 不存在时自动创建，learnings 为空时跳过

## 3. Git Commit

提交前收口检查：
- [ ] 测试和验证结果是最新的（非历史通过）
- [ ] 工作区无无关改动（`git status` 干净或仅含预期文件）
- [ ] 文件边界清楚（一个 commit 只做一件事）
- [ ] 提交信息准确描述改动内容
- [ ] 关键决策已记录
- [ ] 验证证据已附
- [ ] 未解决项已标注

提交信息默认遵循 Conventional Commits，并结合项目自己的来源前缀使用。

### Commit Trailer 格式

推荐包含结构化 trailer 记录决策上下文（不强制）：

```text
type(scope): description

Constraint: [设计约束或特殊情况]
Rejected: [被拒绝的替代方案及原因]
Evidence: [验证结果或测试通过证据]
Confidence: [high/medium/low]
```

默认结构：
- prefix：`[AI-Gen]`、`[AI-Review]`、`[Manual]`
- type：`feat`、`fix`、`docs`、`refactor`、`test`、`chore`、`perf`、`ci`、`revert`
- scope：优先用 feature id 或领域模块；如果会让标题更模糊可以省略
- description：动作导向、简短明确，不写 `update code`、`fix bugs` 这类空话

body / footer 用来补“为什么这样改”、重要权衡、`Closes #123` 或 `BREAKING CHANGE` 等上下文。

### 常见场景

- 新功能：`[AI-Gen] feat({id}): ...`
- 审查修复：`[AI-Review] fix({id}): ...`
- 文档同步：`[AI-Gen] docs({id}): ...`

## 4. PR + Branch Cleanup

推送后根据 remote URL 自动检测平台，生成 PR/MR 创建链接。

### 平台检测与链接生成

从 `git remote get-url origin` 提取 host 判断平台：

```text
GitHub:  https://github.com/{group}/{repo}/compare/{base}...{head}?expand=1
GitLab:  https://{host}/{group}/{repo}/-/merge_requests/new?merge_request[source_branch]={head}&merge_request[target_branch]={base}
```

self-hosted GitLab 同样适用。链接输出到终端，不自动打开浏览器。

base 分支检测：
1. `git symbolic-ref refs/remotes/origin/HEAD` → 取 `refs/remotes/origin/` 后面的部分
2. 如果失败（新克隆、HEAD 未设置），提示用户指定

PR 描述至少应包含：
- `Summary`：一句话概括改动目标
- `Changes`：最重要的 2-4 个改动点
- `Testing`：验证命令或验证方式
- `Docs` / `Notes`：文档同步情况和剩余注意事项

合并前再确认：
- reviewer 已完成必要审查
- 关键反馈已处理
- CI 或项目门禁状态正常
- PR 描述没有过期

### CHANGELOG

触发条件（全部满足才更新）：
- 仓库明确维护 `CHANGELOG.md`
- 本次变更会出现在后续版本说明中
- 新增、修复或变更会被项目使用者感知

不必更新的场景：纯内部重构、过程性提交、不对外暴露的微小整理。

如果仓库采用 Keep a Changelog 风格，优先按 `Added / Changed / Fixed / Security` 归类，按“读者会感知到的变化”聚合，不按 commit 历史机械照抄。

### Branch Cleanup

**委托 `superpowers:finishing-a-development-branch` 执行。**

- 决定分支去留（merge / keep / discard）
- 清理 worktree（如果使用了 `superpowers:using-git-worktrees`）
- 确认工作区恢复干净状态

## 输出

```text
features/{id}-{name}/: 技术方案.md, VERIFICATION.md, notepads/learnings.md
docs/knowledge.md          ← 项目级知识沉淀（Step 2 更新）
Git: commit history (含 trailers) + pushed branch
PR: pull request (如适用)
```

## 判断标准

- 代码、文档和验证结论一致
- commit history 能说明交付内容
- reviewer 可以只看 PR 就理解改动

**委托 superpowers**:
- Step 4 → `superpowers:finishing-a-development-branch`

## Gotchas

- **Commit 后才发现文档没同步**：代码改了但 API 文档没更新 → reviewer 看到过时文档 → Document Sync 必须逐项检查不能跳过
- **Knowledge 沉淀了公开知识**：把 React useState 用法写进 knowledge.md → 噪音淹没真正有用的内部知识 → 沉淀判断标准严格按"公开资料查不到"过滤
- **推送到了错误分支**：本地在 feature-A 但 push 到了 feature-B 的远程 → `git push` 前必须确认当前分支与目标分支一致
