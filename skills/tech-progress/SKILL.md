---
name: tech:progress
description: 读取 STATE.md 和 Feature 状态，展示当前进度并推荐下一步操作。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "1.0"
---

# /tech:progress

## 功能

进度导航命令。读取当前项目的所有 Feature 状态，展示结构化进度报告，推荐下一步操作。

## 执行步骤

### 1. 扫描 Feature 目录

```
扫描 features/ 目录：
  IF features/ 不存在 THEN
    输出："项目未初始化，请先执行 /tech:init"
    EXIT
  END

  列出所有 features/*/STATE.md 文件
  IF 无 STATE.md THEN
    输出："没有进行中的 Feature"
    推荐："执行 /tech:feature 开始新需求分析"
    EXIT
  END
```

### 2. 读取每个 STATE.md

对每个 STATE.md 提取：

| 字段 | 来源 |
|------|------|
| Feature ID | STATE.md 标题行 `# STATE: {id}` |
| 当前阶段 | `## 位置` 下的「当前阶段」 |
| 当前 Wave | `## 位置` 下的「当前 Wave」 |
| 已完成 Task | `[x]` 标记数量 |
| 总 Task | `[x]` + `[ ]` 标记总数 |
| 阻塞项 | `## 阻塞` 下的内容 |
| 偏差项 | `## 偏差` 下的内容 |

### 3. 生成进度报告

```
=== 进度报告 ===

项目: {project_name}
时间: {datetime}

## 进行中的 Feature

| Feature | 阶段 | Wave | 进度 | 阻塞 |
|---------|------|------|------|------|
| CSS-123 | Phase 2 | Wave 3/5 | ██████░░░░ 60% | 无 |
| CSS-456 | Phase 3 | Step 2/3 | ██░░░░░░░░ 20% | 安全审查 BLOCK |

## 状态摘要

- 进行中: 2 个 Feature
- 阻塞中: 1 个 Feature
- 已完成: {count} 个 Feature（有 STATE.md 但所有 Wave 为 DONE）

## 推荐下一步

{路由到具体操作，见 Step 4}
```

### 4. 路由推荐

根据每个 Feature 的当前阶段推荐操作：

| 当前阶段 | 所属 Skill | 推荐操作 |
|----------|-----------|----------|
| Phase 0 - 准备 | tech-feature | `继续执行 /tech:feature` |
| Phase 1 - 需求理解 | tech-feature | `继续需求分析和歧义检测` |
| Phase 2 - 技术方案 | tech-feature | `继续技术方案设计` |
| Phase 3 - 任务拆解 | tech-feature | `继续任务拆解` |
| Phase 2 - Wave Execution | tech-code | `继续执行 /tech:code` |
| Phase 3 - Code Review Step 1 | tech-code | `执行方案符合性审查` |
| Phase 3 - Code Review Step 2 | tech-code | `执行安全审查` |
| Phase 3 - Code Review Step 3 | tech-code | `执行代码质量审查` |
| Phase 4 - Verification | tech-code | `执行目标回溯验证` |
| 阻塞中 | - | `查看阻塞原因：{阻塞描述}` |
| 所有 Wave DONE 但无 Review | tech-code | `执行 /tech:code 进入 Code Review` |

如果所有 Feature 都已完成：
```
所有 Feature 已完成。
推荐：执行 /tech:commit 提交代码和文档。
```

如果没有进行中的 Feature：
```
没有进行中的 Feature。
推荐：
  1. /tech:feature — 开始新需求分析
  2. /tech:code — 继续未完成的 Feature（如 STATE.md 存在）
```

### 5. 种子检查

```
扫描 features/*/seeds/ 目录：
  IF 存在未触发种子（status: dormant）THEN
    在报告末尾列出：
    "💡 待触发种子：
     - SEED-001: {简述}（触发条件：{trigger}）"
  END
```

## 输出

- 终端输出结构化进度报告
- 不修改任何文件

## 使用场景

- 开始新会话时快速了解项目状态
- 确认下一步应该做什么
- 向团队汇报进度
