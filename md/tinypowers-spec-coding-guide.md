# tinypowers — AI 辅助编码规范与工程实践

> 拍卖与新能源技术部 · 拍卖平台 · 内部技术分享
>
> 版本：v1.0 | 更新日期：2026-03-31

---

## 目录

- [一、为什么需要这套规范](#一为什么需要这套规范)
- [二、整体架构：四层模型](#二整体架构四层模型)
- [三、核心流程：四个 Skill 走完一个需求](#三核心流程四个-skill-走完一个需求)
  - [3.1 /tech:init — 项目初始化](#31-techinit--项目初始化)
  - [3.2 /tech:feature — 需求分析与方案设计](#32-techfeature--需求分析与方案设计)
  - [3.3 /tech:code — 编码执行与审查验证](#33-techcode--编码执行与审查验证)
  - [3.4 /tech:commit — 交付收口与知识沉淀](#34-techcommit--交付收口与知识沉淀)
- [四、关键设计原则](#四关键设计原则)
  - [4.1 薄编排层](#41-薄编排层)
  - [4.2 文件即状态](#42-文件即状态)
  - [4.3 缝合优先](#43-缝合优先)
  - [4.4 决策锁定](#44-决策锁定)
  - [4.5 HARD-GATE 强制门禁](#45-hard-gate-强制门禁)
- [五、工程目录结构](#五工程目录结构)
- [六、多工程协作规范](#六多工程协作规范)
- [七、技术栈与集成](#七技术栈与集成)
- [八、常见问题](#八常见问题)

---

## 一、为什么需要这套规范

### 1.1 背景

团队使用 Claude Code + AI 辅助开发后，面临三个核心问题：

| 问题 | 表现 | 后果 |
|------|------|------|
| **流程不统一** | 有人直接写代码，有人先做方案，有人跳过审查 | 代码质量参差不齐，review 成本翻倍 |
| **知识不沉淀** | 每次需求从零开始，同样的坑踩多次 | 新人上手慢，老员工重复救火 |
| **状态不透明** | 需求做到哪了、卡在哪、决策是什么，只存在于 AI 会话里 | 换人接手等于重做 |

### 1.2 目标

tinypowers 是一套**轻量级 AI 开发工作流框架**，面向 Java / Spring Boot 为主的工程化研发场景。它不是业务应用，而是一套可复用的"开发操作系统"：

- 用 **Skills** 定义流程（做什么、按什么顺序、什么情况下禁止继续）
- 用 **Agents** 定义角色（谁来审查、谁来设计、谁来验证）
- 用 **Hooks** 做运行期守护（防止跳过门禁、防止残留调试代码）
- 用 **文件** 记录状态（关键产物和执行状态落到 Markdown，不依赖会话上下文）

### 1.3 与 superpowers 的关系

tinypowers 不是从零构建所有能力，而是站在 [obra/superpowers](https://github.com/obra/superpowers) 肩膀上做**编排层**：

| 层级 | 职责 | 谁提供 |
|------|------|--------|
| **执行层（HOW）** | 怎么头脑风暴、怎么派子 agent、怎么做 review、怎么验证 | superpowers（外部插件） |
| **编排层（WHAT）** | 做什么、按什么顺序、门禁是什么、产出什么 | tinypowers（自有） |
| **领域层（DOMAIN）** | Java/Spring Boot 编码规范、安全规则、MySQL DBA 规范 | tinypowers（自有） |

**一句话理解**：superpowers 提供"纪律驱动的 Skills 库"，tinypowers 定义"在 Java/Spring Boot 场景下怎么编排这些 Skills"。

---

## 二、整体架构：四层模型

```
┌─────────────────────────────────────────────────────────┐
│                    用户意图层                             │
│         "做个用户登录" / "修个 Bug" / "提交代码"           │
└────────────────────────┬────────────────────────────────┘
                         │ 意图路由
┌────────────────────────▼────────────────────────────────┐
│                    Skill 编排层                           │
│  /tech:init → /tech:feature → /tech:code → /tech:commit │
└────────────────────────┬────────────────────────────────┘
                         │ 委托 + 约束
┌────────────────────────▼────────────────────────────────┐
│                    Agent 审查层                           │
│  architect → spec-compliance → security → code-quality  │
│  decision-guardian → tech-plan-checker → tech-verifier  │
└────────────────────────┬────────────────────────────────┘
                         │ 规则 + 模板
┌────────────────────────▼────────────────────────────────┐
│                    规则与模板层                            │
│  configs/rules/ (common → java → mysql 分层继承)         │
│  configs/templates/ (PRD / 技术方案 / 任务拆解 / ...)     │
└─────────────────────────────────────────────────────────┘
```

---

## 三、核心流程：四个 Skill 走完一个需求

### 3.1 /tech:init — 项目初始化

**什么时候用**：新项目首次接入，或重新初始化 AI 开发环境。

**做什么**：
1. 检测目标项目的技术栈（Java / Node.js / Go / Python）
2. 扫描项目结构，生成领域知识摘要（写入 `docs/knowledge.md`）
3. 安装 hooks、rules、templates 骨架
4. 生成 `CLAUDE.md` 入口文件

**产出**：
```
目标项目/
├── CLAUDE.md              ← AI 工作流入口
├── .claude/skills/        ← 安装的 skills
├── docs/
│   ├── rules/             ← 编码规范（common + 技术栈特定）
│   ├── guides/            ← 使用指南
│   └── templates/         ← 文档模板
└── hooks/                 ← 运行期守护脚本
```

### 3.2 /tech:feature — 需求分析与方案设计

**什么时候用**：新功能需求、需求模糊不完整、需要先做技术方案和任务拆解。

**流程**（5 步，禁止跳步）：

```
Phase 0: 准备          → 解析需求 ID、扫描种子、创建目录和分支
Phase 1: 需求理解      → 读 PRD、one-at-a-time 确认（背景→用户→范围→验收→非功能）
Phase 2: 歧义检测      → 多方案对比、消除高优先级歧义（委托 superpowers:brainstorming）
Phase 3: 技术方案      → 设计方案、用户确认、决策锁定（D-0N 格式）
Phase 4: 任务拆解      → Epic→Story→Task、依赖拓扑（委托 superpowers:writing-plans）
Phase 5: 任务表验证    → 验证任务表格式、依赖、粒度（agents/tech-plan-checker）
```

**关键门禁**：
- 高优先级歧义未清零 → 禁止进入技术方案
- 技术方案未通过显式确认 → 禁止锁定决策
- 任务拆解未通过 plan-check → 禁止流入 /tech:code

**最终产物**：
```
features/{需求编号}-{需求名称}/
├── CHANGESET.md              ← 变更集元数据
├── SPEC-STATE.md             ← 生命周期状态（INIT→REQ→DESIGN→TASKS→EXEC→...）
├── PRD.md                    ← 产品需求文档
├── 需求理解确认.md            ← 已确认的需求理解
├── 技术方案.md                ← 含 D-0N 锁定的关键决策
├── 任务拆解表.md              ← 通过 plan-check 的可执行任务表
└── seeds/ notes/ archive/    ← 种子、笔记、归档
```

**决策锁定机制**：

方案确认后，关键决策写入持久化记忆并同步到文档，格式为 `D-XXX`：

| 决策编号 | 类型 | 示例 |
|---------|------|------|
| D-01 | 架构/框架选型 | 使用 MyBatis-Plus 而非 JPA |
| D-02 | 数据结构/表结构 | 订单表增加 tenant_id 字段 |
| D-03 | 对外接口契约 | 返回格式统一为 Result<T> |
| D-04 | 中间件/依赖选型 | 使用 Redisson 分布式锁 |
| D-05 | 特殊安全方案 | 敏感字段 AES 加密存储 |

**原则**：已确认决策在 `/tech:code` 阶段不能被擅自推翻。如需修改，必须重新确认并更新记录。

### 3.3 /tech:code — 编码执行与审查验证

**什么时候用**：执行已规划的任务、开始编码实现、或继续未完成的 wave 执行。

**流程**（6 步，顺序推进）：

```
Phase 0: Gate Check           → 验证任务表、拓扑排序、决策约束
Phase 1: Context Preparation  → 预加载技术方案、领域知识、learnings
Phase 2: Pattern Scan         → 搜索最相似已有实现（缝合扫描）
Phase 3: Execute              → 委托 superpowers:subagent-driven-development
Phase 4: Review               → 方案符合性 → 安全 → 代码质量（三阶段审查）
Phase 5: Verify               → 委托 superpowers:verification-before-completion
```

**硬约束**：
- **缝合优先**：任务执行前必须搜索项目中最相似的已有实现作为锚点，复制骨架 → 替换业务字段 → 只在差异点写新代码。纯新模块标记 `GREENFIELD` 后可从零编写
- **TDD 强制门禁**：RED（写失败测试）→ GREEN（最小代码通过）→ REFACTOR（重构提升质量）
- **偏差 3 次升级**：同一问题连续失败 3 次后停止同方向尝试，上升到架构层讨论

**审查顺序**（不可跳步）：

```
1. agents/spec-compliance-reviewer  — 技术方案符合性（是不是实现了方案要求的东西）
2. agents/security-reviewer         — 安全风险审查（注入/鉴权/敏感信息/不安全依赖）
3. superpowers:code-reviewer        — 代码质量审查（命名/结构/测试/性能）
```

**验证标准**（4-Level 证据验证）：

| Level | 名称 | 验证内容 | 证据要求 |
|-------|------|----------|----------|
| L1 | Exists | 文件/方法存在 | 文件路径确认 |
| L2 | Substantive | 真实实现（非 stub） | 函数有完整逻辑 |
| L3 | Wired | 被其他部分调用 | 调用链确认 |
| L4 | Data Flow | 数据真实流通 | 集成测试或端到端验证 |

**覆盖率基线**：

| 场景 | 行覆盖率 | 分支覆盖率 |
|------|---------|-----------|
| 默认 | ≥ 80% | ≥ 70% |
| 核心业务逻辑 | ≥ 90% | ≥ 80% |

### 3.4 /tech:commit — 交付收口与知识沉淀

**什么时候用**：提交代码、创建 PR、同步文档、沉淀知识、完成 feature 收口。

**流程**：

```
1. Document Sync       → 同步技术方案、API 文档、README 与实现一致
2. Knowledge Capture   → 把 learnings.md 沉淀到项目级 docs/knowledge.md
3. Commit Preparation  → 检查清单确认（测试/边界/决策/证据）
4. Git Commit          → Conventional Commits + 结构化 Trailer
5. PR Workflow         → 推送 + 创建 Pull Request
6. Changelog Update    → 更新变更日志（如适用）
7. Branch Cleanup      → 委托 superpowers:finishing-a-development-branch
```

**Commit Trailer 格式**（记录决策上下文）：

```
feat(auth): prevent silent session drops

Constraint: Auth service does not support token introspection
Rejected: Extend token TTL to 24h | security policy violation
Evidence: 127 tests passed, coverage 94%
Confidence: high
```

**知识沉淀飞轮**：

```
编码中发现 learnings → 写入 notepads/learnings.md
                      → /tech:commit 评估是否值得沉淀
                      → 值得 → 写入 docs/knowledge.md（项目级）
                      → 不值得 → 保留在 feature 级
                      → 下次 /tech:code 读取 knowledge.md 作为领域知识
                      → 减少重复踩坑
```

沉淀判断标准：

| 值得沉淀 | 不值得沉淀 |
|---------|-----------|
| 内部组件的非显而易见用法 | 公开文档可查的知识 |
| 平台/框架级别的约束和陷阱 | 仅本次需求特有的业务逻辑 |
| 调试发现的隐蔽 bug 模式 | 一次性的 typos 和格式问题 |
| 跨需求可复用的编码模式 | 已在 knowledge.md 中存在的条目 |

---

## 四、关键设计原则

### 4.1 薄编排层

tinypowers 的 Skill 文件只定义 **WHAT**（做什么、顺序、门禁、产物），**HOW**（具体怎么做）委托给配套文档或 superpowers。

| 文件 | 瘦身前 | 瘦身后 | 瘦身策略 |
|------|--------|--------|---------|
| tech-feature/SKILL.md | 347 行 | ~120 行 | Phase 详细步骤下沉到配套文档 |
| tech-code/SKILL.md | 199 行 | ~100 行 | Wave 执行细节委托 superpowers |

**好处**：
- SKILL.md 可读性强，新成员 5 分钟理解全流程
- HOW 的变化不影响编排层，superpowers 升级无感知
- 配套文档可独立演进，不耦合

### 4.2 文件即状态

关键产物和执行状态落到 Markdown 文件，不依赖 AI 会话上下文：

| 文件 | 作用 | 谁读写 |
|------|------|--------|
| `SPEC-STATE.md` | 需求生命周期状态 | /tech:feature 写，/tech:code 读 |
| `STATE.md` | 执行期状态（Wave/任务/阻塞） | /tech:code 持续更新 |
| `技术方案.md` | 技术设计 + 决策锁定 | /tech:feature 写，/tech:code 读 |
| `任务拆解表.md` | 可执行任务序列 | /tech:feature 写，/tech:code 读 |
| `VERIFICATION.md` | 验证证据 | /tech:code 写，/tech:commit 读 |

### 4.3 缝合优先

编码前先搜索项目中最相似的已有实现，**复制骨架 → 替换业务字段 → 只写差异**。

**搜索策略**：

| 维度 | 方法 | 示例 |
|------|------|------|
| 同类型文件 | 按文件类型/层匹配 | 新建 Controller → 搜现有 Controller |
| 同业务域 | 按目录名、模块名匹配 | 用户模块 → 搜 src/user/ 下文件 |
| 同模式 | 按功能模式匹配 | CRUD → 找最近的 CRUD 实现 |

**好处**：风格一致、减少重复造轮子、降低 AI 幻觉。

### 4.4 决策锁定

关键决策在方案阶段确认后，编码阶段不能擅自推翻。防止 AI 在编码时"觉得更好的方式"而偏离已确认方案。

### 4.5 HARD-GATE 强制门禁

关键约束必须满足，禁止绕过。每个 Skill 都定义了自己的 HARD-GATE：

| Skill | 门禁条件 |
|-------|---------|
| /tech:feature | 高优先级歧义清零、技术方案已确认、决策已锁定 |
| /tech:code | SPEC-STATE phase 为 TASKS/EXEC、任务表通过 plan-check |
| /tech:commit | VERIFICATION.md 存在、测试通过、工作区干净 |

---

## 五、工程目录结构

### 5.1 tinypowers 框架自身

```
tinypowers/
├── skills/                    # 主工作流定义
│   ├── tech-code/
│   │   ├── SKILL.md           # 薄编排层（~100 行）
│   │   ├── context-preload.md # 上下文预加载
│   │   └── pattern-scan.md    # 缝合扫描 + 学习捕获
│   ├── tech-feature/
│   │   ├── SKILL.md           # 薄编排层（~120 行）
│   │   ├── requirements-guide.md   # PRD 分析指引
│   │   ├── ambiguity-check.md      # 歧义检测维度
│   │   ├── tech-design-guide.md    # 技术方案模板 + 自检
│   │   └── verification.md         # 各阶段验证标准
│   ├── tech-commit/           # 提交收口流程
│   └── tech-init/             # 项目初始化
├── agents/                    # 角色化 Agent（7 个）
│   ├── architect.md           # 技术方案设计
│   ├── decision-guardian.md   # 决策锁定防漂移
│   ├── tech-plan-checker.md   # 任务表验证
│   ├── spec-compliance-reviewer.md  # 方案符合性审查
│   ├── security-reviewer.md   # 安全审查
│   └── java/                  # Java 专属 reviewer
│       ├── java-reviewer.md
│       └── springboot-reviewer.md
├── hooks/                     # 运行期守护（6 个）
│   ├── spec-state-guard.js    # 拦截跳步操作
│   ├── residual-check.js      # 检测残留调试代码
│   ├── gsd-code-checker.js    # 提醒运行验证命令
│   └── ...
├── configs/
│   ├── rules/                 # 分层编码规范
│   │   ├── common/            # 通用规则（所有项目必装）
│   │   ├── java/              # Java/Spring Boot（继承 common）
│   │   └── mysql/             # MySQL DBA 规范
│   └── templates/             # 文档模板
├── contexts/                  # 工作模式（dev / review / research）
├── docs/                      # 使用指南
├── manifests/                 # 安装组件定义
└── scripts/                   # validate / doctor / scaffold
```

### 5.2 业务项目中的 features 目录

```
业务项目/
├── features/
│   └── CSS-2005-mark-customer/
│       ├── CHANGESET.md              ← 变更集元数据
│       ├── SPEC-STATE.md             ← 当前阶段：EXEC
│       ├── PRD.md                    ← 产品需求
│       ├── 需求理解确认.md            ← 已确认
│       ├── 技术方案.md                ← 含 D-01~D-05 决策
│       ├── 任务拆解表.md              ← Epic→Story→Task
│       ├── STATE.md                  ← Wave 执行状态
│       ├── VERIFICATION.md           ← 4-Level 验证证据
│       ├── code-review.md            ← 审查报告
│       ├── 测试报告.md                ← 测试结论
│       ├── notepads/
│       │   └── learnings.md          ← 编码经验
│       ├── seeds/                    ← 需求种子
│       └── archive/                  ← 历史归档
└── docs/
    └── knowledge.md                  ← 项目级知识沉淀
```

---

## 六、多工程协作规范

### 6.1 工程 README 要求

每个工程的 `README.md` 应包含：

1. **工程总体介绍** — 定位、职责、技术栈
2. **接口规范文档** — Dubbo API、Http API
3. **Jar 类工程需要包含**：
   - `@Component` / `@Service` / `@Bean` 定义的抽象类及所有 public 方法
   - 自定义注解（如 `@Access`、`@TokenNoRequire`、`@Attribute`）
   - 基础类（BaseController、XException 等）
   - 工具类（所有 public static 方法）

### 6.2 跨工程依赖

| 工程 | 职责 | 接口方式 |
|------|------|---------|
| car-source | 车源管理 | Dubbo API |
| sale-tech | 交易技术 | Dubbo API + HTTP |
| agent-service | Agent 服务 | HTTP API |

跨工程调用需在技术方案中明确：
- 接口契约（入参/出参/错误码）
- 超时和重试策略
- 降级方案

---

## 七、技术栈与集成

### 7.1 技术栈兼容性

| 技术栈 | 支持级别 | 说明 |
|--------|---------|------|
| Java / Spring Boot | 完整支持 | 主栈，含专属 reviewer |
| Node.js | 支持 | 标准 npm 工作流 |
| Go | 支持 | 标准 go 工具链 |
| Python | 基础支持 | 通用规则适用 |
| MySQL | 规则层支持 | DBA 规范独立配置 |

### 7.2 外部依赖

| 依赖 | 用途 | 安装方式 |
|------|------|---------|
| [superpowers](https://github.com/obra/superpowers) | 纪律驱动的 Skills 库 | claude-plugin 安装 |
| Jira MCP | 需求文档获取 | Claude Code 插件 |
| CWiki MCP | 文档同步 | Claude Code 插件 |

### 7.3 安装

```bash
# 全局安装（推荐）
git clone https://github.com/Walternater/tinypowers.git ~/.tinypowers && ~/.tinypowers/install.sh --global

# 项目内初始化
/tech:init

# 验证安装
npm run validate && npm test
```

---

## 八、常见问题

### Q1：为什么不能跳过 /tech:feature 直接写代码？

历史教训：AI 看到分析结果后直接跳到编码阶段，跳过了需求确认、技术方案、任务拆解等所有规划阶段。SPEC-STATE 门禁和意图路由是为了防止这种行为。Hook 层 (`spec-state-guard.js`) 会在运行时拦截违规操作。

### Q2：TDD 一定要写测试吗？

`/tech:code` 的 TDD 门禁有例外条款：小任务快速修复、纯配置变更、文档更新、基础设施代码、原型探索代码不强制 TDD。除此之外，每个任务必须遵循 RED-GREEN-REFACTOR 循环。

### Q3：决策锁定后能改吗？

能，但不能"擅自"改。需要重新走确认流程，更新 `技术方案.md` 中的 D-XXX 记录，并通知所有相关方。

### Q4：superpowers 升级会影响 tinypowers 吗？

不会。tinypowers 是薄编排层，只定义 WHAT。superpowers 的 HOW 变化不影响编排层。superpowers 通过外部插件引用，不拷贝到项目内，无版本同步负担。

### Q5：怎么查看当前需求的进度？

查看 `features/` 目录下活跃 Feature 的 `SPEC-STATE.md` 和 `STATE.md`，可以了解当前阶段、Wave、已完成任务、阻塞项和下一步建议。

---

## 附录：参考项目

- [obra/superpowers](https://github.com/obra/superpowers) — 纪律驱动的 Skills 库
- [get-shit-done](https://github.com/gsd-build/get-shit-done) — Wave 执行 + Deviation Rules
- [gstack](https://github.com/nickariaslabs/gstack) — 虚拟工程团队
