---
name: tech:code
description: Wave并行执行 + 顺序审查循环，支持偏差处理、质量门禁和Session恢复。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "5.0"
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
- 审查必须按“方案符合性 -> 安全 -> 代码质量”的顺序执行
- 审查和最终验证必须通过独立 Agent 完成，禁止主 Agent 自审自批
- 同一问题连续失败 3 次后，必须停止当前修补方向并上升到架构层讨论

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
- 每个任务都要带着明确的验收标准、相关文件和技术方案上下文执行
- 执行前先读现有代码，禁止脱离上下文直接生成新实现
- 每个 Wave 完成后必须执行质量门禁

### 任务分配要求

每个任务的执行 prompt 至少要包含：
- 任务目标
- 验收标准
- 涉及文件路径
- 依赖的接口、类或数据结构
- 对应的锁定决策 ID

### 运行中必须同步的状态

- 当前阶段
- 当前 Wave
- 已完成任务
- 阻塞项
- 偏差记录
- 上次操作

具体格式见 `state-management.md`。

## Phase 3: 顺序审查

这一阶段不是“多做几次 review”，而是依次回答三个不同问题。

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

目标是确认“做完了”不只是代码写完，而是需求闭环了。

### 必做事项

- 使用 `task` 工具调用 `tech-verifier`
- 回到技术方案核对功能点、接口、数据结构和验收标准
- 检查测试结果和覆盖率目标
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
└── VERIFICATION.md
```

代码变更此时仍处于“待提交”状态，统一由 `/tech:commit` 收口。

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
