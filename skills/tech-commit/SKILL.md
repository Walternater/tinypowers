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

把 `/tech:code` 阶段已完成但未提交的成果，收口成可审阅、可追踪的交付物。

本 skill 是 **tinypowers 独有**（无 superpowers 方法论引用），仅 Standard Step 4 委托 `superpowers:finishing-a-development-branch`。

## 前置条件

- `/tech:code` 已完成（VERIFICATION.md 存在）
- 所有测试通过
- 工作区中无无关改动

<HARD-GATE>
**提交前门禁** - 上述条件必须全部满足才能提交。

不满足时：暂停提交，先修复对应前置条件：
- `VERIFICATION.md` 不存在 → 先完成 `/tech:code` Verify 阶段
- 测试未通过 → 修复失败测试，重新运行验证
- 工作区有无关改动 → `git stash` 或 discard 无关变更后再提交
</HARD-GATE>

## 输入

已通过验证的代码变更、技术方案、任务拆解表、STATE.md、测试报告、VERIFICATION.md。

## 主流程

### Standard

```text
Step 1: Document Sync
Step 2: Git Commit
Step 3: PR + Branch Cleanup（委托 superpowers:finishing-a-development-branch）
```

### Fast

```text
Step 1: 文档快速过检
Step 2: Git Commit + Push
Step 3: PR 链接
```

## 硬约束

- 只提交已通过验证的改动
- 提交信息必须可读、可追溯
- PR 只在分支、远程和工作区状态都正确时创建

## Step 1: Document Sync

确认代码落地后需要同步的说明文档。不是重写，而是保持一致。

检查项：
- 技术方案中的接口定义是否与实现一致
- API 文档是否反映最新变更
- README 中的示例代码是否可运行
- 配置说明是否匹配实际配置项

不同步的文档会在后续产生误导，比没有文档更危险。

### 快速过检（Fast）

只检查直接涉及的接口和配置，不做全量文档扫描。

## Step 2: Git Commit

提交前收口检查：
- [ ] 测试和验证结果是最新的
- [ ] 工作区无无关改动
- [ ] 文件边界清楚（一个 commit 只做一件事）
- [ ] 提交信息准确描述改动内容

### Commit 格式

```text
type(scope): description

Evidence: [验证结果或测试通过证据]
```

Fast 路径：只需自然语言 body，不需要 Trailer。

### 常见场景

- 新功能：`feat({id}): ...`
- 审查修复：`fix({id}): ...`
- 文档同步：`docs({id}): ...`

## Step 3: PR + Branch Cleanup（Standard）

**委托 `superpowers:finishing-a-development-branch` 执行。**

- 推送后根据 remote URL 自动检测平台，生成 PR/MR 创建链接
- 决定分支去留（merge / keep / discard）
- 清理 worktree（如果使用了 worktree）
- 确认工作区恢复干净状态

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

### Fast 路径

```bash
git push -u origin <current-branch>
```

输出 PR/MR 创建链接。

如果 SPEC-STATE 存在，更新 phase 为 `DONE`。

## 提交后提示

提交完成后，检查 `notepads/learnings.md` 是否有值得沉淀到 `docs/knowledge.md` 的内容。

值得沉淀的：
- 内部组件的非显而易见用法
- 平台/框架级别的约束和陷阱
- 调试发现的隐蔽 bug 模式

**不强制执行**——有值得沉淀的内容时提醒用户，由用户决定是否沉淀。learnings 为空则跳过。

## 输出

```text
features/{id}-{name}/: 技术方案.md, VERIFICATION.md, 测试报告.md, notepads/learnings.md
Git: commit history + pushed branch
PR: pull request (如适用)
```

## 判断标准

- 代码、文档和验证结论一致
- commit history 能说明交付内容
- reviewer 可以只看 PR 就理解改动

**委托 superpowers**:
- Standard Step 3 → `superpowers:finishing-a-development-branch`

## Gotchas

- **Commit 后才发现文档没同步**：代码改了但 API 文档没更新 → reviewer 看到过时文档 → Document Sync 必须逐项检查不能跳过
- **推送到了错误分支**：本地在 feature-A 但 push 到了 feature-B 的远程 → `git push` 前必须确认当前分支与目标分支一致
- **Fast 路径不需要 Trailer**：小改动用自然语言 body 即可
- **SPEC-STATE 推进时机**：Standard 在 Step 3 Branch Cleanup 时推进到 `DONE`；Fast 在 push 后推进
