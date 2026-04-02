---
name: tech:init
description: 当用户在全新项目中首次使用、或要求重新初始化 AI 开发环境时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "4.1"
---

# /tech:init

## 作用

`/tech:init` 用于在一个目标项目里落地 tinypowers 的基础工作流骨架。

本 skill 是 **tinypowers 独有**（无 superpowers 委托），负责项目首次接入时的骨架落地。

从 `v4.0` 开始，`/tech:init` 明确只支持 Java 项目初始化。

## 复杂度路由

进入主流程前，先判定需求复杂度：

| 模式 | 判定条件 | 流程差异 |
|------|---------|---------|
| **Fast** | 新项目、无已有 CLAUDE.md | 跳过 Step 2（知识扫描）、Step 3（策略选择默认 Create）、Step 5（knowledge.md 留空模板） |
| **Standard** | 已有 CLAUDE.md 或部分配置 | 完整 6 步流程 |

## 初始化目标

执行完成后，目标项目通常应具备：
- `CLAUDE.md` 入口文件
- `docs/guides/` 指南文档（含 development-spec 和 workflow-guide）
- `docs/knowledge.md` 领域知识库
- `configs/rules/` 规则目录
- `features/` 需求工作目录
- `.claude/` 本地配置目录（hooks + settings）

## 核心特性

- 自动检测 Java 技术栈
- 初始化前让用户确认检测结果
- 支持增量更新，不默认覆盖已有内容
- 自动替换模板变量
- 空项目可用的变量回退策略
- 直接生成可工作的 `.claude/` 配置
- 边界场景通过预检静默分流
- 保持 `CLAUDE.md` 精简，只做入口

## 主流程

```text
1. 技术栈检测
2. 领域知识扫描（Fast 模式跳过）
3. 确认检测结果 + 选择更新策略（Fast 模式默认 Create）
4. 落地入口、规则、guide、.claude/
5. 生成领域知识库（Fast 模式留空模板）
6. 执行初始化验证并输出下一步建议
```

## 详细步骤

### 执行前预检

预检是 guard clause，不属于用户感知的主流程步骤。

它的目标是先拦住"继续执行只会产出错误结果"的场景。当前覆盖：
- 框架仓库自举保护
- 非 Java 项目短路退出
- `.claude/` 初始化依赖缺失时停止落地

判定规则和分流动作见：
- `bootstrap-guard.md`

### 1. 技术栈检测

通过根目录文件、目录结构和依赖特征判断项目类型。

| 文件 | 默认判断 |
|------|---------|
| `pom.xml` | Java (Maven) |
| `build.gradle` / `build.gradle.kts` | Java (Gradle) |
| `src/main/java` | Java（辅助确认） |

框架特征（第三层）：
- `org.springframework.*` → Spring Boot
- MyBatis 相关依赖 → MyBatis
- `dubbo` / `apache-dubbo` → Dubbo
- `mysql` / `flyway` / `liquibase` → 需要同时加载 MySQL 规则

默认值约定：

| 技术栈 | build_tool | build_command | service_port |
|--------|------------|---------------|--------------|
| Java (Maven) | Maven | `mvn test` | `8080` |
| Java (Gradle) | Gradle | `./gradlew check` | `8080` |

如果检测结果不是 Java，默认不要继续初始化，而是明确提示当前规则集尚未覆盖该栈。

### 2. 领域知识扫描（Standard 模式）

> Fast 模式跳过此步，直接进入 Step 3。

技术栈检测完成后，扫描项目代码提取领域知识，为 `docs/knowledge.md` 准备内容。

**核心原则**：只提取模型无法从公开资料获取的内容。

**空项目处理**：项目没有足够源码时跳过扫描，`docs/knowledge.md` 留空模板，后续由物料飞轮填充。

### 3. 确认检测结果 + 选择更新策略

> Fast 模式：新项目无 CLAUDE.md 时默认 Create 策略，跳过此步交互。

检测结果不是最终事实，用户确认才是。

确认时至少要让用户看到：
- 检测到的主技术栈
- 推荐加载的规则集
- 建议初始化的指南文档
- 建议生成的 `.claude/` 内容

如果项目根目录已经有 `CLAUDE.md` 或 `.claude/settings.json`，说明大概率不是首次接入。

这时不应直接覆盖，而应进入策略选择。

支持三种策略：

| 策略 | 含义 |
|------|------|
| `Update` | 只补缺失内容，尽量保留现有配置 |
| `Skip` | 完全不改动 |
| `Overwrite` | 删除后重建，风险最高 |

默认推荐 `Update`。

`Overwrite` 必须二次确认，并清楚提示将被替换的内容。

### 4. 落地入口、规则、guide、`.claude/`

按确认后的技术栈加载：
- `configs/rules/common/`
- `configs/rules/java/`
- 如检测到 MySQL 相关特征，再加载 `configs/rules/mysql/`

默认规则映射：

| 源路径 | 目标路径 |
|--------|----------|
| `configs/rules/common/coding-style.md` | `configs/rules/common/coding-style.md` |
| `configs/rules/common/security.md` | `configs/rules/common/security.md` |
| `configs/rules/common/testing.md` | `configs/rules/common/testing.md` |
| `configs/rules/common/code-review-checklist.md` | `configs/rules/common/code-review-checklist.md` |
| `configs/rules/java/java-coding-style.md` | `configs/rules/java/java-coding-style.md` |
| `configs/rules/java/testing.md` | `configs/rules/java/testing.md` |

Guide 产出要求：

- `docs/guides/development-spec.md` 必须与 Java 项目匹配
- `docs/guides/workflow-guide.md` 必须创建（CLAUDE.md 显式引用）
- 不得继续输出 Node.js / Go / Python 的误导性内容

模板复制与变量替换要求：

会用项目上下文替换模板变量，例如：
- `{{project_name}}`
- `{{tech_stack}}`
- `{{build_tool}}`
- `{{branch_pattern}}`
- `{{author}}`
- `{{hooks_dir}}`

默认目录与复制规则：
- 推荐创建 `docs/`、`docs/guides/`、`configs/rules/`、`features/`、`.claude/`
- `configs/templates/` 本身属于框架资源，不必整目录复制到目标项目
- 目标不存在时创建；已存在时优先保留用户内容；仅在明显还是模板变量未替换时做替换

变量回退策略和 `.claude/` 初始化细节见：
- `claude-init.md`

`.claude/` 初始化至少包括：

- 复制核心 hooks 到 `.claude/hooks/`
- 基于模板生成 `.claude/settings.json`
- 如果 `.claude/settings.json` 已存在，默认 merge，不覆盖用户已有 `permissions` 和 `tools`

### 5. 生成领域知识库（Standard 模式）

> Fast 模式：直接创建空模板，不执行扫描。

将 Step 2 扫描得到的领域知识写入 `docs/knowledge.md`。

**生成规则**：
- 使用 `configs/templates/knowledge.md` 作为骨架
- 将扫描到的条目填入对应分区（组件用法 / 平台约束 / 踩坑记录）
- 如果项目没有足够的源码，保留空模板
- 如果 `docs/knowledge.md` 已存在，增量追加不覆盖

### 6. 初始化验证

初始化完成后，要确认：
- 目录存在
- 关键文件存在
- 模板变量已替换
- 规则和技术栈匹配
- `.claude/` 已可工作
- 链接没有明显断裂

至少检查：

- `CLAUDE.md` 存在且不包含未替换变量
- `docs/guides/development-spec.md` 存在
- `docs/guides/workflow-guide.md` 存在
- `docs/knowledge.md` 存在
- `features/` 存在
- `.claude/hooks/spec-state-guard.js` 存在
- `.claude/settings.json` 存在且可解析
- `configs/rules/common/coding-style.md` 存在
- `configs/rules/java/java-coding-style.md` 存在

可以用类似方式快速检查：

```bash
test -f CLAUDE.md
test -f docs/guides/development-spec.md
test -f docs/guides/workflow-guide.md
test -f docs/knowledge.md
test -d features
test -f .claude/settings.json
! grep -q '{{project_name}}' CLAUDE.md
```

## 典型输出

```text
=== 初始化完成 ===

策略: Update
项目类型: Java (Maven)

已加载:
- common/coding-style
- common/security
- common/testing
- java/java-coding-style
- mysql/*

已创建:
- CLAUDE.md
- docs/guides/
- docs/knowledge.md (领域知识: 3 组件用法, 2 平台约束)
- features/
- .claude/hooks/
- .claude/settings.json

下一步:
/tech:feature
```

## 默认忽略项

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

## 配套文档

| 文档 | 作用 |
|------|------|
| `bootstrap-guard.md` | 主流程前的边界场景预检与 repo 自举保护 |
| `claude-init.md` | `.claude/` 初始化、merge 与变量回退规则 |

> stack-detection 和 knowledge-scanning 已内联到本文件。

## Gotchas

> 已知失败模式，从实际使用中发现，有机增长。

- **检测到已存在文件就跳过初始化**：但已存在的 `CLAUDE.md` 或 `.claude/settings.json` 可能过时。优先使用 `Update` 补齐缺失项，或在明确确认后使用 `Overwrite`
- **在空目录下初始化**：没有任何源码文件，栈检测失效。至少需要有 `pom.xml`、`build.gradle` 或 `src/main/java`
- **对非 Java 项目继续初始化**：会生成不匹配的 guide 和规则。应在 Step 1 后直接停止
- **覆盖已有配置而不备份**：强制覆盖后原配置丢失，无法回滚。init 默认跳过已存在文件
