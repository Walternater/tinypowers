# claude-init.md

## 作用

这份文档定义 `/tech:init` 在目标项目中如何初始化 `.claude/` 目录。

目标不是生成一个庞大的配置中心，而是让项目在初始化后立刻具备可工作的 hooks、settings 和最小安全边界。

## 产出目标

初始化完成后，目标项目至少应具备：

- `.claude/hooks/`
- `.claude/settings.json`

其中：
- `.claude/hooks/` 负责运行期守护
- `.claude/settings.json` 负责把 hooks、权限和工具配置接起来

## Hook 安装

默认复制这些 hook 到目标项目 `.claude/hooks/`：

| 文件 | 用途 | 必需 |
|------|------|------|
| `spec-state-guard.js` | 阻止越阶段直接写代码 | 是 |
| `gsd-context-monitor.js` | 提醒上下文压缩 | 是 |
| `config-protection.js` | 保护 lint / CI / `.claude/` 配置 | 是 |
| `gsd-code-checker.js` | 提醒验证命令并检查残留调试代码 | 是 |
| `gsd-session-manager.js` | SessionStart / PreCompact / Stop 生命周期管理 | 是 |

来源目录约定：

- 仓库模式：直接从 `hooks/` 复制
- 安装模式：从 tinypowers 安装目录下的 `hooks/` 复制

如果找不到 hooks 源目录，不应继续生成 `settings.json`，而应明确提示用户先确认 tinypowers 安装路径。

## settings.json 模板

默认使用 `configs/templates/settings.json` 作为 `.claude/settings.json` 模板。

模板变量：

| 变量 | 含义 |
|------|------|
| `{{hooks_dir}}` | 目标项目中的 hooks 目录，默认 `.claude/hooks` |

生成后的 hook 命令示例：

```json
{
  "type": "command",
  "command": "node \".claude/hooks/spec-state-guard.js\"",
  "timeout": 5
}
```

## 已存在 settings.json 时的合并规则

如果目标项目已经有 `.claude/settings.json`，默认执行 merge，而不是覆盖。

合并原则：

1. 保留已有 `permissions`
2. 保留已有 `tools`
3. 保留已有 `model`、`statusLine` 等用户个性化配置
4. 只补缺失的 hooks
5. 如果同一事件下已存在完全相同的 hook command，则不重复追加

推荐的判重键：

```text
event + matcher + hook.command
```

如果 merge 后发现同一事件存在两条语义冲突的 hook，应保留用户已有配置，并在输出中提醒人工检查。

## 模板变量回退策略

`/tech:init` 替换模板变量时，使用下面的默认值，避免空项目卡住：

| 变量 | 首选来源 | 回退值 |
|------|----------|--------|
| `{{author}}` | `git config user.name` | `Developer` |
| `{{project_name}}` | 当前目录名 | `my-project` |
| `{{ProjectName}}` | `project_name` 转首字母大写 | `MyProject` |
| `{{date}}` | 当前日期 | 执行当天日期 |
| `{{tech_stack}}` | 技术栈检测结果 | `Java (Maven)` |
| `{{tech_stack_short}}` | 技术栈检测结果 | `java` |
| `{{build_tool}}` | 技术栈检测结果 | `Maven` |
| `{{build_command}}` | 技术栈检测结果 | `mvn test` |
| `{{service_port}}` | 技术栈检测结果 | `8080` |
| `{{branch_pattern}}` | 项目约定 | `feature/{id}-{short-desc}` |
| `{{hooks_dir}}` | `.claude/hooks` | `.claude/hooks` |

如果某个变量无法解析，也不应把原始 `{{...}}` 留在产出物中。

## 初始化后最小验收

至少确认：

- `.claude/hooks/spec-state-guard.js` 存在
- `.claude/hooks/gsd-session-manager.js` 存在
- `.claude/settings.json` 可解析
- `.claude/settings.json` 中包含 `spec-state-guard.js`
- `.claude/settings.json` 中包含 `gsd-context-monitor.js`
- `.claude/settings.json` 中包含 `config-protection.js`
- `.claude/settings.json` 中包含 `gsd-code-checker.js`

## 失败处理

| 失败类型 | 处理方式 |
|----------|----------|
| hooks 源目录不存在 | 停止初始化并提示确认 tinypowers 安装路径 |
| settings 模板不存在 | 停止初始化并提示修复安装 |
| settings 无法 merge | 回退为用户已有文件，不自动覆盖 |
| 模板变量缺失 | 使用回退值重新渲染 |
