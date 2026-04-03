# tinypowers 全流程优化方案

> 基于真实 dogfood 体验：从零创建 Node.js 项目 → init → feature → code → commit
> 需求规模：Task CRUD + JWT Auth（10 个任务，4 个 Wave，约 6 小时工作量）

---

## 一、全流程耗时与产出对比

| 阶段 | 实际编码时间 | 流程开销时间 | 产出文件数 | 产出行数 | 复杂度评分 |
|------|------------|------------|-----------|---------|-----------|
| `/tech:init` | 0 min | ~10 min | 14 | ~800 | 🔴 高 |
| `/tech:feature` | 0 min | ~15 min | 5 | ~300 | 🟡 中 |
| `/tech:code` | ~30 min | ~10 min | 6 | ~350 | 🟢 低 |
| `/tech:commit` | ~2 min | ~3 min | 0 | 0 | 🟢 低 |
| **总计** | **~32 min** | **~38 min** | **25** | **~1450** | — |

**核心问题：流程开销 > 实际编码时间。对于一个 6 小时的需求，文档和状态管理花了比写代码更多的时间。**

---

## 二、各阶段复杂度审查

### 1. `/tech:init` — 🔴 最严重

**问题清单：**

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| I-1 | **Java 内容注入 Node.js 项目** | BLOCK | development-spec.md 全是 Maven/MyBatis/Dubbo，对 Node.js 项目零价值 |
| I-2 | **文档过载** | HIGH | 7 个 guide + 2 个模板 = ~800 行 boilerplate，大部分项目用不上 |
| I-3 | **7 个 Agent 定义全量创建** | HIGH | requirement-analyst、architect、task-splitter 等 7 个 .md 文件，小项目根本不需要 |
| I-4 | **无技术栈自适应** | HIGH | 不管什么项目都复制同一套 Java 文档 |
| I-5 | **`doc/` vs `docs/` 路径不一致** | MEDIUM | init 创建 `doc/`，框架自身用 `docs/` |

**优化建议：**

```
init 应该分 profile：
- minimal: CLAUDE.md + features/ + .claude/ (3 个文件)
- standard: minimal + 技术栈相关规则 + 核心 guide (8-10 个文件)
- full: standard + 全部模板 + 全部 Agent (当前行为)

默认使用 minimal，用户按需 /tech:init --profile full
```

### 2. `/tech:feature` — 🟡 中等

**问题清单：**

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| F-1 | **4 个文档 for 6h 任务** | HIGH | PRD + 需求确认 + 技术方案 + 任务拆解 = 4 个文件，文档/代码比失衡 |
| F-2 | **决策锁定过重** | MEDIUM | D-01~D-06 锁定了 "用 jsonwebtoken" 这种显而易见的选择 |
| F-3 | **SPEC-STATE 手动更新** | MEDIUM | 每次阶段推进都要手动编辑 SPEC-STATE.md |
| F-4 | **"One question at a time" 不适配小需求** | MEDIUM | 简单 CRUD 不需要多轮澄清 |
| F-5 | **Seed 扫描增加无谓步骤** | LOW | 小项目没有 seeds/，扫描是空操作 |

**优化建议：**

```
引入 fast track：
- 需求 < 1 人天 → 合并 PRD + 技术方案 为单个 feature-spec.md
- 决策只锁架构级（框架选型、数据模型），不锁库级别
- SPEC-STATE 更新自动化（脚本或 hook）
- 歧义检测只对"关键模糊点"提问，非全量扫描
```

### 3. `/tech:code` — 🟢 可接受

**问题清单：**

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| C-1 | **STATE.md 手动维护** | MEDIUM | 每个任务完成都要编辑 STATE.md 表格 |
| C-2 | **三阶段审查对小改动过重** | LOW | 10 行改动也要跑 spec-compliance + security + code-quality |
| C-3 | **TDD 强制门禁的例外太多** | LOW | quick fix、配置、文档、脚手架、原型都有例外，实际约束力弱 |
| C-4 | **Wave 分拆对小需求不必要** | LOW | 6 小时任务拆 4 个 Wave，管理开销 > 并行收益 |

**优化建议：**

```
- STATE.md 自动追踪（从 git diff 或文件修改时间推断）
- 审查阶段按变更量分级：< 50 行 → 轻量审查，> 500 行 → 完整审查
- Wave 合并：单文件/单模块变更不需要分 Wave
```

### 4. `/tech:commit` — 🟢 轻量

**问题清单：**

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| M-1 | **文档同步检查项过多** | LOW | 小项目没有 API 文档/README 示例需要更新 |
| M-2 | **Trailer 格式过于复杂** | LOW | Constraint/Rejected/Evidence/Confidence 四字段，多数情况填不满 |

---

## 三、根因分析

### 根因 1：框架为"企业级 Java 项目"设计，但用户用它开发各种规模的项目

当前 skill 的所有假设（Jira 需求编号、PRD 文档、技术方案评审、多分支协作）都来自企业 Java 开发场景。
对于 Node.js 小项目、个人项目、快速原型，这套流程是 overkill。

### 根因 2：状态管理完全依赖手动 Markdown 编辑

SPEC-STATE.md、STATE.md、CHANGESET.md 三个状态文件，每次阶段推进都需要手动编辑。
没有脚本辅助，没有自动检测，全靠 AI 记住去更新。

### 根因 3：文档模板没有技术栈感知

`tech:init` 复制的文档全是 Java/Spring Boot 内容，对 Node.js/Go/Python 项目完全不匹配。
技术栈检测已经有了，但检测结果没有用于选择对应的文档模板。

---

## 四、优化方案（按优先级排序）

### P0: 引入 Track 分级（fast / standard）

**目标**：让小需求走快车道，大需求走完整流程。

```yaml
# 在 SPEC-STATE.md 中增加 track 字段
track: fast        # < 1 人天，合并文档
track: standard    # >= 1 人天，完整流程

# fast track 产物：
features/{id}-{name}/
├── feature-spec.md    # PRD + 技术方案 合并
├── 任务拆解表.md       # 简化版（只列 Task，不拆 Epic/Story）
└── SPEC-STATE.md

# standard track 产物：（保持现有）
features/{id}-{name}/
├── PRD.md
├── 需求理解确认.md
├── 技术方案.md
├── 任务拆解表.md
├── 评审记录.md
└── SPEC-STATE.md
```

**预期效果**：feature 阶段文档从 4-5 个减少到 2-3 个，耗时减半。

### P0: init 分 profile + 技术栈自适应

**目标**：init 不再向 Node.js 项目注入 Java 文档。

```bash
# 自动检测技术栈后选择 profile
node init-project.js --auto    # 检测 + 最小化安装
node init-project.js --profile java-fullstack   # 完整 Java 栈
node init-project.js --profile node-express     # Node.js 栈
node init-project.js --profile minimal          # 仅骨架
```

每个 profile 对应不同的文档模板集：
- `minimal`: CLAUDE.md + features/ + .claude/
- `node-express`: minimal + Node.js 开发规范 + Jest 测试规范
- `java-fullstack`: minimal + Java 规范 + MyBatis 规范 + MySQL 规范

**预期效果**：init 产出从 14 个文件减少到 3-6 个（取决于 profile），Java 内容不再出现在 Node.js 项目中。

### P1: 状态文件自动化

**目标**：SPEC-STATE.md 和 STATE.md 的更新自动化。

```bash
# 推进阶段
node scripts/update-spec-state.js --feature TASK-001 --to EXEC

# 自动检测任务完成情况（从 git diff 或文件存在性）
node scripts/update-spec-state.js --feature TASK-001 --auto-detect
```

**预期效果**：减少 30% 的手动编辑操作。

### P1: 审查阶段按变更量分级

**目标**：小改动不走完整三阶段审查。

```yaml
# 审查分级
light:    变更 < 50 行 → 只做方案符合性检查
standard: 变更 50-500 行 → 方案 + 安全
full:     变更 > 500 行 → 方案 + 安全 + 代码质量

# 自动判断
if (changed_lines < 50) review_level = light
```

### P2: 决策锁定精简

**目标**：只锁真正重要的决策。

```yaml
# 决策分级
critical:  架构选型、数据模型、对外接口契约 → 必须锁定
normal:    库选择、错误格式、中间件 → 记录但不锁定
info:      编码风格、命名约定 → 不记录为决策

# 小项目只记录 critical 决策
```

### P2: 合并 spec-state 和 state

**目标**：两个状态文件合并为一个，减少维护负担。

```yaml
# 合并后的 LIFECYCLE.md
phase: PLAN | EXEC | REVIEW | DONE
wave: 2
tasks_completed: [T-001, T-002, T-003]
tasks_pending: [T-004, T-005]
deviations: []
blockers: []
```

---

## 五、优化后预期效果

| 指标 | 优化前 | 优化后 (fast track) | 优化后 (standard) |
|------|--------|-------------------|-----------------|
| init 产出文件 | 14 | 3 (minimal) | 8 (profile-matched) |
| feature 文档数 | 4-5 | 2 | 5 |
| feature 耗时 | ~15 min | ~5 min | ~12 min |
| STATE 手动编辑 | 每次 Wave | 自动 | 自动 |
| 审查步骤 | 3 (固定) | 1 (light) | 2-3 (按量) |
| 总流程开销 | ~38 min | ~15 min | ~25 min |
| 流程/编码比 | 1.2:1 | 0.5:1 | 0.8:1 |

---

## 六、实施优先级

```
Phase 1 (立即):
  ✅ P0: Track 分级 (fast/standard)
  ✅ P0: init profile + 技术栈自适应

Phase 2 (短期):
  ⬜ P1: 状态文件自动化脚本
  ⬜ P1: 审查分级

Phase 3 (中期):
  ⬜ P2: 决策锁定精简
  ⬜ P2: 合并 SPEC-STATE + STATE
```
