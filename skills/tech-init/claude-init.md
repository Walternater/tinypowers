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

### settings.json 生成

使用 `configs/templates/settings.json` 作为模板生成 `.claude/settings.json`。

变量替换：
- `{{hooks_dir}}` → `.claude/hooks`（相对路径）

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
    └── gsd-code-checker.js
```

## 失败处理

| 失败场景 | 处理方式 |
|----------|---------|
| tinypowers 安装目录找不到 | 提示用户运行 install.sh 或手动指定路径 |
| Hook 文件复制失败 | 报告失败文件，继续其他初始化 |
| settings.json 解析失败 | 使用 Overwrite 策略重新生成 |
