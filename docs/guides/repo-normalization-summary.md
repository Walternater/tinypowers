# 仓库统一总结

## 这份文档是做什么的

这是一页短总结，用来说明本轮文档重构之后，tinypowers 仓库有哪些约定已经被统一，哪些内容现在应当视为正式标准。

如果以后继续维护这个仓库，优先以这里列出的结论为准，而不是回到旧文件或旧表述中寻找依据。

## 本轮统一了什么

这次整理主要把仓库从“新旧设计并存”收口成了一套一致模型，重点包括：

- 统一目录约定
- 统一工作流命令
- 统一执行状态模型
- 统一文档写法和入口职责
- 统一 templates、guides、skills 之间的语言和边界

## 当前正式标准

以下约定现在应视为仓库默认标准：

| 主题 | 正式标准 |
|------|----------|
| 规范目录 | `docs/guides/` |
| Feature 工作目录 | `features/{id}/` |
| 执行状态主文件 | `features/{id}/STATE.md` |
| 工作流命令 | `/tech:init`、`/tech:feature`、`/tech:code`、`/tech:commit`、`/tech:progress`、`/tech:note` |
| 执行主链路 | `tech-feature -> tech-code -> tech-commit` |
| 审查顺序 | 方案符合性 -> 安全 -> 代码质量 |
| 恢复依据 | `STATE.md` 为主，Snapshot 仅作恢复入口 |

## 文档层的职责边界

当前仓库中文档分层应这样理解：

| 目录 | 职责 |
|------|------|
| `README.md` | 项目级入口和总览 |
| `docs/guides/` | 使用说明、开发规范、流程说明 |
| `configs/rules/` | 规则层与检查清单 |
| `configs/templates/` | 初始化模板和交付模板 |
| `skills/` | 工作流定义 |
| `agents/` | 角色职责和审查视角 |
| `hooks/` | 运行期行为与守护实现 |

不要再把不同层的职责重新混写回一个文件里。

## 已明确淘汰的旧约定

以下内容已经视为旧设计，不应重新引入：

- `doc/guides`
- `docs/feature`
- `SESSION.md`
- `superpowers:*`
- 旧式“中文编号目录式模板”作为默认模板风格
- 在入口文件里堆叠完整规则库的做法

如果某处文档中再次出现这些内容，默认视为回退信号，应优先修正。

## 本轮重点收口的区域

本轮已经系统整理过这些区域：

- `README.md`
- `docs/guides/*`
- `configs/rules/*`
- `configs/templates/*`
- `skills/tech-init/*`
- `skills/tech-feature/*`
- `skills/tech-code/*`
- `skills/tech-commit/*`
- `skills/tech-progress/SKILL.md`
- `skills/tech-note/SKILL.md`
- `hooks/README.md`
- `hooks/gsd-session-manager.js`

## 后续维护建议

继续维护时，建议遵守下面几条：

- 改流程时，优先同步 `skills/`、`docs/guides/` 和 `README.md`
- 改 hook 行为时，确认实现和文档一起更新
- 改模板时，确认它们和当前 `tech-feature`、`tech-code` 语境一致
- 新增规则时，优先放进 `configs/rules/`，不要把入口文件写胖
- 新增命名或目录前，先确认是否会形成第二套约定

## 快速巡检方法

如果以后要检查仓库有没有重新漂移，可以优先搜索这些关键词：

```text
doc/guides
docs/feature
SESSION.md
superpowers:
本文档描述
本文档定义
## 一、
## 二、
## 三、
```

如果这些关键词再次大量出现，通常说明文档层开始回退到旧风格了。

## 一句话结论

tinypowers 现在已经统一到一套更清晰的工作流模型：
`docs/guides` 负责说明，`skills` 负责流程，`STATE.md` 负责状态，`/tech:*` 负责动作。
