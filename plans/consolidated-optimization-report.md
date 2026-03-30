# tinypowers 优化共识报告（集思广益版）

> 日期: 2026-03-30
> 来源: 10 份报告综合（4 份审计报告 + 2 份统一计划 + 4 份参考项目分析）
> 作者: 多个 AI 协作者（kilo code、opencode、Claude）
> 方法: 提取全量共识 → 逐项裁决分歧 → 输出一份可执行计划

---

## 一、报告全景

| # | 文件 | 作者 | 视角 |
|---|------|------|------|
| 1 | `archive/simplify-plan.md` | kilo code | 激进简化——删 9 项、精简 6 项 |
| 2 | `archive/audit-report.md` | kilo code | 状态核对——PR #2 后的差距分析 |
| 3 | `archive/audit-report-claude.md` | Claude | 逐文件审查——CORE/USEFUL/BLOAT 分级 |
| 4 | `archive/review-and-optimization-report.md` | opencode | 增量优化——在现有基础上改进 |
| 5 | `unified-optimization-plan.md` | 综合 | 共识报告——裁决上述 4 份分歧 |
| 6 | `reference-projects-analysis.md` | kilo code | 11 项目对比——22 项改进建议 |
| 7 | `reference-driven-optimization.md` | Claude | 精选建议——4 项值得借用的模式 |
| 8 | `reference-strategy.md` | kilo code | 激进引用——fork GSD hooks + npm install OpenSpec |
| 9 | `external-projects-analysis.md` | kilo code | 可直接引用的设计模式 |
| 10 | `reference-borrowing-guide.md` | Claude | 借用指南——借思维不借代码 |

---

## 二、10 份报告的共识

### 2.1 一致同意保留的 6 个核心价值

所有报告**无分歧**地认同这些是 tinypowers 的差异化优势：

| 价值 | 独特性 |
|------|--------|
| Decision Guardian | 11 个参考项目中独有 |
| Anti-Rationalization | 与 superpowers 的 persuasion-resistant 异曲同工，但 tinypowers 更实用 |
| 分层规则继承（common→java→mysql） | 最干净的规则组织方式 |
| Component-based install | GSD 和 OpenSpec 都没有 |
| File-as-State + SPEC-STATE | 比 GSD 的 .planning/ 更轻量 |
| Ordered Review Pipeline | spec→security→code 三阶段门禁 |

### 2.2 一致同意删除的文件（6 份+认同）

| 文件 | 行数 | 共识度 | 理由 |
|------|------|--------|------|
| `configs/schema.yaml` | 146 | 6/6 | 未被 validate.js 使用，纯装饰 |
| `configs/templates/delta-spec.md` | 109 | 5/6 | 仅大项目需要，默认模板不应包含 |
| `configs/README.md` | 79 | 5/6 | 内容可合并到 configs/rules/README.md |
| `agents/gap-analyzer.md` | 140 | 5/6 | 与 spec-compliance-reviewer 职责重叠 |
| `skills/tech-code/tdd-cycle.md` | 189 | 4/6 | TDD 是常识，一段话够了 |
| `skills/tech-code/model-tiering.md` | 209 | 4/6 | 模型选择不是框架该管的 |
| `scripts/hashline-edit-hook.js` | 203 | 4/6 | 死代码，无调用无测试无注册 |
| `docs/agents/python-agent-plan.md` | 11 | 3/6 | 空洞计划文件 |
| `docs/agents/writing-skills-plan.md` | 11 | 3/6 | 空洞计划文件 |
| `docs/guides/optimization-roadmap-2026.md` | 144 | 4/6 | 过时的路线图 |
| `docs/guides/repo-normalization-summary.md` | 110 | 3/6 | 一次性迁移记录 |

### 2.3 一致认同的 5 个反模式

从 11 个参考项目和自身教训中总结：

| 反模式 | 典型项目 | tinypowers 曾犯的错误 |
|--------|---------|---------------------|
| 数量堆砌 | everything-claude-code (125+ skills)、agency-agents-zh (186 agents) | PR #1/#2 引入 11 个新概念 |
| 全盘照搬 | 正是 PR #1/#2 的根因 | 把别项目的好东西全堆进来 |
| 过度抽象 | oh-my-openagent (多模型路由)、oh-my-claudecode (三层叠加) | NEXUS 7-Type Handoff、Context Budget 四层 |
| 运行时依赖 | OpenSpec (npm)、gstack (Bun 二进制) | tinypowers 保持零依赖 |
| 流程刚性 | superpowers (铁律)、GSD (严格 checkpoint) | SPEC-STATE 只有严格线性模式 |

---

## 三、分歧裁决

以下是 10 份报告之间存在分歧的关键议题，逐项裁决：

### 3.1 NEXUS Handoff — **删除文件，清单内联**

| 立场 | 来源 |
|------|------|
| 删除 | kilo code 审计报告 |
| 精简到 ~60 行 | Claude 审计报告 |
| 精简到 ~80 行 | opencode 审查报告 |
| 保留为独立文件 | external-projects-analysis |

**裁决**: 删除 `nexus-handoff.md`（326 行），在 SKILL.md 内保留 15 行交接检查清单。7 种类型模板是过度设计，一份通用清单覆盖 80% 场景。

### 3.2 4-Level Verification — **保留，精简示例**

| 立场 | 来源 |
|------|------|
| 删除 | kilo code 审计报告 |
| 保留 | Claude 审计报告、opencode 审查报告、reference-projects-analysis |

**裁决**: 保留 L1-L4 概念（Exists/Substantive/Wired/Data Flow），是 PR #2 最有价值的新增。但示例占一半篇幅，精简 50%。

### 3.3 Agent 目标行数 — **80-100 行**

| 立场 | 来源 |
|------|------|
| 压到 50 行 | kilo code 审计报告 |
| 80-100 行 | Claude 审计报告 |
| 无具体数字 | opencode、其余报告 |

**裁决**: 80-100 行。50 行太极端会丢失有价值的执行指导。移除叙述冗余（身份/记忆/经验），保留职责、交付标准、硬约束。

### 3.4 EARS 格式 — **推荐，不强制**

| 立场 | 来源 |
|------|------|
| 移除强制要求 | kilo code 简化计划 |
| 推荐非强制 | Claude 审计报告、统一优化计划 |
| 改为强制 | external-projects-analysis |
| 已改为推荐 | opencode 审查报告 |

**裁决**: 保持"推荐"。EARS 是好实践但强制会增加抗拒。好示例比强制更有效。

### 3.5 引用策略 — **借模式不借代码**

| 立场 | 来源 |
|------|------|
| 直接 fork/引用外部项目 | reference-strategy.md（fork GSD hooks、npm install OpenSpec、引用 superpowers skills） |
| 借思维不借代码 | reference-driven-optimization、reference-borrowing-guide |
| 参考 GSD 模式 | external-projects-analysis |

**裁决**: 借思维不借代码。具体理由：
- Fork GSD hooks → GSD hooks 为 75K 行架构设计，不匹配 tinypowers 轻量模型；且 tinypowers 的 hooks 已有自己的设计（Hook Profile、选择性禁用）
- npm install OpenSpec → 给纯 markdown 框架加运行时依赖，违反零依赖核心定位
- 引用 superpowers skills → superpowers 缺少 Decision Guardian、Wave Execution、Anti-Rationalization，直接替换会丢失独特价值

### 3.6 Hooks 重命名 — **不重命名**

| 立场 | 来源 |
|------|------|
| 重命名为 tinypowers- 前缀 | reference-projects-analysis |
| 保持现状 | 其余报告未提及 |

**裁决**: 不重命名。`gsd-` 前缀是历史遗产，重命名涉及 hooks/hook-hierarchy.js、install.sh、validate.js 多处引用，成本高于收益。时机是将来做 breaking change 时一起做。

### 3.7 tech-code 子文档数量 — **目标 7 个**

| 立场 | 来源 |
|------|------|
| 压到 4 个（激进合并） | kilo code 审计报告 |
| 7-8 个 | Claude 审计报告 |
| 5-6 个 | opencode 审查报告 |

**裁决**: 7 个（含 SKILL.md）。删 5 个文件（tdd-cycle、model-tiering、nexus-handoff、anti-rationalization→内联、deviation-log→合并），保留 7 个各有独立职责的文件。

### 3.8 Instinct/Confidence 系统 — **简化，不增强**

| 立场 | 来源 |
|------|------|
| 精简为 atomic instinct 格式 | external-projects-analysis |
| 参考 everything-claude-code 增强 | reference-projects-analysis |
| 简化回滚 | kilo code 简化计划、统一优化计划 |
| 不借用 | reference-borrowing-guide |

**裁决**: 简化。learnings.md 保留简单笔记格式，移除 Instinct 表和 Confidence 评分。everything-claude-code 的 Instinct 系统本身是过度设计。

### 3.9 Java-specific Agents — **保留**

| 立场 | 来源 |
|------|------|
| 删除（只保留 6 个通用） | kilo code 审计报告（极简版） |
| 保留 | Claude 审计报告、opencode 审查报告 |

**裁决**: 保留。Java/Spring Boot 是主栈，专属 reviewer 有明确价值。

---

## 四、统一行动计划

### Phase 1: 删除（零风险，直接执行）

| # | 文件 | 行数 | 共识度 |
|---|------|------|--------|
| 1 | `configs/schema.yaml` | 146 | 6/6 |
| 2 | `configs/templates/delta-spec.md` | 109 | 5/6 |
| 3 | `configs/README.md` | 79 | 5/6 |
| 4 | `agents/gap-analyzer.md` | 140 | 5/6 |
| 5 | `skills/tech-code/tdd-cycle.md` | 189 | 4/6 |
| 6 | `skills/tech-code/model-tiering.md` | 209 | 4/6 |
| 7 | `scripts/hashline-edit-hook.js` | 203 | 4/6 |
| 8 | `docs/agents/python-agent-plan.md` | 11 | 3/6 |
| 9 | `docs/agents/writing-skills-plan.md` | 11 | 3/6 |
| 10 | `docs/guides/optimization-roadmap-2026.md` | 144 | 3/6 |
| 11 | `docs/guides/repo-normalization-summary.md` | 110 | 3/6 |
| 12 | `skills/tech-code/nexus-handoff.md` | 326 | 裁决：删除文件，清单内联 |
| 13 | `skills/tech-code/anti-rationalization.md` | 20 | 内联到 SKILL.md |
| 14 | `skills/tech-code/deviation-log.md` | 168 | 合并到 deviation-handling.md |

**删除小计: ~1,865 行**

### Phase 2: 合并与精简

| # | 操作 | 当前 | 目标 |
|---|------|------|------|
| 15 | NEXUS 交接清单内联到 `tech-code/SKILL.md` | 0 | +15 |
| 16 | Anti-Rationalization 内联到 `tech-code/SKILL.md` | 20+326 | ~330 |
| 17 | 精简 `tech-code/SKILL.md`（移除 TDD/Model/Deviation 大段） | 330 | ~240 |
| 18 | 精简 `tech-code/wave-execution.md`（移除智慧提取 Step 5） | 177 | ~120 |
| 19 | 精简 `tech-code/context-preload.md`（移除 Per-Task 命令文件） | 83 | ~40 |
| 20 | 精简 `tech-code/session-recovery.md`（移除 handoff.json 双持久化） | 114 | ~80 |
| 21 | 精简 `tech-code/quality-gate.md`（精简 4-Level 示例） | 108 | ~80 |
| 22 | 精简 `tech-commit/SKILL.md`（移除 NEXUS 大段） | 246 | ~180 |
| 23 | 精简 `tech-commit/commit-message-format.md`（Trailer 缩减） | 223 | ~140 |
| 24 | 精简 `hooks/gsd-session-manager.js`（移除双持久化） | 370 | ~280 |
| 25 | 精简 `configs/templates/prd-template.md`（EARS 缩减） | 112 | ~80 |
| 26 | 精简 `configs/templates/state.md`（Context Budget 简化） | ~40 | ~15 |
| 27 | 精简 `agents/tech-plan-checker.md`（移除 Context Budget 段） | 133 | ~110 |
| 28 | 精简 `agents/architect.md`（移除 ANTI_DUPLICATION） | 145 | ~125 |
| 29 | 精简 `agents/planner.md`（移除 ANTI_DUPLICATION） | 108 | ~90 |
| 30 | 精简 `scripts/scaffold-feature.js`（learnings 模板简化） | 131 | ~100 |
| 31 | 精简 `scripts/validate.js`（移除 Glob 检测段） | — | — |
| 32 | 精简 `README.md`（移除 v6.0 特性表） | 393 | ~280 |
| 33 | 精简 `skills/tech-code/deviation-handling.md`（合并 deviation-log + 参考 GSD 4 级规则） | 131+168 | ~150 |

**精简小计: 减少约 ~1,400 行**

### Phase 3: 回滚与清理

| # | 操作 |
|---|------|
| 34 | `tech-code/SKILL.md` 版本号回滚 6.0 → 5.0 |
| 35 | `tech-commit/SKILL.md` 版本号回滚 3.0 → 2.0 |
| 36 | 运行 `npm run validate && npm test` 确认全绿 |

### Phase 4: 参考项目精华融入（新增）

来自参考项目分析的 4 项高价值低成本的改进：

| # | 改进 | 来源 | 成本 | 融入时机 |
|---|------|------|------|---------|
| 37 | `context-preload.md` 加入裁剪规则表 | claude-code-spec-workflow | 零（Phase 2 时顺便） | Phase 2 |
| 38 | README 加入 Skill 管道图 | gstack | +10 行 | Phase 2 |
| 39 | Agent 文件统一 YAML frontmatter 格式 | get-shit-done | 零（Phase 2 时顺便） | Phase 2 |
| 40 | hooks 统一 JSON 输入/输出协议 | get-shit-done | 零（Phase 2 时顺便） | Phase 2 |

### Phase 5: 企业级增强（Phase 4 之后）

| # | 改进 | 来源 | 成本 |
|---|------|------|------|
| 41 | SPEC-STATE 宽松模式（`--mode relaxed`） | OpenSpec | ~30 行 |
| 42 | `project-overrides.json` 项目级配置覆盖 | cc-sdd | ~100 行 |
| 43 | deviation-handling 参考 GSD 4 级规则细化 | get-shit-done | 已含在 Phase 2 #33 |

---

## 五、简化后预期

| 指标 | 当前 | 简化后 | 变化 |
|------|------|--------|------|
| 总行数 | ~14,900 | ~11,600 | -22% |
| Agent 数量 | 11 | 10 | -1 |
| Agent 平均行数 | ~145 | ~100 | -31% |
| Skill 子文档数 | ~40 | ~28 | -30% |
| tech-code 文件数 | 11 | 7 | -36% |
| 独立概念数 | 11 | 6 | -45% |
| 外部依赖 | 0 | 0 | 不变 |

### 简化后 tech-code 目录

```
skills/tech-code/
├── SKILL.md              (~240 行) 核心流程 + HARD-GATE + NEXUS 清单 + anti-rationalization
├── wave-execution.md     (~120 行) Wave 执行流程
├── context-preload.md    (~40 行)  上下文预加载 + 裁剪规则表
├── quality-gate.md       (~80 行)  质量门禁 + 4-Level Verification
├── deviation-handling.md (~150 行) 偏差处理 + 偏差日志 + 4 级规则
├── state-management.md   (~128 行) 状态管理（不变）
└── session-recovery.md   (~80 行)  会话恢复（单一 notepad）
```

### 保留的 6 个核心概念

1. **HARD-GATE** — 关键约束强制检查
2. **EARS** — 验收标准格式（推荐，不强制）
3. **4-Level Verification** — 证据驱动的验证（L1-L4）
4. **Decision Guardian** — 决策锁定防漂移
5. **Anti-Rationalization** — 防止自我合理化绕过门禁
6. **Wave Execution** — 依赖驱动的并行执行

### 移除的 5 个过度设计概念

1. ~~NEXUS 7-Type Handoff~~ → 简化为 SKILL.md 内的 15 行检查清单
2. ~~Model Tiering~~ → 不是框架该管的事
3. ~~TDD Cycle Guide~~ → 常识不需要 189 行文档
4. ~~Context Budget 四层质量~~ → 一行提醒即可
5. ~~Confidence/Instinct 评分~~ → 简单笔记格式

---

## 六、坚决不引入的外部能力

综合 10 份报告的集体判断：

| 能力 | 来源 | 不引入的原因 | 认同不引入的报告数 |
|------|------|-------------|-----------------|
| Fork GSD hooks | reference-strategy | 不匹配轻量模型，会引入 75K 行架构的依赖 | 6/8 |
| npm install OpenSpec | reference-strategy | 违反零依赖原则，给 markdown 框架加运行时依赖 | 7/8 |
| 引用 superpowers skills | reference-strategy | 缺少 tinypowers 独特价值（Decision Guardian 等） | 5/8 |
| Hash-Anchored Edit | oh-my-openagent | SUL-1.0 不可商用；PR #2 审查已决定删除 | 6/8 |
| 多模型路由 | oh-my-openagent | 环境配置，不是框架职责 | 7/8 |
| 48 个 Hooks | oh-my-openagent | 过度工程 | 8/8 |
| 19 个 Agent | oh-my-claudecode | 反面教材 | 7/8 |
| 125+ Skills | everything-claude-code | 数量堆砌的反面教材 | 8/8 |
| 浏览器集成 | gstack | 不属于工作流框架范畴 | 7/8 |
| Instinct 评分系统 | everything-claude-code | 过度设计 | 5/8 |
| Ship/QA skill | gstack | tinypowers 定位是编码工作流，发布由项目自行处理 | 4/8 |

---

## 七、执行原则

1. **先删后改** — Phase 1 全部完成后再开始 Phase 2
2. **每 5 步验证** — 每完成 5 个操作跑一次 `npm run validate && npm test`
3. **单一 commit** — 全部简化工作合并为一个 commit
4. **不重新引入** — 被删除的概念如果将来确实需要，按需加回
5. **功能等价** — 简化后的框架功能不能少于简化前（只是更精炼）
6. **零外部依赖** — 不引入任何 npm 包、不 fork 外部项目代码

---

## 八、总结

### 10 份报告的集体智慧

**核心共识**: tinypowers 的问题不是"缺什么"，而是"多了什么"。两轮对标优化引入了太多未经验证的概念，解决方案是做减法而不是做加法。

**借用策略**: 11 个参考项目的价值不是提供代码，而是提供反面教材——大多数项目的问题恰恰是太复杂。tinypowers 应该做反面，保持轻量。

**唯一值得新增的是企业级能力**: `project-overrides.json` 是所有报告中唯一被一致认可的企业级增强，因为它解决的是"不同团队需要不同配置"的实际问题。

### tinypowers 的差异化定位

在 11 个参考项目中，tinypowers 的独特定位是：

> **唯一一个同时做到轻量 + 企业级 + 零依赖 + 可定制的框架。**

不需要变成其他项目的组装件。精简自己比借用别人更有效。
