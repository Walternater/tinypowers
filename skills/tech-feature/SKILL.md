---
name: tech:feature
description: 需求分析到技术方案到任务拆解的完整流程。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "1.0"
---

# /tech:feature

## 功能
需求分析 → 技术方案 → 任务拆解

## 输入
- Jira需求ID或需求标题

## 执行步骤

### Phase 1: 准备
1. 解析需求ID
2. 创建feature目录：`features/{id}-{short-desc}/`
3. 创建代码分支：`git branch -b feature/{id}-{short-desc}`

### Phase 2: 需求文档
4. **用户手工创建**需求文档：
   - `features/{id}/PRD.md`
5. 调用 requirement-analyst 分析需求
6. 输出需求理解确认

### Phase 3: 技术方案
7. 调用 architect 设计技术方案
8. 输出 `技术方案.md`

### Phase 4: 任务拆解
9. 调用 task-splitter 拆解任务
10. 输出 `任务拆解表.md`
11. 输出 `测试计划.md`

## 输出清单
- `features/{id}/PRD.md`（用户创建）
- `features/{id}/技术方案.md`
- `features/{id}/任务拆解表.md`
- `features/{id}/测试计划.md`

## 协作模式
顺序执行（规划阶段）

## 参考文档
- `docs/guides/prd-analysis-guide.md` - PRD分析与任务拆解指南
- `configs/templates/tech-design.md` - 技术方案模板
