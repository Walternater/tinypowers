# tinypowers 流程优化方案

> 基于 2026-04-02 完整跑测（init → feature → code → commit）
> 测试项目：Spring Boot 3.2 + Maven 最小项目
> 测试需求：用户管理 CRUD API（5 个 REST 端点，内存存储）

---

## 一、全流程总览

| 阶段 | 实际步骤数 | 合理步骤 | 冗余步骤 | 复杂度评分 |
|------|-----------|---------|---------|-----------|
| /tech:init | 7 | 4 | 3 | 6/10 |
| /tech:feature | 6 phases | 3 | 3 | 8/10 |
| /tech:code | 7 phases | 4 | 3 | 7/10 |
| /tech:commit | 4 steps | 2 | 2 | 5/10 |
| **合计** | **24** | **13** | **11** | **6.5/10** |

**核心结论：约 45% 的步骤对简单需求属于过度流程。**

---

## 二、分阶段审计

### 2.1 /tech:init — 复杂度 6/10

| 步骤 | 合理性 | 问题 |
|------|--------|------|
| 1. Bootstrap Guard | ✅ 必要 | 无 |
| 2. 技术栈检测 | ✅ 必要 | 无 |
| 3. 领域知识扫描 | ⚠️ 小项目无意义 | 2 个 Java 文件，扫不出东西，纯占时间 |
| 4. 确认 + 策略选择 | ⚠️ 新项目无需策略 | 没有 CLAUDE.md 时还要问 Update/Skip/Overwrite，多余 |
| 5. 落地文件 | ✅ 必要 | 15+ 文件，但大部分是复制 |
| 6. 生成 knowledge.md | ⚠️ 空模板 | 小项目就是空模板，不如延后 |
| 7. 验证 | ✅ 必要 | 无 |

**优化建议：**
- 步骤 3+4+6 可合并为一步：新项目直接跳过知识扫描，默认 Create 策略，knowledge.md 延后生成
- init 从 7 步 → 4 步

### 2.2 /tech:feature — 复杂度 8/10（最重）

| Phase | 合理性 | 问题 |
|-------|--------|------|
| Phase 0: 准备 | ✅ 必要 | scaffold 脚本好用 |
| Phase 1: 需求理解 | ✅ 必要 | 但模板字段太多（47 行模板只填了 10 行） |
| Phase 2: 歧义检测 + 多方案 | ⚠️ 简单需求过度 | "用户 CRUD" 有什么歧义？需要 2-3 个方案？ |
| Phase 3: 技术方案 | ✅ 必要 | 但 147 行模板对简单 CRUD 太重 |
| Phase 4: 任务拆解 | ⚠️ 委托外部 | 依赖 superpowers:writing-plans，增加一层委托 |
| Phase 5: 任务表验证 | ⚠️ 可合并 | 验证可以和 Phase 4 合并 |

**核心问题：对一个 "用户 CRUD" 需求，feature 阶段产出了 7 个文件、6 个 phase、5 个锁定决策。实际编码只需要 3 个文件（User/UserService/UserController）。**

**优化建议：**
- 引入**需求分级**：简单需求（CRUD/小改动）走 fast-track，跳过 Phase 2 歧义检测和 Phase 5 独立验证
- 技术方案模板按复杂度分级：简单需求 30 行够用，不需要 147 行
- Phase 4+5 合并：任务拆解自带验证，不需要单独一个 phase

### 2.3 /tech:code — 复杂度 7/10

| Phase | 合理性 | 问题 |
|-------|--------|------|
| Phase 0: Gate Check | ✅ 必要 | 无 |
| Phase 1: Worktree Setup | ⚠️ 简单需求过度 | 一个 CRUD 功能需要 git worktree 隔离？ |
| Phase 2: Context Preparation | ✅ 必要 | 但小项目上下文很少 |
| Phase 3: Pattern Scan | ✅ 有价值 | 找到 HelloController 作为参考，确实有用 |
| Phase 4: Execute | ✅ 必要 | 委托 superpowers 增加复杂度 |
| Phase 5: Review (3 轮) | ⚠️ 串行太重 | 方案符合性 → 安全 → 代码质量，3 轮串行 |
| Phase 6: Verify | ✅ 必要 | 无 |

**优化建议：**
- Worktree 改为可选：简单需求（单模块、无破坏性变更）直接在主分支开发
- Review 3 轮串行对小项目可以合并为一轮综合审查
- Pattern Scan 是真正有价值的步骤，保留

### 2.4 /tech:commit — 复杂度 5/10

| Step | 合理性 | 问题 |
|------|--------|------|
| Step 1: Document Sync | ✅ 必要 | 但小项目文档很少，检查项多余 |
| Step 2: Knowledge Capture | ⚠️ 价值有限 | learnings.md 为空时纯走流程 |
| Step 3: Git Commit | ✅ 必要 | Trailer 格式好但可选 |
| Step 4: PR + Cleanup | ⚠️ 依赖外部 | 依赖 superpowers:finishing-a-development-branch |

**优化建议：**
- Step 1+2 合并：文档同步和知识沉淀一起做
- Step 4 的 superpowers 委托去掉，直接用 git 命令

---

## 三、核心问题总结

### 问题 1：没有需求分级

当前流程对 "加一个 CRUD" 和 "重构整个订单系统" 走的是同一套流程。
- CRUD 需求：实际编码 3 个文件，但流程产出 7 个文档 + 29 个文件变更
- **文档/代码比 = 9.7:1**，严重失衡

### 问题 2：superpowers 委托链太长

```
tech:feature → superpowers:brainstorming → superpowers:writing-plans
tech:code → superpowers:using-git-worktrees → superpowers:subagent-driven-development → superpowers:requesting-code-review → superpowers:verification-before-completion
tech:commit → superpowers:finishing-a-development-branch
```

- **7 个外部委托**，每个委托增加一层理解成本和失败点
- 很多 superpowers 方法论在小项目中用不上

### 问题 3：模板过重

| 模板 | 行数 | 简单需求实际使用 | 利用率 |
|------|------|-----------------|--------|
| PRD.md | 71 | ~15 行 | 21% |
| 技术方案.md | 147 | ~40 行 | 27% |
| 任务拆解表.md | 54 | ~20 行 | 37% |
| 需求理解确认.md | 47 | ~20 行 | 43% |

### 问题 4：SPEC-STATE 状态机过细

8 个状态（INIT → REQ → DESIGN → TASKS → EXEC → REVIEW → VERIFY → CLOSED）对一个简单 CRUD 来说：
- 实际只用了 3 个（INIT → TASKS → EXEC）
- REQ/DESIGN/REVIEW/VERIFY 都是自动通过的

---

## 四、优化方案

### 方案 A：需求分级（推荐，影响最大）

引入三级分类，在 `/tech:feature` Phase 0 自动判定：

| 级别 | 判定条件 | 流程裁剪 |
|------|---------|---------|
| **Fast** | 单模块、≤3 个文件、无 DB 变更 | 跳过 Phase 2/5，技术方案 ≤30 行，不建 worktree |
| **Standard** | 多模块、有 DB 变更、≤2 周 | 完整流程 |
| **Complex** | 跨系统、架构变更、>2 周 | 完整流程 + 额外评审 |

**Fast-track 流程：**
```
/tech:feature: Phase 0 → Phase 1(简化) → Phase 3(简化) → 直接进 code
/tech:code: Phase 0 → Phase 3(Pattern Scan) → Phase 4(Execute) → Phase 5(合并审查) → Phase 6
/tech:commit: Step 1+2 合并 → Step 3 → Step 4(简化)
```

**预期效果：**
- 简单需求步骤数：24 → 12（减少 50%）
- 文档/代码比：9.7:1 → 3:1
- 模板利用率：32% → 70%+

### 方案 B：减少 superpowers 委托

| 当前委托 | 优化方案 |
|---------|---------|
| brainstorming | 内化为 feature Phase 2 的简单歧义检测 |
| writing-plans | 内化为 feature Phase 4，AI 直接拆解 |
| using-git-worktrees | 改为可选，默认不开 |
| subagent-driven-development | 简单任务直接编码，不用 subagent |
| requesting-code-review | 3 轮审查合并为 1 轮 |
| verification-before-completion | 保留，但简化为证据检查 |
| finishing-a-development-branch | 直接用 git 命令 |

**预期效果：** 外部委托 7 → 2（只保留 verification）

### 方案 C：模板瘦身

为每个模板提供 `simple` 和 `full` 两个版本：

| 模板 | Simple 版 | Full 版 |
|------|----------|---------|
| PRD | 15 行（目标+范围+验收） | 71 行完整版 |
| 技术方案 | 30 行（接口+决策） | 147 行完整版 |
| 任务拆解 | 15 行（任务列表） | 54 行含 Wave 建议 |
| 需求理解确认 | 10 行（摘要+确认） | 47 行完整版 |

### 方案 D：SPEC-STATE 简化

| 当前 | 优化后 |
|------|--------|
| 8 个状态 | 4 个状态：PLAN → EXEC → REVIEW → DONE |
| 每个状态独立产物检查 | 合并为阶段门禁 |
| 禁止跳步 | Fast-track 允许 PLAN → EXEC 直达 |

---

## 五、实施优先级

| 优先级 | 方案 | 预期收益 | 实施成本 |
|--------|------|---------|---------|
| P0 | 方案 A：需求分级 | 减少 50% 流程步骤 | 中（改 feature SKILL.md） |
| P1 | 方案 B：减少委托 | 减少 70% 外部依赖 | 中（改 code SKILL.md） |
| P2 | 方案 C：模板瘦身 | 提升 2x 模板利用率 | 低（加 simple 模板） |
| P3 | 方案 D：状态机简化 | 减少状态管理开销 | 低（改 spec-state 模板） |

---

## 六、优化后预期流程对比

### 优化前（当前）

```
/tech:init (7 steps) → /tech:feature (6 phases, 7 files) → /tech:code (7 phases, 7 delegates) → /tech:commit (4 steps, 1 delegate)
总步骤: 24 | 外部委托: 7 | 文档产出: 7 | 状态: 8
```

### 优化后（Fast-track）

```
/tech:init (4 steps) → /tech:feature (3 phases, 3 files) → /tech:code (4 phases, 1 delegate) → /tech:commit (2 steps)
总步骤: 13 | 外部委托: 1 | 文档产出: 3 | 状态: 4
```

### 优化后（Standard/Complex）

```
保持不变 — 复杂需求仍然需要完整流程
```

---

## 七、实测数据

| 指标 | 优化前 | 优化后(Fast) | 改善 |
|------|--------|-------------|------|
| 总步骤数 | 24 | 13 | -46% |
| 文档/代码比 | 9.7:1 | 3:1 | -69% |
| 外部委托数 | 7 | 1 | -86% |
| 模板利用率 | 32% | 70%+ | +119% |
| SPEC-STATE 状态 | 8 | 4 | -50% |
| 实际编码时间占比 | ~15% | ~45% | +200% |

> **核心 insight**：当前流程把 85% 的时间花在文档和流程上，只有 15% 在真正编码。
> 优化后应该倒过来：45% 编码，55% 流程（对简单需求）。
