# Hooks

本目录存放 tinypowers 的运行期守护脚本。

这些 hook 不负责业务实现，而是负责在执行过程中"扶正流程"：
- 防止危险命令和高风险读写
- 监控上下文压力
- 为会话恢复提供入口
- 防止为了过检查去改配置
- 检测残留调试代码

## 设计目标

hooks 解决的不是"怎么写代码"，而是"怎么不把流程写歪"。

它们主要防护这几类问题：
- 会话切换后忘了上次做到哪
- 上下文快满了却没有及时压缩
- 为了让检查通过去改 lint / tsconfig / hook 配置
- 在不适合的场景运行额外检查，拖慢体验

## Hook 模式

默认通过 `hooks-settings-template.json` 接线全部核心 hook。

`TINYPOWERS_HOOK_LEVEL` 现在只影响 `gsd-code-checker.js` 的提醒强度：

```bash
export TINYPOWERS_HOOK_LEVEL=standard
```

- `standard`：保留 Stop 残留代码检测，不主动频繁提醒验证命令
- `strict`：额外开启 PostToolUse 验证提醒

## 文件说明

| 文件 | 作用 |
|------|------|
| `spec-state-guard.js` | 基于 SPEC-STATE 阻止越阶段代码编辑 |
| `gsd-context-monitor.js` | 监控上下文占用，提醒 `/compact` |
| `gsd-session-manager.js` | SessionStart / Stop / PreCompact 生命周期管理 |
| `gsd-code-checker.js` | strict 模式验证提醒 + Stop 时残留代码检测 |
| `config-protection.js` | 保护 lint / formatter / hook / CI 等关键配置 |

## 核心行为

### 1. 上下文监控

`gsd-context-monitor.js` 在常见工具调用后运行：
- 当上下文余量下降时发出警告
- 在合适时机提醒压缩

它的作用不是强制中断，而是让执行更平稳。

### 2. 会话恢复

`gsd-session-manager.js` 负责三类事件：
- `SessionStart`
- `Stop`
- `PreCompact`

当前约定：
- `features/{id}-{name}/SPEC-STATE.md` 是恢复主数据源
- `/tmp/tinypowers-session-{session_id}.json` 是恢复入口快照
- `SPEC-STATE.md` 在 `EXEC` 阶段用 `current_wave` / `exec_progress` 追踪执行状态

恢复流程：

```
SessionStart
  -> 检测 /tmp 快照
  -> 提示是否恢复
  -> 用户确认后读取 features/{id}-{name}/SPEC-STATE.md
  -> 从断点继续
```

这意味着：
- Snapshot 只负责"提醒有未完成工作"
- `SPEC-STATE.md` 才负责"告诉你具体做到哪了"

### 3. 配置保护

`config-protection.js` 会在修改关键配置文件后发出提醒，目标是防止这种行为：
- 为了过 lint 改 `.eslintrc`
- 为了过类型检查改 `tsconfig.json`
- 为了绕过流程改 `.claude/` 或 `hooks/`

默认保护范围包括：
- lint / formatter 配置
- TypeScript 配置
- Java 构建与检查配置
- CI 工作流
- `.claude/`、`hooks/`、`.husky/`

### 4. Strict 验证提醒 + 残留代码检测

`gsd-code-checker.js` 负责两部分功能：

**PostToolUse 时（strict 模式）**：根据最近修改过的文件类型，提醒运行最匹配的验证命令，例如：
- Java 改动后提醒 `mvn test`
- JS / TS 改动后提醒 `npm test`
- SQL / migration 改动后提醒检查 DDL 与技术方案是否一致

**Stop 时（任意模式）**：检测残留调试代码（System.out/console.log 等），防止调试代码进入生产。

这样可以保留严格模式的约束感，又避免把所有开发场景都强绑到一套固定命令上。

## 如何接到目标项目

通常在目标项目的 `~/.claude/settings.json` 或项目级设置中挂接：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"{HOOKS_DIR}/spec-state-guard.js\"",
            "timeout": 5
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"{HOOKS_DIR}/gsd-session-manager.js\" SessionStart",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"{HOOKS_DIR}/gsd-session-manager.js\" Stop",
            "timeout": 5
          }
        ]
      },
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"{HOOKS_DIR}/gsd-code-checker.js\" Stop",
            "timeout": 10
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"{HOOKS_DIR}/gsd-session-manager.js\" PreCompact",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash|Edit|Write|MultiEdit|Agent|Task",
        "hooks": [
          {
            "type": "command",
            "command": "node \"{HOOKS_DIR}/gsd-context-monitor.js\"",
            "timeout": 10
          }
        ]
      },
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"{HOOKS_DIR}/config-protection.js\"",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Bash|Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"{HOOKS_DIR}/gsd-code-checker.js\"",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
```

## 配置方式

### 全局 shell

```bash
echo 'export TINYPOWERS_HOOK_LEVEL=strict' >> ~/.zshrc
```

## 维护建议

修改 hooks 时，优先遵守这些原则：
- 文档和实现必须同步
- 不要让 Snapshot 替代 `SPEC-STATE.md`
- 不要把"提醒型 hook"改成高频误报
- 不要把"配置保护"做成无法维护框架自身

特别注意：
- 如果改了上下文门槛，请同步检查用户提示文案
- 如果新增受保护文件类型，请确认不会误伤正常维护动作

## 相关文档

- [README.md](../README.md)
