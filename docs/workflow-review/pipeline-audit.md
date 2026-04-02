# tinypowers 管道全流程审查报告

> 审查方法：创建测试 Spring Boot 项目，模拟执行 init → feature → code → commit 完整管道，记录每一步的摩擦点和复杂度问题。

## 一、数据总览

| 指标 | 数值 |
|------|------|
| Skill 主文档 | 4 个，共 780 行 |
| 子文档 | 9 个，共 783 行 |
| Agent 定义 | 5 个，共 658 行 |
| 模板文件 | 11 个 |
| 管道总步骤 | 21 步/Phase |
| superpowers 委托 | 7 处 |
| feature 目录骨架文件 | 10 个（7 模板 + 3 子目录） |
| 预估最少交互轮次（简单需求） | 11-20 轮 |

## 二、逐 Skill 审查

### 2.1 tech:init — 6 步 × 3 子文档

| 步骤 | 实际工作 | 问题 |
|------|---------|------|
| Step 1 技术栈检测 | 检查 pom.xml 是否存在 | stack-detection.md 53 行文档说明"看 pom.xml 在不在"，可以直接内联到 SKILL.md |
| Step 2 领域知识扫描 | 4 种扫描策略 | knowledge-scanning.md 偏向前端项目（package.json、UI 组件库、页面结构），Java 项目仅依赖扫描有用。对标准 Spring Boot 项目，4 种策略全部落空 |
| Step 3 确认 + 策略选择 | 展示结果，3 种策略 | 合理 |
| Step 4 落地 | 5 个子步骤（规则复制 + 模板替换 + guide 复制 + hooks 安装 + 目录创建） | **最重的一步**：10 个模板变量替换、6 个规则文件复制、8 个 guide 文档复制、5 个 hooks 安装。全部靠 AI 手动执行，无脚本支持 |
| Step 5 知识库生成 | 将 Step 2 结果写入文件 | 和 Step 2 强耦合，且空项目时两步都无事可做 |
| Step 6 验证 | 8 项检查 | 合理但无自动化修复 |

**核心问题**：
1. **落地（Step 4）无脚本化**：10 个变量替换 + 文件复制全靠 AI 手动执行，易出错
2. **3 个子文档可以合并**：stack-detection.md 太短（53 行），knowledge-scanning.md 和 claude-init.md 可以内联到 SKILL.md
3. **Step 2 + Step 5 强耦合**：空项目时扫描无结果，知识库留空模板，两步可以合并为一步

### 2.2 tech:feature — 5 Phase × 4 子文档 × 3 agents

**模拟场景**：用户说"添加用户注册功能，需要邮箱和密码"

| Phase | 实际工作 | 交互轮次 | 问题 |
|-------|---------|---------|------|
| Phase 0 准备 | 种子扫描 + 脚手架创建 | 0 | scaffold-feature.js 创建 10 个文件骨架，但对简单需求来说太重 |
| Phase 1 需求理解 | 按 requirements-guide.md 逐项确认 | 6+ | **"one question at a time"策略导致交互过多**：背景 → 用户 → 范围 → 验收 → 非功能 → 确认稿，至少 6 轮 |
| Phase 2 歧义 + brainstorming | ambiguity-check + superpowers:brainstorming | 3-4 | 对"用户注册"这种明确需求，歧义检测（模糊词、边界、异常、量级）和 2-3 方案探索是过度的 |
| Phase 3 技术方案 | architect agent + D-01~D-05 决策锁定 | 1-2 | 对标准 CRUD，5 个决策锁定是过度的（D-04 中间件选型、D-05 安全方案可能不适用） |
| Phase 4 任务拆解 | superpowers:writing-plans | 1 | 委托合理 |
| Phase 5 验证 | tech-plan-checker agent | 0 | 合理 |

**核心问题**：
1. **没有复杂度分级**：所有需求走同一流程，"用户注册"和"支付系统重构"走同样多的步骤
2. **交互轮次过多**：Phase 1 的 "one question at a time" 对简单需求至少 6 轮，加上 Phase 2-4 的确认，总计 11-15 轮
3. **verification.md（92 行）过度详细**：对每个 Phase 都有验证表，但大部分是人工检查项
4. **feature 目录过度预设**：10 个文件骨架中，需求理解确认.md、评审记录.md、seeds/、archive/ 在简单需求中大概率空着

### 2.3 tech:code — 6 Phase × 2 子文档 × 4 superpowers 委托

| Phase | 实际工作 | 问题 |
|-------|---------|------|
| Phase 0 Gate Check | 3 层门禁检查 | 合理，但是和 feature Phase 5 有重叠（tech-plan-checker 被调用两次） |
| Phase 1 Worktree | superpowers:using-git-worktrees | 对小任务增加不必要的隔离开销 |
| Phase 2 Context Prep | 读取 5 个文档 + 裁剪注入 | context-preload.md 95 行定义了详细的裁剪规则，但 AI 实际执行时很难精确裁剪 |
| Phase 3 Pattern Scan | 3 维度搜索参考实现 | 对标准 CRUD，搜索结果必然是"参考已有的 Controller"，策略价值有限 |
| Phase 4 Execute | superpowers:subagent-driven-development | 合理，但每个 subagent 需要 6 类上下文注入 |
| Phase 5 Review | 3 步串行审查 | **spec → security → code-quality 三步串行，每步最多重试 3 次**，对小任务过重 |
| Phase 6 Verify | superpowers:verification-before-completion | 覆盖率目标（80/70/90%）对项目初始阶段可能不现实 |

**核心问题**：
1. **6 Phase + 4 个 superpowers 委托 = 至少 10 次上下文切换**
2. **Phase 2 + Phase 3 可以合并**：上下文预加载和 Pattern Scan 是连续的信息收集，拆成两步增加了切换成本
3. **Phase 5 三步审查串行过重**：小任务的 spec 符合性和安全性检查可以简化
4. **tech-plan-checker 被重复调用**：在 feature Phase 5 调了一次，code Phase 0 又调一次

### 2.4 tech:commit — 4 步 × 0 子文档 × 1 superpowers 委托

| 步骤 | 实际工作 | 问题 |
|------|---------|------|
| Step 1 Document Sync | 5 类文档同步检查 | 对小变更过重，但这是合理的安全网 |
| Step 2 Knowledge Capture | 从 learnings.md 沉淀到 knowledge.md | 合理，但"沉淀判断标准"依赖 AI 主观判断 |
| Step 3 Git Commit | 7 项收口检查 + Trailer 格式 | **Commit Trailer（Constraint/Rejected/Evidence/Confidence）过于定制化**，不是标准 git 实践 |
| Step 4 PR + Branch | superpowers:finishing-a-development-branch | 合理 |

**核心问题**：
1. **Step 3 Trailer 格式不实用**：6 个可选 trailer 字段，实际使用中 AI 和开发者都不会认真填写
2. **4 步流程本身合理**，但和 code 的 Phase 5-6 有重叠（code 已经做了审查和验证）

## 三、管道级问题

### 3.1 交互总成本（简单需求的最短路径）

```text
init:  1-2 轮（确认策略）
feature: 11-15 轮（需求理解 6 + 歧义/方案 3-4 + 任务确认 1-2 + 方案确认 1-2）
code:  3-5 轮（worktree 确认 + 执行检查点 + 审查反馈）
commit: 1-3 轮（文档确认 + 提交确认 + PR 确认）
──────────────────
总计: 16-25 轮交互
```

对一个简单的"用户注册 CRUD"需求，16-25 轮交互明显过多。

### 3.2 文档碎片化

```text
4 个 Skill × (1 SKILL.md + 0~4 子文档) = 4 + 9 = 13 个文档文件
5 个 Agent 定义
11 个模板文件
──────────────
29 个文件，总计 ~2221 行
```

AI 在执行管道时需要频繁切换读取不同文件，增加了上下文压力和执行延迟。

### 3.3 SPEC-STATE 状态机过于复杂

```text
INIT → REQ → DESIGN → TASKS → EXEC → REVIEW → VERIFY → CLOSED
```

8 个状态，4 个门禁（REQ/DESIGN/TASKS/EXEC 各有前置条件）。对简单需求：
- INIT → REQ：只需 PRD 非空
- REQ → DESIGN：需要需求理解确认
- DESIGN → TASKS：需要技术方案含锁定决策
- TASKS → EXEC：需要任务表通过 plan-check

4 次状态推进 = 4 次文件更新 + 4 次门禁检查。

### 3.4 冗余检查

- tech-plan-checker 在 feature Phase 5 和 code Phase 0 各被调用一次
- code Phase 5 的 spec-compliance-review 和 feature Phase 3 的 architect 有重叠
- commit Step 1 的文档同步和 feature Phase 3 的技术方案确认有重叠

## 四、优化方案

### 方案 1：复杂度分级（最关键）

引入两级复杂度路由：

```text
简单任务 (Simple): ≤ 2 人天、单模块、标准 CRUD / 小修复
标准任务 (Standard): 当前完整流程
```

**Simple 模式的简化路径**：

| Skill | 当前步骤 | Simple 模式 |
|-------|---------|------------|
| init | 6 步 | 不变（init 本身已经足够精简） |
| feature | 5 Phase × 11-15 轮 | 2 Phase × 2-3 轮：① 直接确认需求 + 方案 → ② 拆任务 |
| code | 6 Phase × 4 委托 | 3 Phase × 2 委托：① Gate → ② Execute → ③ Verify |
| commit | 4 步 | 不变（commit 已经是 4 步，够精简） |

**判断标准**：

```text
如果满足以下全部条件，走 Simple 模式：
- 单模块改动（不跨 Controller/Service/Repository 以外的层）
- 无新表或新外部依赖
- 预估 ≤ 2 人天
- 不涉及安全敏感操作（支付、权限、数据导出）
```

**预估效果**：简单需求从 16-25 轮交互降到 5-8 轮。

### 方案 2：子文档内联

当前 9 个子文档中，以下可以内联到 SKILL.md：

| 子文档 | 行数 | 建议 |
|--------|------|------|
| stack-detection.md | 53 | 内联到 SKILL.md Step 1（仅 4 行检测规则） |
| knowledge-scanning.md | 99 | 内联到 SKILL.md Step 2 |
| claude-init.md | 79 | **保留**（merge 策略等细节确实需要独立空间） |
| requirements-guide.md | 91 | **保留**（需求理解的方法论确实有价值） |
| ambiguity-check.md | 83 | **保留**（歧义检测维度有价值） |
| tech-design-guide.md | 75 | 内联到 SKILL.md Phase 3（本质是"方案要包含什么"的清单） |
| verification.md | 92 | **删除**（验证标准已内联在 SKILL.md 的完成标准中，verification.md 是冗余展开） |
| context-preload.md | 95 | 内联到 SKILL.md Phase 2（裁剪规则可以直接写在 Phase 描述中） |
| pattern-scan.md | 61 | 内联到 SKILL.md Phase 3（搜索策略和缝合规则可以直接写） |

**预估效果**：9 → 4 个子文档，减少 5 次文件切换。

### 方案 3：合并重叠步骤

| 合并点 | 当前 | 合并后 | 节省 |
|--------|------|--------|------|
| feature Phase 2+3 | 歧义检测 + brainstorming + 技术方案 = 3 个独立阶段 | 合并为 1 个"方案探索"阶段 | 减少 2 次 Phase 切换 |
| code Phase 2+3 | Context Prep + Pattern Scan | 合并为 1 个"上下文收集"阶段 | 减少 1 次 Phase 切换 |
| feature + code 的 plan-check | 各自调一次 | 只在 code Phase 0 调一次 | 减少 1 次 agent 调用 |
| SPEC-STATE 状态机 | 8 状态 | 4 状态：`INIT → PLAN → EXEC → CLOSED` | 减少 4 次状态推进 |

### 方案 4：feature 目录骨架精简

当前 scaffold-feature.js 创建 10 个文件：

```text
features/{id}-{name}/
├── CHANGESET.md          ← 大部分场景空着
├── SPEC-STATE.md         ← 合理
├── PRD.md                ← 合理
├── 需求理解确认.md         ← 可以内联到 PRD.md
├── 技术方案.md            ← 合理
├── 任务拆解表.md          ← 合理
├── 评审记录.md            ← 大部分场景空着
├── notepads/learnings.md ← 合理
├── seeds/                ← 大部分场景空着
└── archive/              ← 大部分场景空着
```

**精简方案**：

```text
features/{id}-{name}/
├── SPEC-STATE.md
├── PRD.md          （含需求理解确认内容）
├── 技术方案.md      （含决策锁定）
├── 任务拆解表.md
└── notepads/
    └── learnings.md
```

从 10 个文件/目录降到 6 个。CHANGESET、评审记录、seeds、archive 按需创建，不预生成。

### 方案 5：commit Trailer 简化

当前 Trailer 格式：

```text
Constraint: / Rejected: / Evidence: / Confidence:
```

简化为：

```text
只保留 body 中的自然语言说明和 Evidence（如果有验证数据）
```

去掉 Constraint/Rejected/Confidence 三个字段。这些信息应该在技术方案.md 中记录，不应该在 commit message 中重复。

### 方案 6：init 落地脚本化

当前 Step 4 的 5 个子步骤全部靠 AI 手动执行。建议：

```bash
# 一键初始化脚本
node scripts/init-project.js \
  --root /path/to/target \
  --stack java \
  --tool maven \
  --strategy update
```

脚本负责：
- 规则文件复制
- 模板变量替换
- hooks 安装
- settings.json 生成/merge
- 目录创建

AI 只负责 Step 1-3（检测 + 扫描 + 确认）和 Step 6（验证）。

## 五、优化优先级

| 优先级 | 方案 | 预估收益 | 实施难度 |
|--------|------|---------|---------|
| P0 | 复杂度分级（方案 1） | 简单需求交互量降低 60% | 中（需要改所有 4 个 SKILL.md） |
| P1 | SPEC-STATE 简化（方案 3 的状态机） | 减少 4 次状态推进 | 低（改 spec-state 模板 + guard 逻辑） |
| P1 | 子文档内联（方案 2） | 减少 5 次文件切换 | 低（合并文件） |
| P2 | feature 骨架精简（方案 4） | 减少 4 个空文件 | 低（改 scaffold-feature.js） |
| P2 | init 脚本化（方案 6） | init 落地步骤从 AI 手动变一键 | 中（写脚本） |
| P3 | commit Trailer 简化（方案 5） | 减少提交复杂度 | 低 |
| P3 | 合并重叠步骤（方案 3 的其他项） | 减少步骤切换 | 低 |

## 六、推荐实施路径

```text
Phase 1: 复杂度分级 + SPEC-STATE 简化
  → 对所有 SKILL.md 加入 Simple/Standard 路由
  → 状态机从 8 状态精简到 4 状态
  → feature 从 5 Phase 精简到 Simple 模式 2 Phase

Phase 2: 文档整合
  → 内联 5 个子文档
  → 精简 feature 骨架
  → 删除 verification.md

Phase 3: 自动化
  → init 落地脚本化
  → 简化 commit Trailer
```
