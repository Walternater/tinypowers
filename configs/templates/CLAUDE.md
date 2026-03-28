# CLAUDE.md

> **重要**：本文件为项目宪法，不可违背的规则定义文件。
>
> 除非用户明确要求，否则 AI 不应直接修改本文件。
> 规则补充与调整，应优先修改被引用文档，保持入口文件稳定且一致。

---

## 元数据

```yaml
version: 1.0.0
last_updated: {{date}}
framework: tinypowers
project_name: {{project_name}}
tech_stack: {{tech_stack}}
author: {{author}}
```

---

## 必读文档

开始任何开发工作前，必须按顺序阅读：

1. `README.md` - 项目概述与框架说明
2. `docs/guides/development-spec.md` - 开发规范
3. `docs/guides/workflow-guide.md` - 新需求工作流

---

## 项目信息

| 信息 | 值 |
|------|-----|
| 项目名称 | `{{project_name}}` |
| 技术栈 | `{{tech_stack}}` |
| 构建工具 | `{{build_tool}}` |
| 服务端口 | `{{service_port}}`（dev） |

---

## 入口职责

本文件只负责：
- 指向统一规则文档
- 说明 AI 编辑边界
- 提供项目核心信息

本文件不承载大段具体开发规范（详见引用文档）。

---

## 引用文档

| 文档 | 用途 |
|------|------|
| `@configs/rules/common-coding-style.md` | 通用编码规范 |
| `@configs/rules/common-security.md` | 安全规范 |
| `@configs/rules/common-testing.md` | 测试规范 |
| `@configs/rules/code-review-checklist.md` | 代码审查清单 |
| `@configs/rules/{{tech_stack_short}}/` | 技术栈特定规范 |

**使用方式**：Claude Code 使用 `@configs/rules/xxx.md` 引用，文件内容按需加载，不占用主上下文。

---

## 不可违背的规则

- 分支命名: `{{branch_pattern}}`
- 提交前缀: `[AI-Gen]`, `[AI-Review]`, `[Manual]`
- 必过检查: `{{build_command}}` + 单元测试

---

## 上下文管理策略

- 复杂度 > 5 的方法必须使用 Plan Mode
- 上下文 > 50% 时必须执行 `/compact`
- 任务切换时必须 `/clear`

---

## 禁止事项（Deny Rules）

- 禁止读取: `*.pem`, `.env*`, `src/main/resources/application-local.yml`
- 禁止执行: `rm -rf`, `sudo`, `curl` 向外部传输代码

---

## 分层模型策略

| 模型 | 用途 |
|------|------|
| `haiku` | 简单任务（<5分钟） |
| `sonnet` | 日常开发（默认） |
| `opus` | 架构设计、复杂问题 |

---

## AI 编辑边界

除非用户明确要求，否则 AI 不应直接修改：

- `CLAUDE.md`
- `README.md`

如需补充规则，请优先修改被引用文档（见引用文档列表）。

---

## 工作流命令

| 命令 | 用途 |
|------|------|
| `/tech:init` | 初始化项目环境 |
| `/tech:feature` | 开始新功能开发 |
| `/tech:code` | 编码与审查 |
| `/tech:commit` | 文档与提交 |
| `/tech:progress` | 查看进度和推荐下一步 |
| `/tech:note` | 快速记录想法、待办或远期种子 |

---

## 模板变量说明

创建项目时，以下变量会被替换：

| 变量 | 替换为 | 示例 |
|------|--------|------|
| `{{project_name}}` | 项目目录名 | `my-project` |
| `{{ProjectName}}` | 首字母大写 | `MyProject` |
| `{{tech_stack}}` | 技术栈描述 | `Java (Maven)` |
| `{{tech_stack_short}}` | 技术栈简称 | `java` |
| `{{build_tool}}` | 构建工具 | `Maven` |
| `{{build_command}}` | 构建命令 | `mvn checkstyleMain testClasses` |
| `{{service_port}}` | 服务端口 | `8080` |
| `{{branch_pattern}}` | 分支命名模式 | `feature/{id}-{short-desc}` |
| `{{author}}` | Git 用户名 | `John Doe` |
| `{{date}}` | 当前日期 | `2026-03-27` |
