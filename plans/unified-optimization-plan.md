# tinypowers 简化共识报告

> 日期: 2026-03-30
> 来源: 四份报告综合（kilo code 简化计划 + kilo code 审查 + opencode 审查 + Claude 审查）
> 方法: 提取共识、裁决分歧、输出一份可执行的行动计划

---

## 一、共识摘要

四份报告对问题的诊断高度一致：**tinypowers 在两轮对标优化后变得过度复杂，偏离了"轻量实用"的核心定位。** 根因是"全盘照搬"——把别的项目的好东西全部堆进来，没有考虑协调性和必要性。

### 共识保留的 6 个核心价值

| 价值 | 四份报告一致 |
|------|-------------|
| Decision Guardian（决策守护） | 全部同意保留 |
| Anti-Rationalization（防自我合理化） | 全部同意保留（可简化形式） |
| File-as-State（文件即状态） | 全部同意保留 |
| Ordered Review Pipeline（有序审查） | 全部同意保留 |
| 分层规则（common/java/mysql） | 全部同意保留 |
| Component-based install | 全部同意保留 |

---

## 二、分歧裁决

以下是四份报告存在分歧的关键议题，逐项裁决：

### 2.1 4-Level Verification — **保留，精简示例**

| 立场 | 来源 |
|------|------|
| 删除 | kilo code 审查报告 |
| 保留 | opencode 审查、Claude 审查 |

**裁决**: 保留。L1-L4 概念（Exists/Substantive/Wired/Data Flow）清晰实用，是 PR #2 中最有价值的新增。但示例占了一半篇幅，精简 50%。

**理由**: 三份中两份建议保留；删除它意味着回退到模糊的"验证通过"，得不偿失。

### 2.2 NEXUS Handoff — **大幅精简，不删除**

| 立场 | 来源 |
|------|------|
| 删除 | kilo code 审查报告 |
| 精简到 ~60 行 | Claude 审查 |
| 精简到 ~80 行 | opencode 审查 |
| 简化 | kilo code 简化计划 |

**裁决**: 大幅精简。保留交接检查清单概念，删除 7 种类型的完整模板。从 326 行缩减到 ~60 行。

**理由**: 交接检查本身有价值（防止信息丢失），但 7 种完整模板是过度设计。一份通用清单足以覆盖 80% 场景。

### 2.3 TDD Cycle 文档 — **删除独立文件，SKILL.md 内一段话**

| 立场 | 来源 |
|------|------|
| 合并到 execution.md | kilo code 审查报告 |
| 删除独立文件 | Claude 审查 |
| 合并核心到 SKILL.md | opencode 审查 |
| 未提及 | kilo code 简化计划 |

**裁决**: 删除 `tdd-cycle.md`（189 行）。SKILL.md 内保留一段话描述 RED-GREEN-REFACTOR + 例外条款。

**理由**: TDD 是业界常识，不值得 189 行的"指南"。三份报告都认为这个文件过于冗长。

### 2.4 Model Tiering — **删除**

| 立场 | 来源 |
|------|------|
| 删除 | kilo code 审查报告、Claude 审查 |
| 整合到 SKILL.md | opencode 审查 |
| 未提及 | kilo code 简化计划 |

**裁决**: 删除 `model-tiering.md`（209 行）。不整合到 SKILL.md。

**理由**: 模型选择是基础设施/环境决策，不是编码流程的一部分。框架不该管这件事。三份中两份建议完全删除。

### 2.5 Agent 压缩目标 — **80-100 行，不是 50 行**

| 立场 | 来源 |
|------|------|
| 压到 50 行 | kilo code 审查报告 |
| 80-100 行合理 | Claude 审查 |
| 无具体数字 | opencode 审查、kilo code 简化计划 |

**裁决**: 目标 80-100 行。移除冗余的"身份/记忆/经验"叙述，保留职责、交付标准、硬约束。

**理由**: 50 行太极端，会丢失有价值的执行指导。80-100 行足以消除叙述冗余同时保留实质内容。

### 2.6 EARS 格式 — **保留要求，精简解释**

| 立场 | 来源 |
|------|------|
| 移除强制要求 | kilo code 简化计划 |
| 保留要求，精简解释 | Claude 审查 |
| 已改为推荐 | opencode 审查 |

**裁决**: 降为推荐（不强制），同时精简模板中的解释文字。

**理由**: EARS 是好实践但强制执行会增加抗拒。推荐 + 好示例比强制更有效。opencode 已做了这个改动，认可。

### 2.7 Java-specific Agents — **保留**

| 立场 | 来源 |
|------|------|
| 删除 | kilo code 审查报告（极简版结构里只保留 6 个通用 Agent） |
| 保留 | Claude 审查、opencode 审查 |

**裁决**: 保留。Java/Spring Boot 是项目的主栈，专属 reviewer 有明确价值。

**理由**: 三份中两份建议保留。删除栈专属 Agent 反而会降低实用性。

### 2.8 tech-code 子文档数量 — **目标 7 个**

| 立场 | 来源 |
|------|------|
| 压到 4 个（激进合并） | kilo code 审查报告 |
| 7-8 个 | Claude 审查 |
| 5-6 个 | opencode 审查 |

**裁决**: 目标 7 个（含 SKILL.md）。具体为：

```
skills/tech-code/
├── SKILL.md              # 核心流程 + HARD-GATE
├── wave-execution.md     # Wave 执行（精简 Step 5）
├── context-preload.md    # 上下文预加载（移除 Per-Task 命令文件）
├── quality-gate.md       # 质量门禁 + 4-Level Verification（精简示例）
├── deviation-handling.md # 偏差处理 + deviation-log 合并入
├── state-management.md   # 状态管理
└── session-recovery.md   # 会话恢复（简化持久化层）
```

**删除**: tdd-cycle.md、model-tiering.md、nexus-handoff.md（检查清单内联到 SKILL.md）、anti-rationalization.md（内联到 SKILL.md）、deviation-log.md（合并到 deviation-handling.md）

### 2.9 Commit Trailer — **推荐，不强制**

| 立场 | 来源 |
|------|------|
| 简化为可选 | kilo code 审查报告 |
| 推荐非强制 | Claude 审查 |
| 已是推荐 | opencode 审查（PR #2 修复后） |

**裁决**: 保持当前的"推荐"状态。文档从 ~119 行缩减到 ~30 行。

---

## 三、统一行动计划

### Phase 1: 删除（零风险，直接执行）

| # | 文件 | 行数 | 共识度 |
|---|------|------|--------|
| 1 | `configs/schema.yaml` | 146 | 4/4 |
| 2 | `configs/templates/delta-spec.md` | 109 | 4/4 |
| 3 | `configs/README.md` | 79 | 4/4 |
| 4 | `agents/gap-analyzer.md` | 140 | 4/4 |
| 5 | `skills/tech-code/tdd-cycle.md` | 189 | 3/4 |
| 6 | `skills/tech-code/model-tiering.md` | 209 | 3/4 |
| 7 | `scripts/hashline-edit-hook.js` | 203 | 2/4 |
| 8 | `docs/agents/python-agent-plan.md` | 11 | 2/4 |
| 9 | `docs/agents/writing-skills-plan.md` | 11 | 2/4 |
| 10 | `docs/guides/optimization-roadmap-2026.md` | 144 | 3/4 |
| 11 | `docs/guides/repo-normalization-summary.md` | 110 | 3/4 |
| 12 | `skills/tech-code/nexus-handoff.md` | 326 | 裁决：删除文件，清单内联 |

**删除小计: ~1,677 行**

### Phase 2: 合并与精简

| # | 操作 | 当前 | 目标 |
|---|------|------|------|
| 13 | `deviation-log.md` 合并到 `deviation-handling.md` | 168+131=299 | ~150 |
| 14 | `anti-rationalization.md` 内联到 `SKILL.md` | 20+326 | ~330 |
| 15 | NEXUS 交接清单内联到 `tech-code/SKILL.md` | 0 | +15 |
| 16 | 精简 `tech-code/SKILL.md`（移除 TDD/Model/Deviation 大段） | 330 | ~240 |
| 17 | 精简 `tech-code/wave-execution.md`（移除智慧提取 Step 5） | 177 | ~120 |
| 18 | 精简 `tech-code/context-preload.md`（移除 Per-Task 命令文件） | 83 | ~40 |
| 19 | 精简 `tech-code/session-recovery.md`（移除 handoff.json） | 114 | ~80 |
| 20 | 精简 `tech-code/quality-gate.md`（精简 4-Level 示例） | 108 | ~80 |
| 21 | 精简 `tech-commit/SKILL.md`（移除 NEXUS 大段） | 246 | ~180 |
| 22 | 精简 `tech-commit/commit-message-format.md`（Trailer 缩减） | 223 | ~140 |
| 23 | 精简 `hooks/gsd-session-manager.js`（移除双持久化） | 370 | ~280 |
| 24 | 精简 `configs/templates/prd-template.md`（EARS 缩减） | 112 | ~80 |
| 25 | 精简 `configs/templates/state.md`（Context Budget 简化） | ~40 | ~15 |
| 26 | 精简 `agents/tech-plan-checker.md`（移除 Context Budget 段） | 133 | ~110 |
| 27 | 精简 `agents/architect.md`（移除 ANTI_DUPLICATION） | 145 | ~125 |
| 28 | 精简 `agents/planner.md`（移除 ANTI_DUPLICATION） | 108 | ~90 |
| 29 | 精简 `scripts/scaffold-feature.js`（learnings 模板简化） | 131 | ~100 |
| 30 | 精简 `README.md`（移除 v6.0 特性表） | 393 | ~280 |

**精简小计: 减少约 ~1,400 行**

### Phase 3: 回滚与清理

| # | 操作 |
|---|------|
| 31 | `tech-code/SKILL.md` 版本号回滚 6.0 → 5.0 |
| 32 | `tech-commit/SKILL.md` 版本号回滚 3.0 → 2.0 |
| 33 | `tech-code/nexus-handoff.md` 引用从 `tech-commit/SKILL.md` 移除 |
| 34 | `scripts/validate.js` 移除 Glob 检测段 |
| 35 | 删除 `tech-commit/nexus-handoff.md`（如存在副本） |
| 36 | 运行 `npm run validate && npm test` 确认全绿 |

---

## 四、简化后预期

| 指标 | 当前 | 简化后 | 变化 |
|------|------|--------|------|
| 总行数 | ~14,900 | ~11,800 | -21% |
| Agent 数量 | 11 | 10 | -1 |
| Agent 平均行数 | ~145 | ~100 | -31% |
| Skill 子文档数 | ~40 | ~28 | -30% |
| tech-code 文件数 | 11 | 7 | -36% |
| Hook 数量 | 6 | 6 | 不变 |
| Template 数量 | 11 | 10 | -1 |
| 独立概念数 | 11 | 6 | -45% |
| Feature 核心文件数 | ~20 | ~8 | -60% |

### 简化后 tech-code 目录

```
skills/tech-code/
├── SKILL.md              (~240 行) 核心流程 + HARD-GATE + NEXUS 清单 + anti-rationalization
├── wave-execution.md     (~120 行) Wave 执行流程
├── context-preload.md    (~40 行)  简单上下文预加载
├── quality-gate.md       (~80 行)  质量门禁 + 4-Level Verification
├── deviation-handling.md (~150 行) 偏差处理 + 偏差日志
├── state-management.md   (~128 行) 状态管理（不变）
└── session-recovery.md   (~80 行)  会话恢复（单一 notepad）
```

### 简化后 Feature 目录

```
features/{id}/
├── CHANGESET.md
├── SPEC-STATE.md
├── PRD.md
├── 需求理解确认.md
├── 技术方案.md
├── 任务拆解表.md
├── STATE.md
└── learnings.md
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

## 五、执行原则

1. **先删后改** — Phase 1 全部完成后再开始 Phase 2
2. **每 5 步验证** — 每完成 5 个操作跑一次 `npm run validate && npm test`
3. **单一 commit** — 全部简化工作合并为一个 commit
4. **不重新引入** — 被删除的概念如果将来确实需要，按需加回
5. **功能等价** — 简化后的框架功能不能少于简化前（只是更精炼）

---

## 六、报告来源

| 报告 | 作者 | 侧重 |
|------|------|------|
| `simplify-plan.md` | kilo code | 12 步简化计划，聚焦删除和简化 |
| `audit-report.md` | kilo code | 根因分析，激进简化（50 行 Agent、删除 4-Level） |
| `review-and-optimization-report.md` | opencode | 状态核对，增量优化建议 |
| `audit-report-claude.md` | Claude | 文件级审查，逐行分析，平衡的优化建议 |
| **本报告** | **综合** | **共识提取 + 分歧裁决 + 统一行动计划** |
