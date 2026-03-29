# configs/ — 规则与模板目录

## 目录结构

```
configs/
├── rules/           # AI 判断准则（Rules）
├── templates/       # 输出文档结构（Templates）
└── schema.yaml     # 工作流 schema 定义
```

## Rules vs Templates 的职责分离

### Rules（`rules/`）

**作用：** 定义 AI 在生成内容时应该遵循的判断准则。

| 特征 | 说明 |
|------|------|
| **回答的问题** | AI 应该怎么思考、怎么判断 |
| **内容类型** | 编码风格约束、安全要求、测试策略、命名规范 |
| **应用时机** | AI 在实现、审查、验证的各个阶段都会参考 |
| **是否输出给用户** | 否，Rules 融入了 AI 的决策过程 |
| **示例** | "密码必须 BCrypt 加密"、"注入风险必须检查" |

### Templates（`templates/`）

**作用：** 定义 AI 输出文档的结构和格式。

| 特征 | 说明 |
|------|------|
| **回答的问题** | AI 输出长什么样子、包含哪些章节 |
| **内容类型** | PRD 格式、技术方案格式、任务拆解表格式 |
| **应用时机** | AI 生成对应类型文档时直接使用模板 |
| **是否输出给用户** | 是，用户会看到生成的文档 |
| **示例** | PRD 模板、EARS 验收标准格式、Review Log 模板 |

## 为什么要分离

- **独立演进**：Rules 可以收紧判断标准而不改变文档结构；Templates 可以改格式而不影响判断逻辑
- **可复用性**：同一套 Templates 可以搭配不同的 Rules 集（如 Java Rules + MySQL Rules）
- **维护清晰**：开发者只关心输出格式时只改 Templates；关注代码质量时只改 Rules

## 如何自定义

### 自定义 Rules

在 `rules/` 下按语言栈创建子目录：
- `rules/java/` — Java 技术栈的规则（扩展 common）
- `rules/mysql/` — MySQL DBA 规则（扩展 common）
- `rules/python/` — Python 技术栈的规则（预留）

### 自定义 Templates

在 `templates/` 下修改或新增模板文件：
- 模板使用 `{{variable}}` 占位符
- scaffold 时自动替换为实际值

### 自定义工作流 Schema

fork `schema.yaml` 为 `schema.custom.yaml`，修改 artifact 依赖关系和阶段推进规则。

## Glob 作用域规则

语言专属规则可以声明 `Glob:` 字段，限制规则只在编辑匹配文件时激活：

```yaml
---
Glob: **/*.java
---
```

有效激活示例：
- `Glob: **/*.java` — 所有 Java 文件
- `Glob: src/**/*.java` — src 下的 Java 文件
- `Glob: **/mapper/*.xml` — MyBatis mapper 文件
- `Glob: *.sql` — 根目录 SQL 文件

未声明 `Glob:` 的规则对所有文件生效（默认全局加载）。
