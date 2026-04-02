# tinypowers 全流程审查 — 三份报告整合

> 整合日期：2026-04-02
> 三份来源：
> - **E2E 试跑**（真实执行 `init → feature → code → commit`，测试功能 `TaskService#listCompletedTasks`）
> - **Pipeline Audit**（管道级结构审查，逐 Skill/Phase 拆解）
> - **Optimization Plan**（量化指标 + 需求分级方案）

---

## 一、三份报告概览

| 报告 | 方法 | 测试场景 | 视角 |
|------|------|---------|------|
| E2E 试跑 | 真实执行完整流程 | 最小 Java 项目 + 2 文件改动 | **实操摩擦**：发现了具体 bug 和边界问题 |
| Pipeline Audit | 逐 Skill/Phase 结构分析 | 模拟 "用户注册 CRUD" | **管道结构**：交互成本、文档碎片化、冗余检查 |
| Optimization Plan | 量化审计 + 方案设计 | Spring Boot + 用户管理 CRUD | **数据驱动**：步骤数、委托数、模板利用率 |

**三份报告结论高度一致**：流程骨架完整、理念正确，但对小需求过度流程化。

---

## 二、共识问题清单（三份报告均提及）

### 🔴 问题 1：没有需求分级

| 报告 | 原文 |
|------|------|
| E2E | "对小需求明显过度流程化" |
| Pipeline | "所有需求走同一流程，'用户注册'和'支付系统重构'走同样多的步骤" |
| Optimization | "CRUD 和系统重构走同一套流程，文档/代码比 = 9.7:1" |

**三份报告一致建议**：引入 Fast/Standard 两级（或 Fast/Standard/Complex 三级）路由。

### 🔴 问题 2：superpowers 委托链太长

| 报告 | 原文 |
|------|------|
| E2E | 未直接提及（但实测中依赖外部方法论） |
| Pipeline | "6 Phase + 4 个 superpowers 委托 = 至少 10 次上下文切换" |
| Optimization | "7 个外部委托，每个委托增加一层理解成本和失败点" |

委托清单：`brainstorming`、`writing-plans`、`using-git-worktrees`、`subagent-driven-development`、`requesting-code-review`、`verification-before-completion`、`finishing-a-development-branch`

### 🔴 问题 3：模板过重 + 利用率低

| 报告 | 原文 |
|------|------|
| E2E | "大多数模板都只是表格骨架，没有足够强的引导或默认值" |
| Pipeline | "feature 目录过度预设：10 个文件骨架中，4 个大概率空着" |
| Optimization | "PRD 21%、技术方案 27%、任务拆解 37%，平均利用率 32%" |

### 🔴 问题 4：SPEC-STATE 状态机过细

| 报告 | 原文 |
|------|------|
| E2E | "历史表插入有格式问题"、"门禁偏弱，只验证文件存在" |
| Pipeline | "8 个状态，4 次状态推进 = 4 次文件更新 + 4 次门禁检查" |
| Optimization | "实际只用了 3 个状态，REQ/DESIGN/REVIEW/VERIFY 都是自动通过的" |

---

## 三、各报告独有发现

### E2E 试跑独有发现（实操 bug）

| # | 问题 | 严重度 | 描述 |
|---|------|--------|------|
| E1 | Maven 默认命令错误 | P0 | `stack-detection.md` 给 Maven 配了 `mvn checkstyleMain testClasses`，像 Gradle 目标 |
| E2 | SPEC-STATE 历史表插入 bug | P0 | `update-spec-state.js` 把历史行插到标题和表头之间，破坏表格结构 |
| E3 | CLAUDE.md 模板变量误报 | P0 | 模板变量说明表中保留了 `{{ProjectName}}` 等原文，导致"禁止遗留未替换变量"检查误报 |
| E4 | Worktree 时机冲突 | P1 | feature 不建 worktree，code 才建；但前两步已产生大量未提交文档，切隔离环境别扭 |
| E5 | 首次 commit 范围过大 | P1 | init + feature + code 全部产物一起提交（28 文件、3000+ 行），reviewer 不友好 |
| E6 | CLOSED 状态语义倒置 | P1 | 必须在 git commit 前先把 SPEC-STATE 推到 CLOSED，"状态先于事实" |
| E7 | workflow-guide.md 隐式断链 | P1 | CLAUDE.md 引用了它，但 init 主流程未显式纳入产物要求 |

### Pipeline Audit 独有发现（结构问题）

| # | 问题 | 严重度 | 描述 |
|---|------|--------|------|
| P1 | 交互轮次过多 | P0 | 简单需求最短路径 16-25 轮交互 |
| P2 | 文档碎片化 | P1 | 29 个文件、~2221 行，AI 频繁切换读取 |
| P3 | tech-plan-checker 重复调用 | P1 | feature Phase 5 调一次，code Phase 0 又调一次 |
| P4 | knowledge-scanning.md 偏向前端 | P2 | Java 项目仅依赖扫描有用，4 种策略全部落空 |
| P5 | init Step 4 无脚本化 | P1 | 10 个变量替换 + 6 个规则文件 + 5 个 hooks 全靠 AI 手动执行 |
| P6 | Commit Trailer 过于定制化 | P2 | Constraint/Rejected/Evidence/Confidence 四个字段不实用 |
| P7 | 覆盖率目标不现实 | P2 | 80/70/90% 对项目初始阶段可能过高 |

### Optimization Plan 独有发现（量化数据）

| 指标 | 当前值 | 优化后(Fast) | 改善 |
|------|--------|-------------|------|
| 总步骤数 | 24 | 13 | -46% |
| 文档/代码比 | 9.7:1 | 3:1 | -69% |
| 外部委托数 | 7 | 1 | -86% |
| 模板利用率 | 32% | 70%+ | +119% |
| SPEC-STATE 状态 | 8 | 4 | -50% |
| 编码时间占比 | ~15% | ~45% | +200% |

---

## 四、合并后的优化方案

### 方案 A：需求分级（三份报告一致推荐，P0）

引入三级路由，在 `/tech:feature` Phase 0 自动判定：

| 级别 | 判定条件 | 流程 |
|------|---------|------|
| **Fast** | 单模块、≤2 人天、无 DB 变更、无安全敏感 | 跳过歧义检测/独立验证，技术方案 ≤30 行，不建 worktree |
| **Standard** | 多模块、有 DB 变更、≤2 周 | 当前完整流程 |
| **Complex** | 跨系统、架构变更、>2 周 | 完整流程 + 额外评审 |

**Fast-track 流程对比**：

| Skill | 当前 | Fast-track |
|-------|------|-----------|
| init | 7 步 | 4 步（跳过知识扫描、策略选择、空知识库） |
| feature | 6 phases, 11-15 轮交互 | 2 phases, 2-3 轮交互 |
| code | 7 phases, 4 委托 | 4 phases, 1 委托 |
| commit | 4 步 | 2 步（合并文档同步+知识沉淀） |
| **合计** | **24 步, 16-25 轮** | **12 步, 5-8 轮** |

### 方案 B：SPEC-STATE 状态机简化（P1）

| 当前 | 优化后 |
|------|--------|
| 8 状态：INIT → REQ → DESIGN → TASKS → EXEC → REVIEW → VERIFY → CLOSED | 4 状态：PLAN → EXEC → REVIEW → DONE |
| 4 次独立门禁 | 合并为阶段门禁 |
| 禁止跳步 | Fast-track 允许 PLAN → EXEC 直达 |

同时修复 E2E 发现的 bug：
- 修复 `update-spec-state.js` 历史表插入位置
- 强化门禁：不再只检查"文件存在"，至少识别空模板

### 方案 C：子文档内联 + 文档整合（P1）

| 子文档 | 行数 | 动作 |
|--------|------|------|
| stack-detection.md | 53 | **内联**到 SKILL.md（仅 4 行检测规则） |
| knowledge-scanning.md | 99 | **内联**到 SKILL.md |
| claude-init.md | 79 | **保留**（merge 策略需要独立空间） |
| requirements-guide.md | 91 | **保留**（需求理解方法论有价值） |
| ambiguity-check.md | 83 | **保留**（歧义检测维度有价值） |
| tech-design-guide.md | 75 | **内联**到 SKILL.md |
| verification.md | 92 | **删除**（与 SKILL.md 完成标准重复） |
| context-preload.md | 95 | **内联**到 SKILL.md |
| pattern-scan.md | 61 | **内联**到 SKILL.md |

**效果**：9 → 4 个子文档，减少 5 次文件切换。

### 方案 D：feature 目录骨架精简（P2）

| 当前（10 个） | 优化后（6 个） |
|--------------|--------------|
| CHANGESET.md ← 大部分空着 | SPEC-STATE.md |
| SPEC-STATE.md | PRD.md（含需求理解确认） |
| PRD.md | 技术方案.md（含决策锁定） |
| 需求理解确认.md ← 可合并到 PRD | 任务拆解表.md |
| 技术方案.md | notepads/learnings.md |
| 任务拆解表.md | |
| 评审记录.md ← 大部分空着 | |
| notepads/learnings.md | |
| seeds/ ← 大部分空着 | |
| archive/ ← 大部分空着 | |

### 方案 E：init 落地脚本化（P2）

当前 Step 4 的 5 个子步骤（规则复制、模板替换、guide 复制、hooks 安装、目录创建）全部靠 AI 手动执行。

建议新增 `scripts/init-project.js`：
- 规则文件复制
- 模板变量替换
- hooks 安装
- settings.json 生成/merge
- 目录创建

AI 只负责 Step 1-3（检测 + 扫描 + 确认）和 Step 6（验证）。

### 方案 F：减少 superpowers 委托（P1）

| 当前委托 | 优化方案 |
|---------|---------|
| brainstorming | 内化为 feature Phase 2 的简单歧义检测 |
| writing-plans | 内化为 feature Phase 4，AI 直接拆解 |
| using-git-worktrees | 改为可选，Fast-track 默认不开 |
| subagent-driven-development | Fast-track 直接编码 |
| requesting-code-review | Fast-track 3 轮合并为 1 轮 |
| verification-before-completion | 保留，简化为证据检查 |
| finishing-a-development-branch | 直接用 git 命令 |

**效果**：7 → 1 个外部委托（只保留 verification）。

---

## 五、P0 修复清单（不分级也能修的 bug）

这些是 E2E 试跑发现的具体 bug，不需要等分级方案落地即可修复：

| # | 问题 | 修复动作 |
|---|------|---------|
| E1 | Maven 默认命令错误 | `stack-detection.md` 中改为 `mvn test` |
| E2 | SPEC-STATE 历史表插入 bug | `update-spec-state.js` 改为插入表头之后 |
| E3 | CLAUDE.md 模板变量误报 | 模板变量说明表用代码块包裹或改用其他格式 |
| E7 | workflow-guide.md 隐式断链 | 纳入 init 正式产物要求和验证项 |

---

## 六、推荐实施路径

```text
Phase 1（立刻做）: P0 Bug 修复
  → 修正 Maven 默认命令
  → 修复 SPEC-STATE 历史表插入
  → 修复 CLAUDE.md 模板变量误报
  → 补上 workflow-guide.md 产物要求

Phase 2（核心优化）: 需求分级 + 状态机简化
  → 对所有 4 个 SKILL.md 加入 Fast/Standard 路由
  → 状态机从 8 状态精简到 4 状态
  → feature 从 6 phases 精简到 Fast 模式 2 phases

Phase 3（文档整合）: 子文档内联 + 骨架精简
  → 内联 5 个子文档到 SKILL.md
  → 删除 verification.md
  → feature 骨架从 10 文件降到 6 文件

Phase 4（自动化）: init 脚本化 + 委托精简
  → 新增 init-project.js 脚本
  → 减少 superpowers 委托从 7 到 1
  → 简化 commit Trailer
```

---

## 七、一句话总结

> **理念正确，落地偏重，小需求成本过高。**
> 核心优化方向不是加更多规则，而是**为小需求减负**——让 CRUD 不需要 147 行的技术方案。
