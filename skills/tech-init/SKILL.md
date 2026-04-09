<<<<<<< HEAD
---
name: tech:init
description: 当用户在全新项目中首次使用、或要求重新初始化 AI 开发环境时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "5.5"
---

# /tech:init

## 作用

`/tech:init` 用于把 tinypowers 的基础工作流骨架落到目标项目中。当前只支持 Java 项目初始化。

## 初始化目标

执行完成后，目标项目至少应具备：
- `CLAUDE.md`
- `README.md`（已有则更新，无则补最小项目说明）
- `docs/guides/development-spec.md`
- `docs/guides/workflow-guide.md`
- `docs/knowledge.md`（应沉淀 README 和当前工程里的关键选型）
- `configs/rules/common/`
- `configs/rules/java/`
- `features/`
- `.claude/settings.json`
- `.claude/hooks/`

## 核心原则

- Java-only，避免给非 Java 项目生成误导性 guides 和规则
- 小项目知识库默认 lazy mode：创建模板即可，不强制做重扫描
- 初始化动作尽量脚本化，AI 负责检测、确认和验证
- README 和知识库要服务后续开发，不只是留空模板
- 第一次 init 且 README / `docs/knowledge.md` 仍接近空白时，优先用 `brainstorming` 完整梳理项目职责、关键链路和关键选型，再回填文档

## 主流程

```text
0. 预检（框架仓库 / 非 Java / 已初始化）
0.5. 版本检查（远端 vs 本地）
1. 技术栈检测
2. 检测结果确认
3. 选择更新策略
4. 运行 init-project.js 落地骨架（含内置验证）
5. README 同步与知识沉淀
```

## 0. 预检

以下情况直接停止或降级：
- 检测到 tinypowers 框架仓库自身
- 检测到 Node.js / Go / Python / Rust 等非 Java 项目
- 用户只想查看检测结果，不想真正写入项目

## 0.5. 版本检查

**定位 tinypowers 安装目录：**

```bash
detect_tinypowers_root() {
    # 1. 优先读取安装标记文件（最快）
    if [ -f "$HOME/.config/tinypowers/path" ]; then
        local dir
        dir=$(cat "$HOME/.config/tinypowers/path" 2>/dev/null)
        if [ -n "$dir" ] && [ -f "$dir/scripts/check-version.js" ]; then
            echo "$dir"
            return 0
        fi
    fi

    # 2. 检查常见候选路径
    local candidates=(
        "$HOME/.claude/skills/tinypowers"
        "$HOME/tinypowers"
        "$HOME/.npm-global/lib/node_modules/tinypowers"
        "/usr/local/lib/node_modules/tinypowers"
        "/usr/local/share/tinypowers"
        "/opt/tinypowers"
    )
    for dir in "${candidates[@]}"; do
        if [ -f "$dir/scripts/check-version.js" ]; then
            echo "$dir"
            return 0
        fi
    done

    # 3. 限制深度的 find 作为兜底
    local found
    found=$(find ~ -maxdepth 4 -name "check-version.js" -path "*/tinypowers/scripts/*" 2>/dev/null | head -1)
    if [ -n "$found" ]; then
        dirname "$(dirname "$found")"
        return 0
    fi

    return 1
}

TINYPOWERS_DIR=$(detect_tinypowers_root)
```

**检测失败处理：**

如果以上两种方法都找不到 tinypowers 安装目录：
- 停止初始化流程
- 提示用户手动指定安装路径或确认安装方式

**版本检测：**

```bash
node "$TINYPOWERS_DIR/scripts/check-version.js"
```

**输出处理**：
- 如果 `behind: true`：提示用户版本落后，询问是否升级
- 如果 `upToDate: true` 或 `error` 非空：继续流程

**版本落后时的用户交互**：
```
⚠️ 检测到 tinypowers 版本落后
  本地版本：v1.2.3
  远端版本：v1.5.0

  [升级到 v1.5.0] [跳过，继续当前版本] [取消初始化]
```

- 用户选择升级：执行 `git pull` 或提示用户手动更新
- 用户选择跳过：继续当前流程
- 用户选择取消：停止初始化

**版本一致或本地更新时**：静默通过，不打断流程。

## 1. 技术栈检测

当前只接受这些强信号：
- `pom.xml` -> Java (Maven)
- `build.gradle` / `build.gradle.kts` -> Java (Gradle)
- `src/main/java` -> Java 辅助信号

框架特征用于补充规则建议：
- `org.springframework.*` -> Spring Boot
- MyBatis 依赖 -> MyBatis
- `mysql` / `flyway` / `liquibase` -> 同时加载 MySQL 规则

默认值：
- Maven 构建命令：`mvn test`
- Gradle 构建命令：`./gradlew check`
- 默认分支模式：`feature/{id}-{short-desc}`

## 2. 检测结果确认

至少向用户确认：
- 主技术栈
- 构建工具和默认构建命令
- 推荐规则集
- 是否需要 MySQL 规则

## 3. 更新策略

支持三种策略：
- `Update`：只补缺失内容
- `Skip`：不改动
- `Overwrite`：重建入口和本地配置

默认推荐 `Update`。

## 4. 运行 init-project.js

真正落地动作由脚本完成，脚本执行完毕后会**自动运行内置验证**，无需额外调用其他脚本：

```bash
node "$TINYPOWERS_DIR/scripts/init-project.js" \
  --root . \
  --project-name {project_name} \
  --tech-stack "Java (Maven)" \
  --tech-stack-short java \
  --build-tool Maven \
  --build-command "mvn test" \
  --include-mysql
```

脚本负责：
- 创建目录
- 复制 guides
- 复制规则
- 复制 hooks
- 渲染 `CLAUDE.md`
- 渲染 `.claude/settings.json`
- **验证初始化完整性**（内置，退出码非 0 即失败）

`.claude` 细节和 merge 规则保留在：
- `claude-init.md`

## 5. 知识扫描 / lazy mode

初始化后要补两类项目上下文：

### 5.1 README 同步

至少检查或补齐：
- 项目做什么
- 如何启动 / 构建 / 验证
- 核心模块或目录
- 对外接口或调用入口

如果 README 已存在：
- 优先更新过期内容，不重写项目已有风格

如果 README 缺失或信息明显不足：
- 补一个最小可用 README
- 至少让接手者知道“项目职责、启动方式、主要模块、对外依赖”
- 如果这是项目第一次 init，且现有信息分散在代码、配置和口头背景里，优先用 `brainstorming` 把项目说明梳理完整，再写入 README

### 5.2 `docs/knowledge.md` 沉淀

基于 `README.md` 和当前工程实际内容，优先沉淀这些最关键的信息：
- 当前项目用了哪些中间件
- RPC / 消息 / 外部系统交互选型
- 关键链路或系统边界
- 平台级约束、隐蔽坑位、默认约定

推荐策略：
- 第一次 init：先用 `brainstorming` 汇总 README、代码结构、配置和工程背景，再整理到 `docs/knowledge.md`
- 后续 update：只增量修正过期内容，不重复做完整梳理

**brainstorming 执行确认**（第一次 init 时必须显式确认，不可静默跳过）：

```
brainstorming 执行检查
----------------------
□ 已读取 README.md（如存在）
□ 已采样 src/ 下 1-2 个同域 Controller 及至少 1 个 Service / config Java 文件
  （目标是 .java 源文件，而非 YAML / properties 等配置文件）
□ 已检查 application.yml / application.properties 中的数据源、中间件配置
□ 已将上述内容中的项目特有信息整理到 docs/knowledge.md
```

仅当以上 4 项全部完成，才视为 brainstorming 步骤已执行。未完成时不得跳到 5.3 验收。

只记录模型无法从公开资料获取或无法仅靠通用经验可靠推断的内容。

采样即可，不做全量扫描。以下情况默认 lazy mode：
- 空项目
- 只有构建文件，没有实现代码
- 采样文件不足 2 个

lazy mode 下也应至少：
- 检查 README 是否需要补最小项目说明
- 在 `docs/knowledge.md` 中保留项目关键选型骨架，而不是只留空白模板

### 5.3 knowledge.md 完成验收

init 最后一步：确认 `docs/knowledge.md` 有实质内容，而不是空壳模板。

**验收标准**（满足全部方可视为 init 完成）：
- 至少包含 3-4 个实质性段落（每段有具体内容，而非空占位或单行标题）
- 至少覆盖以下 4 个方面：
  - 技术栈（Spring Boot 版本、构建工具、数据库）
  - 中间件（缓存、MQ、RPC 等，无则注明"无"）
  - 关键约定或坑位（特殊注解用法、数据源切换、分层规范等）
  - 项目边界（对外接口入口、依赖的外部系统）

**不满足时**：继续补充，直到满足为止。这是 init 阶段唯一强制的质量门。

## 配套文档

| 文档 | 作用 |
|------|------|
| `claude-init.md` | `.claude/` 初始化和 merge 规则 |
| `scripts/init-project.js` | 初始化自动化脚本（含内置完整性验证） |

## Gotchas

- 空项目不要强做知识扫描，成本高于收益
- 非 Java 项目不要继续初始化，否则会得到不匹配的入口文档
- 已存在的 `.claude/settings.json` 不应盲目覆盖，应先走更新策略
- `scripts/validate.js` 是 tinypowers 框架自身的组件校验器，**不适合**在目标项目初始化流程中调用
- `docs/knowledge.md` 内容空白 ≠ init 完成；只有通过 5.3 验收标准才算真正完成
=======
# /tech:init

项目初始化技能。检测技术栈并生成项目入口文档和领域知识骨架。

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

### Step 4: 输出完成

输出初始化结果摘要：

```
✅ 项目初始化完成

技术栈: Java (Maven)
生成文件:
  - CLAUDE.md (项目入口文档)
  - docs/knowledge.md (领域知识骨架)

下一步:
  1. 查看 CLAUDE.md 了解项目约定
  2. 使用 /tech:feature 开始功能规划
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
| knowledge.md | docs/knowledge.md | 领域知识沉淀文档骨架 |

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
生成 docs/knowledge.md... ✅

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
生成 docs/knowledge.md... ✅

初始化完成！
```
>>>>>>> 8eee60a (feat(skills): create tech-init and tech-feature SKILL.md for Wave 3)
