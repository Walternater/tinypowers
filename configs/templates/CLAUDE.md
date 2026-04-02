# CLAUDE.md

> 本文件是项目入口，不是完整规则库。
>
> 除非用户明确要求，否则不要直接修改本文件；优先维护它引用的规则文档。

## 元数据

```yaml
version: 1.0.0
init_version: "4.0"
last_updated: {{date}}
framework: tinypowers
project_name: {{project_name}}
tech_stack: {{tech_stack}}
author: {{author}}
```

## 先读什么

开始任何开发工作前，按顺序阅读：

1. `README.md`
2. `docs/guides/development-spec.md`
3. `docs/guides/workflow-guide.md`

## 项目概况

| 信息 | 值 |
|------|-----|
| 项目名称 | `{{project_name}}` |
| 技术栈 | `{{tech_stack}}` |
| 构建工具 | `{{build_tool}}` |
| 服务端口 | `{{service_port}}` |

## 本文件负责什么

`CLAUDE.md` 只负责三件事：
- 指向统一入口文档
- 提供项目级核心信息
- 说明 AI 编辑边界

具体实现规范、审查标准和工作流细节，都应继续查看被引用文档。

## 规则入口

| 文档 | 用途 |
|------|------|
| `@configs/rules/common/coding-style.md` | 通用编码规范 |
| `@configs/rules/common/security.md` | 安全要求 |
| `@configs/rules/common/testing.md` | 测试要求 |
| `@configs/rules/common/code-review-checklist.md` | 审查清单 |
| `@configs/rules/{{tech_stack_short}}/` | 技术栈专属规则 |

## 项目级硬约束

- 分支命名遵循 `{{branch_pattern}}`
- 提交来源前缀使用 `[AI-Gen]`、`[AI-Review]`、`[Manual]`
- 提交前至少通过 `{{build_command}}` 和项目单元测试

## AI 编辑边界

除非用户明确要求，否则不要直接修改：
- `CLAUDE.md`
- `README.md`

如果需要补充规则，优先修改被引用文档，而不是继续往本文件叠内容。

## 上下文使用建议

- 复杂任务先读规则，再开始实现
- 上下文压力过高时执行 `/compact`
- 任务切换时主动丢弃无关上下文

## 禁止事项

- 禁止读取：`*.pem`、`.env*`、`src/main/resources/application-local.yml`
- 禁止执行：`rm -rf`、`sudo`、向外部传输源码的命令

## 常用工作流命令

| 命令 | 用途 |
|------|------|
| `/tech:init` | 初始化项目环境 |
| `/tech:feature` | 开始新功能分析 |
| `/tech:code` | 执行编码、审查和验证 |
| `/tech:commit` | 收口文档、提交和 PR |

## 模板变量

以下变量在 init 时自动替换，替换后此节可删除。

```text
{{project_name}}  → 项目目录名（如 my-project）
{{tech_stack}}    → 技术栈描述（如 Java (Maven)）
{{tech_stack_short}} → 技术栈简称（如 java）
{{build_tool}}    → 构建工具（如 Maven）
{{build_command}} → 构建命令（如 mvn test）
{{service_port}}  → 服务端口（如 8080）
{{branch_pattern}}→ 分支命名模式（如 feature/{id}-{short-desc}）
{{author}}        → Git 用户名
{{date}}          → 当前日期
```
