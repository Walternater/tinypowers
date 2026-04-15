<!-- /autoplan restore point: ~/.gstack/projects/znkf-atomic-task/online-autoplan-restore-20260414-105340.md -->

# SKILL: /knowledge:init

## 基本信息

- **名称**: `knowledge:init`
- **别名**: `/knowledge:init`
- **配套命令**: `/knowledge:check` (知识库一致性检查)
- **支持参数**:
  - `--yes` / `-y`：跳过逐章确认直接写入；若生成内容中存在 `MANUAL` 或 `HYBRID` 占位区块则中断并提示人工确认（防止 CI 提交未填充内容）
  - `--dry-run`：执行扫描并输出预览，但不写入文件
  - `--strategy={create|update|resync}`：强制指定初始化策略
  - `--skip-backup`：跳过备份（不推荐，仅供高级用户）
- **适用范围**: Java 项目（Maven/Gradle）
- **触发方式**:
  1. 作为 `tech:init` 的固定子步骤自动触发（不可跳过）
  2. 手动输入 `/knowledge:init` 独立触发（用于重新生成或补全）

## 技能目标

为每个 Java 工程初始化一套标准化的三层知识库：

```
project-root/
├── README.md              # 人类入口：项目简介、技术栈、Quick Start、文档导航
├── AI-KNOWLEDGE.md        # AI 索引：代码位置、依赖版本、快速导航、PR 检查清单
└── docs/
    ├── business-domain.md # 业务领域：枚举、架构、数据模型、关键逻辑
    ├── infrastructure.md  # 基础设施：中间件、监控、部署、测试/日志/安全规范
    └── operations.md      # 运维实操：命令、三方交互、定时任务、FAQ
```

**核心价值**：让 AI 和人类都能基于统一文档快速理解项目，降低新成员和 Agent 的 onboarding 成本。

---

## 执行流程

### Step 1: 代码扫描

AI 主动扫描代码库，收集以下信息：

| 扫描项 | 方法 | 用途 |
|--------|------|------|
| 技术栈 | `pom.xml` / `build.gradle` 依赖解析 | README 徽章、AI-KNOWLEDGE 元数据 |
| 模块结构 | `find . -path '*/src/main/java' -type d` | README 项目结构图 |
| 大文件/核心类 | 按行数排序 `.java` 文件 | AI-KNOWLEDGE 代码位置索引 |
| 枚举类 | `grep "enum .*Enum"` | business-domain.md 类型系统 |
| 中间件 | `grep -r "kafka\|redis\|dubbo\|etcd\|zookeeper\|redisson\|mybatis\|datasource"` | infrastructure.md 配置 |
| 外部服务 | `thirdpart/` 包扫描 + `@Reference` / Dubbo 接口交叉匹配 + 接口名关键词分类 | operations.md 三方交互 |
| Kafka Consumer | 全代码库搜索 `@KafkaListener` / `@ConsumeWithoutLog`（不仅限于 `kafka/consumer/` 目录） | business-domain.md 消费者列表 |
| 定时任务 | `job/` 目录 + `@Scheduled` + `ElasticJob` 注解 + `SimpleJob` / `DataflowJob` 接口实现 | operations.md 定时任务 |
| 配置文件 | `application-*.yml` | infrastructure.md 环境配置 |
| 敏感信息过滤 | 扫描时自动跳过含 `password`、`secret`、`token`、`key`、`uri`、`address`、`nodes`、`host`、`url` 的配置键 | 避免将凭据或内部拓扑写入生成的文档 |
| 测试覆盖 | `*Test.java` 数量统计 | infrastructure.md 测试规范 |
| SDK 依赖 | `pom.xml` 中 `*-sdk.version` / `smart-common.version` | AI-KNOWLEDGE.md 依赖表 |

#### 增强扫描规则（经 3 个真实项目验证）

| 规则 | 方法 | 触发动作 |
|------|------|----------|
| **模块边界规则** | 检测与主包平级的独立包，或单模块内职责隔离的大型子包 | 若包含 ≥10 个 Java 文件 或 ≥500 行代码，标记为 `AUTO` 自动生成摘要；否则标记为 `MANUAL` |
| **动态配置规则** | 扫描 `TaskConfig` / `@ConfigurationProperties` / `docs/data/*.json` | 区分"硬编码枚举"与"配置型动态任务/参数"，在 business-domain.md 中说明 |
| **定时任务规则** | 扫描 `job/` 目录 + `@Scheduled(cron = "...")` / `ElasticJob` 注解 + `SimpleJob` / `DataflowJob` 接口实现 | 在 operations.md 补充 cron 表达式与调度说明 |
| **HTTP 接口规则** | 扫描 `thirdpart/` 接口时，交叉匹配 `@FeignClient` / `RestTemplate` 调用；按接口名关键词分类（Mall/Wechat/Im/Call/Search/Order/Car） | 提取 URL 前缀、超时配置，补充到 operations.md |
| **规范文档规则** | 扫描 `docs/guides/`、`CLAUDE.md`、`docs/*.md` | 若存在 guides/ 或 CLAUDE.md，摘要合并到 infrastructure.md；若存在其他技术文档，提示用户是否引用 |

### Step 2: README 评估与初始化策略选择

**核心原则：已有优质 README 时，禁止直接覆盖重写，必须采用增量更新策略。**

评估维度：
- 文件是否存在
- 字数/行数是否 > 200 行
- 是否包含：项目简介、技术栈、快速开始、项目结构 中的 ≥3 项

**策略分支**：

| 策略 | 触发条件 | README 处理方式 | AI-KNOWLEDGE + docs | 确认章节数 |
|------|----------|-----------------|---------------------|------------|
| **Create** | 无 README 或 README < 100 行且内容稀疏 | 按完整模板全新生成 | 全新生成 | 7 章 |
| **Update** | README 已存在且信息丰富（> 200 行，含 ≥3 项核心内容） | **保留原有结构和风格**，仅追加 AI-KNOWLEDGE.md / docs/ 的导航链接和缺失的标准区块 | 全新生成 | 5 章 |
| **Resync** | 用户明确选择"只更新 AI 索引和文档，不动 README" | 完全不动 | 全新生成或增量补全 | 4 章 |

**边界处理（100–200 行灰色地带）**：README 行数在 100–200 之间时，AI 应判断内容质量：
- 若含 ≥3 项核心内容（项目简介、技术栈、快速开始、项目结构之一），按 **Update** 策略处理
- 否则（内容稀疏或大量占位符），按 **Create** 策略处理，并提示用户确认是否覆盖

默认推荐：
- 若 README 丰富 → 默认 **Update**
- 若 README 缺失或简陋 → 默认 **Create**
- **Resync** 只在独立触发 `/knowledge:init` 时作为可选策略提供

**策略不兼容处理**：若用户通过 `--strategy` 强制指定了与当前项目状态不兼容的策略（如 `--strategy=update` 但项目无 README），AI 应报错并建议切换为 `create`。

### Step 3: 骨架生成（内存中）

生成 5 个文件的 Markdown 初稿，遵循固定模板：

**模板填充规则**：
- `README.md`: 项目名、技术栈徽章、Quick Start、文档导航表
- `AI-KNOWLEDGE.md`: YAML frontmatter + 快速导航 + 代码位置索引 + 数据模型 + 常见问题 + PR 检查清单
- `docs/business-domain.md`: 项目概述、类型系统、架构设计、关键业务逻辑、数据模型、开发指南、示例
- `docs/infrastructure.md`: 中间件配置、监控告警、部署环境、smart-common 组件、测试规范、日志规范、版本升级、安全规范
- `docs/operations.md`: 常用命令、注意事项、三方服务交互、定时任务、开发规范补充、错误码、FAQ

#### AUTO / MANUAL / HYBRID 标注机制

为降低用户对生成内容的信任成本，模板内部使用 HTML 注释标注内容来源：

```markdown
<!-- AUTO: 以下内容由 AI 从 application.yml 自动生成 -->
### 1.1 Dubbo 配置
dubbo.group: znkf_dubbo
...

<!-- MANUAL: 以下内容需人工补充，模板仅提供引导 -->
### 1.5 监控与告警
（请补充 Zipkin、Sentinel、LogPolice 配置）

<!-- HYBRID: 以下类名由代码扫描生成，职责说明需人工补充 -->
- `TaskBusiness` — （请补充核心职责）
```

用户确认时，AI **优先高亮 MANUAL 区块**，减少无效阅读时间。

### Step 4: 逐章确认

确认章节数根据初始化策略动态调整：

**Create 策略（7 章）**：
```
第 1/7 章：README.md — 项目简介与技术栈
第 2/7 章：README.md — Quick Start 与文档导航
第 3/7 章：AI-KNOWLEDGE.md — 元数据与代码索引
第 4/7 章：docs/business-domain.md — 业务类型与状态机
第 5/7 章：docs/infrastructure.md — 中间件与组件库
第 6/7 章：docs/operations.md — 三方服务与 FAQ
第 7/7 章：整体结构确认与写入
```

**Update 策略（5 章）**：
```
第 1/5 章：README.md 增量变更预览
第 2/5 章：AI-KNOWLEDGE.md — 元数据与代码索引
第 3/5 章：docs/business-domain.md
第 4/5 章：docs/infrastructure.md
第 5/5 章：docs/operations.md + 整体确认与写入
```

**Resync 策略（4 章）**：
```
第 1/4 章：AI-KNOWLEDGE.md
第 2/4 章：docs/business-domain.md
第 3/4 章：docs/infrastructure.md
第 4/4 章：docs/operations.md + 整体确认与写入
```

每章提供：**预览**（Markdown 折叠或摘要）+ **选项** `[确认] [编辑] [跳过]`。

### Step 5: 原子写入

全部确认后执行：

```bash
# 1. 强制备份旧文件（若存在；使用 --skip-backup 参数时跳过此步骤，仅供高级用户）
mkdir -p .knowledge-backup/
cp README.md .knowledge-backup/README.md.bak.$(date +%s) 2>/dev/null || true
cp AI-KNOWLEDGE.md .knowledge-backup/AI-KNOWLEDGE.md.bak.$(date +%s) 2>/dev/null || true
cp docs/*.md .knowledge-backup/ 2>/dev/null || true
mkdir -p docs/

# 2. 原子写入：先写临时文件，再重命名
# AI 先将内容写入 TMP.md，确认无误后执行：
# mv TMP.md README.md
# 若中途失败，可从 .knowledge-backup/ 恢复

# 3. 输出变更清单
```

输出示例：
```
✅ 知识库初始化完成
   README.md          ← 人类入口
   AI-KNOWLEDGE.md    ← AI 索引
   docs/business-domain.md
   docs/infrastructure.md
   docs/operations.md
```

---

## /knowledge:check 设计

**触发**：手动运行 `/knowledge:check`

**检查逻辑**：

1. **代码变更检测**
   ```bash
   # 跨平台方式：取 AI-KNOWLEDGE.md 最后一次 git 提交时间戳（UNIX 秒）
   _SINCE=$(git log -1 --format=%ct -- AI-KNOWLEDGE.md)
   # 注意1：git diff 不接受 --since 参数（会被静默忽略），必须用 git log
   # 注意2：git log --since 支持直接传入 UNIX 时间戳整数（git 2.x approxidate 解析器支持）
   git log --since="${_SINCE}" --name-only --pretty=format: | sort -u | grep -v '^$'
   ```

2. **缺失项匹配（按优先级）**

   **P0 — 必须同步（架构/业务变更）**

   | 扫描规则 | 若发现 | 建议动作 | 目标文档 |
   |----------|--------|----------|----------|
   | 新增独立包/子包结构 | 如 `bargain/` / `live/` 目录下有 >10 个 Java 文件 | 生成模块摘要，建议补充 | `business-domain.md` |
   | 枚举类新增 5+ 个值 | `TaskSecondTypeEnum` / `AssignmentStatusEnum` diff | 同步类型系统表格 | `business-domain.md` |
   | 新增核心大文件 | 新增 >1000 行的 Business/Service 类 | 补充代码位置索引与职责说明 | `AI-KNOWLEDGE.md` + `business-domain.md` |

   **P1 — 强烈建议同步（接口/配置变更）**

   | 扫描规则 | 若发现 | 建议动作 | 目标文档 |
   |----------|--------|----------|----------|
   | 新增 `@Attribute(alias = "...etcd...")` | ETCD 配置项新增 ≥1 个 | 补充配置清单 | `infrastructure.md` |
   | 新增 `thirdpart/*.java` | 新外部服务接口 | 补充接口列表与调用说明 | `operations.md` |
   | 新增 `@KafkaListener` | 新 Kafka 消费者 | 补充消费者列表与 Topic 映射 | `business-domain.md` |
   | 新增 `SimpleJob` / `DataflowJob` / `@Scheduled` | 新定时任务 | 补充 cron 与调度说明 | `operations.md` |

   **P2 — 可选同步（环境/细节变更）**

   | 扫描规则 | 若发现 | 建议动作 | 目标文档 |
   |----------|--------|----------|----------|
   | `application.yml` 新增中间件配置项 | 如新增 Redis 集群节点 | 同步配置速查 | `infrastructure.md` |
   | `pom.xml` 依赖版本升级 | 如 Dubbo 2.7 → 3.x | 同步依赖版本表 | `AI-KNOWLEDGE.md` |
   | 新增 `docs/data/*.json` | 动态配置数据更新 | 说明配置型任务变更 | `business-domain.md` |

3. **输出报告**
   生成 `# 知识库一致性检查报告`，列出发现项、建议动作、目标文档章节。

---

## 模板速查

### README.md 模板要点

```markdown
# {project-name}
> {project-description}

## 简介
{project-name} 是...（从代码和 pom.xml 推断）

## 核心能力
- {能力1}
- {能力2}

## 技术栈
![Java](...) ![Spring Boot](...) ![Dubbo](...) ![Kafka](...)

## 快速开始
### 1. 构建项目
```bash
mvn clean install -DskipTests
```

## 文档导航
| 读者角色 | 推荐阅读 |
|----------|----------|
| 新同学入职 | [docs/business-domain.md](...) |
| 开发新功能 | [docs/business-domain.md](...) + [docs/infrastructure.md](...) |
| 排查线上问题 | [docs/operations.md](...) |
| AI Agent 开发 | [AI-KNOWLEDGE.md](...) |
```

### AI-KNOWLEDGE.md 模板要点

```markdown
---
project: {project-name}
name: {name}
description: {description}
type: microservice
language: java
version: 1.0.0
last_updated: {date}
ai_context_version: 1
---

# AI 上下文索引: {project-name}

## 元数据
...

## 快速导航索引
...

## 代码位置索引
...

## 常见问题（AI 上下文）
...

## PR 更新检查清单（AI 用）
- [ ] 新增枚举值是否已同步到 docs/business-domain.md
- [ ] 新增 thirdpart/ 接口是否已补充到 docs/operations.md
- [ ] 新增 Kafka Listener 是否已更新消费者列表
- [ ] 新增定时任务是否已更新 docs/operations.md
```

---

## 约束与原则

1. **纯 AI 实现**：不引入新的外部 CLI 工具或脚本
2. **代码事实优先**：生成的内容优先基于代码扫描结果，不编造未发现的配置或服务
3. **README 保护**：禁止直接覆盖已有优质 README，必须通过 Update 策略增量更新
4. **强制备份**：所有写入前必须备份旧文件
5. **人工确认**：每章内容默认需经用户确认；使用 `--yes` 参数时可批量跳过，但若生成内容中存在 `MANUAL` 或 `HYBRID` 占位区块，则必须中断并提示用户交互确认，防止将未填充的占位符提交到仓库

---

## 错误处理

| 错误场景 | 现象 | 根因 | 修复方式 | 文档 |
|---------|------|------|---------|------|
| `pom.xml` 解析失败 | 技术栈扫描为空 | 文件格式异常或权限不足 | 降级为仅读取 `<groupId>` / `<artifactId>` 基础标签 | 提示用户手动补充 |
| `docs/` 无写入权限 | 写入失败 | 目录权限为只读 | 输出到 `.knowledge-output/` 并提示用户（不修改仓库权限） | — |
| git 未初始化 | `/knowledge:check` 无法获取变更范围 | 仓库缺少 `.git` | 回退到 `find` 时间戳比较，并提示初始化 git | — |
| `AI-KNOWLEDGE.md` 存在但未提交 | `git log` 返回空，变更范围异常 | 文件从未进入 git 历史 | 回退到 `stat` 时间戳或 `find -newer` 比较 | — |
| 扫描到敏感字段 | 配置值被替换为 `***` | 命中 `password` / `secret` / `token` / `key` 黑名单 | 自动生成时跳过该键值，标记为 `MANUAL` | — |

---

## 测试规范

1. **事实校验**：对扫描出的每个事实（类名、接口名、依赖版本），AI 必须二次比对源文件内容，确保无幻觉。
2. **dry-run 验证**：在首次运行于新仓库前，建议先执行 `--dry-run`，确认输出范围符合预期。
3. **多模块兼容性**：扫描逻辑必须兼容单模块 `src/main/java` 和多模块 `*/src/main/java` 两种布局。
4. **跨平台命令**：所有 shell 命令必须在 GNU/Linux 和 macOS (darwin) 上均可执行。
5. **回归测试**：每次规则迭代后，需在 `atomic-task`、`atomic-customer`、`smart-sale-service` 三个项目上运行并对比输出差异。

---

## 验证历史

本技能经过以下 3 个瓜子智能客服团队的真实项目验证：

| 项目 | 特点 | 验证重点 |
|------|------|----------|
| `atomic-task` | 多模块、动态配置丰富 | 模块边界规则发现 `bargain` 子系统 |
| `atomic-customer` | 多模块、README 完整（477 行） | Update 策略保护现有 README |
| `smart-sale-service` | 单模块、2645 文件、无 README | Create 策略正确触发；SimpleJob 扫描发现 5 个定时任务；101 个外部接口分类 |

---

## 示例对话

### 场景 1：tech:init 中自动触发

**User**: `/tech:init`

**Claude**: `tech:init` 已检测到这是 Java + Maven 项目。现在进入第 6 步：知识库初始化 (`/knowledge:init`)。

首先进行 README 评估... 检测到当前项目没有 README.md，推荐采用 **Create** 策略（从无到有生成全部 5 个文件）。

接下来进行代码扫描... 扫描完成。发现 2645 个 Java 文件、38 个 Kafka Consumer、5 个 ElasticJob 定时任务、101 个外部服务接口。

请确认生成的内容。我们将分 7 章进行确认：
- 第 1/7 章：README.md — 项目简介与技术栈

### 场景 2：独立触发，已有 README

**User**: `/knowledge:init`

**Claude**: 开始知识库初始化。

README 评估结果：已检测到 `README.md`（477 行，包含项目简介、技术栈、快速开始、项目结构）。
**推荐策略：Update**（保留现有 README，仅追加导航链接）。

请选择：
- A. Update — 增量更新 README，生成 AI-KNOWLEDGE.md + docs/
- B. Create — 完全重新生成（覆盖风险）
- C. Resync — 只生成 AI-KNOWLEDGE.md + docs/，不动 README

### 场景 3：知识库一致性检查

**User**: `/knowledge:check`

**Claude**: 正在检查代码变更与知识库的一致性...

# 知识库一致性检查报告

## 发现 3 处可能需要同步的变更

1. **新增 live 子模块**
   - 发现 198 个新增 Java 文件于 `com.guazi.znkf.sale.live`
   - 建议：在 `docs/business-domain.md` 中补充直播业务说明

2. **新增 ETCD 配置**
   - 发现配置项：`close_live_accompany_job.enable`
   - 建议：在 `docs/infrastructure.md` 补充配置说明

3. **新增外部服务接口**
   - `thirdpart/AiAgentInterface.java`
   - 建议：补充到 `docs/operations.md` 的 AI/智能类接口列表
