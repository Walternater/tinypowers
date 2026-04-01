---
name: tech:init
description: 当用户在全新项目中首次使用、或要求重新初始化 AI 开发环境时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "4.0"
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
Step 2: 领域知识扫描
Step 3: 确认 + 策略选择
Step 4: 落地（规则 + 模板 + .claude/）
Step 5: 知识库生成
Step 6: 验证
```

## Step 1: 技术栈检测

检测目标项目是否为 Java 项目。检测细节见 `stack-detection.md`。

默认值：

| 构建工具 | build_command | service_port |
|----------|---------------|--------------|
| Maven | `mvn checkstyleMain testClasses` | 8080 |
| Gradle | `./gradlew check` | 8080 |
| unknown | `mvn test` | 8080 |

空项目（无构建文件）：告知用户无法检测，要求确认技术栈。

## Step 2: 领域知识扫描

技术栈检测完成后，扫描项目代码提取领域知识。

核心原则：只提取模型无法从公开资料获取的内容。

空项目处理：跳过扫描，`docs/knowledge.md` 留空模板。

扫描策略和输出格式详见 `knowledge-scanning.md`。

## Step 3: 确认 + 策略选择

展示检测结果，让用户确认，并选择更新策略。

**展示内容**：
- 检测到的技术栈和置信度
- 推荐加载的规则集
- .claude/ 初始化计划

**更新策略**：

| 策略 | 含义 | 适用场景 |
|------|------|---------|
| Update（默认） | 只补缺失，保留现有 | 已有 CLAUDE.md 但想补齐 |
| Skip | 不改动 | 只看检测结果 |
| Overwrite | 删除后重建 | 配置明显过时 |

`Overwrite` 必须二次确认，并提示将被替换的内容。

## Step 4: 落地

一次性完成规则加载、模板复制和 .claude/ 初始化。

### 4a. 规则加载

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

### 4b. 模板复制 + 变量替换

| 模板 | 目标 |
|------|------|
| `configs/templates/CLAUDE.md` | CLAUDE.md |
| `configs/templates/knowledge.md` | docs/knowledge.md |

变量替换和回退策略详见 `claude-init.md`。

已存在的文件：Update 策略保留用户内容；Overwrite 策略替换。

### 4c. Guide 文档复制

从 tinypowers 安装目录复制 `docs/guides/` 下的指南文档到目标项目。

### 4d. .claude/ 初始化

详见 `claude-init.md`。

安装 hooks、生成 settings.json、确保 init 后项目可直接开始 `/tech:feature`。

### 4e. 目录创建

确保以下目录存在：`features/`、`docs/`、`docs/guides/`。

## Step 5: 知识库生成

将 Step 2 扫描结果写入 `docs/knowledge.md`。

已存在时增量追加不覆盖。

空扫描结果时保留空模板。

## Step 6: 验证

初始化完成后逐项检查：

| 检查项 | 验证方式 |
|--------|----------|
| CLAUDE.md 存在且变量已替换 | `test -f` + 不含 `{{` |
| CLAUDE.md 含 init_version | `grep init_version` |
| docs/guides/ 存在 | `test -d` |
| docs/knowledge.md 存在 | `test -f` |
| configs/rules/ 存在 | `test -d` |
| features/ 存在 | `test -d` |
| .claude/settings.json 存在 | `test -f` |
| .claude/hooks/ 含 spec-state-guard.js | `test -f` |

验证不通过时修复缺失项后重新检查。

## 典型输出

```text
=== 初始化完成 ===

策略: Update
项目类型: Java (Maven)

已加载:
- common/coding-style, security, testing, code-review-checklist
- java/java-coding-style, java/testing

已创建:
- CLAUDE.md (init_version: 4.0)
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
| `stack-detection.md` | 技术栈检测规则（Java-only） |
| `knowledge-scanning.md` | 领域知识扫描策略 |
| `claude-init.md` | .claude/ 初始化逻辑 |

## Gotchas

> 已知失败模式，从实际使用中发现，有机增长。

- **检测到已存在文件就跳过初始化**：已存在的 CLAUDE.md 可能过时 → 用 Overwrite 策略可强制重建
- **在空目录下初始化**：无构建文件 → 栈检测失效 → 需用户确认技术栈
- **覆盖已有配置而不备份**：init 默认 Update 策略不覆盖 → Overwrite 会替换但不自动备份
- **settings.json merge 不完整**：已存在复杂配置时 merge 可能遗漏 → 展示 merge 结果供用户确认
