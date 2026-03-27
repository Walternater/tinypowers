---
name: tech:init
description: 初始化项目AI开发环境，检查并创建必要的目录、配置文件和Agent定义，自动生成预设文档。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "1.0"
---

# /tech:init

## 功能
初始化项目AI开发环境，在新项目或空项目中创建完整的工作流框架。

## 执行步骤

### 1. 检查目录结构
检查以下目录是否存在：
- doc/guides/
- doc/rules/
- doc/templates/
- features/
- .claude/

如果目录不存在，自动创建。

### 2. 初始化配置文件
检查并创建：
- CLAUDE.md（如果不存在）
- .claude/settings.json（如果不存在）
- .claude/hooks.json（如果不存在）

### 3. 创建预设文档
如果文档不存在，按下表创建预设文档：

| 文档路径 | 说明 |
|---------|------|
| CLAUDE.md | 项目宪法，定义入口职责和核心规则 |
| doc/guides/development-spec.md | 后端开发规范 |
| doc/guides/workflow-guide.md | 新需求完整工作流 |
| doc/guides/prd-analysis-guide.md | PRD分析与任务拆解指南 |
| doc/guides/test-plan.md | 测试计划规范 |
| doc/guides/code-review-checklist.md | 代码审查清单 |
| doc/templates/tech-design.md | 技术方案模板 |
| doc/templates/test-report.md | 测试报告模板 |

### 4. 初始化Agent定义
检查并创建：
- agents/*.md（核心Agent定义）

### 5. 输出完成报告
报告初始化结果和创建的文件列表。

## 预设文档内容

预设文档内容请参考 `docs/` 目录下的对应文件。

## 验证

初始化完成后，用户可以：
- 使用 `/tech:feature` 开始新功能开发
- 使用 `/tech:code` 进入代码开发流程
- 使用 `/tech:commit` 进行文档复写和提交
