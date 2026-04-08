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
TINYPOWERS_DIR=""
for dir in "$HOME/.claude/skills/tinypowers" "$HOME/tinypowers" "$HOME/.npm-global/lib/node_modules/tinypowers" "/usr/local/share/tinypowers"; do
    if [ -f "$dir/scripts/check-version.js" ]; then
        TINYPOWERS_DIR="$dir"
        break
    fi
done

# 兜底：全局搜索
if [ -z "$TINYPOWERS_DIR" ]; then
    TINYPOWERS_DIR=$(find ~ -name "check-version.js" -path "*/tinypowers/scripts/*" 2>/dev/null | head -1 | xargs -I {} dirname {} | xargs -I {} dirname {})
fi
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

只记录模型无法从公开资料获取或无法仅靠通用经验可靠推断的内容。

采样即可，不做全量扫描。以下情况默认 lazy mode：
- 空项目
- 只有构建文件，没有实现代码
- 采样文件不足 2 个

lazy mode 下也应至少：
- 检查 README 是否需要补最小项目说明
- 在 `docs/knowledge.md` 中保留项目关键选型骨架，而不是只留空白模板

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
