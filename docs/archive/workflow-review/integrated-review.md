# tinypowers 全流程整合审查报告

> 三份独立试跑报告的交叉分析：Codex（pipeline-audit）、Claude（e2e-complex）、OpenCode（dogfood）
> 审计时间：2026-04-02

---

## 一、试跑概览

| 维度 | Codex | Claude | OpenCode |
|------|-------|--------|----------|
| 测试项目 | Spring Boot 3.2 书店 | Spring Boot 2.7 任务管理 | Node.js + Express 任务管理 |
| 技术栈 | Java + JPA + H2 | Java + Maven | Node.js + SQLite |
| 需求 | 购物车+订单管理 | 任务组合筛选+摘要统计 | Task CRUD + JWT Auth |
| 复杂度 | 多模块 + DB 变更 | 单服务 + 4 任务 | 单服务 + 10 任务 |
| Track | Standard | Standard | 无分级（手动走完全流程） |
| 总预估耗时 | ~115 min | — | ~70 min |
| 编码占比 | 17% | — | 46% |
| 产出文件 | ~30 | ~25 | ~25 |

**三份报告覆盖了 Java 和 Node.js 两种技术栈、从 CRUD 到多模块的不同复杂度，结论具有交叉验证价值。**

---

## 二、交叉验证结论（三份报告一致发现的问题）

### 🔴 共识 1：Feature 阶段是最大瓶颈

| 来源 | 证据 |
|------|------|
| Codex | 67% 的用户交互集中在 feature，Phase 1 "one question at a time" 贡献 5 轮冗余交互 |
| Claude | 374 行规划文档（PRD 93 + 方案 171 + 拆解 59 + SPEC-STATE 51），对单服务需求偏重 |
| OpenCode | 4 个文档 for 6 小时任务，流程开销 > 编码时间 |

**根因**：`requirements-guide.md` 强制 "one question at a time"，歧义检测和 brainstorming 拆成两个独立 Phase，对中等复杂度需求产生 9-12 轮交互。

### 🔴 共识 2：Fast / Standard 两档不够

| 来源 | 证据 |
|------|------|
| Codex | 未明确提及两档问题，但指出 CRUD 场景下歧义检测产出"显而易见的问题" |
| Claude | **核心结论**："Fast 太轻，Standard 太重，中间缺 Medium 档" |
| OpenCode | 建议引入 fast track，但实际体验中 Standard 对小需求仍然过重 |

**根因**：当前分级只有两档，但实际需求复杂度是连续的。单服务多文件改动（3-5 任务、无 DB 变更、无跨系统）落在两档之间的空档。

### 🔴 共识 3：Init 缺乏脚本自动化

| 来源 | 证据 |
|------|------|
| Codex | Step 3 有 22 个文件操作全靠 AI 手动，~12 min；scaffold-feature.js 证明脚本化可行 |
| Claude | init 产出 17 个文件、2805 行，doctor 路径规范化有缺口（/tmp vs /private/tmp） |
| OpenCode | Java 内容注入 Node.js 项目，无技术栈自适应，14 个文件 800+ 行 boilerplate |

**根因**：init 最重的部分（规则加载、模板复制、变量替换、目录创建）没有对应的 `init-project.js` 脚本，全靠 AI 逐文件操作。

### 🟡 共识 4：审查阶段串行设计浪费

| 来源 | 证据 |
|------|------|
| Codex | 3 步串行审查 ~15 min，spec-compliance 和 security 无依赖关系却串行 |
| Claude | 未特别提及串行问题，但指出 code 阶段比 feature 顺得多 |
| OpenCode | 三阶段审查对小改动过重，建议按变更量分级 |

### 🟡 共识 5：状态文件手动维护成本高

| 来源 | 证据 |
|------|------|
| Codex | STATE.md 初稿自动生成但后续更新全靠人工；VERIFICATION.md 完全手工编写 |
| Claude | SPEC-STATE 历史表 bug 在真实项目中复现（历史行插到表头前）；DONE 状态需要额外 commit |
| OpenCode | SPEC-STATE 每次阶段推进都要手动编辑，STATE.md 每个任务完成都要更新表格 |

---

## 三、各阶段独有发现

### /tech:init

| 发现 | 来源 | 严重度 |
|------|------|--------|
| Java 文档注入 Node.js 项目 | OpenCode | BLOCK |
| doctor 路径规范化缺口（/tmp vs /private/tmp） | Claude | HIGH |
| 8 个 guide 中包含框架内部文档（capability-map 等），对项目价值低 | Codex | MEDIUM |
| knowledge.md 知识扫描性价比极低（对简单项目只记录"用了 Lombok"） | Codex | MEDIUM |
| 7 个 Agent 定义全量创建，小项目不需要 | OpenCode | HIGH |
| `doc/` vs `docs/` 路径不一致 | OpenCode | MEDIUM |
| init 完成后应单独 commit 一次初始化产物 | Claude | LOW |

### /tech:feature

| 发现 | 来源 | 严重度 |
|------|------|--------|
| 标准模板偏空壳，必须人工大段补全，没有从需求描述生成半成品 | Claude | HIGH |
| 歧义检测对常见需求产出显而易见的问题（库存不足怎么办？） | Codex | MEDIUM |
| 强制多方案 brainstorming（3 个方案 + trade-offs）对 CRUD 是创造不存在的决策点 | Codex | MEDIUM |
| Epic → Story → Task 三层对多数功能偏深 | Codex | MEDIUM |
| docs 中保留 brainstorming/writing-plans 委托说明，增加理解负担 | Claude | LOW |
| Seed 扫描对小项目是空操作 | OpenCode | LOW |
| 决策锁定了 "用 jsonwebtoken" 这种显而易见的选择 | OpenCode | MEDIUM |

### /tech:code

| 发现 | 来源 | 严重度 |
|------|------|--------|
| Gate Check 重复调用 tech-plan-checker（feature Phase 4 已调用过） | Codex | MEDIUM |
| Pattern Scan 对新项目价值低（4 个任务 3 个是 GREENFIELD） | Codex | LOW |
| TDD 强制门禁例外太多（quick fix、配置、文档、脚手架、原型），约束力弱 | OpenCode | LOW |
| Wave 分拆对小需求不必要（6 小时任务拆 4 个 Wave） | OpenCode | LOW |
| 筛选逻辑与摘要逻辑共用服务层规则这种重要约束容易沉淀到 learnings | Claude | — |

### /tech:commit

| 发现 | 来源 | 严重度 |
|------|------|--------|
| DONE 状态需要额外 meta commit（功能提交 + 状态收口 = 2 个 commit） | Claude | HIGH |
| Knowledge Capture ROI 低，经常空转 | Codex | MEDIUM |
| PR 步骤依赖远端平台，本地 bare remote 无法完整验证 | Claude | MEDIUM |
| Trailer 四字段（Constraint/Rejected/Evidence/Confidence）多数填不满 | OpenCode | LOW |

---

## 四、根因分析

### 根因 1：框架为企业级 Java 场景设计，但用户用它开发各种规模的项目

三份报告覆盖了 Java 和 Node.js，但框架的所有 skill 假设（Jira 编号、PRD、技术评审、多分支协作、Maven 构建）都来自企业 Java 开发场景。

- OpenCode 试跑中：Node.js 项目收到 Maven/MyBatis/Dubbo 文档
- Codex 试跑中：技术栈检测只做 "pom.xml 存在？" 一个判断，其余字段硬编码映射
- Claude 试跑中：Fast/Standard 分级对 Java 中等复杂需求仍然不够精细

### 根因 2：状态管理完全依赖手动 Markdown 编辑

SPEC-STATE.md、STATE.md、CHANGESET.md 三个状态文件，每次阶段推进都需要手动编辑。没有脚本辅助，没有自动检测。

- Claude 试跑中：SPEC-STATE 历史表 bug 复现（历史行插到表头前）
- Claude 试跑中：DONE 状态天然需要额外 commit
- Codex 试跑中：STATE.md 初稿自动生成但后续更新全靠人工

### 根因 3：交互设计过度形式化

- "One question at a time" 对简单需求产生 5 轮冗余交互
- 歧义检测和 brainstorming 拆成两个独立 Phase
- 强制多方案探索对确定性需求创造不存在的决策点

---

## 五、整合优化方案

### P0：必须优化（体验瓶颈）

#### P0-1：新增 Medium / Standard-lite 路由

**来源**：Claude（核心发现）、Codex（隐含）、OpenCode（隐含）

```yaml
# 判定条件（满足全部即为 Medium）
- 单服务或单模块
- 3-8 个任务
- 无 DB 变更或仅单表变更
- 无跨系统依赖

# Medium 产物
features/{id}-{name}/
├── feature-spec.md       # PRD + 技术方案 合并
├── 任务拆解表.md          # 简化版（只列 Task）
└── SPEC-STATE.md

# 目标
- planning 文档控制在 120-180 行（当前 Standard 374 行）
- 跳过歧义探索和外部委托
- 保留任务拆解和锁定决策
```

#### P0-2：合并需求理解为单轮交互

**来源**：Codex（核心发现）、OpenCode

```
修改 requirements-guide.md：
- 删除 "one question at a time" 和 "每次只确认一个主题"
- 改为 "一轮提出所有核心问题，用户自由回答，AI 追问缺失项"
- 预期：5 轮 → 1-2 轮
```

#### P0-3：创建 init-project.js 脚本

**来源**：Codex（核心发现）、OpenCode、Claude

```bash
node scripts/init-project.js --root . --profile auto
# 自动检测技术栈 → 选择对应 profile → 复制规则/模板 → 替换变量 → 验证
```

Profile 设计：
- `minimal`：CLAUDE.md + features/ + .claude/（3 个文件）
- `node-express`：minimal + Node.js 规范 + Jest 测试规范
- `java-fullstack`：minimal + Java 规范 + MyBatis 规范 + MySQL 规范
- `auto`：根据检测结果自动选择

#### P0-4：修复 SPEC-STATE 历史表 bug

**来源**：Claude（核心发现）

`update-spec-state.js` 的历史行插入逻辑把新行插到表头前而非表体内，必须优先修复。

#### P0-5：修复 doctor.js 路径规范化

**来源**：Claude

对 `/tmp/...` 和 `/private/tmp/...` 应给出一致结果。

### P1：应该优化（效率提升）

#### P1-1：审查从串行 3 步合并为 1-2 步

**来源**：Codex（核心发现）、OpenCode

```
方案 A（保守）：合并 spec-compliance + security 为一个 compliance-reviewer
方案 B（激进）：将 spec + security 合并到 code review 的 checklist 中

预期：~15 min → ~8 min，Agent 数量 7 → 5
```

#### P1-2：精简 Feature 产物

**来源**：Codex

| 优化前 (8 个) | 优化后 (4-5 个) |
|--------------|----------------|
| PRD.md | PRD.md（含需求理解确认） |
| 需求理解确认.md | *合并到 PRD* |
| 技术方案.md | 技术方案.md |
| 任务拆解表.md | 任务拆解表.md |
| CHANGESET.md | *删除* |
| 评审记录.md | *删除或可选* |
| SPEC-STATE.md | SPEC-STATE.md |
| notepads/learnings.md | notepads/learnings.md |

#### P1-3：给 feature 增加"从需求描述生成半成品文档"能力

**来源**：Claude

至少自动草拟：PRD 概述、技术方案目标/范围/接口草案、任务拆解初稿。用户只需审核和补充，而非从零填写空模板。

#### P1-4：给 code 增加 VERIFICATION.md 初稿生成

**来源**：Claude

从最近一次测试命令、测试数量、关键场景自动生成最小验证骨架，用户只补少量结论。

#### P1-5：调整 DONE 收口机制

**来源**：Claude（核心发现）

避免为了关状态再补一个 commit。可选方向：
- 在 commit 前允许"预写 DONE + pending commit hash"
- commit 后自动 amend
- 把 DONE 从 repo 内状态改为"git 已提交 + VERIFICATION PASS"的推导态

#### P1-6：状态文件自动化

**来源**：OpenCode、Codex

```bash
node scripts/update-spec-state.js --feature TASK-001 --to EXEC
node scripts/update-spec-state.js --feature TASK-001 --auto-detect
```

### P2：可以优化（锦上添花）

| 编号 | 优化项 | 来源 |
|------|--------|------|
| P2-1 | 知识捕获改为被动触发（learnings.md 无实质内容时跳过） | Codex |
| P2-2 | 精简 Guide 文档复制（只保留 3 个核心 guide） | Codex |
| P2-3 | Gate Check 去重（code Phase 0 不再重新调用 tech-plan-checker） | Codex |
| P2-4 | 决策锁定精简（只锁 critical：架构选型、数据模型、对外接口） | OpenCode |
| P2-5 | 合并 SPEC-STATE + STATE 为 LIFECYCLE.md | OpenCode |
| P2-6 | 为本地 remote 提供更明确的 commit 降级说明 | Claude |
| P2-7 | 扩大 Fast 路径（去掉"无 DB 变更"要求） | Codex |
| P2-8 | 统一 Phase/Step 命名 | Codex |
| P2-9 | init 完成后建议单独 commit 初始化产物 | Claude |

---

## 六、优化效果预估

| 维度 | 优化前 | 优化后 (Medium) | 优化后 (Fast) | 变化 |
|------|--------|----------------|--------------|------|
| 用户交互总轮次 | ~14 轮 | ~8 轮 | ~4 轮 | **-43% ~ -71%** |
| Feature 文档数 | 8 | 4-5 | 2-3 | **-50% ~ -75%** |
| Feature 规划行数 | 374 | 120-180 | 60-100 | **-52% ~ -84%** |
| init 文件操作 | 22 (手动) | 1 (脚本) | 1 (脚本) | **质变** |
| init 产出文件 | 17-25 | 8-12 | 3-6 | **-50% ~ -76%** |
| 串行审查步骤 | 3 | 1-2 | 1 | **-50% ~ -67%** |
| 总预估耗时 | ~115 min | ~65 min | ~40 min | **-43% ~ -65%** |
| 编码时间占比 | 17% | ~35% | ~55% | **+18pp ~ +38pp** |

---

## 七、实施路线图

```
Phase 1 (立即，本周):
  ✅ P0-4: 修复 SPEC-STATE 历史表 bug
  ✅ P0-5: 修复 doctor.js 路径规范化
  ✅ P0-2: 合并需求理解为单轮交互
  ✅ P0-3: 创建 init-project.js 脚本

Phase 2 (短期，2 周内):
  ⬜ P0-1: 新增 Medium 路由
  ⬜ P1-1: 审查串行合并
  ⬜ P1-2: 精简 Feature 产物
  ⬜ P1-5: 调整 DONE 收口机制

Phase 3 (中期，1 个月内):
  ⬜ P1-3: 需求描述 → 半成品文档
  ⬜ P1-4: VERIFICATION.md 初稿生成
  ⬜ P1-6: 状态文件自动化脚本
  ⬜ P2 系列优化项
```

---

## 八、最终判断

三份独立试跑报告（Java 两种场景 + Node.js 一种场景）交叉验证了同一个核心结论：

> **当前问题已经不再是"所有需求都一样重"，而是"分级粒度不够细 + 仪式性工作占比过高"。**

相较旧版流程，当前版本已经明显改善：
- 状态机已压到 4 态
- Fast/Standard 分级已存在
- init 已部分脚本化
- feature 骨架已缩小

但真实试跑证明：

1. **Medium 档是缺失的一环** — 单服务多文件改动（最常见的日常需求类型）落在 Fast 和 Standard 之间的空档
2. **init 缺脚本是最容易修的硬伤** — scaffold-feature.js 和 update-spec-state.js 证明脚本化可行，init 没有理由继续手动
3. **"one question at a time" 是交互体验的最大杀手** — 对非模糊需求，5 轮交互全是确认显而易见的信息
4. **DONE 状态设计有结构性缺陷** — 提交后再写 DONE 天然制造额外 commit

如果下一步只做三件事：
1. **新增 Medium 路由** — 解决"中等复杂需求仍然拖沓"
2. **创建 init-project.js** — 解决"22 个文件操作全靠 AI 手动"
3. **修掉 SPEC-STATE 历史表 bug** — 解决"状态文件真实输出不可信"
