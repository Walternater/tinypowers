# tinypowers for OpenCode

tinypowers 当前没有提供 OpenCode 专属 runtime 插件，但已经补齐了最小安装说明，便于在 OpenCode 项目里复用同一套工作流文档、规则和 hooks。

## 直接作为项目工作流使用

```bash
git clone https://github.com/Walternater/tinypowers.git /path/to/tinypowers
cd /path/to/project
/path/to/tinypowers/install.sh
```

然后把安装后的文档和规则接入你的 OpenCode 项目配置。

建议至少引用：

- `skills/`
- `agents/`
- `contexts/`
- `configs/rules/`
- `hooks-settings-template.json`

## 建议映射

| tinypowers | OpenCode |
|------------|----------|
| `skills/*/SKILL.md` | instructions / prompts |
| `agents/*.md` | agent definitions |
| `hooks/*.js` | hook handlers 或自定义脚本 |
| `contexts/*.md` | mode / instruction presets |

## 安装后检查

```bash
node .claude/skills/tinypowers/scripts/doctor.js --project .
```

如果 doctor 提示 hooks 尚未接线，按 `hooks-settings-template.json` 手动映射到 OpenCode 的事件系统即可。
