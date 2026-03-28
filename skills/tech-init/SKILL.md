---
name: tech:init
description: 初始化项目 AI 开发环境，自动检测技术栈，生成规则、模板与入口文件。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "3.0"
---

# /tech:init

## 作用

`/tech:init` 用于在一个目标项目里落地 tinypowers 的基础工作流骨架。

它解决的是“第一次接入框架时该放什么、怎么放、已有配置怎么处理”的问题，而不是业务初始化本身。

## 初始化目标

执行完成后，目标项目通常应具备：
- `CLAUDE.md` 入口文件
- `docs/guides/` 指南文档
- `configs/rules/` 规则目录
- `configs/templates/` 模板目录
- `features/` 需求工作目录
- `.claude/` 本地配置目录

## 核心特性

- 自动检测技术栈
- 初始化前让用户确认检测结果
- 支持增量更新，不默认覆盖已有内容
- 自动替换模板变量
- 保持 `CLAUDE.md` 精简，只做入口

## 主流程

```text
1. 技术栈检测
2. 检测结果确认
3. 已初始化检查
4. 选择更新策略
5. 加载对应规则
6. 复制模板并替换变量
7. 执行初始化验证
8. 输出结果与下一步建议
```

## 详细步骤

### 1. 技术栈检测

通过根目录文件、目录结构和依赖特征判断项目类型。

常见识别来源：
- `pom.xml`
- `build.gradle`
- `package.json`
- `go.mod`
- `src/main/java`

检测细节见：
- `stack-detection.md`

### 2. 检测结果确认

检测结果不是最终事实，用户确认才是。

确认时至少要让用户看到：
- 检测到的主技术栈
- 推荐加载的规则集
- 建议初始化的指南文档

### 3. 已初始化检查

如果项目根目录已经有 `CLAUDE.md`，说明大概率不是首次接入。

这时不应直接覆盖，而应进入更新策略选择。

### 4. 更新策略

支持三种策略：

| 策略 | 含义 |
|------|------|
| `Update` | 只补缺失内容，尽量保留现有配置 |
| `Skip` | 完全不改动 |
| `Overwrite` | 删除后重建，风险最高 |

默认推荐 `Update`。

策略细节见：
- `update-strategies.md`

### 5. 规则加载

按确认后的技术栈加载：
- `configs/rules/common-*`
- 技术栈对应子目录规则

例如：
- Java 项目加载 `configs/rules/java/`
- 需要 MySQL 约束时加载 `configs/rules/mysql/`

### 6. 模板复制与变量替换

会用项目上下文替换模板变量，例如：
- `{{project_name}}`
- `{{tech_stack}}`
- `{{build_tool}}`
- `{{branch_pattern}}`
- `{{author}}`

目录和变量细节见：
- `init-steps.md`

### 7. 初始化验证

初始化完成后，要确认：
- 目录存在
- 关键文件存在
- 模板变量已替换
- 规则和技术栈匹配
- 链接没有明显断裂

验证细节见：
- `verification.md`

## 典型输出

```text
=== 初始化完成 ===

策略: Update
项目类型: Java (Maven)

已加载:
- common-coding-style
- common-security
- common-testing
- java/java-coding-style
- mysql/*

已创建:
- CLAUDE.md
- docs/guides/
- features/

下一步:
/tech:feature
```

## 默认忽略项

初始化过程中默认跳过这类文件或目录：

```text
.git/
node_modules/
target/
build/
*.class
*.log
.env*
*.pem
*.key
```

## 相关文档

- `init-steps.md`
- `stack-detection.md`
- `update-strategies.md`
- `verification.md`
