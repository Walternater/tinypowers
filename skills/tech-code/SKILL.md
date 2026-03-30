---
name: tech:code
description: 当用户要求执行已规划的任务、开始编码实现、或继续未完成的 wave 执行时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "6.0"
---

# /tech:code

## 作用

`/tech:code` 负责把 `tech-feature` 阶段产出的任务表和技术方案，落成一轮可恢复、可审查、可验证的实现过程。

它回答四个问题：
- 任务要按什么顺序执行
- 哪些任务可以分 Wave 并行
- 实现完成后要按什么顺序审查
- 如果中断、失败或偏离方案，应该怎么收口

## 输入

- `features/{id}/任务拆解表.md`
- `features/{id}/技术方案.md`
- `features/{id}/STATE.md`
- `features/{id}/SPEC-STATE.md`

如果 `STATE.md` 不存在，则在启动时创建。

如果 `SPEC-STATE.md` 存在，Phase 1 必须验证当前 phase 为 `TASKS` 或 `EXEC`，禁止在 `INIT`/`REQ`/`DESIGN` 阶段进入 code。

<HARD-GATE>
**执行前门禁检查** - 以下条件必须全部满足才能进入执行：
1. `SPEC-STATE.md` 存在且当前 phase 为 `TASKS` 或 `EXEC`
2. `任务拆解表.md` 存在且通过 `tech-plan-checker` 验证
3. `技术方案.md` 存在且包含已锁定决策（D-0N 格式）
4. 上一阶段（Phase 3 审查）已通过

如果不满足上述任一条件，禁止进入 Wave Execution，必须先完成对应阶段。
</HARD-GATE>

## 主流程

```text
Plan Check
  -> Wave Execution
  -> Spec Compliance Review
  -> Security Review
  -> Code Quality Review
  -> Verification
```

这条链路必须顺序推进，不能跳步。

## 默认 Context

- Wave Execution 默认使用 `contexts/dev.md`
- 顺序审查默认使用 `contexts/review.md`
- 遇到疑难问题时，可临时切到 `contexts/debug.md`

## 硬约束

- 禁止在 `/tech:commit` 之前自动执行 `git commit`
- `STATE.md` 是执行期唯一真相源，Snapshot 只负责恢复提示
- Phase 1 未通过前，禁止启动任何编码任务
- 审查必须按"方案符合性 -> 安全 -> 代码质量"的顺序执行
- 审查和最终验证必须通过独立 Agent 完成，禁止主 Agent 自审自批
- 同一问题连续失败 3 次后，必须停止当前修补方向并上升到架构层讨论

<HARD-GATE>
**TDD 强制门禁** - 每个任务的实现必须遵循 RED-GREEN-REFACTOR 循环：
1. RED：首先编写一个会失败的测试（测试目标行为而非实现）
2. GREEN：编写最小代码使测试通过（不追求完美，只求通过）
3. REFACTOR：重构代码消除重复、提升质量，但保持测试通过

禁止在测试失败的情况下向主分支提交生产代码。违反此规则的代码必须回滚。

**例外条款**（不强制 TDD）：
- `tech:quick` 模式下的快速修复
- 纯配置变更（application.yml、properties 等）
- 文档更新（README、API docs）
- 基础设施/脚手架代码（Dockerfile、CI 配置等）
- 原型探索阶段（feature flag 保护的实验性代码）
</HARD-GATE>

## Phase 1: Plan Check

目标是确认任务表足够可靠，值得进入执行阶段。

### Spec State 校验

如果 `SPEC-STATE.md` 存在：
- 读取当前 phase 字段
- 当前 phase 必须为 `TASKS` 或 `EXEC`，否则输出阻塞说明并暂停
- 更新 phase 为 `EXEC`

### 必做事项

- 使用 `task` 工具调用 `tech-plan-checker`
- 检查任务表格式、依赖关系、任务粒度和关键路径
- 对照 `技术方案.md` 中的锁定决策，确认没有擅自偏离 D-0N 约束
- **执行 Wave 依赖拓扑排序，检测循环依赖和悬空引用**

### 失败处理

- 根据 `tech-plan-checker` 的反馈修正任务表
- 最多重试 3 次
- 3 次后仍未通过，则输出阻塞说明并暂停

## Phase 2: Wave Execution

目标是把任务表转换成按依赖推进的 Wave，并在每个 Wave 末尾完成一次本地收敛。

### 执行原则

- 启动前先读取或创建 `features/{id}/STATE.md`
- 按依赖图分 Wave，同一 Wave 内的任务可以并行，不同 Wave 必须串行
- **启动 Wave 前执行上下文预加载**（见 `context-preload.md`）
- **优先使用 Per-Task 命令文件**（`features/{id}/commands/T-XXX-execute.md`）减少 token 浪费
- 每个任务都要带着明确的验收标准、相关文件和技术方案上下文执行
- 执行前先读现有代码，禁止脱离上下文直接生成新实现
- 每个 Wave 完成后必须执行质量门禁
- **每个 Wave 完成后必须提取智慧积累**到 `features/{id}/notepads/learnings.md`

### TDD 循环执行

每个任务的实现必须遵循 TDD 循环：

```text
T-XXX Task
  ├── Step 1: RED - 编写失败的测试
  │   ├── 明确测试目标（验证什么行为）
  │   ├── 编写测试代码（此时应失败）
  │   └── 验证测试确实失败
  ├── Step 2: GREEN - 编写最小实现
  │   ├── 只写使测试通过的最少代码
  │   ├── 不追求完美，只求通过
  │   └── 验证测试通过
  └── Step 3: REFACTOR - 重构
      ├── 消除重复代码
      ├── 提升可读性和可维护性
      ├── 保持测试通过
      └── 记录重构学到的东西
```

### Deviation Rules（自动修复规则）

执行过程中遇到偏移时，按以下规则处理：

| 规则 | 条件 | 动作 |
|------|------|------|
| Rule 1 | 发现 Bug | 自动修复，不询问 |
| Rule 2 | 发现遗漏的关键功能（技术方案中明确列出的条目） | 自动补全，不询问 |
| Rule 3 | 遇到阻塞问题 | 自动解决阻塞，不询问 |
| Rule 4 | 架构变更 | 暂停，询问用户 |

<HARD-GATE>
**Rule 边界**：
- Rule 1-3 仅适用于明确、无争议的修复
- 如果修复涉及架构决策或业务逻辑变更，必须升级到 Rule 4
- 所有自动修复必须记录到 `deviation-log.md`
- **阈值限制**：同一 Wave 内 Rule 1-3 自动修复总计最多 3 次，超过必须升级到 Rule 4
- **Rule 2 约束**："关键功能"必须引用技术方案中的明确条目号（如 D-02），禁止主观判断
</HARD-GATE>

### Model Tiering（成本优化）

根据任务复杂度选择合适的模型：

| 任务类型 | 示例 | 推荐模型 |
|----------|------|----------|
| 机械任务 | 1-2 文件，明确需求 | 快速/便宜模型 |
| 集成任务 | 多文件，涉及接口对接 | 标准模型 |
| 架构/设计/审查 | 复杂逻辑，决策密集 | 最强模型 |

在任务执行 prompt 中明确标注推荐模型。

### 任务分配要求

每个任务的执行 prompt 至少要包含：
- 任务目标
- 验收标准
- 涉及文件路径
- 依赖的接口、类或数据结构
- 对应的锁定决策 ID
- **TDD 循环要求**
- **推荐模型**

### 运行中必须同步的状态

- 当前阶段
- 当前 Wave
- 已完成任务
- 阻塞项
- 偏差记录
- 上次操作

具体格式见 `state-management.md`。

## Phase 3: 顺序审查

这一阶段不是"多做几次 review"，而是依次回答三个不同问题。

### Step 1: 方案符合性审查

使用 `task` 工具调用 `spec-compliance-reviewer`，确认实现内容与技术方案一致。

检查重点：
- 接口契约是否一致
- 业务流程是否一致
- 数据结构和 DDL 是否一致
- 验收标准是否都有落地代码支撑
- 是否私自加入方案外行为

只有拿到 `COMPLIANT` 才能进入下一步。

### Step 2: 安全审查

使用 `task` 工具调用 `security-reviewer`，确认实现没有明显安全风险。

检查重点：
- 注入风险
- 鉴权与授权缺失
- 敏感信息暴露
- 不安全依赖
- 其他高危安全问题

只有拿到 `APPROVE` 才能进入下一步。

### Step 3: 代码质量审查

使用 `task` 工具调用代码质量审查 Agent。通用审查必选，技术栈专属审查按项目情况追加。

检查重点：
- 分层和结构是否清晰
- 命名和异常处理是否合理
- 是否存在明显的性能或可维护性问题
- 测试覆盖是否支撑当前实现

### 审查失败处理

- Step 1 失败：修复后重跑 Step 1
- Step 2 失败：修复后重跑 Step 2
- Step 3 失败：修复后重跑 Step 3
- 任一步骤最多重试 3 次，仍失败则输出阻塞报告并暂停

## Phase 4: Verification

目标是确认"做完了"不只是代码写完，而是需求闭环了。

### 4-Level Verification with Evidence

使用 `task` 工具调用 `tech-verifier`，执行目标回溯验证：

| Level | Name | 验证内容 | 需要的证据 |
|-------|------|----------|----------|
| L1 | Exists | 文件/方法存在 | 文件路径确认 |
| L2 | Substantive | 真实实现（非 stub） | 函数有完整逻辑 |
| L3 | Wired | 被其他部分调用 | 调用链确认 |
| L4 | Data Flow | 数据真实流通 | 集成测试/数据验证 |

<HARD-GATE>
**Verification 必须包含证据**：
- 每个验证点必须附带具体证据（文件路径、行号、调用链）
- L4 必须有数据流通的实测证据
- 没有证据的验证视为未完成
</HARD-GATE>

### 必做事项

- 回到技术方案核对功能点、接口、数据结构和验收标准
- 检查测试结果和覆盖率目标
- 确认 `notepads/learnings.md` 包含所有 Wave 的智慧积累
- 产出验证报告

### 默认目标

| 指标 | 目标 |
|------|------|
| 行覆盖率 | >= 80% |
| 分支覆盖率 | >= 70% |
| 核心业务覆盖率 | >= 90% |

如果项目已有更严格门槛，以项目规则为准。

## 输出

`/tech:code` 完成后，至少应留下以下交付物：

```text
features/{id}/
├── STATE.md
├── code-review.md
├── 测试报告.md
├── VERIFICATION.md
├── notepads/
│   └── learnings.md       # 每个 Wave 的智慧积累
├── deviation-log.md       # 偏差记录（自动修复日志）
└── commands/             # Per-Task 执行命令文件（可选）
    ├── T-001-execute.md
    └── ...
```

代码变更此时仍处于"待提交"状态，统一由 `/tech:commit` 收口。

## 失败与恢复

- 质量门禁失败：停止推进下一 Wave，先修复再继续
- 发现偏差：按 `deviation-handling.md` 记录并处理
- 上下文中断：按 `session-recovery.md` 从 `STATE.md` 断点恢复
- 连续 3 次失败：停止同方向尝试，转入架构质疑

## 配套文档

- `wave-execution.md`：如何把任务表拆成 Wave 并执行
- `state-management.md`：`STATE.md` 的结构和更新原则
- `session-recovery.md`：中断后如何恢复
- `quality-gate.md`：每个 Wave 之后的门禁要求
- `deviation-handling.md`：偏差分类、升级条件和记录方式
- `anti-rationalization.md`：防止绕过门禁时自我合理化
- `tdd-cycle.md`：TDD 循环执行指南
- `model-tiering.md`：模型选择指南
- `../tech-commit/nexus-handoff.md`：标准化交接协议

## Gotchas

> 已知失败模式，从实际使用中发现，有机增长。

- **审查阶段跳过直接推进**：Step 1 失败后直接尝试修复代码而不重跑 Step 1 → 审查结果仍为 FAIL：每次修复后必须重新跑对应 Step
- **3 次失败后继续同方向**：同一 Wave 内连续失败 3 次后换方向继续 → 架构质疑失效：严格在第 3 次失败后停止并升级
- **STATE.md 和 Snapshot 不一致**：Snapshot 说 Wave 3，STATE.md 说 Wave 2 → 以 STATE.md 为准，Snapshot 只是恢复提示
- **TDD 跳过测试直接写实现**：觉得"测试会拖慢速度" → 违反 HARD-GATE：测试失败时禁止提交生产代码
- **Deviation Rule 滥用**：把复杂变更当作 Rule 1-3 自动处理 → 违反 HARD-GATE：架构变更必须询问用户
