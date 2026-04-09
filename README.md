# tinypowers

<<<<<<< HEAD
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
| Knowledge Base | `docs/knowledge.md` — 手动维护的项目知识库 |

## 能力地图

### Skills

| Skill | 用途 |
|-------|------|
| `tech-init` | 初始化项目骨架，检测技术栈，检查版本更新，同步 README / 知识库 |
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

一行命令，自动完成：
- 安装 tinypowers 到 `~/.claude/skills/tinypowers/`
- 创建技能 symlinks（`tech-init`, `tech-feature`, `tech-code`, `tech-commit`）
- 合并 hooks 配置到 `~/.claude/settings.json`
- 设置 `TINYPOWERS_DIR` 环境变量
- 运行 `doctor.js` 验证安装

默认包含 Java 全栈组件（`java-fullstack` profile）：
- workflow skills / agents / hooks
- Java / Spring Boot / MySQL 规范
- 初始化模板和运行时指南

### 安装到指定项目

```bash
cd /path/to/project
/path/to/tinypowers/install.sh              # 自动检测技术栈
```

项目级安装适合：
- 只想在单个项目里试用
- 需要对项目内副本做隔离定制

### 全部参数

| 参数 | 说明 |
|------|------|
| `--global` | 安装到 `~/.claude/skills/tinypowers/`，全局生效（默认使用 `java-fullstack` profile） |
| `--profile NAME` | 指定 profile（`java-fullstack`, `java-light`, `minimal`） |
| `--target DIR` | 安装到指定目录 |
| `--force` | 覆盖已有安装 |
| `--list` | 列出可用组件和 profile |
| `--components a,b` | 指定组件列表 |

可用 profile：
- `java-fullstack`：Java + Spring Boot + MySQL 全套 runtime（全局安装默认）
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
=======
AI 辅助开发编排框架。定义 WHAT（做什么、门禁是什么），委托 superpowers 执行 HOW（怎么实现）。

---

## 项目介绍

tinypowers 是一个面向 Java 项目的 AI 辅助开发编排框架，通过四个核心技能（/tech:init、/tech:feature、/tech:code、/tech:commit）串联完整的开发流程，确保需求规划、代码实现和提交收口的一致性和可追溯性。

### 核心设计理念

- **薄编排层**: tinypowers 负责定义流程和门禁，具体执行委托 superpowers
- **知识沉淀**: 通过 Knowledge Capture 形成项目特有的约定、踩坑记录和代码模式
- **方案符合性**: compliance-reviewer 确保代码实现与技术方案一致
- **状态驱动**: SPEC-STATE.md 驱动流程流转，确保阶段完整性

---

## 安装说明

### 前置要求

- macOS / Linux 环境
- Bash / Zsh shell
- Git
- Java 项目（Maven 或 Gradle）
- Claude Code (claude.ai/code) + superpowers 插件

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone <repository-url> ~/tinypowers
   cd ~/tinypowers
   ```

2. **设置环境变量**（可选）
   ```bash
   export TINYPOWERS_HOME=~/tinypowers
   export PATH=$PATH:$TINYPOWERS_HOME/scripts
   ```

3. **验证安装**
   ```bash
   ./scripts/detect-stack.sh .
   ```

---

## 快速开始

### 1. 初始化项目

在新项目目录中执行：

```bash
/tech:init
```

这将：
- 检测技术栈（Maven/Gradle）
- 生成 CLAUDE.md（项目入口文档）
- 生成 docs/knowledge.md（领域知识骨架）

### 2. 规划功能

```bash
/tech:feature 订单筛选功能
```

这将引导你回答 8 个核心问题，然后：
- 生成 PRD.md（需求文档）
- 生成 spec.md（技术方案）
- 生成 tasks.md（任务拆解）
- 执行 CHECK-1 门禁

### 3. 开发代码

```bash
/tech:code
```

这将：
- 执行 CHECK-2 进入门禁
- 扫描项目代码模式（Pattern Scan）
- 委托 superpowers 执行编码
- 执行 compliance-reviewer 审查
- 执行 CHECK-2 离开门禁
- 生成 VERIFICATION.md

### 4. 提交收口

```bash
/tech:commit
```

这将：
- 执行文档同步检查
- 执行 Knowledge Capture（知识沉淀）
- 生成标准化 commit message
- 执行 Git 提交
- 委托 superpowers 完成分支收尾

---

## 四技能使用说明

### /tech:init - 项目初始化

**触发条件**: 新项目首次使用 tinypowers

**执行流程**:
1. 检测技术栈（pom.xml / build.gradle）
2. 确认项目信息
3. 生成 CLAUDE.md 和 docs/knowledge.md

**输出产物**:
- CLAUDE.md - 项目入口文档
- docs/knowledge.md - 领域知识骨架

**文档**: [skills/tech-init/SKILL.md](skills/tech-init/SKILL.md)

---

### /tech:feature - 功能规划

**触发条件**: 开始新功能开发

**执行流程**:
1. 输入处理（解析功能名称和描述）
2. 引导问答（8 个核心问题）
3. Brainstorming（superpowers 委托）
4. Writing Plans（superpowers 委托）
5. 生成 PRD.md / spec.md / tasks.md
6. CHECK-1 门禁检查
7. 用户确认

**输出产物**:
- PRD.md - 需求文档（背景、范围、验收标准）
- spec.md - 技术方案（目标、核心设计、锁定决策 D-XXX）
- tasks.md - 任务拆解（任务列表 T-XXX，≤8 个）

**CHECK-1 门禁**:
- PRD.md 存在且非空
- spec.md 存在且有 ≥1 条锁定决策
- tasks.md 存在且任务数 ≤8

**文档**: [skills/tech-feature/SKILL.md](skills/tech-feature/SKILL.md)

---

### /tech:code - 代码开发

**触发条件**: CHECK-1 已通过，SPEC-STATE 为 PLAN

**执行流程**:
1. CHECK-2 进入门禁
2. Pattern Scan（项目模式扫描）
3. 编码执行（superpowers 委托）
   - using-git-worktrees（建立隔离）
   - subagent-driven-development（执行编码）
4. 审查
   - 决策自查（D-XXX 落地确认）
   - compliance-reviewer（方案符合性审查）
   - requesting-code-review（代码质量审查，superpowers 委托）
5. 验证（superpowers:verification-before-completion 委托）
6. CHECK-2 离开门禁
7. 生成 VERIFICATION.md

**输出产物**:
- patterns.md - 项目代码模式
- compliance-review-report.md - 合规审查报告
- VERIFICATION.md - 验证报告

**CHECK-2 门禁**:
- 进入: CHECK-1 通过、spec/tasks 存在、SPEC-STATE 为 PLAN
- 离开: 编译通过、compliance-reviewer 通过（无 BLOCK）、决策自查完成

**compliance-reviewer 审查维度**:
- 决策落地（D-XXX 是否实现）
- 接口符合（API 与 spec 一致）
- 数据符合（DB 变更与 spec 一致）
- 范围符合（无方案外变更）
- 安全符合（无安全风险）

**文档**: [skills/tech-code/SKILL.md](skills/tech-code/SKILL.md)

---

### /tech:commit - 提交收口

**触发条件**: CHECK-2 已通过，存在 VERIFICATION.md

**执行流程**:
1. 前置检查（CHECK-2 通过、VERIFICATION.md 存在）
2. 文档同步检查
3. Knowledge Capture（知识沉淀）
4. 生成 commit message
5. Git 提交
6. 委托 finishing-a-development-branch（superpowers）
7. 标记 DONE

**输出产物**:
- Git 提交记录
- 更新的 docs/knowledge.md
- 更新的 SPEC-STATE.md

**Knowledge Capture**:
捕获四类知识写入 docs/knowledge.md：
- 约定 - 项目特有编码约定
- 踩坑 - 调试时间 >30 分钟的问题
- 模式 - 出现 3+ 次的相似实现
- 重构 - 重大结构变更经验

**Commit Message 格式**:
```
[AI-Gen] <type>(<scope>): <description>

- <变更点 1>
- <变更点 2>

Verification: <PASS|FAIL|PARTIAL>
Feature: <FEAT-XXX>
```

**文档**: [skills/tech-commit/SKILL.md](skills/tech-commit/SKILL.md)

---

## 与 superpowers 关系说明

### 职责边界

| 能力 | tinypowers | superpowers |
|------|------------|-------------|
| 流程定义 | 定义 4 技能流程和阶段 | 不介入 |
| 门禁控制 | CHECK-1 / CHECK-2 硬门禁 | 不介入 |
| 方案符合性 | compliance-reviewer | 不介入 |
| 知识沉淀 | Knowledge Capture | 不介入 |
| 格式规范 | D-XXX / T-XXX / EARS 等 | 不介入 |
| 编码实现 | 不介入 | subagent-driven-development |
| 代码审查 | 方案符合性 | 代码质量、设计模式 |
| 工作区隔离 | 不介入 | using-git-worktrees |
| 技术方案 | 提供约束 | brainstorming / writing-plans |

### 协作模式

```
用户 → /tech:feature → tinypowers（引导问答）
                          ↓
                    superpowers（brainstorming）
                          ↓
                    superpowers（writing-plans）
                          ↓
              tinypowers（CHECK-1 门禁）→ [PLAN]
                          ↓
              用户 → /tech:code → tinypowers（CHECK-2 进入）
                                  ↓
                            tinypowers（Pattern Scan）
                                  ↓
                            superpowers（worktrees）
                                  ↓
                            superpowers（subagent 编码）
                                  ↓
              tinypowers（compliance-reviewer）+ superpowers（code-review）
                                  ↓
              tinypowers（CHECK-2 离开）→ [DONE]
                                  ↓
              用户 → /tech:commit → tinypowers（Knowledge Capture + Git 提交）
                                  ↓
                            superpowers（finishing-branch）
```

### 核心原则

- **tinypowers 管 WHAT**: 做什么、门禁是什么、符合什么标准、沉淀什么知识
- **superpowers 管 HOW**: 怎么生成方案、怎么编码、怎么审查代码质量

---

## 项目结构

```
tinypowers/
├── skills/                    # 四技能定义
│   ├── tech-init/
│   │   └── SKILL.md          # /tech:init 技能文档
│   ├── tech-feature/
│   │   └── SKILL.md          # /tech:feature 技能文档
│   ├── tech-code/
│   │   └── SKILL.md          # /tech:code 技能文档
│   └── tech-commit/
│       └── SKILL.md          # /tech:commit 技能文档
├── agents/
│   └── compliance-reviewer.md # 方案符合性审查 Agent
├── scripts/                   # 门禁脚本
│   ├── detect-stack.sh       # 技术栈检测
│   ├── check-gate-1.sh       # CHECK-1 门禁
│   ├── check-gate-2-enter.sh # CHECK-2 进入门禁
│   ├── check-gate-2-exit.sh  # CHECK-2 离开门禁
│   └── pattern-scan.sh       # 项目模式扫描
├── templates/                 # 文档模板
│   ├── CLAUDE.md             # 项目入口模板
│   ├── knowledge.md          # 领域知识模板
│   ├── PRD.md                # 需求文档模板
│   ├── spec.md               # 技术方案模板
│   ├── tasks.md              # 任务拆解模板
│   └── commit-message.md     # 提交信息模板
├── docs/
│   └── internal/             # 内部设计文档
│       ├── feature-questions.md    # 引导问答设计
│       ├── pattern-scan-spec.md    # Pattern Scan 规范
│       ├── compliance-reviewer-spec.md # compliance-reviewer 规范
│       ├── doc-sync-checklist.md   # 文档同步检查清单
│       └── knowledge-capture-spec.md # Knowledge Capture 规范
└── docs/plans/               # 版本规划文档
    ├── contracts/            # 接口契约
    │   ├── v1.0-interface.md
    │   └── data-formats.md
    └── v1.0/                 # v1.0 规划
        └── ...
```

---

## 版本信息

- **当前版本**: v1.0.0
- **状态**: 正式发布
- **适用范围**: Java (Maven/Gradle) 项目

### v1.0.0 功能清单

- [x] /tech:init - 技术栈检测 + 骨架初始化
- [x] /tech:feature - 引导问答 + CHECK-1 门禁
- [x] /tech:code - Pattern Scan + compliance-reviewer + CHECK-2 门禁
- [x] /tech:commit - Knowledge Capture + Git 提交
- [x] 5 个门禁脚本
- [x] 7 个文档模板
- [x] compliance-reviewer Agent

---

## 贡献指南

### 提交规范

使用 tinypowers 自身的 /tech:commit 流程：

1. 创建功能分支
2. 使用 /tech:feature 规划变更
3. 使用 /tech:code 开发实现
4. 使用 /tech:commit 提交代码

### 文档更新

- SKILL.md 更新需同步更新本 README 对应章节
- 脚本变更需更新 `docs/plans/contracts/v1.0-interface.md`
- 模板变更需更新 `docs/plans/contracts/data-formats.md`

---

## 许可证

MIT License

---

## 相关链接

- [Claude Code](https://claude.ai/code)
- [superpowers 插件](https://github.com/...)
- [v1.0 接口契约](docs/plans/contracts/v1.0-interface.md)
- [数据格式契约](docs/plans/contracts/data-formats.md)
>>>>>>> c5568cc (docs(v1.0): complete v1.0 release preparation)
