# tinypowers

轻量级 AI 开发工作流框架，面向 Java / Spring Boot 为主的工程化研发场景。

它不是业务应用，而是一套可复用的"开发操作系统"：
- 用 `skills/` 定义流程
- 用 `agents/` 定义角色
- 用 `hooks/` 做运行期守护
- 用 `configs/` 和 `docs/` 提供规则与模板
- 用 `contexts/` 定义工作模式
- 用 `manifests/` 管理安装组件

## Skill 管道

```
/tech:init → /tech:feature → /tech:code → /tech:commit
```

## 核心理念

1. **Skills 即规范** - 把流程写进 skill，而不是散落在团队口头约定里。
2. **文件即状态** - 关键产物和执行状态落到 Markdown，而不是只存在会话上下文里。
3. **先约束，后执行** - 先做方案和任务拆解，再进入编码。
4. **审查顺序有门禁** - 先看是否符合方案，再看安全，最后看代码质量。
5. **HARD-GATE 强制门禁** - 关键约束必须满足，禁止绕过。
6. **决策锁定追踪** - 所有关键决策必须记录并可追溯。
7. **复杂度按需展开** - worktree、知识库、状态恢复都保留，但只在复杂需求时展开。

## 核心概念

| 概念 | 说明 |
|------|------|
| HARD-GATE | 关键约束强制检查，不满足则阻断流程 |
| EARS | 验收标准格式（推荐，不强制） |
| 4-Level Verification | 证据驱动的验证（L1 Exists → L4 Data Flow） |
| Decision Guardian | 决策锁定防漂移，编码阶段不能擅自修改已锁定决策 |
| Anti-Rationalization | 防止自我合理化绕过门禁 |
| Worktree Isolation | 复杂需求可使用独立 worktree 隔离执行 |
| Knowledge Base | `docs/knowledge.md` + 可选的 `notepads/learnings.md` 提升链路 |

## 能力地图

### Skills

| Skill | 用途 |
|-------|------|
| `tech-init` | 初始化目标项目骨架，并同步 README / 项目级知识入口 |
| `tech-feature` | 需求理解、技术方案、任务拆解 |
| `tech-code` | 开发执行、审查修复、测试验证 |
| `tech-commit` | 文档同步、提交、PR 流程 |

### Agents

#### 规划与设计
- `architect`：技术方案设计
- `decision-guardian`：锁定关键决策，防止编码阶段擅自漂移

#### 审查与验证
- `compliance-reviewer`：方案符合性 + 安全审查（合二为一）

> 委托 superpowers：`writing-plans`（任务拆解）、`requesting-code-review`（代码审查）、`verification-before-completion`（完成验证）

#### 语言特定
- `agents/java/java-reviewer`
- `agents/java/springboot-reviewer`

### Hooks

| Hook | 作用 |
|------|------|
| `spec-state-guard.js` | SPEC-STATE 门禁，禁止在错误阶段直接写代码 |
| `gsd-context-monitor.js` | 监控上下文压力，提醒压缩 |
| `gsd-session-manager.js` | SessionStart / Stop / PreCompact 生命周期管理 |
| `gsd-code-checker.js` | 严格模式验证提醒 + Stop 时检测残留调试代码 |
| `config-protection.js` | 防止为了过检查而弱化配置 |

### Rules（分层）

```text
configs/rules/
├── common/              # 通用规则（所有项目必装）
│   ├── coding-style.md
│   ├── security.md
│   ├── testing.md
│   └── code-review-checklist.md
├── java/                # Java / Spring Boot（继承 common）
│   ├── java-coding-style.md
│   └── testing.md
└── mysql/               # MySQL DBA 规则
```

## 标准流程

```text
/tech:init
  -> 初始化项目入口、规范、模板、hooks
  -> 第一次 init 时优先用 brainstorming 补全 README / knowledge

/tech:feature
  -> 需求理解 -> 技术方案 -> 任务拆解 -> 方案确认

/tech:code
  -> Gate Check -> 开发执行
  -> 审查修复 -> 测试计划 / 测试报告 -> 测试验证

/tech:commit
  -> Document Sync -> Commit -> PR
```

## 技术栈兼容性

| 技术栈 | /tech:init 自动检测 | 工作流可用 | 说明 |
|--------|---------------------|-----------|------|
| Java / Spring Boot | 完整支持 | 完整支持 | 主栈，含专属 reviewer 和规则集 |
| Node.js | 不支持 | 手动配置 | 通用规则适用，需手动创建 CLAUDE.md |
| Go | 不支持 | 手动配置 | 通用规则适用，需手动创建 CLAUDE.md |
| Python | 不支持 | 手动配置 | 通用规则适用，需手动创建 CLAUDE.md |
| MySQL | N/A | 规则层支持 | DBA 规范独立配置，按需加载 |

## 统一约定

- 需求工作目录：`features/{id}-{name}/`
- 生命周期主文件：`features/{id}-{name}/SPEC-STATE.md`
- 执行状态文件：`features/{id}-{name}/STATE.md`（复杂执行可选）
- 工作流命令：`/tech:*`
- 审查顺序：方案符合性 -> 安全 -> 代码质量
- 决策格式：D-XXX（锁定决策编号）

## 安装

### Claude Code（推荐）

```bash
git clone https://github.com/Walternater/tinypowers.git ~/.tinypowers && ~/.tinypowers/install.sh --global
```

一行命令，将 tinypowers 安装到 `~/.claude/skills/tinypowers/`，所有项目共享。

默认安装面只包含运行时必需内容：

- workflow skills / agents / hooks
- 初始化与诊断脚本
- 运行时指南与模板

默认不会把这些仓库维护材料复制进目标项目：

- `docs/plans/`
- `docs/workflow-optimization-*.md`
- `tests/`
- 其他仅供框架仓库维护使用的文档

### 安装到指定项目

```bash
cd /path/to/project
/path/to/tinypowers/install.sh              # 自动检测技术栈
/path/to/tinypowers/install.sh java-fullstack  # 指定 profile
```

项目级安装仍然支持，但更适合：

- 只想在单个项目里试用
- 需要对项目内副本做隔离定制
- 不希望所有项目共用一套 tinypowers

### 全部参数

| 参数 | 说明 |
|------|------|
| `--global` | 安装到 `~/.claude/skills/tinypowers/`，全局生效 |
| `--target DIR` | 安装到指定目录 |
| `--force` | 覆盖已有安装 |
| `--list` | 列出可用组件和 profile |
| `--components a,b` | 指定组件列表 |

可用 profile：
- `java-fullstack`：Java + Spring Boot + MySQL 全套 runtime
- `java-light`：Java + Spring Boot（无 MySQL）
- `minimal`：最小 runtime（`core + docs-runtime`）

常见组件：

- `core`：skills / agents / hooks / 安装与诊断脚本
- `docs-runtime`：运行时指南
- `rules-*`：语言或数据库规则
- `templates`：初始化模板
- `contexts`：工作模式定义
- `repo-maintenance`：优化方案、执行计划等仓库维护文档（默认不安装）

### 安装后

```bash
# 在 Claude Code 中初始化项目
/tech:init

# 验证安装
node ~/.claude/skills/tinypowers/scripts/doctor.js --project .
```

如果你用的是项目级安装，对应脚本路径会是 `.claude/skills/tinypowers/scripts/doctor.js`。
`doctor` 现在除了检查安装完整性，也会提示 hooks 接线和项目运行时准备情况。

## 快速开始

```bash
# 1. 初始化项目
/tech:init

# 2. 开始新需求
/tech:feature

# 3. 执行编码
/tech:code

# 4. 提交
/tech:commit
```

## 仓库自检

```bash
npm run validate   # 校验 Agent/Skill 定义完整性
npm run doctor     # 诊断安装状态、hooks 接线和运行时准备情况
npm test           # 跑回归测试
```

## 仓库结构

```text
tinypowers/
├── skills/               # 主工作流定义
│   ├── tech-code/
│   │   ├── SKILL.md
│   │   ├── context-preload.md
│   │   └── pattern-scan.md
│   └── tech-commit/
│       └── SKILL.md
├── agents/               # 角色化 Agent 提示词
├── hooks/                # 运行期 hook 实现
├── configs/
│   ├── rules/            # 分层编码规范
│   └── templates/        # 文档模板
├── contexts/             # 工作模式（dev / research / review）
├── docs/                 # 使用指南
├── manifests/            # 安装组件定义
└── scripts/              # 校验与工具脚本
```

`tech:commit` 和 `tech:init` 的提交 / PR / 文档同步 / 更新策略规则现在都直接内联在各自的 `SKILL.md` 中。

## 贡献建议

- 改流程 → `skills/`
- 改角色 → `agents/`
- 改运行期约束 → `hooks/`
- 改用户可见规则 → `docs/` 和 `configs/`
- 避免引入第二套命名或目录约定

## 参考

- [obra/superpowers](https://github.com/obra/superpowers) — 纪律驱动的 Skills 库
- [get-shit-done](https://github.com/gsd-build/get-shit-done) — Wave 执行 + Deviation Rules
- [gstack](https://github.com/nickariaslabs/gstack) — 虚拟工程团队
- [oh-my-claudecode](https://github.com/Ashin520/oh-my-claudecode) — Commit Trailers
- [OpenSpec](https://github.com/nickolas-iaconis/OpenSpec) — 增量 Spec 框架
- [cc-sdd](https://github.com/kiro-config/cc-sdd) — EARS Requirements
- [claude-code-spec-workflow](https://github.com/ykyzhang/claude-code-spec-workflow) — Steering Documents

## License

MIT
