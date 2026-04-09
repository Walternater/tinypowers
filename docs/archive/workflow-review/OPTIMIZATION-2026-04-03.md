# tinypowers 全流程审查与优化方案

> 审查日期: 2026-04-03
> 审查方法: 在 demo-order-service 上用 ORDER-102（支付回调与状态同步）走完 init→feature→code→commit 全流程
> 需求复杂度: Standard 路由，6 个任务，3 个 Wave，涉及新增+修改共 9 个 Java 文件
> 测试选手: claude+glm-5.1

---

## 一、全流程数据总览

### 时间分布估算

| 阶段 | 实际操作 | 文档编写 | 文件数 | 体感耗时占比 |
|------|----------|----------|--------|------------|
| tech:init | 运行脚本 | 0 | 脚本自动 | 5% |
| tech:feature | 填 PRD + 技术方案 + 任务拆解 | 3 个 md 文件 (~200 行) | 3 md + 4 自动生成的空模板 | 25% |
| tech:code | 写 9 个 Java 文件 + 1 个测试 | 3 个 md 文件 (测试计划+报告+VERIFICATION, ~100 行) | 9 java + 1 sql + 3 md | 55% |
| tech:commit | git add + commit | 0 | 2 commits | 15% |

### 产物统计

```
features/ORDER-102-订单支付回调与状态同步/
├── SPEC-STATE.md          # 生命周期状态（自动）
├── PRD.md                 # 需求文档（手写）
├── 技术方案.md             # 技术方案（手写）
├── 任务拆解表.md           # 任务拆解（手写）
├── 测试计划.md             # 测试计划（手写）
├── 测试报告.md             # 测试报告（手写）
├── VERIFICATION.md        # 验证报告（手写）
└── notepads/learnings.md  # 知识沉淀（空模板）

代码文件（9 java + 1 sql）：
├── PaymentCallbackController.java
├── PaymentCallbackService.java
├── PaymentRecord.java
├── PaymentRecordMapper.java
├── OrderMapper.java (修改)
├── OrderEventConsumerJob.java (修改)
├── InventoryStub.java (修改)
├── V2__payment_record.sql
└── PaymentCallbackServiceTest.java
```

**关键比例**: 10 个代码文件 vs 8 个文档文件。文档/代码比 = 0.8:1。

---

## 二、按阶段的问题与优化建议

### 2.1 tech:init

| # | 问题 | 影响 | 优化建议 |
|---|------|------|----------|
| I-1 | 6 步流程实际只需 2 步 | 认知负担 | 合并为：①检测+确认 → ②运行脚本。把预检、策略选择内联到检测步骤 |
| I-2 | 知识扫描无脚本支持 | 空话步骤 | 要么脚本化（采样几个文件自动提取），要么删除这个步骤，放到 docs/knowledge.md 模板里作为提示 |
| I-3 | 已初始化项目 re-init 路径模糊 | AI 困惑 | 在 bootstrap-guard.md 加一个"已初始化"场景，明确 Update 策略的默认行为 |
| I-4 | 5 个 hooks 全量安装太重 | 运行时开销 | 支持精简模式：只安装 spec-state-guard + gsd-session-manager，其余可选 |

### 2.2 tech:feature

| # | 问题 | 影响 | 优化建议 |
|---|------|------|----------|
| F-1 | **scaffold 一次创建 7 个文件，PLAN 阶段只需要 4 个** | 目录杂乱 | scaffold 分两阶段：feature 阶段只创建 PRD + 技术方案 + 任务拆解 + SPEC-STATE；测试计划/报告在 code 阶段按需创建 |
| F-2 | **SPEC-STATE 产物状态全是假 done** | 误导 | scaffold 创建时标记为 `scaffolded`，填写内容后由 AI 或脚本改为 `done` |
| F-3 | 路由选择无量化标准 | 主观 | 提供量化参考：任务数 ≤2 → Fast，3-8 → Medium，>8 → Standard |
| F-4 | PRD 验收标准和技术方案验收映射重叠 | 文档冗余 | 删除技术方案的"验收映射"小节。PRD 的验收标准已经足够，code 阶段直接用 PRD 的 AC 做 VERIFICATION |
| F-5 | 用户确认是君子协定 | 易跳步 | 在 SPEC-STATE 的 PLAN→EXEC 前置检查中加入"用户已确认"的标记（可以是 SPEC-STATE 里的一个 confirmed_at 字段） |

### 2.3 tech:code

| # | 问题 | 影响 | 优化建议 |
|---|------|------|----------|
| C-1 | **测试计划+测试报告+VERIFICATION 三文件重叠 >70%** | 最大痛点 | **合并为一个 VERIFICATION.md**，包含：测试用例表 + 执行结果 + AC 映射。删除测试计划和测试报告 |
| C-2 | **文档编写时间 > 代码编写时间（比例失衡）** | 效率低 | C-1 的合并将文档/代码比从 0.8:1 降到 0.4:1 |
| C-3 | Wave 编排无工具验证 | 依赖关系可能错 | 低优先级。Wave 是执行建议，不是强约束。当前靠 AI 判断足够 |
| C-4 | compliance-reviewer 和 code-review 两个 agent | 上下文开销 | 合并为一个 review agent，一次审查覆盖方案符合性+安全+代码质量 |
| C-5 | Pattern Scan 概念多余 | 认知噪音 | 删除"Pattern Scan"命名，改为自然语言"先读已有代码模式再编写" |

### 2.4 tech:commit

| # | 问题 | 影响 | 优化建议 |
|---|------|------|----------|
| M-1 | Document Sync 几乎总是空步骤 | 形式主义 | 合并到 Gate Check 中作为检查项，不单独成步骤 |
| M-2 | SPEC-STATE → DONE 需要额外 commit | 噪音 commit | 将 SPEC-STATE 推进合并到主 commit 中，或让脚本自动 amend |
| M-3 | Push/PR 硬依赖 remote + gh CLI | 本地项目卡住 | 增加"本地完成"路径：无 remote 时只做 commit + 输出分支信息 |

---

## 三、核心优化方案（3 个）

### 方案 A：三文件合一（影响最大）

**现状**:
```
测试计划.md（测试用例表） + 测试报告.md（执行结果表） + VERIFICATION.md（AC 映射）
= 3 个文件，信息重叠 >70%
```

**优化后**:
```
VERIFICATION.md（一个文件包含全部）
├── 测试用例（编号/场景/前置/预期/结果）
├── AC 映射（AC → 测试用例 → 结果）
└── 结论（PASS/FAIL + 已知问题）
```

**收益**: 文档量减少 40%，维护成本降低，信息不再分散。

**改动范围**:
- `scaffold-feature.js`: 删除测试计划/报告模板创建
- `tech:code/SKILL.md`: 输出产物从 4 个减到 2 个（VERIFICATION.md + STATE.md 可选）
- `tech:commit/SKILL.md`: 前置条件不再检查测试计划/报告
- `update-spec-state.js`: EXEC→REVIEW 的前置检查只验证 VERIFICATION.md

### 方案 B：scaffold 分阶段创建（影响中等）

**现状**: scaffold 一次创建 7 个文件，PLAN 阶段看到测试计划和测试报告的空模板。

**优化后**:
```
feature 阶段创建:
  SPEC-STATE.md + PRD.md + 技术方案.md + 任务拆解表.md

code 阶段按需创建:
  VERIFICATION.md（开始测试时创建）

不再创建:
  notepads/learnings.md（改为按需手动创建）
  测试计划.md / 测试报告.md（被 VERIFICATION.md 替代）
```

**改动范围**:
- `scaffold-feature.js`: 新增 `--phase` 参数，默认 `plan` 只创建 4 个文件
- `tech:code/SKILL.md`: 进入时检查并创建 VERIFICATION.md
- SPEC-STATE 产物状态: scaffolded → filled → verified

### 方案 C：tech:init 扁平化（影响较小）

**现状**: 6 步流程（预检→检测→确认→策略→脚本→扫描），实际体验只需 2 步。

**优化后**:
```
1. 检测+确认（AI 检测技术栈，向用户确认一次）
2. 运行脚本（init-project.js 一步到位）
```

**改动范围**:
- `tech:init/SKILL.md`: 合并 Step 0-3 为 Step 1，合并 Step 4-5 为 Step 2
- 删除 bootstrap-guard.md 中的冗余场景
- 知识扫描从独立步骤变为 init-project.js 的可选参数 `--with-knowledge-scan`

---

## 四、推荐优先级

| 优先级 | 方案 | 预期收益 | 改动量 |
|--------|------|----------|--------|
| **P0** | 方案 A：三文件合一 | 文档量 -40%，消除最大痛点 | 中（脚本+3 个 SKILL.md） |
| **P1** | 方案 B：scaffold 分阶段 | 早期体验更干净，消除假 done | 小（scaffold-feature.js + 1 个 SKILL.md） |
| **P2** | 方案 C：init 扁平化 | 认知负担降低，但 init 不常跑 | 小（1 个 SKILL.md + 1 个子文档） |

---

## 五、其他观察

### 5.1 SPEC-STATE 机制的价值

SPEC-STATE 作为生命周期门禁是有价值的，但当前实现有两个问题：
1. **前置检查只验证文件存在，不验证内容质量** — 空模板也能通过 PLAN→EXEC
2. **没有"用户已确认"的记录** — PLAN→EXEC 的门禁说"方案与任务拆解已确认"，但脚本无法检查这一点

建议在 update-spec-state.js 中增加：
- 文件最小内容长度检查（如 PRD > 200 字符）
- 可选的 `--confirmed-by` 参数记录确认人

### 5.2 脚本 vs AI 的边界

当前脚本做了对的事（文件创建、状态管理、验证），但 AI 的角色偏弱：
- init: AI 做检测 → 脚本执行 → AI 确认。合理。
- feature: AI 填模板 → AI 确认 → AI 填模板 → AI 确认。太多次交互。
- code: AI 写代码 → AI 填文档 → AI 填文档 → AI 填文档。文档太多。
- commit: AI 检查 → 脚本提交。合理。

feature 和 code 阶段 AI 的"填文档"操作应该进一步脚本化或模板化，减少手写量。

### 5.3 knowledge.md 沉淀效果

在本流程中，notepads/learnings.md 始终为空模板，docs/knowledge.md 没有更新。原因：
- 知识沉淀没有触发点 — SKILL.md 说"如果有沉淀价值就写"，但缺乏明确指引
- 建议：在 VERIFICATION.md 完成后，脚本自动提示"是否有可沉淀的模式？"，或者从代码 diff 中自动提取新增的模式（如乐观锁 CAS 用法）

---

## 六、feature 目录最终产物

### 当前（8 个文件）

```
features/ORDER-102-订单支付回调与状态同步/
├── SPEC-STATE.md        (auto)
├── PRD.md               (手写)
├── 技术方案.md           (手写)
├── 任务拆解表.md         (手写)
├── 测试计划.md           (手写，与 VERIFICATION 重叠)
├── 测试报告.md           (手写，与 VERIFICATION 重叠)
├── VERIFICATION.md      (手写)
└── notepads/learnings.md (空模板)
```

### 优化后（4 个文件）

```
features/ORDER-102-订单支付回调与状态同步/
├── SPEC-STATE.md        (auto)
├── PRD.md               (手写)
├── 技术方案.md           (手写)
├── 任务拆解表.md         (手写)
└── VERIFICATION.md      (手写，包含测试用例+结果+AC映射)
```
