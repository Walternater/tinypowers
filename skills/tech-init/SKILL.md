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
- `docs/guides/development-spec.md`
- `docs/guides/workflow-guide.md`
- `docs/knowledge.md`（小项目可只放空模板）
- `configs/rules/common/`
- `configs/rules/java/`
- `features/`
- `.claude/settings.json`
- `.claude/hooks/`

## 核心原则

- Java-only，避免给非 Java 项目生成误导性 guides 和规则
- 小项目知识库默认 lazy mode：创建模板即可，不强制做重扫描
- 初始化动作尽量脚本化，AI 负责检测、确认和验证

## 主流程

```text
0. 预检（框架仓库 / 非 Java / 已初始化）
1. 技术栈检测
2. 检测结果确认
3. 选择更新策略
4. 运行 init-project.js 落地骨架（含内置验证）
5. 可选知识扫描 / lazy mode
```

## 0. 预检

以下情况直接停止或降级：
- 检测到 tinypowers 框架仓库自身
- 检测到 Node.js / Go / Python / Rust 等非 Java 项目
- 用户只想查看检测结果，不想真正写入项目

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
node "${TINYPOWERS_DIR}/scripts/init-project.js" \
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

只记录模型无法从公开资料获取的内容：
- 内部依赖的特殊用法
- 平台级约束
- 隐蔽坑位

采样即可，不做全量扫描。以下情况默认 lazy mode：
- 空项目
- 只有构建文件，没有实现代码
- 采样文件不足 2 个

lazy mode 下只创建 `docs/knowledge.md` 模板，不做实际扫描。

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
