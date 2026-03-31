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
3. **先约束，后并行** - 先做方案、依赖、决策锁定，再做 Wave 并行执行。
4. **审查顺序有门禁** - 先看是否符合方案，再看安全，最后看代码质量。
5. **HARD-GATE 强制门禁** - 关键约束必须满足，禁止绕过。
6. **决策锁定追踪** - 所有关键决策必须记录并可追溯。
7. **拒绝过度设计** - 框架保持轻量，无外部依赖，够用即可。

## 核心概念

| 概念 | 说明 |
|------|------|
| HARD-GATE | 关键约束强制检查，不满足则阻断流程 |
| EARS | 验收标准格式（推荐，不强制） |
| 4-Level Verification | 证据驱动的验证（L1 Exists → L4 Data Flow） |
| Decision Guardian | 决策锁定防漂移，编码阶段不能擅自修改已锁定决策 |
| Anti-Rationalization | 防止自我合理化绕过门禁 |
| Wave Execution | 依赖驱动的并行执行，按拓扑分 Wave |

## 能力地图

### Skills

| Skill | 用途 |
|-------|------|
| `tech-init` | 初始化目标项目的 AI 工作流骨架 |
| `tech-feature` | 需求分析、歧义检测、技术方案、任务拆解 |
| `tech-code` | Wave 并行执行、三阶段审查、状态恢复、TDD 循环 |
| `tech-commit` | 文档同步、提交、PR 流程 |

### Agents

#### 规划与设计
- `architect`：技术方案设计
- `decision-guardian`：锁定关键决策，防止编码阶段擅自漂移

#### 审查与验证
- `tech-plan-checker`：执行前验证任务拆解表（含拓扑排序）
- `spec-compliance-reviewer`：先审"是不是实现了方案要求的东西"
- `security-reviewer`：再审安全风险

> 委托 superpowers：`writing-plans`（任务拆解）、`code-reviewer`（代码审查）、`verification-before-completion`（完成验证）

#### 语言特定
- `agents/java/java-reviewer`
- `agents/java/springboot-reviewer`

### Hooks

| Hook | 作用 |
|------|------|
| `gsd-context-monitor.js` | 监控上下文压力，提醒压缩 |
| `gsd-session-manager.js` | SessionStart / Stop / PreCompact 生命周期管理 |
| `gsd-code-checker.js` | 严格模式下提醒运行验证命令 |
| `config-protection.js` | 防止为了过检查而弱化配置 |
| `residual-check.js` | Stop 时检测残留调试代码 |
| `hook-hierarchy.js` | 根据 `TINYPOWERS_HOOK_LEVEL` 切换最小 / 标准 / 严格模式 |

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

/tech:feature
  -> PRD 分析 -> 歧义检测 -> 技术方案 -> 决策锁定 -> 任务拆解

/tech:code
  -> Plan Check -> Wave Execution（TDD + Deviation Rules）
  -> Spec Review -> Security Review -> Code Review
  -> Verification（4-Level 证据验证）

/tech:commit
  -> Document Sync -> Commit -> PR -> Changelog
```

## 技术栈兼容性

| 技术栈 | 支持级别 | 说明 |
|--------|---------|------|
| Java / Spring Boot | 完整支持 | 主栈，含专属 reviewer |
| Node.js | 支持 | 标准 npm 工作流 |
| Go | 支持 | 标准 go 工具链 |
| Python | 基础支持 | 通用规则适用 |
| MySQL | 规则层支持 | DBA 规范独立配置 |

## 统一约定

- 需求工作目录：`features/{id}/`
- 执行状态主文件：`features/{id}/STATE.md`
- 工作流命令：`/tech:*`
- 审查顺序：方案符合性 -> 安全 -> 代码质量
- 决策格式：D-XXX（锁定决策编号）

## 安装

### Claude Code（推荐）

```bash
git clone https://github.com/Walternater/tinypowers.git ~/.tinypowers && ~/.tinypowers/install.sh --global
```

一行命令，将 tinypowers 安装到 `~/.claude/skills/tinypowers/`，所有项目共享。

### 安装到指定项目

```bash
cd /path/to/project
/path/to/tinypowers/install.sh              # 自动检测技术栈
/path/to/tinypowers/install.sh java-fullstack  # 指定 profile
```

### 全部参数

| 参数 | 说明 |
|------|------|
| `--global` | 安装到 `~/.claude/skills/tinypowers/`，全局生效 |
| `--target DIR` | 安装到指定目录 |
| `--force` | 覆盖已有安装 |
| `--list` | 列出可用组件和 profile |
| `--components a,b` | 指定组件列表 |

可用 profile：
- `java-fullstack`：Java + Spring Boot + MySQL 全套
- `java-light`：Java + Spring Boot（无 MySQL）
- `minimal`：仅核心 skill

### 安装后

```bash
# 在 Claude Code 中初始化项目
/tech:init

# 验证安装
node ~/.claude/skills/tinypowers/scripts/doctor.js --project .
```

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
npm run doctor     # 诊断安装状态
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
│       ├── SKILL.md
│       ├── commit-message-format.md
│       ├── documenter-guide.md
│       ├── pr-workflow.md
│       └── changelog-update.md
├── agents/               # 角色化 Agent 提示词
├── hooks/                # 运行期 hook 实现
├── configs/
│   ├── rules/            # 分层编码规范
│   └── templates/        # 文档模板
├── contexts/             # 工作模式（dev / research / review / debug）
├── docs/                 # 使用指南
├── manifests/            # 安装组件定义
└── scripts/              # 校验与工具脚本
```

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
