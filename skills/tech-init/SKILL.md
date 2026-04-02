---
name: tech:init
description: 当用户在全新项目中首次使用、或要求重新初始化 AI 开发环境时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "5.0"
---

# /tech:init

## 作用

`/tech:init` 在目标项目里落地 tinypowers 的基础工作流骨架。

本 skill 是 **tinypowers 独有**（无 superpowers 委托），负责项目首次接入时的骨架落地。

## 初始化目标

执行完成后，目标项目应具备：
- `CLAUDE.md` 入口文件（含 init_version）
- `docs/guides/` 指南文档
- `docs/knowledge.md` 领域知识库
- `configs/rules/` 规则目录
- `features/` 需求工作目录
- `.claude/` 本地配置（hooks + settings.json）

## 主流程

```text
Step 1: 技术栈检测
Step 2: 确认 + 策略选择
Step 3: 落地（规则 + 模板 + .claude/ + 知识扫描）
Step 4: 验证
```

## Step 1: 技术栈检测

检测目标项目的技术栈。当前只支持 Java（Maven / Gradle）。

**检测信号**（按优先级）：

| 信号 | 判定 | 置信度 |
|------|------|--------|
| `pom.xml` 存在 | Java (Maven) | 0.95 |
| `build.gradle` 存在 | Java (Gradle) | 0.95 |
| `build.gradle.kts` 存在 | Java (Gradle) | 0.95 |
| `src/main/java` 存在但无构建文件 | Java (unknown build tool) | 0.80 |

**检测失败**：无上述信号时，要求用户确认技术栈（Maven / Gradle / 非 Java 暂不支持）。

**默认值**：

| 构建工具 | build_command | service_port |
|----------|---------------|--------------|
| Maven | `mvn test` | 8080 |
| Gradle | `./gradlew check` | 8080 |
| unknown | `mvn test` | 8080 |

检测结果包含：`primary_stack`, `tech_stack`, `tech_stack_short`, `build_tool`, `build_command`, `service_port`, `branch_pattern`, `confidence`。

## Step 2: 确认 + 策略选择

展示检测结果，让用户确认。

**展示内容**：
- 检测到的技术栈和置信度
- 推荐加载的规则集
- .claude/ 初始化计划

**策略选择**：

| 场景 | 策略 | 行为 |
|------|------|------|
| 目标项目无 CLAUDE.md | Create（默认） | 全新建 |
| 已有 CLAUDE.md | Update（默认） / Skip / Overwrite | 用户选择 |

- **新项目**（无 CLAUDE.md）直接走 Create，不问 Update/Overwrite。
- **已有 CLAUDE.md** 时展示三种策略供选择。`Overwrite` 必须二次确认，并提示将被替换的内容。

## Step 3: 落地

一次性完成规则加载、模板复制、.claude/ 初始化和知识扫描。

### 3a. 规则加载

从 tinypowers 安装目录复制规则到目标项目 configs/rules/：

| 源路径 | 目标路径 |
|--------|----------|
| configs/rules/common/coding-style.md | configs/rules/common/coding-style.md |
| configs/rules/common/security.md | configs/rules/common/security.md |
| configs/rules/common/testing.md | configs/rules/common/testing.md |
| configs/rules/common/code-review-checklist.md | configs/rules/common/code-review-checklist.md |
| configs/rules/java/java-coding-style.md | configs/rules/java/java-coding-style.md |
| configs/rules/java/testing.md | configs/rules/java/testing.md |

如检测到 MySQL 使用，额外复制 `configs/rules/mysql/`。

### 3b. 模板复制 + 变量替换

| 模板 | 目标 |
|------|------|
| `configs/templates/CLAUDE.md` | CLAUDE.md |
| `configs/templates/knowledge.md` | docs/knowledge.md |

变量替换规则和 settings.json merge 策略详见 `claude-init.md`。

已存在的文件：Update 策略保留用户内容；Overwrite 策略替换。

### 3c. Guide 文档复制

从 tinypowers 安装目录复制 `docs/guides/` 下的指南文档到目标项目。

### 3d. .claude/ 初始化

详见 `claude-init.md`。

安装 hooks、生成 settings.json、确保 init 后项目可直接开始 `/tech:feature`。

### 3e. 目录创建

确保以下目录存在：`features/`、`docs/`、`docs/guides/`。

### 3f. 知识扫描（可选）

对非空项目做轻量领域知识扫描，写入 `docs/knowledge.md`。

**核心原则**：只提取模型无法从公开资料获取的内容。Google 能搜到的不记录。

**空项目跳过**：无源码或采样文件不足 2 个时保留空模板，后续由 `/tech:code` 知识沉淀飞轮填充。

**扫描策略**（采样 2-3 个代表性文件）：

| 扫描维度 | 提取内容 |
|----------|---------|
| 依赖 | 依赖声明中的非公开包（内部 groupId、私有 registry） |
| 请求封装 | API 调用方式、URL 构造规则、错误处理模式 |
| 组件用法 | UI 组件库选型、状态管理模式、与公开版本行为差异 |
| 配置约束 | 路由格式要求、特殊构建 loader/plugin、必填环境变量 |

**输出格式**（三类分区）：

```text
## 组件用法 — 内部组件与公开版本的用法差异
## 平台约束 — 项目特有的隐性规则
## 踩坑记录 — init 阶段发现的坑
```

已存在 `docs/knowledge.md` 时增量追加不覆盖。

## Step 4: 验证

初始化完成后逐项检查：

| 检查项 | 验证方式 |
|--------|----------|
| CLAUDE.md 存在且变量已替换 | `test -f` + 不含 `{{` |
| CLAUDE.md 含 init_version | `grep init_version` |
| docs/guides/ 存在 | `test -d` |
| docs/guides/workflow-guide.md 存在 | `test -f` |
| docs/guides/development-spec.md 存在 | `test -f` |
| docs/knowledge.md 存在 | `test -f` |
| configs/rules/ 存在 | `test -d` |
| features/ 存在 | `test -d` |
| .claude/settings.json 存在 | `test -f` |
| .claude/hooks/ 含 spec-state-guard.js | `test -f` |

验证不通过时修复缺失项后重新检查。

## 典型输出

```text
=== 初始化完成 ===

策略: Create
项目类型: Java (Maven)

已加载:
- common/coding-style, security, testing, code-review-checklist
- java/java-coding-style, java/testing

已创建:
- CLAUDE.md (init_version: 5.0)
- docs/guides/ (5 files)
- docs/knowledge.md (领域知识: 3 组件用法, 2 平台约束)
- .claude/settings.json
- .claude/hooks/ (4 hooks)
- features/

下一步:
/tech:feature
```

## 默认忽略项

初始化过程中默认跳过：

```text
.git/ node_modules/ target/ build/ *.class *.log .env* *.pem *.key
```

## 配套文档

| 文档 | 作用 |
|------|------|
| `claude-init.md` | .claude/ 初始化逻辑（hooks + settings.json merge + 模板变量替换） |

## Gotchas

> 已知失败模式，从实际使用中发现，有机增长。

- **检测到已存在文件就跳过初始化**：已存在的 CLAUDE.md 可能过时 → 用 Overwrite 策略可强制重建
- **在空目录下初始化**：无构建文件 → 栈检测失效 → 需用户确认技术栈
- **覆盖已有配置而不备份**：init 默认 Update 策略不覆盖 → Overwrite 会替换但不自动备份
- **settings.json merge 不完整**：已存在复杂配置时 merge 可能遗漏 → 展示 merge 结果供用户确认
- **空项目知识扫描跳过**：无源码时 docs/knowledge.md 保留空模板，由 `/tech:code` 知识沉淀飞轮逐步填充
- **只支持 Java**：v5 的自动检测仅覆盖 Java（Maven / Gradle）。Node.js / Go / Python 项目无法自动检测，但仍可手动创建 CLAUDE.md 和 configs/rules/ 来接入 tinypowers 工作流
- **project-overrides.json 不再支持**：该机制在 v4 中移除，从未被代码实现。如有自定义需求，直接编辑目标项目的 CLAUDE.md 和 configs/rules/
