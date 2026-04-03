# 三平台全流程审查整合报告

> 整合时间: 2026-04-02
> 来源: Claude / Codex / OpenCode 分别独立执行全流程审查
> 目标: 交叉验证、去重、识别共识与分歧，产出统一优化方案

---

## 一、三份报告概况

| 维度 | Claude | Codex | OpenCode |
|------|--------|-------|----------|
| 文件 | `pipeline-audit.md` | `dogfood-optimization-plan.md` | `2026-04-02-e2e-workflow-review-complex.md` |
| 测试项目 | Spring Boot 3.2 书店 | Node.js Express Task API | Spring Boot 2.7 任务管理 |
| 测试需求 | 购物车+订单管理 | Task CRUD + JWT Auth | 任务组合筛选+摘要统计 |
| 需求复杂度 | 中高（多模块+DB+状态机） | 中（10 任务 + 4 Wave） | 中（单服务 4 任务，无DB） |
| 路由 | Standard | Standard | Standard |
| 测试方法 | 人工走查（未实际执行） | 实际 dogfood | 实际 dogfood |
| 版本差异 | 当前 worktree（有 init-project.js） | 疑似旧版（init 仍手动） | 当前主线（有 init-project.js） |

**版本差异说明**: Codex 报告提到 init 手动执行 22 个文件操作、`doc/` vs `docs/` 路径不一致，说明可能基于旧版测试。Claude 和 OpenCode 都确认 `scripts/init-project.js` 已存在。下文优化方案基于**当前最新版本**。

---

## 二、交叉验证 — 三方共识

### 共识 1: Fast/Standard 两档不够，中间缺一档

| 来源 | 表述 |
|------|------|
| Claude | "Fast 路径条件过于严格，大多数功能走 Standard。Fast 产出 80% 价值但只有 20% 仪式" |
| Codex | "引入 Track 分级（fast / standard），让小需求走快车道" |
| OpenCode | **"Fast / Standard 两档还不够。中间缺一个 Medium / Standard-lite 档"** |

**共识**: 当前 Fast 只适合极简改动（单文件、无DB），Standard 对中等需求偏重。三方都认为需要中间档。

---

### 共识 2: 需求理解 "one question at a time" 体验差

| 来源 | 表述 |
|------|------|
| Claude | "5 轮交互确认显而易见的信息，one question at a time 对简单需求体验极差" → 复杂度 4/5 |
| Codex | F-4: "One question at a time 不适配小需求" (MEDIUM) |
| OpenCode | "对不涉及数据库、不涉及外部系统的需求，文档成本偏高" |

**共识**: requirements-guide.md 的逐项提问策略对所有规模的需求都是负担。应改为批量提问 + 按需追问。

---

### 共识 3: 产物/文档数量过多

| 来源 | 数据 |
|------|------|
| Claude | "Standard 产出 8 个文档，其中 需求理解确认.md 是一次性文档" |
| Codex | "init 产出 14 个文件 ~800 行 boilerplate；feature 4 个文档 for 6h 任务" |
| OpenCode | "init 17 个新文件；feature 规划文档 374 行" |

**共识**: init 和 feature 的文档产出量相对于实际编码量不成比例。

---

### 共识 4: 审查对小/中需求偏重

| 来源 | 表述 |
|------|------|
| Claude | "Phase 5 三步串行审查 ~15 min。spec-compliance 和 security 无依赖关系，可并行" → 复杂度 4/5 |
| Codex | C-2: "三阶段审查对小改动过重" (LOW) |
| OpenCode | "Standard 路由强调 worktree/subagent/review delegation，但真实执行没有一项是必须的" |

**共识**: 三步串行审查（spec-compliance → security → code-quality）对中等需求是浪费。

---

### 共识 5: 知识捕获/Knowledge Capture ROI 低

| 来源 | 表述 |
|------|------|
| Claude | "Google 能搜到的不记录 标准极难操作，沉淀步骤经常空转" → 复杂度 3/5 |
| OpenCode | "learnings 只沉淀了 1 条通用经验" |
| Codex | 未单独提及（但隐含在"文档过载"问题中） |

**共识**: knowledge.md 知识沉淀机制设计意图好，但实践中大部分时候空转。

---

### 共识 6: SPEC-STATE 状态管理有开销

| 来源 | 表述 |
|------|------|
| Claude | "4 次状态推进 = 4 次文件更新 + 4 次门禁检查" |
| Codex | F-3: "SPEC-STATE 手动更新" (MEDIUM) + 建议"合并 SPEC-STATE + STATE" |
| OpenCode | **"SPEC-STATE 历史表插入 bug 仍存在！真实产物中历史行被插到表头前"** |

**共识**: SPEC-STATE 维护是摩擦点。OpenCode 额外发现了真实的 bug。

---

## 三、各报告独有发现

### Claude 独有

| # | 发现 | 价值 |
|---|------|------|
| C-1 | **SKILL.md 与 init-project.js 不同步**: SKILL.md Step 3 仍描述手动 22 个文件操作，但 init-project.js 已存在 | 高 — 文档与代码不一致 |
| C-2 | **Pattern Scan 对新项目价值低**: 模拟中 4 个任务 3 个 GREENFIELD | 中 — 应按项目成熟度自适应 |
| C-3 | **Gate Check 重复调用 tech-plan-checker**: feature Phase 4 和 code Phase 0 各调一次 | 低 — 可去重 |
| C-4 | **歧义检测+brainstorming 强制 2-3 方案是创造不存在的决策点**: 对 CRUD 需求多方案没有意义 | 中 — 与 OpenCode 共识互补 |
| C-5 | **Feature 交互占 67%**: 量化了交互分布，瓶颈在 feature | 高 — 优化靶向明确 |

### Codex 独有

| # | 发现 | 价值 |
|---|------|------|
| X-1 | **Java 内容注入 Node.js 项目**: development-spec.md 全是 Maven/MyBatis 内容 | 高 — 技术栈感知缺失 |
| X-2 | **init 分 profile 建议**: minimal / standard / full 三档 | 中 — 值得考虑 |
| X-3 | **合并 SPEC-STATE + STATE 为 LIFECYCLE.md**: 减少两个状态文件间的维护 | 中 — 值得考虑 |
| X-4 | **决策锁定粒度建议**: critical/normal/info 三级，小项目只锁 critical | 中 — 好的分级思路 |
| X-5 | **STATE.md 手动维护每 Wave**: 建议从 git diff 自动推断进度 | 低 — 可自动化 |

### OpenCode 独有（最有价值，基于实际执行）

| # | 发现 | 价值 |
|---|------|------|
| O-1 | **SPEC-STATE 历史表 bug 仍在真实项目中复现**: 测试用例通过但实际输出错误 | 🔴 最高 — 必须立即修 |
| O-2 | **DONE 状态制造额外 commit**: 提交后再推 DONE 需要第二个 commit | 高 — 流程设计缺陷 |
| O-3 | **doctor.js 路径规范化 bug**: /tmp/ 和 /private/tmp/ 结果不一致 | 高 — init 后验证误报 |
| O-4 | **VERIFICATION.md 完全手写**: 建议从测试结果自动生成初稿 | 中 — 减少手工负担 |
| O-5 | **Medium 路由的量化目标**: planning 控制在 120-180 行，跳过歧义探索 | 高 — 可操作的设计指标 |
| O-6 | **init 产物应单独 commit**: 让后续 feature 分支更干净 | 中 — 好实践 |

---

## 四、关键分歧

| 议题 | Claude | Codex | OpenCode | 判定 |
|------|--------|-------|----------|------|
| init 是否已脚本化 | SKILL.md 描述手动，但脚本已存在 | 报告为手动 | 报告为已脚本化 | **已脚本化但 SKILL.md 未同步** |
| 复杂度分几档 | 保持两档（Fast + Standard），扩大 Fast | 两档（fast / standard） | **三档（Fast / Medium / Standard）** | **采用三档**，三方中 OpenCode 实际执行后结论最可信 |
| SPEC-STATE + STATE 是否合并 | 未提及 | 建议合并 | 未提及 | **暂不合列**，优先修 bug |
| init 分 profile | 未提及 | 建议三档 profile | 未提及 | **值得做**，作为 P1 |
| 审查分级标准 | 按串行→并行合并 | 按变更量分级（<50/50-500/>500行） | 标准路由不需要 review delegation | **按变更量+路由双维度** |

---

## 五、整合优化方案

### P0: 必须立即修复

#### P0-1: 修复 SPEC-STATE 历史表插入 bug

**来源**: OpenCode O-1（真实复现）
**问题**: `update-spec-state.js` 的 `appendHistoryRow` 把历史行插到表头前面，导致输出：
```
| 2026-04-02 | PLAN | EXEC | ... |     ← 错误位置（在表头前）
| 2026-04-02 | EXEC | REVIEW | ... |
## 阶段历史                          ← 表头在这里
| 时间 | 从 | 到 | 备注 |            ← 正式的列头
```
**修复**: 检查 `appendHistoryRow` 中 `insertIndex` 的计算逻辑，确保历史行插入到分隔行之后。

---

#### P0-2: 修复 doctor.js 路径规范化

**来源**: OpenCode O-3
**问题**: `/tmp/` 和 `/private/tmp/`（macOS symlink）给出的验证结果不一致。
**修复**: `doctor.js` 中 resolve/realpath 处理。

---

#### P0-3: 同步 SKILL.md 与 init-project.js

**来源**: Claude C-1
**问题**: tech-init SKILL.md Step 3 仍描述 6 个手动子步骤（3a-3f），但 `init-project.js`（347行）已存在并完成了这些操作。
**修复**: SKILL.md Step 3 改为一行脚本调用 + 脚本输出说明。

---

### P1: 核心优化（解决共识痛点）

#### P1-1: 引入 Medium 路由

**来源**: 三方共识 + OpenCode O-5

```text
当前:  Fast (2 Phase) ← 条件过严 → Standard (5 Phase) ← 偏重
改为:  Fast (2 Phase) ← Medium (3 Phase) ← Standard (5 Phase)
```

| 维度 | Fast | Medium (新增) | Standard |
|------|------|--------------|----------|
| 判定条件 | 单模块 + ≤2人天 + 无DB + 无安全 | 单/双模块 + 3-6任务 + 无跨系统依赖 | 多模块 / 跨系统 / 架构变更 |
| 需求理解 | 1 轮批量确认 | 1 轮批量确认 | 1-2 轮（允许追问） |
| 歧义+方案 | 跳过 | 跳过歧义，AI 直接出推荐方案 | 歧义检测 + 多方案探索 |
| 技术方案 | 不生成 | 精简版（≤80行）：目标+接口+数据+决策 | 完整版（当前模板） |
| 任务拆解 | 精简版（≤20行） | 标准版（Epic→Task，≤60行） | 标准版 + tech-plan-checker |
| 文档总量 | 3 个 | 4 个 | 6 个 |
| SPEC-STATE | PLAN→EXEC 直达 | PLAN→EXEC 直达 | 逐级推进 |
| 审查 | 编码后自审 | 合规+安全合一 | 三步串行（当前） |

**OpenCode 的量化指标**: Medium planning 控制在 120-180 行。

---

#### P1-2: 需求理解改为批量提问

**来源**: 三方共识

**修改 requirements-guide.md**:

删除:
- "one question at a time"
- "每次只确认一个主题"

改为:
```
一轮提出所有核心维度的问题（背景/用户/范围/验收/非功能）。
用户自由回答，AI 只追问缺失项。
不需要逐项确认。
```

**预期收益**: 交互从 5+ 轮 → 1-2 轮。

---

#### P1-3: 审查分级（按变更量 × 路由双维度）

**来源**: Claude 共识4 + Codex C-2

```text
审查级别由变更量和路由共同决定:

Fast 路由:  编码后自审（当前已实现）
Medium 路由: 合规+安全合并为一步审查
Standard 路由:
  变更 < 100 行 → 合规+安全合并
  变更 ≥ 100 行 → 保持三步（当前行为）
```

合并方式: spec-compliance-reviewer + security-reviewer → compliance-reviewer（一个 agent 同时检查方案符合性和安全性）。

---

#### P1-4: 精简 Feature 产物

**来源**: Claude + Codex 共识

| 当前 | 优化后 | 说明 |
|------|--------|------|
| PRD.md | PRD.md | 保留 |
| 需求理解确认.md | *(合并到 PRD)* | 消除一次性文档 |
| 技术方案.md | 技术方案.md | 保留 |
| 任务拆解表.md | 任务拆解表.md | 保留 |
| CHANGESET.md | *(删除)* | 信息量不足 |
| 评审记录.md | *(删除)* | 内联到输出 |
| SPEC-STATE.md | SPEC-STATE.md | 保留（运行时需要） |
| notepads/learnings.md | notepads/learnings.md | 保留 |

Fast/Medium: 只生成 PRD + 任务拆解 + SPEC-STATE + learnings = 4 个文件。
Standard: 生成 PRD + 技术方案 + 任务拆解 + SPEC-STATE + learnings = 5 个文件。

---

#### P1-5: 解决 DONE 状态的额外 commit 问题

**来源**: OpenCode O-2

**问题**: 提交代码后，SPEC-STATE 从 REVIEW→DONE 需要修改文件，产生第二个 commit。

**方案**: 在 commit 步骤中，将 SPEC-STATE 更新与代码变更放在同一个 commit 中：
- 提交前先将 SPEC-STATE 更新为 DONE
- 然后 commit 代码 + SPEC-STATE 一起

或者: DONE 改为推导态（git 已 push + VERIFICATION PASS = DONE），不再需要显式状态文件。

---

### P2: 重要改进

#### P2-1: VERIFICATION.md 自动生成初稿

**来源**: OpenCode O-4

从最近一次测试命令的输出自动抽取：
- 测试数量
- 通过/失败
- 关键场景覆盖情况

生成最小验证骨架，用户只补结论。

---

#### P2-2: 知识捕获改为被动触发

**来源**: Claude 共识5

```text
当前: 每次 commit 都执行 Knowledge Capture 判断
改为: learnings.md 无实质内容时跳过，有内容时才执行判断
```

---

#### P2-3: init 精简 Guide 复制

**来源**: Claude P2-2

只复制 3 个核心 guide:
- workflow-guide.md
- development-spec.md
- test-plan.md

其他 5 个框架内部文档不复制到目标项目。

---

#### P2-4: 决策锁定分级

**来源**: Codex X-4

```text
critical: 架构选型、数据模型、对外接口 → 必须锁定 (所有路由)
normal:   库选择、错误格式 → 记录但不锁定 (Medium 可跳过)
info:     编码风格、命名 → 不记录为决策
```

---

#### P2-5: Gate Check 去重

**来源**: Claude C-3

code Phase 0 不再重新调用 tech-plan-checker（feature Phase 4 已调用过）。

---

### P3: 锦上添花

| 来源 | 改进 | 说明 |
|------|------|------|
| Codex X-3 | 合并 SPEC-STATE + STATE | 两个状态文件合并为 LIFECYCLE.md |
| Codex X-5 | STATE.md 自动推断进度 | 从 git diff 推断 task 完成状态 |
| Codex X-2 | init 分 profile | minimal / standard / full 三档 |
| OpenCode O-6 | init 产物单独 commit | 文档中推荐这个实践 |
| Claude P2-4 | 统一 Phase/Step 命名 | 全部改为 Step |
| Claude C-2 | Pattern Scan 按项目成熟度自适应 | 新项目可跳过 |

---

## 六、实施路径

```text
Phase 1 (立即 — 修 bug):
  ✅ P0-1: 修 update-spec-state.js 历史表 bug
  ✅ P0-2: 修 doctor.js 路径规范化
  ✅ P0-3: 同步 tech-init SKILL.md 与 init-project.js

Phase 2 (核心 — 解决最大痛点):
  ⬜ P1-1: 引入 Medium 路由（改 4 个 SKILL.md + scaffold + spec-state 模板）
  ⬜ P1-2: 需求理解改为批量提问（改 requirements-guide.md）
  ⬜ P1-3: 审查分级（合并 spec-compliance + security agent）
  ⬜ P1-4: 精简 Feature 产物（改 scaffold-feature.js）
  ⬜ P1-5: 解决 DONE 额外 commit 问题

Phase 3 (增强):
  ⬜ P2-1 ~ P2-5
```

---

## 七、预期效果

| 维度 | 当前 | Phase 2 后 | Phase 3 后 |
|------|------|-----------|-----------|
| 路由 | 2 档 | **3 档** (Fast/Medium/Standard) | 3 档 |
| 中等需求交互轮次 | ~14 轮 (Standard) | **~5-7 轮** (Medium) | ~5-7 轮 |
| 中等需求文档数 | 8 | **4** | 4 |
| 中等需求耗时 | ~115 min | **~60 min** | ~50 min |
| 编码时间占比 | 17% | **~35%** | ~40% |
| Agent 数量 | 7 | **5** | 5 |
| SPEC-STATE bug | 存在 | **已修复** | 已修复 |
| SKILL.md 与代码同步 | 否 | **是** | 是 |

---

## 八、核心结论

三份报告从不同技术栈（Java/Node）、不同需求规模、不同执行方式（模拟/实际 dogfood）出发，得出高度一致的结论：

1. **最大痛点是 Medium 缺失**: Fast 太轻、Standard 太重，80% 的真实需求落在中间地带
2. **需求理解交互过度**: "one question at a time" 是三方共同吐槽的第一体验问题
3. **文档仪式性过重**: 编码只占 17% 时间，其余是文档和状态管理
4. **SPEC-STATE 有真实 bug**: OpenCode 实际执行发现历史表插入逻辑仍然错误

**如果下一步只做三件事**: 修 SPEC-STATE bug → 引入 Medium 路由 → 改批量提问。这三项覆盖了三方报告的核心诉求。
