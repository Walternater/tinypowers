# tinypowers

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

### 一键安装

当前的一键安装脚本面向 Claude Code，执行后会自动把 tinypowers 的 skills 接入 `~/.claude/skills/`。
默认安装最新稳定版本；后续重复执行同一条命令即可升级到最新稳定版。

```bash
curl -fsSL https://raw.githubusercontent.com/Walternater/tinypowers/main/install.sh | bash
```

默认会：
- 克隆或更新 tinypowers 到 `~/.tinypowers`
- 将 tinypowers 更新到最新稳定 tag
- 将 `skills/*` 全部链接到 `~/.claude/skills/`
- 创建 `~/.claude/skills/tinypowers -> ~/.tinypowers`

常见参数：

```bash
# 安装到自定义目录
curl -fsSL https://raw.githubusercontent.com/Walternater/tinypowers/main/install.sh | bash -s -- --dir ~/tools/tinypowers

# 只准备安装目录，不创建 Claude skill 链接
curl -fsSL https://raw.githubusercontent.com/Walternater/tinypowers/main/install.sh | bash -s -- --skip-links

# 安装或升级到最新开发版（main）
curl -fsSL https://raw.githubusercontent.com/Walternater/tinypowers/main/install.sh | bash -s -- --version main

# 如果本地已经有同名 skill 目录，无交互场景下显式允许替换
curl -fsSL https://raw.githubusercontent.com/Walternater/tinypowers/main/install.sh | bash -s -- --force
```

如果检测到 `~/.claude/skills/` 下已有同名目录，安装脚本会在交互终端里提示你选择“保留原内容并退出”还是“替换为 tinypowers 链接”；只有在无交互场景下，才需要显式传 `--force`。

### 本地仓库安装

1. **克隆仓库**
   ```bash
   git clone https://github.com/Walternater/tinypowers.git ~/tinypowers
   cd ~/tinypowers
   ```

2. **执行安装脚本**
   ```bash
   ./install.sh --dir "$PWD"
   ```

3. **设置环境变量**（可选）
   ```bash
   export TINYPOWERS_HOME=~/tinypowers
   export PATH=$PATH:$TINYPOWERS_HOME/scripts
   ```

4. **验证安装**
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
- [x] 6 个文档模板
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
- 脚本变更需同步更新对应的 `docs/internal/*.md` 设计文档
- 模板变更需同步更新本 README、相关 SKILL.md 和测试说明

---

## 许可证

MIT License

---

## 相关链接

- [Claude Code](https://claude.ai/code)
- [superpowers 插件](https://github.com/...)
- [文档同步清单](docs/internal/doc-sync-checklist.md)
- [Knowledge Capture 规范](docs/internal/knowledge-capture-spec.md)
