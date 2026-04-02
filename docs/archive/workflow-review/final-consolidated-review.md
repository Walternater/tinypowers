# tinypowers 全流程审查 — 三方整合报告

> 整合日期：2026-04-02
> 来源：
> - **Claude** (`pipeline-audit.md`)：管道结构审查，逐 Skill/Phase 拆解交互成本
> - **Codex** (`2026-04-02-e2e-workflow-review.md`)：E2E 真实试跑，TaskService#listCompletedTasks
> - **OpenCode** (`optimization-plan.md`)：量化审计，文档/代码比、模板利用率、委托成本

---

## 一、一句话结论

**理念正确，落地偏重，小需求成本过高。** 三方独立审查结论高度一致。

```text
核心问题不是某个 skill 写错了，而是整条链路没有复杂度分级。
CRUD 和系统重构走同一套流程 → 文档/代码比 9.7:1 → 85% 时间在流程，15% 在编码。
```

---

## 二、三方共识（全部提及）

### 共识 1：没有需求分级是第一性问题

| 来源 | 原文 |
|------|------|
| Claude | "所有需求走同一流程，'用户注册'和'支付系统重构'走同样多的步骤" |
| Codex | "CRUD 和系统重构走同一套流程，文档/代码比 = 9.7:1" |
| OpenCode | "对小需求明显过度流程化" |

如果不先做分级，后续任何删文档/缩模板/减 Phase 都只能缓解，不能根治。

### 共识 2：tech:feature 是最重的环节

- 6 Phase、7 个文件骨架、5 个决策锁定
- 模板空、填写成本高（平均利用率仅 32%）
- 对简单需求交互 11-15 轮

### 共识 3：SPEC-STATE 状态机过细

- 8 状态（INIT→REQ→DESIGN→TASKS→EXEC→REVIEW→VERIFY→CLOSED）
- 简单需求实际只过 3 个有意义的门禁，其余自动通过
- 每次状态推进 = 1 次文件更新 + 1 次门禁检查

### 共识 4：模板和骨架偏重

- feature 骨架预生成 10 个文件/目录，4 个大概率空着（CHANGESET、评审记录、seeds、archive）
- 模板利用率：PRD 21%、技术方案 27%、任务拆解 37%

### 共识 5：superpowers 委托链过长

- 7 个外部委托，每个增加一层理解成本和失败点
- 小需求也需要走完整委托链

---

## 三、各方独有发现

### OpenCode E2E 试跑独有（实操 bug）

| # | 问题 | 严重度 |
|---|------|--------|
| E1 | Maven 默认 `build_command` 写了 `mvn checkstyleMain testClasses`，不是合理的 Maven 默认命令 | **P0** |
| E2 | `update-spec-state.js` 历史行插到标题和表头之间，破坏表格结构 | **P0** |
| E3 | CLAUDE.md 模板变量说明表保留了 `{{ProjectName}}` 原文，导致"禁止遗留未替换变量"检查误报 | **P0** |
| E4 | feature 不建 worktree，code 才建，但前两步已产生大量未提交文档，切隔离环境别扭 | P1 |
| E5 | 首次 commit 把 init + feature + code 全部产物一起提交（28 文件、3000+ 行） | P1 |
| E6 | CLOSED 状态必须在 git commit 前推进，"状态先于事实" | P1 |
| E7 | CLAUDE.md 引用了 workflow-guide.md，但 init 主流程未显式纳入产物要求 | P1 |

### Claude 管道审查独有（结构问题）

| # | 问题 | 严重度 |
|---|------|--------|
| P1 | 简单需求最短路径 16-25 轮交互 | P0 |
| P2 | 29 个文件 ~2221 行，AI 执行时频繁切换 | P1 |
| P3 | tech-plan-checker 在 feature Phase 5 和 code Phase 0 各调一次 | P1 |
| P4 | knowledge-scanning.md 偏向前端项目，Java 项目 4 种策略全部落空 | P2 |
| P5 | init Step 4 全靠 AI 手动执行（10 变量替换 + 6 规则文件 + 5 hooks） | P1 |

### Codex 量化审计独有（数据）

| 指标 | 当前值 | Fast-track 目标 | 改善 |
|------|--------|----------------|------|
| 总步骤数 | 24 | 13 | -46% |
| 文档/代码比 | 9.7:1 | 3:1 | -69% |
| 外部委托数 | 7 | 1 | -86% |
| 模板利用率 | 32% | 70%+ | +119% |
| SPEC-STATE 状态 | 8 | 4 | -50% |
| 编码时间占比 | ~15% | ~45% | +200% |

---

## 四、优化方案

### 方案 A：需求分级（P0，三方一致推荐）

在 `/tech:feature` Phase 0 自动判定复杂度级别：

| 级别 | 判定条件 | 流程裁剪 |
|------|---------|---------|
| **Fast** | 单模块、≤2 人天、无 DB 变更、无安全敏感 | feature 2 Phase、code 3 Phase、不建 worktree |
| **Standard** | 多模块、有 DB 变更、≤2 周 | 当前完整流程 |
| **Complex** | 跨系统、架构变更、>2 周 | 完整流程 + 额外评审 |

**Fast vs Standard 流程对比（Fast 为目标态预估，不是当前已实测结果）：**

| Skill | Standard | Fast | 差异 |
|-------|----------|------|------|
| init | 6 步 | 4 步（跳知识扫描 + 合并策略选择） | -2 步 |
| feature | 5 Phase, 11-15 轮交互 | 2 Phase, 2-3 轮交互 | -3 Phase, -9 轮 |
| code | 6 Phase, 4 委托 | 3 Phase, 1 委托 | -3 Phase, -3 委托 |
| commit | 4 步 | 2 步（合并 Doc Sync + Knowledge） | -2 步 |
| **合计** | **21 步, 16-25 轮** | **11 步, 5-8 轮（目标值）** | **-48% 步, -60% 交互** |

### 方案 B：SPEC-STATE 状态机简化（P1）

| 当前 | 优化后 |
|------|--------|
| 8 状态：INIT→REQ→DESIGN→TASKS→EXEC→REVIEW→VERIFY→CLOSED | 4 状态：PLAN→EXEC→REVIEW→DONE |
| 4 次独立门禁检查 | 合并为阶段门禁 |
| 禁止跳步 | Fast 允许 PLAN→EXEC 直达 |

同时修复 E2E 发现的 bug：
- 修复历史表插入位置
- 门禁从"文件存在"升级为"真实内容完成"

### 方案 C：子文档内联（P1）

| 子文档 | 行数 | 处理 |
|--------|------|------|
| stack-detection.md | 53 | 内联到 SKILL.md（仅 4 行检测规则） |
| knowledge-scanning.md | 99 | 内联到 SKILL.md |
| claude-init.md | 79 | **保留**（merge 策略需要独立空间） |
| requirements-guide.md | 91 | **保留**（需求理解方法论有价值） |
| ambiguity-check.md | 83 | **保留**（歧义检测维度有价值） |
| tech-design-guide.md | 75 | 内联到 SKILL.md |
| verification.md | 92 | **删除**（与 SKILL.md 完成标准重复） |
| context-preload.md | 95 | 内联到 SKILL.md |
| pattern-scan.md | 61 | 内联到 SKILL.md |

效果：9 → 4 个子文档，减少 5 次文件切换。

### 方案 D：feature 骨架精简（P2）

```text
当前 10 个 → 精简后 6 个

删除预生成：CHANGESET.md、评审记录.md、seeds/、archive/
合并：需求理解确认.md → PRD.md
保留：SPEC-STATE.md、PRD.md、技术方案.md、任务拆解表.md、notepads/learnings.md
```

按需创建替代预生成，Fast 模式可进一步只创建 SPEC-STATE + PRD + 任务表。

### 方案 E：init 落地脚本化（P2）

新增 `scripts/init-project.js`，一键完成当前 Step 4 的 5 个子步骤（规则复制、模板替换、guide 复制、hooks 安装、目录创建）。AI 只负责检测 + 确认 + 验证。

### 方案 F：superpowers 委托精简（P1）

| 委托 | Standard 路径 | Fast 路径 |
|------|-------------|----------|
| brainstorming | 保留 | 跳过，直接简单歧义检测 |
| writing-plans | 保留 | 跳过，AI 直接拆任务 |
| using-git-worktrees | 保留 | 跳过 |
| subagent-driven-development | 保留 | 跳过，直接编码 |
| requesting-code-review | 3 轮串行 | 合并为 1 轮 |
| verification-before-completion | 保留 | 保留（唯一保留的委托） |
| finishing-a-development-branch | 保留 | 直接 git 命令 |

效果：Standard 保留 7 委托，Fast 仅保留 1 个（verification）。
以上为设计目标，不代表当前流程已经达到该状态。

### 方案 G：commit Trailer 简化（P3）

- 保留 `Evidence`（有验证数据时附上）
- 去掉 Constraint/Rejected/Confidence（这些信息应在技术方案.md 中记录）
- Fast 路径：自然语言 body + Evidence
- Standard 路径：可选完整 Trailer

---

## 五、推荐实施路径

```text
Phase 1（立刻做）：P0 Bug 修复
  → E1: 修正 Maven 默认 build_command
  → E2: 修复 SPEC-STATE 历史表插入 bug
  → E3: 修复 CLAUDE.md 模板变量误报
  → E7: 把 workflow-guide.md 纳入 init 正式产物要求

Phase 2（核心优化）：需求分级 + 状态机简化
  → 对所有 SKILL.md 加入 Fast/Standard 路由
  → SPEC-STATE 8 状态精简到 4 状态
  → feature Fast 模式 2 Phase
  → code Fast 模式 3 Phase

Phase 3（文档整合）：子文档内联 + 骨架精简
  → 内联 5 个子文档到 SKILL.md
  → 删除 verification.md
  → feature 骨架 10→6 文件
  → Fast 模式提供简化版模板

Phase 4（自动化）：init 脚本化 + 委托精简
  → 新增 init-project.js
  → Fast 路径 superpowers 委托 7→1
  → 简化 commit Trailer
```

---

## 六、核心数据汇总

| 指标 | 当前 | Fast 目标（预估） | Standard 目标（预估） |
|------|------|----------|-------------|
| 总步骤 | 24 | 11 | ~18（合并重叠后） |
| 交互轮次 | 16-25 | 5-8 | 10-15 |
| 文档/代码比 | 9.7:1 | 3:1 | 5:1 |
| 外部委托 | 7 | 1 | 5 |
| SPEC-STATE 状态 | 8 | 4 | 4 |
| 编码时间占比 | ~15% | ~45% | ~30% |
| feature 文件数 | 10 | 3-4 | 6 |
| 子文档数 | 9 | 4 | 4 |

---

## 七、最终判断

三份报告没有本质冲突，只有侧重点不同：

- **OpenCode E2E**：真实跑下来哪里卡 → 发现 4 个 P0 bug
- **Claude Audit**：管道结构哪里重 → 量化了交互成本和文档碎片化
- **Codex Optimization**：怎么裁成更适合的版本 → 量化了改善预期

如果只做一件事：**为简单需求提供 Fast Path。** 这一步能同时解决流程过长、文档过多、委托过多、状态过细、worktree 不协调、commit 收口过重全部问题。
