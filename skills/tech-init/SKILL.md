---
name: tech:init
description: 项目初始化技能。检测技术栈并生成项目入口文档和三层知识库（含 README.md、AI-KNOWLEDGE.md、docs/*.md）。
triggers: ["/tech:init"]
---

# /tech:init

项目初始化技能。检测技术栈并生成项目入口文档和三层知识库（含 README.md、AI-KNOWLEDGE.md、docs/*.md）。知识库初始化（knowledge:init）为固定子步骤，不可跳过。

---

## 触发条件

- 新项目首次使用 tinypowers
- 检测到项目根目录存在 `pom.xml` 或 `build.gradle`/`build.gradle.kts`
- 项目根目录不存在 `CLAUDE.md` 或 `docs/knowledge.md`

---

## 执行流程

### Step 1: 检测技术栈

调用 `scripts/detect-stack.sh` 检测项目技术栈。

```bash
./scripts/detect-stack.sh [项目路径]
```

**输出格式** (JSON):
```json
{
  "stack": "java",
  "buildTool": "maven",
  "detectedAt": "2024-01-15T08:30:00Z"
}
```

**错误处理**:
- 未检测到支持的构建工具时，脚本返回 exit code 1 并输出错误信息到 stderr
- 此时应提示用户确认项目类型或手动指定

---

### Step 2: 确认项目信息

基于技术栈检测结果，向用户确认以下信息：

| 字段 | 来源 | 示例 |
|------|------|------|
| PROJECT_NAME | 目录名或用户输入 | `order-service` |
| PROJECT_DESCRIPTION | 用户输入 | `订单微服务，处理订单生命周期` |
| BUILD_COMMAND | 根据 buildTool 推断 | `mvn clean package` 或 `./gradlew build` |
| TEST_COMMAND | 根据 buildTool 推断 | `mvn test` 或 `./gradlew test` |

---

### Step 3: 生成项目骨架

#### 3.1 生成 CLAUDE.md

使用 `templates/CLAUDE.md` 模板，渲染以下占位符：

- `{{PROJECT_NAME}}` - 项目名称
- `{{PROJECT_DESCRIPTION}}` - 项目描述
- `{{STACK}}` - 技术栈 (java)
- `{{BUILD_TOOL}}` - 构建工具 (maven/gradle)
- `{{BUILD_COMMAND}}` - 构建命令
- `{{TEST_COMMAND}}` - 测试命令

**输出位置**: 项目根目录 `CLAUDE.md`

#### 3.2 生成 knowledge.md

使用 `templates/knowledge.md` 模板，直接复制到项目目录。

**输出位置**: `docs/knowledge.md` (如 docs 目录不存在则自动创建)

---

### Step 4: 知识库初始化 (knowledge:init)

> 知识库初始化是 tech:init 的固定子步骤，不可跳过。通过半自动交互（逐章确认）保证内容质量。

#### 4.1 代码扫描

扫描代码库，收集以下信息：

| 扫描项 | 方法 | 用途 |
|--------|------|------|
| 技术栈 | `pom.xml` / `build.gradle` 依赖解析 | README 徽章、AI-KNOWLEDGE 元数据 |
| 模块结构 | `find . -path '*/src/main/java' -type d` | README 项目结构图 |
| 大文件/核心类 | 按行数排序 `.java` 文件 | AI-KNOWLEDGE 代码位置索引 |
| 枚举类 | `grep "enum .*Enum"` | business-domain.md 类型系统 |
| 中间件 | `grep -r "kafka\|redis\|dubbo\|etcd\|zookeeper\|redisson\|mybatis\|datasource"` | infrastructure.md 配置 |
| 外部服务 | `thirdpart/` 包扫描 + `@Reference` / Dubbo 接口交叉匹配 | operations.md 三方交互 |
| Kafka Consumer | 全代码库搜索 `@KafkaListener` / `@ConsumeWithoutLog` | business-domain.md 消费者列表 |
| 定时任务 | `job/` 目录 + `@Scheduled` + `ElasticJob` 注解 | operations.md 定时任务 |
| 配置文件 | `application-*.yml` | infrastructure.md 环境配置 |
| 敏感信息过滤 | 自动跳过含 `password`、`secret`、`token`、`key` 等配置键 | 避免凭据写入文档 |

#### 4.2 初始化策略选择

评估维度：
- 文件是否存在、字数/行数是否 > 200 行
- 是否包含项目简介、技术栈、快速开始、项目结构中的 ≥3 项

| 策略 | 触发条件 | README 处理方式 |
|------|----------|----------------|
| **Create** | 无 README 或 README < 100 行且内容稀疏 | 全新生成 5 个文件 |
| **Update** | README 已存在且信息丰富（> 200 行，含 ≥3 项核心内容） | 保留原有结构，仅追加导航链接 |
| **Resync** | 用户明确选择 | 只生成 AI-KNOWLEDGE.md + docs/，不动 README |

**边界处理（100–200 行灰色地带）**：README 行数在 100–200 之间时，AI 应判断内容质量：
- 若含 ≥3 项核心内容（项目简介、技术栈、快速开始、项目结构之一），按 **Update** 策略处理
- 否则（内容稀疏或大量占位符），按 **Create** 策略处理，并提示用户确认是否覆盖

#### 4.3 生成三层知识库

生成 5 个文件的 Markdown 初稿：

```
project-root/
├── README.md              # 人类入口：项目简介、技术栈、Quick Start、文档导航
├── AI-KNOWLEDGE.md        # AI 索引：代码位置、依赖版本、快速导航、PR 检查清单
└── docs/
    ├── business-domain.md # 业务领域：枚举、架构、数据模型、关键逻辑
    ├── infrastructure.md  # 基础设施：中间件、监控、部署、测试/日志/安全规范
    └── operations.md      # 运维实操：命令、三方交互、定时任务、FAQ
```

**AUTO / MANUAL 标注机制**：模板内部使用 HTML 注释标注内容来源，用户确认时 AI 优先高亮 MANUAL 区块。

#### 4.4 逐章确认

确认章节数根据初始化策略动态调整（Create 策略 7 章、Update 策略 5 章、Resync 策略 4 章）。每章提供预览 + 选项 `[确认] [编辑] [跳过]`。

#### 4.5 原子写入

```bash
# 1. 强制备份旧文件
mkdir -p .knowledge-backup/
cp README.md .knowledge-backup/README.md.bak.$(date +%s) 2>/dev/null || true
cp AI-KNOWLEDGE.md .knowledge-backup/AI-KNOWLEDGE.md.bak.$(date +%s) 2>/dev/null || true
cp docs/*.md .knowledge-backup/ 2>/dev/null || true

# 2. 原子写入
```

---

### Step 5: 输出完成

输出初始化结果摘要：

```
✅ 项目初始化完成

技术栈: Java (Maven)
生成文件:
  - CLAUDE.md (项目入口文档)
  - README.md (人类入口)
  - AI-KNOWLEDGE.md (AI 索引)
  - docs/business-domain.md (业务领域)
  - docs/infrastructure.md (基础设施)
  - docs/operations.md (运维实操)

下一步:
  1. 查看 README.md 了解项目
  2. 查看 AI-KNOWLEDGE.md 了解代码结构
  3. 使用 /tech:feature 开始功能规划
  4. 使用 /knowledge:check 保持知识库同步
```

---

## 与 superpowers 的边界

| 能力 | 归属 | 说明 |
|------|------|------|
| 技术栈检测 | tinypowers | 通过 detect-stack.sh 脚本实现 |
| 模板渲染 | tinypowers | 基于 mustache 风格占位符替换 |
| 项目结构分析 | superpowers | 复杂项目结构分析可委托 |

---

## 输出产物

| 文件 | 路径 | 用途 |
|------|------|------|
| CLAUDE.md | 项目根目录 | 项目入口文档，包含技术栈和技能入口 |
| README.md | 项目根目录 | 人类入口：项目简介、技术栈、Quick Start、文档导航 |
| AI-KNOWLEDGE.md | 项目根目录 | AI 索引：代码位置、依赖版本、快速导航、PR 检查清单 |
| docs/business-domain.md | docs/ | 业务领域：枚举、架构、数据模型、关键逻辑 |
| docs/infrastructure.md | docs/ | 基础设施：中间件、监控、部署、测试/日志/安全规范 |
| docs/operations.md | docs/ | 运维实操：命令、三方交互、定时任务、FAQ |

---

## 错误处理

| 场景 | 处理策略 |
|------|----------|
| 未检测到构建工具 | 提示用户手动选择技术栈 |
| 文件已存在 | 询问用户是否覆盖 |
| 目录无写入权限 | 报错并提示检查权限 |

---

## 示例

### Maven 项目初始化

```bash
$ cd /path/to/my-project
$ ls
pom.xml src/

$ /tech:init
检测到技术栈: Java (Maven)
请输入项目描述: 订单服务，处理订单生命周期管理
生成 CLAUDE.md... ✅
开始知识库初始化 (knowledge:init)...
  - 代码扫描完成: 38 个 Kafka Consumer、5 个 ElasticJob 定时任务、101 个外部接口
  - 检测到无 README，采用 Create 策略
  - 逐章确认中...
README.md      ✅
AI-KNOWLEDGE.md ✅
docs/business-domain.md ✅
docs/infrastructure.md ✅
docs/operations.md ✅

初始化完成！
```

### Gradle 项目初始化

```bash
$ cd /path/to/another-project
$ ls
build.gradle.kts src/

$ /tech:init
检测到技术栈: Java (Gradle)
请输入项目描述: 用户中心服务
生成 CLAUDE.md... ✅
开始知识库初始化 (knowledge:init)...
  - 检测到已有 README (477 行)，采用 Update 策略
  - 逐章确认中...
AI-KNOWLEDGE.md ✅
docs/business-domain.md ✅
docs/infrastructure.md ✅
docs/operations.md ✅

初始化完成！
```
