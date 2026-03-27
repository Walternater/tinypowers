# Hooks 目录

本目录包含 tinypowers 的 hooks 实现。

## Hook 级别控制

通过环境变量 `TINYPOWERS_HOOK_LEVEL` 控制启用级别：

```bash
export TINYPOWERS_HOOK_LEVEL=standard  # 默认
```

| 级别 | 说明 | 包含 |
|------|------|------|
| `minimal` | 安全拦截 | beforeToolUse 权限检查 |
| `standard` | 标准配置 | 安全 + 上下文监控（默认） |
| `strict` | 严格模式 | 安全 + 上下文监控 + 代码检查 |

## 文件说明

| 文件 | 作用 |
|------|------|
| `gsd-context-monitor.js` | 上下文监控，≤35% 警告，≤25% 建议 /compact |
| `gsd-session-manager.js` | Session 生命周期管理 |
| `gsd-code-checker.js` | 代码质量检查（strict 模式） |
| `hook-hierarchy.js` | 级别配置控制器 |

## 配置方式

### 全局配置（~/.claude/settings.json）

```json
{
  "hooks": {
    "SessionStart": [{
      "type": "command",
      "command": "node \"~/.claude/hooks/gsd-session-manager.js\" SessionStart"
    }],
    "Stop": [{
      "type": "command",
      "command": "node \"~/.claude/hooks/gsd-session-manager.js\" Stop"
    }],
    "PreCompact": [{
      "type": "command",
      "command": "node \"~/.claude/hooks/gsd-session-manager.js\" PreCompact"
    }],
    "PostToolUse": [{
      "matcher": "Bash|Edit|Write|MultiEdit|Agent|Task",
      "hooks": [{
        "type": "command",
        "command": "node \"~/.claude/hooks/gsd-context-monitor.js\"",
        "timeout": 10
      }]
    }]
  }
}
```

### 设置 Hook 级别

```bash
# 在项目根目录创建 .env 文件
echo "TINYPOWERS_HOOK_LEVEL=standard" > .env

# 或在 shell 配置中设置
echo 'export TINYPOWERS_HOOK_LEVEL=strict' >> ~/.zshrc
```

## 使用建议

| 场景 | 推荐级别 |
|------|----------|
| 日常开发 | `standard` |
| 代码审查时 | `strict` |
| CI 环境 | `minimal` |
| 新项目初始化 | `standard` |
