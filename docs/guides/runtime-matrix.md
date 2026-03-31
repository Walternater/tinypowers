# Runtime Matrix

这份文档定义 tinypowers 在不同宿主里的运行方式，避免安装、命令命名、hook 事件和可用能力各写一套口头约定。

## 目标

Runtime Matrix 解决四个问题：

- tinypowers 现在正式支持哪些宿主
- 相同能力在不同宿主里如何命名和安装
- hooks / skills / agents / contexts 在不同宿主里怎样落地
- 新增能力时应该先改哪一层，避免文档和实现分叉

## 当前正式覆盖的宿主

| 宿主 | 当前状态 | 入口文件 |
|------|----------|----------|
| Claude Code | 一级支持 | `.claude-plugin/plugin.json`、`install.sh`、`hooks-settings-template.json` |
| Codex | 一级支持 | `.codex/INSTALL.md` |
| OpenCode | 二级支持 | `.opencode/README.md`、`.opencode/INSTALL.md` |

说明：
- 一级支持：有明确安装入口、目录约定和可维护文档。
- 二级支持：有明确接入建议，但部分能力仍需要宿主侧手动映射。

## 安装路径约定

| 宿主 | 推荐安装位置 | 说明 |
|------|--------------|------|
| Claude Code | `.claude/skills/tinypowers/` 或 `~/.claude/skills/tinypowers/` | 当前默认安装目标 |
| Codex | 项目内 `.claude/skills/tinypowers/`，或通过 `~/.agents/skills/tinypowers` 暴露 skills | Codex 更偏 skill discovery |
| OpenCode | 项目内 `.claude/skills/tinypowers/`，再按 OpenCode 配置手动映射 | 当前没有独立 runtime 插件 |

## 命令与能力映射

### 1. 工作流命令

tinypowers 当前的正式工作流命令模型仍是 `/tech:*`。

| 能力 | Claude Code | Codex | OpenCode |
|------|-------------|-------|----------|
| 初始化 | `/tech:init` | 通过 skills / prompt 调用同名能力 | 通过宿主命令或 prompt 映射 |
| 需求分析 | `/tech:feature` | 同上 | 同上 |
| 执行与审查 | `/tech:code` | 同上 | 同上 |
| 收口提交 | `/tech:commit` | 同上 | 同上 |

约束：
- 不重新引入 `superpowers:*` 命名。
- 如宿主不支持原生命令系统，保留能力语义，不强行重命名流程本身。

### 2. Contexts

| Context | Claude Code | Codex | OpenCode |
|---------|-------------|-------|----------|
| `dev` | 通过 skills 和 rules 引导 | 通过 SKILL.md discovery 引导 | 作为 instruction preset / prompt 片段映射 |
| `research` | 同上 | 同上 | 同上 |
| `review` | 同上 | 同上 | 同上 |

当前原则：
- `contexts/` 是 tinypowers 的统一工作模式定义。
- 各宿主可以有不同注入方式，但不应再维护第二套 mode 文案。

### 3. Hooks

| 能力 | Claude Code | Codex | OpenCode |
|------|-------------|-------|----------|
| Session 生命周期 | 直接映射 `SessionStart / Stop / PreCompact` | 视宿主能力决定是否启用 | 需要手动映射到等价事件 |
| PostToolUse 监控 | 原生支持 | 取决于宿主是否支持相似 hook 机制 | 通过 tool execute / after 事件映射 |
| Strict 验证提醒 | 支持 | 可降级为显式脚本调用 | 可映射到 after-tool 事件 |

约束：
- 先保持能力语义一致，再做宿主特化。
- 某宿主不支持的 hook，不要在文档里假装“已自动支持”。

## 推荐的宿主分层

```text
tinypowers/
├── skills/              # 宿主无关的流程定义
├── agents/              # 宿主无关的角色职责
├── contexts/            # 宿主无关的模式定义
├── hooks/               # Claude 风格 hook 实现与基准语义
├── manifests/           # 安装组件与 profile
├── .claude-plugin/      # Claude Code 分发元数据
├── .codex/              # Codex 安装与映射说明
└── .opencode/           # OpenCode 安装与映射说明
```

规则：
- 业务语义放在公共层。
- 宿主差异放在宿主目录和安装脚本层。
- 不在 `skills/` 或 `agents/` 里写死某个宿主的专有路径或命令语法。

## 新增能力时的更新顺序

新增一个能力时，按这个顺序检查：

1. 是否先有公共语义  
   例如先定义 skill、agent、context 或 hook 的职责。
2. 是否需要安装暴露  
   更新 `manifests/components.json` 和 `install.sh`。
3. 是否需要宿主映射  
   更新 `.claude-plugin/`、`.codex/`、`.opencode/` 文档或元数据。
4. 是否需要自检  
   更新 `doctor`、`validate`、tests。

## 当前边界

当前 tinypowers 还没有这些能力：

- OpenCode 专属 runtime 插件
- 统一的跨宿主命令生成器
- 自动把 `/tech:*` 映射成所有宿主的原生命令入口

这些缺口是已知的，文档里应明确说明，不要伪装成“已经完全支持”。

## 延伸阅读

- `docs/guides/capability-map.md`
- `docs/guides/generated-vs-curated-policy.md`
- `docs/guides/optimization-roadmap-2026.md`
