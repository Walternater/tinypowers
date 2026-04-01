# claude-init.md

## 作用

定义 `/tech:init` 在 Step 4d 中如何初始化目标项目的 `.claude/` 目录。

## 初始化内容

### Hooks 安装

从 tinypowers 安装目录的 `hooks/` 复制到目标项目 `.claude/hooks/`。

必装 hooks：

| Hook | 触发时机 | 作用 |
|------|---------|------|
| spec-state-guard.js | PreToolUse (Edit/Write/Bash) | SPEC-STATE 阶段门禁 |
| gsd-context-monitor.js | PostToolUse (Bash/Edit/Write/Agent/Task) | 上下文监控 |
| config-protection.js | PostToolUse (Edit/Write/MultiEdit) | 配置文件保护 |
| gsd-code-checker.js | PostToolUse (Bash/Edit/Write/MultiEdit) | 代码规范检查 |

> **注意**：`gsd-session-manager.js` 处理 SessionStart / Stop / PreCompact 生命周期事件，通过 Claude Code 的 lifecycle script 机制运行，不通过 settings.json hooks 配置。init 时复制到 `.claude/hooks/` 但不写入 settings.json。

### settings.json 生成

使用 `configs/templates/settings.json` 作为模板生成 `.claude/settings.json`。

变量替换：
- `{{hooks_dir}}` → `.claude/hooks`（相对路径）

### CLAUDE.md 模板变量替换

Step 4b 生成 CLAUDE.md 时，按以下规则替换模板变量：

| 变量 | 来源 | 回退值 |
|------|------|--------|
| `{{project_name}}` | 当前目录名 | 目录名 |
| `{{ProjectName}}` | project_name 首字母大写 + 驼峰 | 同回退 |
| `{{tech_stack}}` | Step 1 检测结果 | `Java (Maven)` |
| `{{tech_stack_short}}` | 技术栈简称 | `java` |
| `{{build_tool}}` | Step 1 检测结果 | `Maven` |
| `{{build_command}}` | Step 1 检测结果 | `mvn test` |
| `{{service_port}}` | Step 1 检测结果 | `8080` |
| `{{branch_pattern}}` | 硬编码默认值 | `feature/{id}-{short-desc}` |
| `{{author}}` | `git config user.name` | `Developer` |
| `{{date}}` | 当前日期 `YYYY-MM-DD` | 执行日期 |

#### Merge 策略

已存在 `.claude/settings.json` 时：
- **permissions.allow**：追加缺失项，保留已有
- **permissions.deny**：追加缺失项，保留已有
- **hooks**：追加缺失的 hook entry，保留已有
- **其他顶层字段**：保留用户值，只补充缺失字段

merge 后展示合并结果供用户确认。

### 目录结构

初始化完成后 `.claude/` 应包含：

```text
.claude/
├── settings.json
└── hooks/
    ├── spec-state-guard.js
    ├── gsd-context-monitor.js
    ├── config-protection.js
    ├── gsd-code-checker.js
    └── gsd-session-manager.js (lifecycle, 不在 settings.json hooks 中)
```

## 失败处理

| 失败场景 | 处理方式 |
|----------|---------|
| tinypowers 安装目录找不到 | 提示用户运行 install.sh 或手动指定路径 |
| Hook 文件复制失败 | 报告失败文件，继续其他初始化 |
| settings.json 解析失败 | 使用 Overwrite 策略重新生成 |
