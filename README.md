# tinypowers

轻量级 AI 开发工作流框架，基于 [obra/superpowers](https://github.com/obra/superpowers) 的设计思路演进，面向 Java / Spring Boot 为主的工程化研发场景。

它不是业务应用，而是一套可复用的“开发操作系统”：
- 用 `skills/` 定义流程
- 用 `agents/` 定义角色
- 用 `hooks/` 做运行期守护
- 用 `configs/` 和 `docs/` 提供规则与模板
- 用 `contexts/` 定义工作模式
- 用 `manifests/` 管理安装组件

## 这个仓库解决什么问题

传统 AI 编码最容易失控的地方，不是“写不出代码”，而是：
- 需求理解不稳定，方案确认后还在飘
- 写代码前没有任务依赖检查，执行期频繁阻塞
- 审查顺序混乱，先做质量审查再发现功能写偏
- 会话切换后丢上下文，重复劳动
- 为了过检查去改 lint / hook / config，而不是修代码

tinypowers 试图把这些问题产品化成一套默认流程。

## 核心理念

1. Skills 即规范。把流程写进 skill，而不是散落在团队口头约定里。
2. 文件即状态。关键产物和执行状态落到 Markdown，而不是只存在会话上下文里。
3. 先约束，后并行。先做方案、依赖、决策锁定，再做 Wave 并行执行。
4. 审查顺序有门禁。先看是否符合方案，再看安全，最后看代码质量。

## 能力地图

### Skills

| Skill | 用途 |
|------|------|
| `tech-init` | 初始化目标项目的 AI 工作流骨架 |
| `tech-feature` | 需求分析、歧义检测、技术方案、任务拆解 |
| `tech-code` | Wave 并行执行、三阶段审查、状态恢复 |
| `tech-commit` | 文档同步、提交、PR 流程 |
| `tech-progress` | 读取 `STATE.md`，汇总当前进度和下一步建议 |
| `tech-note` | 记录 note / todo / seed 三层想法资产 |
| `tech-debug` | 系统化调试：观察 → 假设 → 验证 → 修复 |
| `tech-quick` | 快速执行小任务，跳过 discuss 阶段 |

### Agents

#### 规划与设计
- `architect`：技术方案设计
- `planner`：任务拆解和 Wave 规划
- `decision-guardian`：锁定关键决策，防止编码阶段擅自漂移

#### 审查与验证
- `tech-plan-checker`：执行前验证任务拆解表
- `spec-compliance-reviewer`：先审“是不是实现了方案要求的东西”
- `security-reviewer`：再审安全风险
- `code-reviewer`：最后审代码质量与可维护性
- `tech-verifier`：目标回溯验证，确认交付达标

#### 语言特定
- `agents/java/java-reviewer`
- `agents/java/springboot-reviewer`

### Hooks

| Hook | 作用 |
|------|------|
| `gsd-context-monitor.js` | 监控上下文压力，提醒压缩 |
| `gsd-session-manager.js` | SessionStart / Stop / PreCompact 生命周期管理 |
| `gsd-code-checker.js` | 严格模式下提醒运行匹配的验证命令 |
| `config-protection.js` | 防止为了过检查而弱化配置 |
| `residual-check.js` | Stop 时检测残留调试代码（System.out / console.log） |
| `hook-hierarchy.js` | 根据 `TINYPOWERS_HOOK_LEVEL` 切换最小 / 标准 / 严格模式 |

### Contexts

| Context | 用途 |
|---------|------|
| `dev.md` | 开发模式：先写代码，后解释 |
| `research.md` | 调研模式：只读，不修改代码 |
| `review.md` | 审查模式：只看不改，输出报告 |
| `debug.md` | 调试模式：科学方法定位根因 |

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
└── mysql/               # MySQL DBA 规范
```

## 标准流程

```text
/tech:init
  -> 初始化项目入口、规范、模板、hooks

/tech:feature
  -> PRD 分析
  -> 歧义检测
  -> 技术方案
  -> 决策锁定
  -> 任务拆解

/tech:code
  -> Plan Check
  -> Wave Execution
  -> Spec Compliance Review
  -> Security Review
  -> Code Review
  -> Verification

/tech:commit
  -> 文档同步
  -> Git Commit
  -> PR Create
  -> Changelog
```

## 统一约定

当前仓库已经统一到以下约定，新增内容应继续沿用：

- 规范目录：`docs/guides/`
- 需求工作目录：`features/{id}/`
- 执行状态主文件：`features/{id}/STATE.md`
- 工作流命令：`/tech:*`
- 审查顺序：方案符合性 -> 安全 -> 代码质量

## 快速开始

### 1. 安装到目标项目

```bash
# 方式 A: 使用安装脚本（推荐）
cd /path/to/project
/path/to/tinypowers/install.sh              # 自动检测技术栈
/path/to/tinypowers/install.sh java-fullstack  # 指定 profile
/path/to/tinypowers/install.sh --global      # 全局安装
/path/to/tinypowers/install.sh --list        # 查看可用组件

# 方式 B: 手动安装
git clone https://github.com/Walternater/tinypowers.git /path/to/project/.claude/skills/tinypowers
```

### 2. 在目标项目里初始化

```bash
/tech:init
```

初始化后，目标项目通常会出现这些产物：
- `CLAUDE.md`
- `docs/guides/`
- `features/`
- `.claude/`

说明：
- 这些目录是“被初始化项目”的产物，不是这个框架仓库本身必须长期携带的内容。
- 因此你在当前仓库根目录下看不到 `features/` 是正常的。

### 3. 开一个新需求

```bash
/tech:feature
# 或先生成 change set 骨架
npm run scaffold:feature -- --id CSS-1234 --name 用户登录
# 推进 SPEC-STATE 生命周期
npm run spec-state:update -- --feature features/CSS-1234-用户登录 --to REQ --note "PRD ready"
```

### 4. 进入执行态

```bash
/tech:code
```

### 5. 查看当前进度

```bash
/tech:progress
```

## 仓库自检

这个仓库已经提供了基础自检、安装诊断和最小回归测试入口。

```bash
npm run validate
npm run doctor
npm test
```

当前校验会检查：
- Agent 和 Skill 的基础元数据
- 常见标签是否正确闭合
- `@agents`、`@configs`、`@docs` 等引用是否存在
- hook 脚本语法和 `.claude/settings.json` 中的 hook 引用

`npm run doctor` 适合检查“装了但为什么没生效”，例如：
- 当前项目有没有发现 tinypowers 安装目录
- hooks 有没有接到 `.claude/settings.json`
- `contexts/`、模板、核心目录是否齐全
- 当前项目是否已经初始化出 `CLAUDE.md` / `docs/guides/` / `features/`

`npm test` 会跑最小脚本与 hook 回归测试，避免安装器、hook 配置和校验器静默漂移。

如果在 GitHub 上协作，`.github/workflows/validate.yml` 也会在 `push` 和 `pull_request` 时执行同一套校验。

## 仓库结构

```text
tinypowers/
├── skills/               # 主工作流定义
├── agents/               # 角色化 Agent 提示词
├── hooks/                # 运行期 hook 实现
├── contexts/             # 工作模式定义（dev / research / review / debug）
├── configs/
│   ├── rules/
│   │   ├── common/       # 通用规则（必装）
│   │   ├── java/         # Java / Spring Boot 规则
│   │   └── mysql/        # MySQL DBA 规范
│   └── templates/        # 文档与初始化模板
├── docs/
│   └── guides/           # 使用与规范说明
├── manifests/            # 安装组件定义
├── scripts/              # 校验与工具脚本
└── .claude/              # 本仓库开发时使用的本地配置
```

## 从哪里开始读

如果你第一次接手这个仓库，推荐顺序：

1. [README.md](./README.md)
2. [skills/tech-feature/SKILL.md](./skills/tech-feature/SKILL.md)
3. [skills/tech-code/SKILL.md](./skills/tech-code/SKILL.md)
4. [docs/guides/repo-normalization-summary.md](./docs/guides/repo-normalization-summary.md)
5. [docs/guides/capability-map.md](./docs/guides/capability-map.md)
6. [docs/guides/runtime-matrix.md](./docs/guides/runtime-matrix.md)
7. [docs/guides/generated-vs-curated-policy.md](./docs/guides/generated-vs-curated-policy.md)
8. [docs/guides/change-set-model.md](./docs/guides/change-set-model.md)
9. [hooks/README.md](./hooks/README.md)
10. [agents/tech-plan-checker.md](./agents/tech-plan-checker.md)
11. [agents/spec-compliance-reviewer.md](./agents/spec-compliance-reviewer.md)
12. [agents/tech-verifier.md](./agents/tech-verifier.md)

## 贡献建议

修改这个仓库时，优先遵守这几个原则：

- 改流程时，优先改 `skills/`
- 改角色职责时，优先改 `agents/`
- 改运行期约束时，优先改 `hooks/`
- 改用户可见规则时，优先改 `docs/` 和 `configs/`
- 避免引入第二套命名或目录约定

特别注意：
- 不要重新引入 `doc/guides`、`docs/feature`、`SESSION.md`、`superpowers:*` 这类旧约定
- 如果修改了主流程，最好同步更新 README 和对应 guide
- 如果修改了 hook 行为，确认文档和实现一致
- 如果不确定当前哪些约定算正式标准，先看 `docs/guides/repo-normalization-summary.md`
- 如果修改了安装或分发入口，记得同步 `manifests/`、`install.sh`、`doctor` 和多宿主安装文档
- 如果不确定一个文件该不该发布或提交，先看 `docs/guides/generated-vs-curated-policy.md`
- 如果新增宿主适配或命令映射，先看 `docs/guides/runtime-matrix.md`

## 参考

- [obra/superpowers](https://github.com/obra/superpowers) — 纪律驱动的 Skills 库，anti-rationalization 模式
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) — 全方位 Claude Code 增强系统，分层 Rules + Contexts
- [get-shit-done](https://github.com/gsd-build/get-shit-done) — 全生命周期项目管理框架，Wave 执行 + SDK
- [agency-agents-zh](https://github.com/msitarzewski/agency-agents) — 186 个即插即用角色提示词库

## License

MIT
