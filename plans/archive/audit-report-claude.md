# tinypowers 全量审查报告

> 日期: 2026-03-30
> 基线: main 分支（合并 PR #1 + PR #2 后）
> 总量: ~14,900 行，115 个文件
> 参考: `plans/simplify-plan.md`（kilo code 简化计划）、`plans/audit-report.md`（kilo code 审查）

---

## 一、问题总览

tinypowers 在两轮对标优化（PR #1 + PR #2）后引入了大量"借鉴"功能，但很多是**为借鉴而借鉴**，脱离了框架"轻量实用"的核心定位。具体表现为：

| 症状 | 表现 |
|------|------|
| **概念膨胀** | EARS、NEXUS、HARD-GATE、TDD Cycle、Deviation Rules、Context Budget、Model Tiering、Per-Task Command、Gap Analyzer、4-Level Verification、Commit Trailer — 11 个独立概念，认知负担重 |
| **文件爆炸** | skills/tech-code/ 下有 11 个文件（含子文档），skills/tech-commit/ 下 5 个文件 |
| **流程过长** | 一个 feature 的完整生命周期需要跨 8 个 Phase、13 种 Artifact（schema.yaml 定义） |
| **重复定义** | 同一概念在多个文件中重复解释（如 Deviation Rules 在 SKILL.md、deviation-log.md、deviation-handling.md 三处） |
| **过度工程** | Hash-Anchored Edit 脚本 203 行但无人调用；NEXUS Handoff 326 行但与 STATE.md 职责重叠 |

---

## 二、逐层审查

### 2.1 Agents（11 个文件，共 ~1,600 行）

| Agent | 行数 | 评级 | 问题 |
|-------|------|------|------|
| `architect.md` | 145 | CORE | 决策守护是特色，但 ANTI_DUPLICATION 段是冗余的常识提醒 |
| `planner.md` | 108 | CORE | 同上，ANTI_DUPLICATION 冗余 |
| `decision-guardian.md` | 142 | CORE | 特色功能，保留 |
| `spec-compliance-reviewer.md` | 168 | USEFUL | EARS 格式检查可简化 |
| `code-reviewer.md` | 121 | CORE | 基础审查角色 |
| `security-reviewer.md` | 114 | USEFUL | 安全审查有价值但可合并为 code-reviewer 的一个 section |
| `tech-plan-checker.md` | 133 | USEFUL | Context Budget 评估段（+26 行）是 PR #1 加的，过度设计 |
| `tech-verifier.md` | 233 | USEFUL | 4-Level Verification 有价值但示例占了一半篇幅 |
| `gap-analyzer.md` | 140 | **BLOAT** | kilo code 加的，与 spec-compliance-reviewer 职责重叠（都是"发现遗漏"） |
| `agents/java/java-reviewer.md` | 169 | USEFUL | Java 栈专属，合理 |
| `agents/java/springboot-reviewer.md` | 158 | USEFUL | Spring 栈专属，合理 |

**建议**：
- 删除 `gap-analyzer.md`（职责已被 spec-compliance-reviewer 覆盖）
- `tech-plan-checker.md` 移除 Context Budget 评估段
- `architect.md` 和 `planner.md` 移除 ANTI_DUPLICATION 段

### 2.2 Skills

#### tech-code（11 个文件，~2,000 行）— **重灾区**

| 文件 | 行数 | 评级 | 问题 |
|------|------|------|------|
| `SKILL.md` | 326 | CORE | 版本从 5.0 跳到 6.0，加了 HARD-GATE/TDD/Deviation/Model Tiering，过于臃肿 |
| `tdd-cycle.md` | 189 | **BLOAT** | TDD 是常识，不需要 189 行的"指南"，一个段落足矣 |
| `model-tiering.md` | 209 | **BLOAT** | 模型选择是基础设施决策，不应作为编码流程的一部分 |
| `deviation-log.md` | 168 | **BLOAT** | 与 `deviation-handling.md`（131 行）重复，合并后可缩减到 80 行 |
| `nexus-handoff.md` | 326 | **BLOAT** | 与 STATE.md、session-recovery.md 职责三重叠加 |
| `context-preload.md` | 83 | USEFUL | Per-Task 命令文件模式增加复杂性，回滚到简单预加载即可 |
| `wave-execution.md` | 177 | USEFUL | 智慧提取（Step 5）是过度设计 |
| `quality-gate.md` | 108 | CORE | 保留 |
| `state-management.md` | 128 | CORE | 保留 |
| `session-recovery.md` | 114 | USEFUL | 持久化层（handoff.json + notepad.md）过度，简化为单一 notepad |
| 其余子文档 | ~400 | USEFUL | deviation-handling、anti-rationalization 等，内容合理 |

**建议**：
- 删除 `tdd-cycle.md`（189 行），SKILL.md 里用一段话描述即可
- 删除 `model-tiering.md`（209 行），这不是编码流程关心的事
- 合并 `deviation-log.md`（168 行）到 `deviation-handling.md`（131 行），输出一个 ~80 行的文件
- 大幅精简 `nexus-handoff.md`（326 行 → ~60 行），只保留交接检查清单，删除 7 种类型的完整模板
- `context-preload.md` 移除 Per-Task 命令文件模式
- `wave-execution.md` 移除智慧提取 Step

#### tech-commit（5 个文件，~900 行）

| 文件 | 行数 | 评级 | 问题 |
|------|------|------|------|
| `SKILL.md` | 246 | CORE | HARD-GATE + NEXUS 检查段可简化 |
| `commit-message-format.md` | 223 | USEFUL | Trailer 部分（+119 行）过度，trailer 是好习惯但不值得 100+ 行定义 |
| `nexus-handoff.md` | 326 | — | 应只在 tech-code 定义，不该出现在 tech-commit |
| `documenter-guide.md` | 90 | USEFUL | 保留 |
| `pr-workflow.md` | ~60 | USEFUL | 保留 |

#### tech-feature / tech-init / 其他 Skill

相对精简，Gotchas 章节有价值。保留。`tech-feature/requirements-guide.md` 的 EARS 强制要求可降为推荐。

### 2.3 Configs

| 文件 | 行数 | 评级 | 问题 |
|------|------|------|------|
| `schema.yaml` | 146 | **BLOAT** | 8 Phase × 13 Artifact 的形式化定义，但 validate.js 不使用它。纯文档装饰 |
| `README.md` | 79 | **BLOAT** | 解释 Rules vs Templates 分离，但这对用户来说不言自明 |
| `templates/delta-spec.md` | 109 | **BLOAT** | 增量变更模板，大项目才需要，核心框架不应包含 |
| `templates/prd-template.md` | 112 | USEFUL | EARS 格式部分过长（+44 行），可缩减 |
| `templates/state.md` | ~40 | USEFUL | Context Budget 四层质量表可简化为一句提醒 |
| 其余模板 | ~500 | CORE | 基础模板，保留 |

**建议**：
- 删除 `schema.yaml`
- 删除 `configs/README.md`
- 删除 `templates/delta-spec.md`
- 简化 `prd-template.md` 的 EARS 部分

### 2.4 Hooks（6 个文件，~1,200 行）

| 文件 | 行数 | 评级 | 问题 |
|------|------|------|------|
| `gsd-session-manager.js` | 370 | USEFUL | handoff.json + notepad.md 双持久化过度，简化为单一 notepad |
| `hook-hierarchy.js` | 164 | CORE | Hook 分级 + 禁用机制，合理 |
| 其余 4 个 | ~580 | CORE | 保留 |

### 2.5 Scripts（8 个文件，~2,100 行）

| 文件 | 行数 | 评级 | 问题 |
|------|------|------|------|
| `validate.js` | 729 | CORE | Glob 检测段是给没人用的 schema.yaml 服务的 |
| `hashline-edit-hook.js` | 203 | **BLOAT** | 无调用方、无测试、无注册。死代码 |
| `scaffold-feature.js` | 131 | CORE | learnings.md 模板的 Instinct/Confidence 表格过度设计 |
| 其余脚本 | ~1,000 | CORE | 保留 |

### 2.6 Docs & Plans

| 文件 | 行数 | 评级 |
|------|------|------|
| `optimization-roadmap-2026.md` | 144 | **BLOAT**（历史文档，已过期） |
| `repo-normalization-summary.md` | 110 | **BLOAT**（历史文档） |
| `docs/agents/python-agent-plan.md` | 11 | **BLOAT**（空壳占位） |
| `docs/agents/writing-skills-plan.md` | 11 | **BLOAT**（空壳占位） |
| 其余 guides | ~900 | USEFUL |

---

## 三、kilo code 简化计划评审

kilo code 的 `simplify-plan.md` 方向正确，逐项评审如下：

### 同意的部分（8/12）

| 项目 | 评价 |
|------|------|
| 删除 schema.yaml | 完全同意，纯装饰 |
| 删除 delta-spec.md | 同意，不属于核心 |
| 删除 gap-analyzer.md | 同意，与 spec-compliance-reviewer 重叠 |
| 简化 learnings.md 模板 | 同意，去掉 Instinct/Confidence |
| 简化 Context Budget | 同意，四层太细 |
| 简化 gsd-session-manager.js | 同意，去掉 handoff.json |
| 合并/删除 configs/README.md | 同意，删除 |
| 简化 context-preload.md | 同意，去掉 Per-Task 命令文件 |

### 需要补充的部分（kilo 遗漏）

| 项目 | 建议 |
|------|------|
| `tdd-cycle.md`（189 行） | 应删除，SKILL.md 内一段话即可 |
| `model-tiering.md`（209 行） | 应删除，不属于编码流程 |
| `nexus-handoff.md`（326 行） | 应大幅精简到 ~60 行，7 种交接模板过度 |
| `hashline-edit-hook.js`（203 行） | 应删除，死代码 |
| `docs/agents/*.md` 占位文件 | 应删除，空壳无价值 |
| `optimization-roadmap-2026.md` | 应删除，历史文档 |
| `repo-normalization-summary.md` | 应删除，历史文档 |
| Commit Trailer 定义 | `commit-message-format.md` 的 Trailer 部分应从 119 行缩减到 ~30 行 |
| ANTI_DUPLICATION 段 | architect.md 和 planner.md 中的冗余段落应移除 |
| tech-plan-checker Context Budget | 应回滚 Context Budget 评估段 |

### 部分不同意的部分

| 项目 | kilo 建议 | 我的意见 |
|------|----------|---------|
| EARS 格式 | 移除强制要求 | **保留格式要求，精简解释** — EARS 本身是好实践，只是 PRD 模板不需要 40 行来解释它 |
| wave-execution Step 5 | 移除智慧提取 | **部分同意** — 移除 Instinct/Confidence 格式，但保留简单的"记录学到的教训"习惯 |
| 4-Level Verification | 完全移除 | **不同意** — L1-L4 概念清晰有用，只是示例过长，缩减即可 |
| Feature 文件数 | 缩到 6 个 | **同意方向但不要激进** — 去掉 notes/todos/seeds 和 nexus-handoff/deviation-log，但保留 VERIFICATION.md 和 code-review.md |

### 与 kilo code 审查报告的分歧

kilo code 的 `audit-report.md` 建议更激进（把 Agent 压到 50 行、删除 4-Level Verification、合并全部子文档），我认为：

1. **Agent 不需要压到 50 行** — 当前的"身份描述"段落确实可以精简，但 80-100 行是合理的，不需要极端压缩
2. **4-Level Verification 应保留** — 这是 PR #2 中最有价值的新增，只是示例太多
3. **子文档合并要适度** — kilo 建议把 11 个文件压到 4 个，我认为 7-8 个更合理（保留独立的质量门禁和偏差处理）

---

## 四、完整优化清单

### 第一优先级：删除（直接删除，零风险）

| # | 文件 | 行数 | 原因 |
|---|------|------|------|
| 1 | `configs/schema.yaml` | 146 | 纯装饰，未被代码使用 |
| 2 | `configs/templates/delta-spec.md` | 109 | 大项目才需要，不属于核心 |
| 3 | `configs/README.md` | 79 | 不言自明的内容 |
| 4 | `agents/gap-analyzer.md` | 140 | 与 spec-compliance-reviewer 重叠 |
| 5 | `skills/tech-code/tdd-cycle.md` | 189 | TDD 是常识，一段话即可 |
| 6 | `skills/tech-code/model-tiering.md` | 209 | 不属于编码流程 |
| 7 | `scripts/hashline-edit-hook.js` | 203 | 死代码，无调用方无测试 |
| 8 | `docs/agents/python-agent-plan.md` | 11 | 空壳占位 |
| 9 | `docs/agents/writing-skills-plan.md` | 11 | 空壳占位 |
| 10 | `docs/guides/optimization-roadmap-2026.md` | 144 | 过期的历史文档 |
| 11 | `docs/guides/repo-normalization-summary.md` | 110 | 历史文档 |

**删除小计: ~1,351 行**

### 第二优先级：精简（保留但缩减）

| # | 文件 | 当前行数 | 目标行数 | 操作 |
|---|------|---------|---------|------|
| 12 | `skills/tech-code/nexus-handoff.md` | 326 | ~60 | 只保留交接检查清单，删除 7 种完整模板 |
| 13 | `skills/tech-code/deviation-log.md` | 168 | 删除 | 合并到 deviation-handling.md（+20 行即可） |
| 14 | `skills/tech-code/SKILL.md` | 326 | ~220 | 移除 TDD 大段、Model Tiering 段，精简 Deviation Rules |
| 15 | `skills/tech-code/context-preload.md` | 83 | ~40 | 移除 Per-Task 命令文件模式 |
| 16 | `skills/tech-code/wave-execution.md` | 177 | ~120 | 移除智慧提取 Step 5 的大段定义 |
| 17 | `skills/tech-code/session-recovery.md` | 114 | ~80 | 移除 handoff.json 双持久化描述 |
| 18 | `skills/tech-commit/SKILL.md` | 246 | ~180 | 移除 NEXUS 大段、精简 Commit Trailer |
| 19 | `skills/tech-commit/commit-message-format.md` | 223 | ~140 | Trailer 部分从 +100 行缩减到 ~30 行 |
| 20 | `hooks/gsd-session-manager.js` | 370 | ~280 | 移除 writePersistentHandoff + writeNotepad 双写，简化为单一 notepad |
| 21 | `configs/templates/prd-template.md` | 112 | ~80 | EARS 部分从 40 行缩减到 10 行 |
| 22 | `configs/templates/state.md` | ~40 | ~15 | Context Budget 表格简化为一行提醒 |
| 23 | `agents/tech-plan-checker.md` | 133 | ~110 | 移除 Context Budget 评估段 |
| 24 | `agents/architect.md` + `planner.md` | 253 | ~220 | 移除 ANTI_DUPLICATION 段 |
| 25 | `scripts/scaffold-feature.js` | 131 | ~100 | learnings.md 模板简化 |
| 26 | `scripts/validate.js` | 729 | ~720 | 移除 Glob 检测段 |
| 27 | `README.md` | 393 | ~280 | 移除 v6.0 特性表 |

**精简小计: 减少约 ~1,500 行**

### 第三优先级：回滚

| # | 项目 | 操作 |
|---|------|------|
| 28 | `tech-code/SKILL.md` 版本号 | 回滚 6.0 → 5.0 |
| 29 | `tech-commit/SKILL.md` 版本号 | 回滚 3.0 → 2.0 |

---

## 五、简化后预期

| 指标 | 当前 | 简化后 |
|------|------|--------|
| 总行数 | ~14,900 | ~12,000（减少 19%） |
| Agent 数量 | 11 | 10（-gap-analyzer） |
| Skill 子文档数 | ~40 | ~28 |
| Hook 数量 | 6 | 6（不变） |
| Template 数量 | 11 | 10（-delta-spec） |
| 独立概念数 | 11 | 6（保留 HARD-GATE、EARS、4-Level Verification、Decision Guardian、Anti-Rationalization、Wave Execution） |

---

## 六、执行建议

1. **先删后改** — 先完成第一优先级的删除（零风险），跑 `npm run validate && npm test` 确认通过
2. **逐文件精简** — 第二优先级按编号顺序执行，每改 3-5 个文件跑一次 validate
3. **最后回滚版本号** — 第三优先级在所有精简完成后一次性处理
4. **一个 commit 提交** — 所有简化工作作为一个 commit，message 说明简化理由
5. **不要重新引入** — 简化后的概念如果将来确实需要，再按需加回，而不是预置

---

## 七、总结

tinypowers 的核心价值是**轻量、实用、纪律性**。PR #1 和 PR #2 的初衷是好的（对标学习优秀项目），但执行时犯了"全盘照搬"的错误——把别的项目的好东西全部堆进来，没有考虑它们在一起是否协调、是否有必要。

**好的框架不是什么都有的框架，而是该有的都有、不该有的都没有的框架。**
