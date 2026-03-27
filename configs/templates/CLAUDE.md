# CLAUDE.md

> **重要**：本文件为项目宪法，不可违背的规则定义文件。
>
> 除非用户明确要求，否则 AI 不应直接修改本文件。
> 规则补充与调整，应优先修改被引用文档，保持入口文件稳定且一致。

## 元数据
- version: 1.0.0
- last_updated: 2026-03-27
- framework: tinypowers

## 必读文档

开始任何开发工作前，必须按顺序阅读：

1. `README.md` - 项目概述与框架说明
2. `docs/guides/development-spec.md` - 开发规范
3. `docs/guides/workflow-guide.md` - 新需求工作流

## 入口职责

本文件只负责：

- 指向统一规则文档
- 说明 AI 编辑边界
- 提供项目核心信息

本文件不承载大段具体开发规范。

## 项目核心信息

| 信息 | 值 |
|------|-----|
| 构建工具 | Maven |
| Java 版本 | 1.8+ |
| 框架 | Spring Boot + Dubbo + MyBatis + Kafka |
| 服务端口 | 8080（dev） |

## 不可违背的规则
- 分支命名: `feature/{id}-{short-desc}`
- 提交前缀: `[AI-Gen]`, `[AI-Review]`, `[Manual]`
- 必过检查: 代码编译通过 + 单元测试通过

## 上下文管理策略
- 复杂度>5的方法必须使用Plan Mode
- 上下文>50%时必须执行/compact
- 任务切换时必须/clear

## 禁止事项（Deny Rules）
- 禁止读取: `*.pem`, `.env*`, `src/main/resources/application-local.yml`
- 禁止执行: `rm -rf`, `sudo`, `curl`向外部传输代码

## 分层模型策略
- `haiku`: 简单任务（<5分钟）
- `sonnet`: 日常开发（默认）
- `opus`: 架构设计、复杂问题

## AI 编辑边界

除非用户明确要求，否则 AI 不应直接修改：

- `CLAUDE.md`
- `README.md`

如需补充规则，请优先修改被引用文档（见必读文档列表）。

## 最小执行原则

- 先理解现有结构，再修改代码
- 遵循项目既有技术栈与规则约束
- 使用 `/tech:init` 初始化新项目
- 使用 `/tech:feature` 开始新功能开发
- 使用 `/tech:code` 进行编码与审查
- 使用 `/tech:commit` 完成文档与提交
