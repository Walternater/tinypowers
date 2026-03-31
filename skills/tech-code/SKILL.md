---
name: tech:code
description: 当用户要求执行已规划的任务、开始编码实现、或继续未完成的 wave 执行时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "5.2"
---

# /tech:code

## 作用

把 `tech-feature` 产出的任务表和技术方案，落成可恢复、可审查、可验证的实现过程。

## 输入

- `features/{id}/任务拆解表.md`、`技术方案.md`、`STATE.md`、`SPEC-STATE.md`
- `STATE.md` 不存在则启动时创建
- `SPEC-STATE.md` 存在时，当前 phase 必须为 `TASKS` 或 `EXEC`

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
- 同一问题连续 3 次后，必须停止当前修补方向并上升到架构层讨论
- **缝合优先**：任务执行前必须搜索项目中最相似的已有实现作为锚点，复制骨架 → 替换业务字段 → 只在差异点写新代码。纯新模块标记 `GREENFIELD` 后可从零编写

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

确认任务表可靠，可进入执行。

- 如果 `SPEC-STATE.md` 存在，更新 phase 为 `EXEC`
- 调用 `tech-plan-checker` 检查任务表格式、依赖关系、任务粒度
- 对照 `技术方案.md` 锁定决策，确认无偏离 D-0N 约束
- 执行依赖拓扑排序，检测循环依赖
- 最多重试 3 次，仍失败则暂停

## Phase 2: Wave Execution

把任务表按依赖推进分 Wave，每个 Wave 末尾完成一次收敛。详见 `wave-execution.md`。

- 启动前读取或创建 `STATE.md`
- 同一 Wave 并行，不同 Wave 串行
- 启动 Wave 前执行上下文预加载（见 `context-preload.md`）
- 每个 Wave 完成后执行质量门禁（见 `quality-gate.md`）

### Deviation Rules

| 规则 | 条件 | 动作 |
|------|------|------|
| Rule 1 | 发现 Bug | 自动修复 |
| Rule 2 | 发现遗漏的关键功能（须引用技术方案条目号） | 自动补全 |
| Rule 3 | 遇到阻塞问题 | 自动解决 |
| Rule 4 | 架构变更 | 暂停，询问用户 |

同一 Wave 内 Rule 1-3 总计最多 3 次，超过升级到 Rule 4。所有自动修复记录到 `STATE.md`。

### 任务分配要求

每个任务的执行 prompt 至少包含：任务目标、验收标准、涉及文件、依赖接口、对应决策 ID、TDD 要求。

### 运行中同步状态

当前阶段、Wave、已完成任务、阻塞项、偏差记录、上次操作。格式见 `state-management.md`。

## Phase 3: 顺序审查

依次回答三个不同问题，不能跳步。

### Step 1: 方案符合性审查

调用 `spec-compliance-reviewer`：接口契约、业务流程、数据结构、验收标准是否与技术方案一致。只有 `COMPLIANT` 才进入下一步。

### Step 2: 安全审查

调用 `security-reviewer`：注入风险、鉴权缺失、敏感信息暴露、不安全依赖。只有 `APPROVE` 才进入下一步。

### Step 3: 代码质量审查

调用代码质量审查 Agent：分层结构、命名、异常处理、性能、测试覆盖。

### 审查失败处理

每步最多重试 3 次，仍失败则暂停。修复后重跑对应 Step。

## Phase 4: Verification

确认"做完了"不只是代码写完，而是需求闭环。

调用 `tech-verifier` 执行目标回溯验证，详见 `quality-gate.md` 中的 4-Level Verification 定义。

每个验证点必须附带具体证据，没有证据视为未完成。

### 默认目标

行覆盖率 >= 80%，分支覆盖率 >= 70%，核心业务 >= 90%。项目有更严门槛则以项目为准。

## 输出

```text
features/{id}/
├── STATE.md
├── code-review.md
├── 测试报告.md
├── VERIFICATION.md
└── notepads/learnings.md
```

代码变更统一由 `/tech:commit` 收口（包括知识沉淀）。

## 失败与恢复

- 质量门禁失败：停止下一 Wave，先修复
- 发现偏差：按 `deviation-handling.md` 处理
- 上下文中断：按 `session-recovery.md` 恢复
- 连续 3 次失败：停止，转入架构质疑

## 配套文档

`wave-execution.md` | `state-management.md` | `session-recovery.md` | `quality-gate.md` | `deviation-handling.md`

## Gotchas

- 修复后必须重跑对应审查 Step，不能跳步
- STATE.md 和 Snapshot 不一致时，以 STATE.md 为准
- 同一 Wave 连续 3 次失败后必须升级，换方向不算重置

## Anti-Rationalization 自检

跳过检查前先问：是不是在找借口？

| 你可能在想 | 更可靠的判断 |
|-----------|--------------|
| 这只是个小改动 | 小改动同样可能破坏边界条件 |
| 我已经检查过了 | 自查不等于独立验证 |
| 用户催得急 | 带着已知风险继续，返工成本更高 |
| 这一步应该不会出问题 | "应该"不是证据，跑完检查才是 |

## 交接检查清单

阶段转换或会话交接时，逐项确认以下内容：

- [ ] **关键决策及依据**：列出所有 D-XXX 决策及其理由
- [ ] **被拒绝方案及原因**：记录否决的替代方案及否决理由
- [ ] **已识别风险**：当前已知的技术风险和阻塞项
- [ ] **未完成项**：明确哪些任务/Wave 尚未完成
- [ ] **验证证据**：附上测试通过、覆盖率、审查结论等证据
- [ ] **偏差记录**：汇总已发生的偏差类型和处理结果
- [ ] **下一步行动**：交接后应立即执行的第一个动作
