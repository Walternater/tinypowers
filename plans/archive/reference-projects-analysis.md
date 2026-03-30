# tinypowers 对标分析：11 个优秀项目的可借鉴模式

> 生成日期：2026-03-29
> 来源项目：superpowers, get-shit-done, gstack, OpenSpec, oh-my-openagent, oh-my-claudecode, claude-code-spec-workflow, cc-sdd, everything-claude-code, claude-code-best-practice, agency-agents-zh

## 目录

- [一、tinypowers 已有优势](#一tinypowers-已有优势不应丢失)
- [二、各项目核心创新概览](#二各项目核心创新概览)
- [三、高优先级改进](#三高优先级改进直接影响能力边界)
- [四、中优先级改进](#四中优先级改进显著提升体验)
- [五、低优先级改进](#五低优先级改进锦上添花)
- [六、架构级建议](#六架构级建议长期方向)
- [七、优先级排序总览](#七优先级排序总览)

---

## 一、tinypowers 已有优势（不应丢失）

| 优势 | 说明 | 独特性 |
|------|------|--------|
| **Decision Guardian Agent** | 锁定技术决策防止 scope drift | 11 个项目中独有 |
| **Anti-Rationalization 模式** | 防止 AI 跳过检查的反合理化表格 | 与 superpowers 的 persuasion-resistant 设计异曲同工 |
| **分层规则继承** | common/ → java/ → mysql/ 的规则覆盖机制 | 干净且可扩展 |
| **File-as-State 哲学** | STATE.md / SPEC-STATE.md 作为持久化状态 | 跨会话恢复 |
| **Ordered Review Pipeline** | spec compliance → security → code quality 顺序审查 | 三阶段门禁 |
| **组件化安装系统** | profiles + 栈自动检测 | 按需安装 |
| **9 类自校验** | validate.js 覆盖 metadata、标签平衡、交叉引用 | 框架自验证 |

---

## 二、各项目核心创新概览

### 2.1 superpowers — 提示工程纪律

| 创新点 | 说明 |
|--------|------|
| **Subagent-Driven Development (SDD)** | 每个 task 用 fresh subagent 实现 + 两阶段 review（spec compliance + code quality） |
| **Persuasion-Resistant Skill Design** | 基于学术研究（Meincke 2025, N=28000）设计抗 LLM 合理化的提示 |
| **TDD for Documentation** | 用 RED/GREEN/REFACTOR 周期测试和迭代 skill 本身 |
| **Claude Search Optimization (CSO)** | description 只写触发条件，不写工作流摘要，避免 agent 走捷径 |
| **Visual Brainstorming Companion** | 本地 HTTP server 为终端 agent 提供浏览器可视化交互 |

### 2.2 get-shit-done (GSD) — 上下文工程

| 创新点 | 说明 |
|--------|------|
| **Plans as Prompts (XML)** | PLAN.md 就是可执行 prompt，XML 结构精确到文件路径、验证命令 |
| **Goal-Backward Verification** | 从 "什么必须为真" 反推，4 层验证：exists → substantive → wired → data flowing |
| **Context Budget Engineering** | 明确映射 context 用量到质量等级，任务拆分受 context 预算约束 |
| **Seeds with Trigger Conditions** | 带触发条件的前瞻性想法，自动在合适 milestone 呈现 |
| **Multi-Runtime Abstraction** | 一份 canonical 定义，安装时转换为 6 种 AI 编码平台格式 |
| **Automation-First Checkpoint** | 90/9/1 分布（verify/decision/action），"有 CLI 就自动化" |

### 2.3 gstack — 工程团队模拟

| 创新点 | 说明 |
|--------|------|
| **SKILL.md Template System** | 人写 .tmpl，编译时从代码元数据自动生成 SKILL.md，防止文档漂移 |
| **Fix-First Review** | 每个 review finding 都有 action：机械问题自动修复，模糊问题批量提问 |
| **Cross-Model Consensus** | Claude subagent + Codex CLI 独立审查，产出同意/分歧矩阵 |
| **User Sovereignty** | 模型一致同意也是建议，不是决定；User Challenge 类永不自动决定 |
| **Confidence-Gated Security Audit** | 日常模式 8/10 confidence 门禁（零噪音），全面模式 2/10 |

### 2.4 OpenSpec — 规范驱动开发

| 创新点 | 说明 |
|--------|------|
| **Delta Specs** | 用 ADDED/MODIFIED/REMOVED/RENAMED 表达变更，而非重写完整 spec |
| **Artifact DAG with Filesystem State** | 工件依赖图 + 文件存在性 = 状态，用 Kahn 算法做拓扑排序 |
| **Schema-Driven Workflows** | YAML schema 定义工件类型和依赖，fork 即可自定义 |
| **Explore Stance** | 明确的"思考伙伴"模式，不强制输出，不写代码 |
| **Tool Adapter Registry** | 24 种 AI 工具适配器，新增平台 = 一个 adapter 文件 |

### 2.5 oh-my-openagent — 多模型编排

| 创新点 | 说明 |
|--------|------|
| **Hash-Anchored Edits** | 每行读取时标记 content hash，编辑时验证 hash 匹配防腐败 |
| **Semantic Category Delegation** | 按任务类型（visual-engineering）委托，不按模型名 |
| **3-Layer Orchestration** | Planning → Execution → Workers，每层工具权限严格限制 |
| **Dynamic Prompt Assembly** | agent prompt 运行时从可用 tools/agents/skills 动态组装 |
| **Skill-Embedded MCPs** | skill 激活时 MCP server 按需启动，完成后销毁 |
| **Wisdom Accumulation** | 每个 task 完成后提取 learnings，传递给后续 subagent |

### 2.6 oh-my-claudecode — 持久化编排

| 创新点 | 说明 |
|--------|------|
| **Hook-Based Keyword Detection** | 自然语言关键词（ralph/autopilot）→ system-reminder XML 注入 |
| **Compaction-Resistant Notepad** | PreCompact 保存 → resume 重新注入，穿越 context 重置 |
| **Mathematical Ambiguity Scoring** | 加权维度评分（Goal 35-40%, Constraints 25-30%, Criteria 25-30%），歧义 < 20% 才执行 |
| **Stage Handoff Documents** | pipeline 阶段间传递决策、拒绝方案、风险、文件列表 |
| **RALPLAN-DR Structured Deliberation** | Principles → Decision Drivers → Viable Options 结构化审议 |

### 2.7 claude-code-spec-workflow — 规格工作流

| 创新点 | 说明 |
|--------|------|
| **Auto-Generated Per-Task Commands** | tasks.md 批准后自动生成每个 task 的独立命令，内嵌全部上下文 |
| **Validation-Only Agents** | 只读审查 agent，硬限制禁止修改任何文件 |
| **EARS Format** | WHEN/IF/THEN/SHALL 格式验收标准 |
| **Approval Stamping** | 文档顶部加 `APPROVED` 标记，下游阶段检查 |
| **Steering Documents** | product.md / tech.md / structure.md 持久项目上下文 |
| **File Cache with mtime** | 全局缓存 + 修改时间失效，避免重复文件读取 |

### 2.8 cc-sdd — Kiro 风格规范驱动

| 创新点 | 说明 |
|--------|------|
| **Rules/Templates 分离** | Rules = AI 判断准则；Templates = 输出结构 |
| **Adaptive Discovery** | 自动评估需求复杂度，按复杂度调整研究深度 |
| **Parallel Task Markers (P)** | 自动标注可并行任务，4 条判断标准 |
| **spec.json Phase Tracking** | 轻量 JSON 元数据跟踪阶段状态和审批 |
| **Manifest-Based Multi-Agent Templating** | 一套 rules/templates 通过 manifest 渲染为 10 种 AI 工具格式 |

### 2.9 everything-claude-code — 持续学习

| 创新点 | 说明 |
|--------|------|
| **Continuous Learning (Instincts)** | hook 观察 → 原子 instincts → confidence scoring → 自动演化为 skill |
| **Config Protection Hooks** | 阻止 agent 削弱 linter/formatter 配置 |
| **Hook Profile System** | minimal/standard/strict + 按 ID 禁用 |
| **In-Process Hook Execution** | `require()` 代替 `spawnSync`，节省 50-100ms/hook |
| **De-Sloppify Pattern** | 独立 cleanup agent pass，不在 implementer prompt 中加负面指令 |
| **Project Auto-Detection** | 自动识别语言（12 种）和框架（30+），启动时注入上下文 |

### 2.10 claude-code-best-practice — 架构模式

| 创新点 | 说明 |
|--------|------|
| **Command → Agent → Skill 三层架构** | Command = 用户入口；Agent = 自治角色；Skill = 可复用过程 |
| **Skills as Folders** | references/ + examples/ + scripts/ 渐进式披露 |
| **Gotchas Sections** | 每个 skill 记录已知失败模式 |
| **Glob-Scoped Rules** | 规则按文件模式匹配加载（`Glob: **/*.java`） |
| **Agent Memory** | `.claude/agent-memory/` 持久化 agent 状态 |
| **Cross-Model Verification** | Claude 实现 + Codex 审查 |

### 2.11 agency-agents-zh — Agent 角色库

| 创新点 | 说明 |
|--------|------|
| **Department-Based Taxonomy** | 按真实部门组织 186 个 agent |
| **Structured Handoff Templates** | 7 种交接模板（standard/QA pass/fail/escalation/phase gate/sprint/incident） |
| **Canonical Source + Multi-Format Derivation** | 一份 Markdown → 14 种工具格式 |
| **NEXUS Orchestration** | 7 阶段 pipeline + 3 种部署模式（Full/Sprint/Micro） |
| **Evidence-Based Quality Gates** | Reality Checker 默认 stance = "needs improvement" |
| **MCP Memory Integration** | prompt 中加几行启用跨会话记忆，无代码改动 |

---

## 三、高优先级改进（直接影响能力边界）

### 3.1 Context Budget 感知

**来源：** GSD

**现状：** tinypowers 有 context monitor hook 提供 35%/25% 阈值警告，但没有把 context 用量作为规划约束。

**改进方案：**
- Planner agent 创建任务时估算 context 占用
- 任务拆分时强制单个 wave 的 context 预算 ≤ 50%
- 在 STATE.md 中增加 `context_usage` 字段

**Context 质量映射表：**

| Context Usage | Quality | Action |
|---------------|---------|--------|
| 0-30% | PEAK | 正常执行 |
| 30-50% | GOOD | 正常执行 |
| 50-70% | DEGRADING | 考虑拆分 wave |
| 70%+ | POOR | 必须拆分或 compact |

**影响：** 防止 context 质量退化导致的输出质量下降
**难度：** 低

### 3.2 增强 Session 持久化

**来源：** oh-my-claudecode / GSD

**现状：** Session manager 保存 snapshot 到 `/tmp/`，丢失风险高。

**改进方案：**
- 在 `.tinypowers/` 目录下创建持久化状态：
  - `notepad.md` — PreCompact 前保存关键状态，resume 时重新注入
  - `handoff.json` — 结构化会话交接（完成的工作、剩余工作、决策、阻塞项）
  - `project-memory.json` — 跨会话项目知识库
- 在 `features/{id}/` 下增加 `notepads/` 目录存储 per-feature 知识积累

**影响：** 跨会话连续性大幅提升
**难度：** 中

### 3.3 Executor 预加载上下文

**来源：** claude-code-spec-workflow

**现状：** tech-code 的 wave 执行有 context pre-loading 描述，但未生成自包含的 per-task 命令。

**改进方案：**
- 在 `features/{id}/` 下自动生成 per-task 执行命令文件，内嵌：
  - 完整的 requirements.md + tech-design.md 相关片段
  - 具体的 task 详情、验收标准
  - `DO NOT reload context` 指令
- 每个 task executor 获得自包含上下文，减少 token 浪费

**影响：** 减少 token 浪费，提升执行独立性
**难度：** 中

### 3.4 Task 智慧积累

**来源：** oh-my-openagent

**现状：** 任务执行之间没有知识传递机制。

**改进方案：**
- wave 执行间，每个完成的 task 提取 learnings（命名约定、陷阱、成功模式）
- 存储到 `features/{id}/notepads/learnings.md`
- 后续 wave 的 subagent 自动接收这些 learnings

**影响：** 提升后续任务质量，减少重复错误
**难度：** 低

### 3.5 EARS 格式需求

**来源：** cc-sdd / claude-code-spec-workflow

**现状：** PRD 模板存在，但没有强制要求验收标准格式。

**改进方案：**
- 在 PRD 模板中要求使用 EARS 格式：
  - `WHEN [事件] THEN [系统] SHALL [响应]`
  - `IF [条件] THEN [系统] SHALL [响应]`
  - `WHILE [状态] [系统] SHALL [持续行为]`
- Spec-compliance-reviewer 检查 EARS 格式合规性

**示例：**
```markdown
### Requirement: 用户登录
- WHEN 用户输入正确的邮箱和密码 THEN 系统 SHALL 返回 JWT token
- IF 邮箱格式无效 THEN 系统 SHALL 返回 400 错误并提示格式
- WHEN 连续 5 次登录失败 THEN 系统 SHALL 锁定账户 15 分钟
```

**影响：** 消除验收歧义，提升 spec 可测试性
**难度：** 低

---

## 四、中优先级改进（显著提升体验）

### 4.1 Skill Description 即触发条件

**来源：** superpowers / claude-code-best-practice

**现状：** Skill descriptions 是功能摘要。

**改进方案：**
- `description` 字段改为**触发条件描述**（when to fire），而非功能摘要
- 例如 `tech-code`：
  - 现状：`Wave 执行和有序审查`
  - 改为：`当用户要求执行已规划的任务、开始编码实现、或继续未完成的 wave 执行时触发`

**影响：** 改善 Skill tool 自动发现准确率
**难度：** 低

### 4.2 每个 Skill 增加 Gotchas 段

**来源：** claude-code-best-practice

**现状：** Skills 没有记录已知失败模式。

**改进方案：**
- 每个 `SKILL.md` 增加 `## Gotchas` 段
- 记录实际使用中发现的失败点和应对策略
- 从几行 + 一个 gotcha 开始，有机增长

**影响：** 捕获失败模式，减少重复踩坑
**难度：** 低

### 4.3 Schema-Driven 工作流

**来源：** OpenSpec

**现状：** 工作流在 Skill 里硬编码。

**改进方案：**
- 在 `configs/` 下增加可选的 `schema.yaml`：
  ```yaml
  artifacts:
    - id: prd
      generates: PRD.md
      requires: []
    - id: tech-design
      generates: tech-design.md
      requires: [prd]
    - id: tasks
      generates: task-breakdown.md
      requires: [prd, tech-design]
  ```
- 允许项目 fork 默认 schema 自定义工作流
- validate.js 校验 schema 定义的完整性

**影响：** 工作流可定制化，适应不同项目需求
**难度：** 中

### 4.4 Rules/Templates 分离

**来源：** cc-sdd

**现状：** rules 和 templates 混在一起。

**改进方案：**
- **Rules（判断准则）**：AI 应该怎么思考（coding style、security、EARS 格式）
- **Templates（输出结构）**：AI 输出什么格式（PRD、tech-design、task-breakdown）
- 明确两者的职责边界，分别可独立定制

**影响：** 职责清晰，降低维护复杂度
**难度：** 低

### 4.5 Hooks 重命名

**现状：** hook 文件保留 `gsd-` 前缀（来自 get-shit-done fork）。

**改进方案：**
- `gsd-session-manager.js` → `tinypowers-session-manager.js`
- `gsd-context-monitor.js` → `tinypowers-context-monitor.js`
- `gsd-code-checker.js` → `tinypowers-code-checker.js`
- 同步更新 `hooks/hook-hierarchy.js` 和 `install.sh` 中的引用

**影响：** 品牌一致性，减少 origin 混淆
**难度：** 低

### 4.6 清理空目录

**现状：** `configs/default/`、`configs/java/`、`agents/agents/python/`、`skills/writing-skills/` 是空目录。

**改进方案：**
- 移除空目录或添加最小化 README（注明 planned）
- `skills/writing-skills/` 如果计划实现，至少放一个 README 说明意图

**影响：** 减少混乱
**难度：** 低

### 4.7 Glob-Scoped Rules

**来源：** claude-code-best-practice

**现状：** rules 全局加载。

**改进方案：**
- 规则 frontmatter 中声明 `Glob: **/*.java` 等匹配模式
- Java 规则只在编辑 Java 文件时加载
- MySQL 规则只在编辑 SQL 文件时加载
- 减少无关 context 占用

**影响：** context 优化，减少无关规则干扰
**难度：** 低

---

## 五、低优先级改进（锦上添花）

### 5.1 Adaptive Discovery

**来源：** cc-sdd

Design 阶段自动评估需求复杂度（简单/扩展/复杂），按复杂度调整研究深度。简单需求跳过深度调研，复杂需求触发 WebSearch/WebFetch。

### 5.2 Parallel Task Markers

**来源：** cc-sdd / GSD

在 task-breakdown 中自动标注可并行执行的任务 `(P)`，标准：
- 无数据依赖
- 不共享文件
- 环境已就绪

tech-code 的 wave 执行可据此自动分配并行 agent。

### 5.3 Delta Specs

**来源：** OpenSpec

对于修改已有功能的需求，用 `## ADDED Requirements` / `## MODIFIED Requirements` / `## REMOVED Requirements` 表达变更，而非重写完整 spec。Archive 时合并回主 spec。

### 5.4 Hook Profile 增强

**来源：** everything-claude-code

`TINYPOWERS_HOOK_LEVEL` 已有 minimal/standard/strict，增加：
- 按 hook ID 禁用：`TINYPOWERS_DISABLED_HOOKS=context-monitor,code-checker`
- 运行时查询当前 profile 配置

### 5.5 Continuous Learning / Instincts

**来源：** everything-claude-code

创建轻量级 `instincts.md`：
- 从 hook 观察中捕获成功/失败模式
- 按 confidence score 排列
- 项目级 vs 全局级 instincts
- 可演化为正式的 Skill 或 Rule

### 5.6 扩展 Agent 阵容

**来源：** agency-agents-zh / oh-my-openagent

考虑增加：
- **Gap Analyzer**：执行前审查 plan 完整性
- **Ruthless Reviewer**：严苛标准审查 plan 可验证性
- **Knowledge Curator**：自动提取调试知识到 notepads

### 5.7 去重保护

**来源：** oh-my-openagent

Agent prompt 中增加规则：禁止重复已委托给其他 agent 的工作（如探索 agent 已完成的搜索）。

---

## 六、架构级建议（长期方向）

### 6.1 Canonical Source + Multi-Format Derivation

**来源：** agency-agents-zh / GSD

**现状：** tinypowers 为 Claude Code / Codex / OpenCode 维护了多份目录。

**改进方案：**
- 将 agent 定义作为 canonical `.md` source
- 用 `scripts/convert.js` 自动派生各平台格式
- 新增平台支持 = 新增一个 converter，而非手动维护多份

### 6.2 De-Sloppify 后处理

**来源：** everything-claude-code

在 wave 执行后增加 cleanup agent pass：
- 不在 implementer prompt 中加负面指令（会降低质量）
- 实现完成后由独立 agent 做一轮 code quality sweep

### 6.3 三层编排架构

**来源：** oh-my-openagent

明确分离：
- **Planning Layer**（architect + planner + decision-guardian）：只产出文档
- **Execution Layer**（per-wave executors）：只做实现
- **Verification Layer**（spec-compliance + security + code-reviewer）：只做审查

每层有明确的工具权限限制（如 planner 禁止 Write/Edit）。

---

## 七、优先级排序总览

| 优先级 | 编号 | 改进项 | 来源 | 预期影响 | 实施难度 |
|--------|------|--------|------|---------|---------|
| 高 | 3.1 | Context Budget 感知 | GSD | 防止 context 质量退化 | 低 |
| 高 | 3.2 | 增强 Session 持久化 | oh-my-claudecode / GSD | 跨会话连续性 | 中 |
| 高 | 3.3 | Executor 预加载上下文 | claude-code-spec-workflow | 减少 token 浪费 | 中 |
| 高 | 3.4 | Task 智慧积累 | oh-my-openagent | 提升后续任务质量 | 低 |
| 高 | 3.5 | EARS 格式需求 | cc-sdd / claude-code-spec-workflow | 消除验收歧义 | 低 |
| 中 | 4.1 | Skill description 即触发条件 | superpowers / claude-code-best-practice | 改善自动发现 | 低 |
| 中 | 4.2 | Gotchas 段 | claude-code-best-practice | 捕获失败模式 | 低 |
| 中 | 4.3 | Schema-Driven 工作流 | OpenSpec | 可定制化 | 中 |
| 中 | 4.4 | Rules/Templates 分离 | cc-sdd | 职责清晰 | 低 |
| 中 | 4.5 | Hooks 重命名 | — | 品牌一致性 | 低 |
| 中 | 4.6 | 清理空目录 | — | 减少混乱 | 低 |
| 中 | 4.7 | Glob-Scoped Rules | claude-code-best-practice | context 优化 | 低 |
| 低 | 5.1 | Adaptive Discovery | cc-sdd | 智能研究深度 | 中 |
| 低 | 5.2 | Parallel Task Markers | cc-sdd / GSD | 并行执行优化 | 低 |
| 低 | 5.3 | Delta Specs | OpenSpec | 变更表达效率 | 中 |
| 低 | 5.4 | Hook Profile 增强 | everything-claude-code | 运行时控制 | 低 |
| 低 | 5.5 | Continuous Learning | everything-claude-code | 知识积累 | 中 |
| 低 | 5.6 | 扩展 Agent 阵容 | agency-agents-zh / oh-my-openagent | 审查深度 | 低 |
| 低 | 5.7 | 去重保护 | oh-my-openagent | 节省 token | 低 |
| 架构 | 6.1 | Canonical Source + Multi-Format | agency-agents-zh / GSD | 多平台支持 | 高 |
| 架构 | 6.2 | De-Sloppify 后处理 | everything-claude-code | 代码质量 | 中 |
| 架构 | 6.3 | 三层编排架构 | oh-my-openagent | 职责分离 | 高 |

---

## 附录：参考项目清单

| 项目 | 路径 | 核心贡献领域 |
|------|------|-------------|
| superpowers | `/Users/wcf/personal/superpowers` | 提示工程、TDD、抗合理化 |
| get-shit-done | `/Users/wcf/personal/get-shit-done` | 上下文工程、多运行时、验证 |
| gstack | `/Users/wcf/personal/gstack` | 工程团队模拟、浏览器集成、安全审计 |
| OpenSpec | `/Users/wcf/personal/OpenSpec` | 规范驱动、Delta Specs、Schema 工作流 |
| oh-my-openagent | `/Users/wcf/personal/oh-my-openagent` | 多模型编排、Hash 编辑、Agent 组合 |
| oh-my-claudecode | `/Users/wcf/personal/oh-my-claudecode` | 持久化编排、歧义评分、Hook 拦截 |
| claude-code-spec-workflow | `/Users/wcf/personal/claude-code-spec-workflow` | 规格工作流、EARS、任务命令生成 |
| cc-sdd | `/Users/wcf/personal/cc-sdd` | Kiro 风格 SDD、自适应发现、多工具适配 |
| everything-claude-code | `/Users/wcf/personal/everything-claude-code` | 持续学习、Hook Profile、项目检测 |
| claude-code-best-practice | `/Users/wcf/personal/claude-code-best-practice` | 架构模式、渐进式披露、Glob 规则 |
| agency-agents-zh | `/Users/wcf/personal/agency-agents-zh` | Agent 角色库、NEXUS 编排、多格式派生 |
