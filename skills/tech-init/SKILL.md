---
name: tech:init
description: 当用户在全新项目中首次使用、或要求重新初始化 AI 开发环境时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "3.0"
---

# /tech:init

## 作用

`/tech:init` 用于在一个目标项目里落地 tinypowers 的基础工作流骨架。

本 skill 是 **tinypowers 独有**（无 superpowers 委托），负责项目首次接入时的骨架落地。

## 初始化目标

执行完成后，目标项目通常应具备：
- `CLAUDE.md` 入口文件
- `docs/guides/` 指南文档
- `docs/knowledge.md` 领域知识库（从项目代码动态提取）
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
0. 框架自举检测（是否在 tinypowers 仓库自身运行）
1. 技术栈检测
2. 领域知识扫描
3. 检测结果确认
4. 已初始化检查 + 项目级配置覆盖检测
5. 选择更新策略
6. 加载对应规则（覆盖配置优先）
7. 复制模板并替换变量（覆盖配置优先）
8. 生成领域知识库
9. 执行初始化验证
10. 输出结果与下一步建议
```

## 详细步骤

### 0. 框架自举检测

在执行任何初始化动作之前，先判断当前项目是否是 tinypowers 框架自身。

判断条件（满足任意两个即为框架仓库）：
- 存在 `skills/` 目录且包含 `SKILL.md` 文件
- 存在 `agents/` 目录且包含多个 md 文件
- 存在 `manifests/components.json`
- 存在 `hooks/` 目录

如果判定为框架仓库：

- **跳过**：创建 .claude/agents/（框架的 Agent 定义在 agents/ 而不是 .claude/agents/）
- **跳过**：创建 docs/templates/（框架模板在 configs/templates/）
- **跳过**：创建 code-review-checklist（框架已有 configs/rules/common/ 下的审查清单）
- **跳过**：复制通用 Agent 定义（框架已有完整的 agents/ 目录）
- **保留**：技术栈检测、CLAUDE.md 更新、规则加载、features/ 创建等正常流程
- **提示**：明确告知用户"检测到框架仓库，已跳过重复创建"

这一步的目的是防止框架用自己的 init 流程创建出重复的 Agent 和模板。

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

### 2. 领域知识扫描

技术栈检测完成后，扫描项目代码提取领域知识，为 `docs/knowledge.md` 准备内容。

**核心原则**：只提取模型无法从公开资料获取的内容。

**输出**：一份领域知识清单，在 Step 8 写入 `docs/knowledge.md`。

**空项目处理**：项目没有足够源码时跳过扫描，`docs/knowledge.md` 留空模板，后续由物料飞轮填充。

扫描策略、采样方法和输出格式详见 `knowledge-scanning.md`。

### 3. 检测结果确认

检测结果不是最终事实，用户确认才是。

确认时至少要让用户看到：
- 检测到的主技术栈
- 推荐加载的规则集
- 建议初始化的指南文档

### 4. 已初始化检查

如果项目根目录已经有 `CLAUDE.md`，说明大概率不是首次接入。

这时不应直接覆盖，而应进入更新策略选择。

同时检查项目根目录是否存在 `project-overrides.json`。如果存在，读取覆盖配置并在后续步骤中优先使用。

支持的覆盖项：

| 字段 | 类型 | 说明 |
|------|------|------|
| `review_checklist` | string | 替换默认审查清单路径 |
| `acceptance_criteria_template` | string | 验收标准模板（EARS / EARS_RELAXED / FREEFORM） |
| `commit_prefix` | string | 提交消息前缀 |
| `quality_gate_command` | string | 替换默认构建/验证命令 |
| `skip_phases` | string[] | 初始化时跳过的 SPEC-STATE 阶段 |
| `rules_dir` | string | 自定义规则目录路径 |
| `templates_dir` | string | 自定义模板目录路径 |

### 5. 更新策略

支持三种策略：

| 策略 | 含义 |
|------|------|
| `Update` | 只补缺失内容，尽量保留现有配置 |
| `Skip` | 完全不改动 |
| `Overwrite` | 删除后重建，风险最高 |

默认推荐 `Update`。

策略选择规则：
- `Update`：项目已有 `CLAUDE.md` 或部分 guides / rules，只想补齐缺失项
- `Skip`：用户只想看检测结果，或当前项目已有自定义体系不希望接入
- `Overwrite`：旧入口和 guides 明显过时，且用户明确接受重建

`Overwrite` 必须二次确认，并清楚提示将被替换的内容，例如 `CLAUDE.md`、`docs/guides/*.md`、`configs/rules/*`。

### 6. 规则加载

按确认后的技术栈加载：
- `configs/rules/common-*`
- 技术栈对应子目录规则
- 如果 `project-overrides.json` 指定了 `rules_dir`，从该目录加载

例如：
- Java 项目加载 `configs/rules/java/`
- 需要 MySQL 约束时加载 `configs/rules/mysql/`

### 7. 模板复制与变量替换

会用项目上下文替换模板变量，例如：
- `{{project_name}}`
- `{{tech_stack}}`
- `{{build_tool}}`
- `{{branch_pattern}}`
- `{{author}}`

默认目录与复制规则：
- 推荐创建 `docs/`、`docs/guides/`、`configs/rules/`、`configs/templates/`、`features/`、`.claude/`
- `configs/templates/` 本身属于框架资源，不必整目录复制到目标项目；真正立即有价值的是入口、guides 和 rules
- 目标不存在时创建；已存在时优先保留用户内容；仅在明显还是模板变量未替换时做替换

常见变量来源：
- 当前工作目录
- 技术栈检测结果
- `git config user.name`
- 当前系统时间

### 8. 生成领域知识库

将 Step 2 扫描得到的领域知识写入 `docs/knowledge.md`。

**生成规则**：
- 使用 `configs/templates/knowledge.md` 作为骨架
- 将扫描到的条目填入对应分区（组件用法 / 平台约束 / 踩坑记录）
- 如果项目没有足够的源码，保留空模板
- 如果 `docs/knowledge.md` 已存在，增量追加不覆盖

**生成时机**：放在模板复制之后、验证之前，因为验证步骤需要检查 knowledge.md 是否存在。

### 9. 初始化验证

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

领域知识扫描:
- 内部依赖: @company/common-utils, @company/auth-sdk
- 请求封装: 统一 Response<T> 包装, GlobalExceptionHandler 模式
- 目录惯例: Controller → Service → Mapper 三层分包

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

## 配套文档

| 文档 | 作用 |
|------|------|
| `stack-detection.md` | 技术栈检测规则 |
| `knowledge-scanning.md` | 领域知识扫描策略和输出格式 |
| `verification.md` | 初始化验证规则 |

## Gotchas

> 已知失败模式，从实际使用中发现，有机增长。

- **检测到已存在文件就跳过初始化**：但已存在的 CLAUDE.md 可能过时 → 配置不同步：在更新策略（Step 5）选择 `Overwrite` 可强制重建，或手动检查 `CLAUDE.md` 与当前 tinypowers 版本的差异
- **在空目录下初始化**：没有任何源码文件 → 栈检测失效：至少需要有 `package.json` 或 `pom.xml` 等标记文件
- **覆盖已有配置而不备份**：强制覆盖后原配置丢失 → 无法回滚：init 默认跳过已存在文件，不会自动备份
