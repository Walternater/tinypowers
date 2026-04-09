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
