# Design: /knowledge:init 技能

## 1. 触发方式

`/knowledge:init` 作为 `tech:init` 的**固定子步骤**，在 `tech:init` 主流程中不可跳过。

```
tech:init 主流程
    │
    ├── 0. 预检
    ├── 1. 技术栈检测
    ├── 2. 检测结果确认
    ├── 3. 选择更新策略
    ├── 4. 运行 init-project.js
    ├── 5. README 同步
    ├── 6. 知识库初始化  ← /knowledge:init 插入点
    │       │
    │       ├── 6.1 代码扫描
    │       ├── 6.2 README 评估与策略选择
    │       ├── 6.3 骨架生成（内存中）
    │       ├── 6.4 逐章确认
    │       └── 6.5 原子写入
    │
    └── 7. 收尾验证
```

**独立触发方式**（可选）：
```bash
/knowledge:init
```
用于已初始化过的项目重新生成或补全知识库。

---

## 2. 执行流程

### Phase 1: 代码扫描

AI 主动扫描代码库，收集以下信息：

| 扫描项 | 方法 | 用途 |
|--------|------|------|
| 技术栈 | `pom.xml` / `build.gradle` 依赖解析 | README 徽章、AI-KNOWLEDGE 元数据 |
| 模块结构 | `find src/main/java -type d` | README 项目结构图 |
| 大文件/核心类 | 按行数排序 `.java` 文件 | AI-KNOWLEDGE 代码位置索引 |
| 枚举类 | `grep "enum .*Enum"` | business-domain.md 类型系统 |
| 中间件 | `grep -r "kafka\|redis\|dubbo\|etcd"` | infrastructure.md 配置 |
| 外部服务 | `thirdpart/` 包扫描 + 接口名分类 | operations.md 三方交互 |
| Kafka Consumer | `@KafkaListener` / `@ConsumeWithoutLog` | business-domain.md 消费者列表 |
| 定时任务 | `job/` 目录 + `@Scheduled` + `ElasticJob` 接口实现 | operations.md 定时任务 |
| 配置文件 | `application-*.yml` | infrastructure.md 环境配置 |
| 测试覆盖 | `*Test.java` 数量统计 | infrastructure.md 测试规范 |
| SDK 依赖 | `pom.xml` 中 `*-sdk.version` / `smart-common.version` | AI-KNOWLEDGE.md 依赖表 |

#### 增强扫描规则（基于 atomic-task 验证补充）

| 规则 | 方法 | 触发动作 |
|------|------|----------|
| **模块边界规则** | 检测与主包平级的独立包（如 `com.guazi.znkf.bargain`） | 独立包若包含 ≥10 个 Java 文件 或 ≥500 行代码，标记为 `AUTO` 自动生成摘要；否则标记为 `MANUAL` 仅提示让用户决定 |
| **动态配置规则** | 扫描 `TaskConfig` / `@ConfigurationProperties` / `docs/data/*.json` | 区分"硬编码枚举"与"配置型动态任务/参数"，在 business-domain.md 中说明 |
| **定时任务规则** | 扫描 `job/` 目录 + 提取 `@Scheduled(cron = "...")` / `ElasticJob` 注解 / `SimpleJob` / `DataflowJob` 接口实现 | 在 operations.md 补充 cron 表达式与调度说明 |
| **HTTP 接口规则** | 扫描 `thirdpart/` 接口时，交叉匹配 `@FeignClient` / `RestTemplate` 调用；按接口名关键词分类（Mall/Wechat/Im/Call/Search/Order/Car） | 提取 URL 前缀、超时配置，补充到 operations.md |
| **规范文档规则** | 扫描项目是否已有 `docs/guides/` 或 `CLAUDE.md` | 若有，摘要合并到 infrastructure.md；若无，使用 skill 内置 Java 团队规范模板预填充 |

### Phase 1.5: README 评估与初始化策略选择

**核心原则：已有优质 README 时，禁止直接覆盖重写，必须采用增量更新策略。**

在骨架生成前，AI 评估现有 `README.md` 的完整度：

```
评估维度：
- 文件是否存在
- 字数/行数是否 > 200 行
- 是否包含：项目简介、技术栈、快速开始、项目结构 中的 ≥3 项
```

**策略分支**：

| 策略 | 触发条件 | README 处理方式 | AI-KNOWLEDGE + docs 处理方式 | 确认章节数 |
|------|----------|-----------------|------------------------------|------------|
| **Create** | 无 README 或 README < 100 行且内容稀疏 | 按完整模板全新生成 | 全新生成 | 7 章 |
| **Update** | README 已存在且信息丰富（> 200 行，含 ≥3 项核心内容） | **保留原有结构和风格**，仅追加 AI-KNOWLEDGE.md / docs/ 的导航链接和缺失的标准区块 | 全新生成 | 5 章（跳过 README 前两章的详细确认，改为整体预览） |
| **Resync** | 用户明确选择"只更新 AI 索引和文档，不动 README" | 完全不动 | 全新生成或增量补全 | 4 章 |

默认推荐策略：
- 若 README 丰富 → 默认 **Update**
- 若 README 缺失或简陋 → 默认 **Create**
- **Resync** 只在独立触发 `/knowledge:init` 时作为可选策略提供

---

### Phase 2: 骨架生成（内存中）

生成 5 个文件的 Markdown 初稿，遵循固定模板：

```
project-root/
├── README.md
├── AI-KNOWLEDGE.md
└── docs/
    ├── business-domain.md
    ├── infrastructure.md
    └── operations.md
```

**模板填充规则**：
- `README.md`: 项目名、技术栈徽章、Quick Start、文档导航表
- `AI-KNOWLEDGE.md`: YAML frontmatter + 快速导航 + 代码位置索引 + 数据模型 + 常见问题 + PR 检查清单
- `docs/business-domain.md`: 项目概述、类型系统、架构设计、关键业务逻辑、数据模型、开发指南、示例
- `docs/infrastructure.md`: 中间件配置、监控告警、部署环境、smart-common 组件、测试规范、日志规范、版本升级、安全规范
- `docs/operations.md`: 常用命令、注意事项、三方服务交互、定时任务、开发规范补充、错误码、FAQ

#### AUTO / MANUAL 标注机制

为降低用户对生成内容的信任成本，模板内部使用 HTML 注释标注内容来源：

```markdown
<!-- AUTO: 以下内容由 AI 从 application.yml 自动生成 -->
### 1.1 Dubbo 配置
dubbo.group: znkf_dubbo
...

<!-- MANUAL: 以下内容需人工补充，模板仅提供引导 -->
### 1.5 监控与告警
（请补充 Zipkin、Sentinel、LogPolice 配置）
```

标注规范：
- `<!-- AUTO -->`：基于代码/配置扫描生成，可信度高，用户可快速确认
- `<!-- MANUAL -->`：无法从代码扫描获取，必须人工填充，AI 提供引导问题
- `<!-- HYBRID -->`：部分可扫描（如类名），部分需人工补充（如架构决策理由）

用户确认时，AI 优先高亮 MANUAL 区块，减少无效阅读时间。

### Phase 3: 逐章确认

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
第 1/5 章：README.md 增量变更预览 — 导航链接与新增区块
第 2/5 章：AI-KNOWLEDGE.md — 元数据与代码索引
第 3/5 章：docs/business-domain.md — 业务类型与状态机
第 4/5 章：docs/infrastructure.md — 中间件与组件库
第 5/5 章：docs/operations.md + 整体确认与写入
```

**Resync 策略（4 章）**：
```
第 1/4 章：AI-KNOWLEDGE.md — 元数据与代码索引
第 2/4 章：docs/business-domain.md
第 3/4 章：docs/infrastructure.md
第 4/4 章：docs/operations.md + 整体确认与写入
```

每章提供：
- **预览**（Markdown 折叠或摘要）
- **选项**：`[确认] [编辑] [跳过]`
- 选择编辑时，进入 inline 修改模式

### Phase 4: 原子写入

全部确认后执行：

```bash
# 1. 备份旧文件（若存在）
cp README.md README.md.bak.$(date +%s)
cp AI-KNOWLEDGE.md AI-KNOWLEDGE.md.bak.$(date +%s)
mkdir -p docs/

# 2. 写入新文件
# （由 AI 直接写入）

# 3. 输出变更清单
echo "✅ 知识库初始化完成"
echo "   README.md          ← 人类入口"
echo "   AI-KNOWLEDGE.md    ← AI 索引"
echo "   docs/business-domain.md"
echo "   docs/infrastructure.md"
echo "   docs/operations.md"
```

---

## 3. /knowledge:check 设计

**触发**：手动运行 `/knowledge:check`

**检查逻辑**：

1. **代码变更检测**
   ```bash
   git diff --name-only --since="$(stat -c %Y AI-KNOWLEDGE.md)"
   ```

2. **缺失项匹配（按优先级）**

   **P0 — 必须同步（架构/业务变更）**

   | 扫描规则 | 若发现 | 建议动作 | 目标文档 |
   |----------|--------|----------|----------|
   | 新增独立包结构 | 如 `bargain/` 目录下有 >3 个 Java 文件 | 生成模块摘要，建议补充 | `business-domain.md` |
   | 枚举类新增 5+ 个值 | `TaskSecondTypeEnum` / `AssignmentStatusEnum` diff | 同步类型系统表格 | `business-domain.md` |
   | 新增核心大文件 | 新增 >1000 行的 Business/Service 类 | 补充代码位置索引与职责说明 | `AI-KNOWLEDGE.md` + `business-domain.md` |

   **P1 — 强烈建议同步（接口/配置变更）**

   | 扫描规则 | 若发现 | 建议动作 | 目标文档 |
   |----------|--------|----------|----------|
   | 新增 `@Attribute(alias = "...etcd...")` | ETCD 配置项新增 ≥1 个 | 补充配置清单 | `infrastructure.md` |
   | 新增 `thirdpart/*.java` | 新外部服务接口 | 补充接口列表与调用说明 | `operations.md` |
   | 新增 `@KafkaListener` | 新 Kafka 消费者 | 补充消费者列表与 Topic 映射 | `business-domain.md` |
   | 新增 `@Scheduled` / `ElasticJob` | 新定时任务 | 补充 cron 与调度说明 | `operations.md` |

   **P2 — 可选同步（环境/细节变更）**

   | 扫描规则 | 若发现 | 建议动作 | 目标文档 |
   |----------|--------|----------|----------|
   | `application.yml` 新增中间件配置项 | 如新增 Redis 集群节点 | 同步配置速查 | `infrastructure.md` |
   | `pom.xml` 依赖版本升级 | 如 Dubbo 2.7 → 3.x | 同步依赖版本表 | `AI-KNOWLEDGE.md` |
   | 新增 `docs/data/*.json` | 动态配置数据更新 | 说明配置型任务变更 | `business-domain.md` |

3. **输出报告**
   ```markdown
   # 知识库一致性检查报告

   ## 发现 3 处可能需要同步的变更

   1. **新增 bargain 模块**
      - 发现文件：`bargain/business/BargainBusiness.java`
      - 建议：在 `docs/business-domain.md` 中补充议价业务说明

   2. **新增 ETCD 配置**
      - 发现配置：`/znkf/atomic-task/bargain/send_rpa_info`
      - 建议：在 `docs/infrastructure.md` 4.9 节补充配置项

   3. **新增任务类型**
      - `TaskSecondTypeEnum` 新增 2 个枚举值
      - 建议：同步 `docs/business-domain.md` 2.2 节
   ```

---

## 4. 模板规范

### README.md 模板

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

### 2. 本地运行
```bash
cd {module-name}
mvn spring-boot:run
```

## 文档导航

| 读者角色 | 推荐阅读 |
|----------|----------|
| 新同学入职 | [docs/business-domain.md](...) |
| 开发新功能 | [docs/business-domain.md](...) + [docs/infrastructure.md](...) |
| 排查线上问题 | [docs/operations.md](...) |
| AI Agent 开发 | [AI-KNOWLEDGE.md](...) |
```

### AI-KNOWLEDGE.md 模板

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
...
```

### 团队规范预置包（infrastructure.md 专用）

由于 `infrastructure.md` 中有大量无法从代码扫描获取的团队通用规范（测试、日志、安全、升级指南等），技能提供以下 fallback 策略：

**策略 1：项目已有规范文档**
若扫描发现项目存在以下任一文档，提取摘要并合并到 `infrastructure.md`：
- `docs/guides/development-spec.md` → 合并到"开发规范/测试规范"
- `docs/guides/ai-guardrails.md` → 合并到"安全规范/AI 约束"
- `docs/guides/code-review-checklist.md` → 合并到"代码审查规范"
- `CLAUDE.md` → 提取"架构概述、中间件、关键枚举"等摘要

**策略 2：使用 skill 内置 Java 团队规范模板**
若项目没有 `docs/guides/` 目录，则使用 skill 内置的轻量模板预填充以下内容（标记为 `<!-- MANUAL -->`）：
- 单元测试规范（JUnit 5 / Mockito / 命名规范）
- 日志规范（级别使用、打印规范、MDC 链路追踪）
- 安全规范（敏感数据处理、SQL 注入防护）
- 版本升级检查清单框架

预填充内容仅提供骨架和引导问题，不编造项目不存在的具体配置。

---

## 5. 依赖与约束

- 依赖 `tech:init` 已完成技术栈检测（确保是 Java 项目）
- 依赖 AI 具备文件扫描和代码分析能力
- 不引入新的外部 CLI 工具或脚本（纯 AI skill 实现）
- 生成的内容优先基于代码事实，不编造未发现的配置或服务

---

## 6. 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| 扫描遗漏 | 知识库缺失关键模块 | 用户确认环节提供补录入口 |
| 模板僵化 | 不适合某些特殊项目 | 每章允许编辑，不强制填充 |
| 文件覆盖 | 已有文档被覆盖 | **禁止直接覆盖已有优质 README**，必须通过 Update 策略增量更新；所有写入前强制备份旧文件 |
| 用户不耐烦 | 7 章确认流程太长 | 提供"全部确认"快捷选项 |

