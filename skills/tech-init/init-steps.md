# init-steps.md

## 作用

本文档说明 `/tech:init` 在目录创建、模板复制和变量替换时的默认做法。

它回答的是“初始化到底会落什么文件、怎么落”。

## 框架自举检测

如果检测到当前项目是 tinypowers 框架自身（见 SKILL.md Step 0），以下行为必须调整：

| 正常项目行为 | 框架仓库行为 |
|-------------|-------------|
| 创建 `.claude/agents/` | 跳过，Agent 定义在 `agents/` |
| 创建 `docs/templates/` | 跳过，模板在 `configs/templates/` |
| 创建 `docs/guides/code-review-checklist.md` | 跳过，已在 `configs/rules/common/` |
| 创建通用 Agent 定义文件 | 跳过，框架有完整的 `agents/` 目录 |
| 复制规则文件到项目 | 跳过，规则已在 `configs/rules/` |

框架仓库只需确认目录完整性和模板变量替换，不应创建重复文件。

## 项目级配置覆盖

如果目标项目根目录存在 `project-overrides.json`，用它覆盖默认行为。

`project-overrides.json` 格式示例：

```json
{
  "review_checklist": "docs/my-review-checklist.md",
  "acceptance_criteria_template": "EARS_RELAXED",
  "commit_prefix": "[TEAM-A]",
  "quality_gate_command": "mvn verify -P ci",
  "skip_phases": ["REQ"]
}
```

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

检测流程：

1. 检查项目根目录是否存在 `project-overrides.json`
2. 存在时解析并验证字段合法性
3. 用覆盖值替换默认模板路径和配置
4. 不存在时使用默认行为

在 SKILL.md Step 6（模板复制与变量替换）中，如果检测到覆盖配置，优先使用覆盖路径。

## 目录创建

推荐创建这些目录（框架仓库跳过已有目录）：

```text
docs/
docs/guides/
configs/
configs/rules/
configs/templates/
features/
.claude/
```

## 模板与内容来源

| 来源 | 目标 | 说明 |
|------|------|------|
| `configs/templates/CLAUDE.md` | `CLAUDE.md` | 项目入口文件 |
| `docs/guides/*.md` | `docs/guides/` | 指南文档 |
| `configs/rules/common-*` | `configs/rules/` | 通用规则 |
| `configs/rules/{{tech_stack}}/*` | `configs/rules/` | 技术栈规则 |

说明：
- `configs/templates/` 本身属于框架资源，不必在目标项目里原样复制整个目录，除非你明确希望把模板也带过去。
- 真正对目标项目立即有价值的，是入口、guides 和 rules。

## 文件复制原则

默认原则：
- 目标不存在时创建
- 已存在时优先保留用户内容
- 变量未替换时做替换
- 有明显差异时不盲目覆盖

简化逻辑：

```python
def copy_template(src, dest):
    if file_exists(dest):
        return "SKIP_OR_UPDATE"
    content = read_file(src)
    content = replace_variables(content)
    write_file(dest, content)
    return "COPIED"
```

## 模板变量

常见变量：

| 变量 | 含义 |
|------|------|
| `{{project_name}}` | 当前项目目录名 |
| `{{ProjectName}}` | 首字母大写名称 |
| `{{PROJECT_NAME}}` | 全大写下划线形式 |
| `{{tech_stack}}` | 技术栈描述 |
| `{{tech_stack_short}}` | 技术栈简称 |
| `{{build_tool}}` | 构建工具 |
| `{{build_command}}` | 默认构建命令 |
| `{{service_port}}` | 默认服务端口 |
| `{{branch_pattern}}` | 默认分支命名模式 |
| `{{date}}` | 当前日期 |
| `{{datetime}}` | 当前日期时间 |
| `{{author}}` | Git 用户名 |
| `{{year}}` | 当前年份 |

## 变量替换来源

变量一般来自：
- 当前工作目录
- 技术栈检测结果
- `git config user.name`
- 当前系统时间

## 文件权限

建议至少保证这些可读：

```bash
chmod 644 CLAUDE.md
chmod 644 docs/guides/*.md
chmod 644 configs/rules/*.md
chmod 755 features/
```

## `.gitignore` 建议

如果项目已有 `.gitignore`，通常建议至少忽略：

```text
# AI Development Framework
.claude/
docs/plans/
```

注意：
- 不要默认忽略整个 `features/`
- `features/{id}-{name}/STATE.md` 和需求产物通常需要被版本控制追踪

## Git 初始化

如果目标项目还不是 Git 仓库：

1. 先确认是否需要初始化
2. 需要时执行 `git init`
3. 视团队约定创建默认分支

## 常见错误处理

| 问题 | 建议处理 |
|------|---------|
| 目录创建失败 | 记录失败项并继续检查其他项 |
| 模板复制失败 | 跳过该文件并在结果里提示 |
| 变量替换失败 | 保留原变量并发出警告 |
| 权限不足 | 提示用户手动处理权限 |
