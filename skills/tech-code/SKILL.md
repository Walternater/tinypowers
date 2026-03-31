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

把 `tech-feature` 产出的任务表和技术方案，落成可恢复、可审查、可验证的实现过程。

## 输入

- `features/{id}/任务拆解表.md`、`技术方案.md`、`STATE.md`、`SPEC-STATE.md`

<HARD-GATE>
**执行前门禁** - 以下条件必须全部满足才能进入执行：
1. `SPEC-STATE.md` 存在且当前 phase 为 `TASKS` 或 `EXEC`
2. `任务拆解表.md` 存在且通过 `tech-plan-checker` 验证
3. `技术方案.md` 存在且包含已锁定决策（D-0N 格式）
4. 审查阶段（Phase 3）已通过

不满足任一条件，禁止进入 Wave Execution。
</HARD-GATE>

## 主流程

```text
Phase 1: Plan Check        → 验证任务表、拓扑排序（见 state-management.md）
Phase 2: Wave Execution    → 依赖驱动并行、Pattern Scan、缝合执行（见 wave-execution.md）
Phase 3: 顺序审查          → 方案符合性 → 安全 → 代码质量（见 quality-gate.md）
Phase 4: Verification      → 4-Level 目标回溯验证（见 quality-gate.md）
```

顺序推进，禁止跳步。

## 默认 Context

- Wave Execution → `contexts/dev.md`
- 顺序审查 → `contexts/review.md`
- 疑难问题 → `contexts/debug.md`

## 硬约束

- 禁止在 `/tech:commit` 之前自动执行 `git commit`
- `STATE.md` 是执行期唯一真相源
- Phase 1 未通过前，禁止启动编码任务
- 审查必须按"方案符合性 → 安全 → 代码质量"顺序执行
- 审查和验证必须通过独立 Agent 完成，禁止自审自批
- 同一问题连续 3 次失败 → 停止修补，转入架构质疑
- **缝合优先**：搜索最相似已有实现作为锚点，复制骨架 → 替换业务字段 → 只写差异。纯新模块标记 `GREENFIELD`

<HARD-GATE>
**TDD 强制门禁** - 每个任务必须遵循 RED-GREEN-REFACTOR：
1. RED：编写会失败的测试
2. GREEN：编写最小代码使测试通过
3. REFACTOR：重构消除重复，保持测试通过

禁止在测试失败的情况下提交生产代码。

**例外**：`tech:quick` 快速修复、纯配置变更、文档更新、基础设施代码、原型探索。
</HARD-GATE>

## Deviation Rules

| 规则 | 条件 | 动作 |
|------|------|------|
| Rule 1 | 发现 Bug | 自动修复 |
| Rule 2 | 遗漏关键功能（须引用技术方案条目号） | 自动补全 |
| Rule 3 | 遇到阻塞问题 | 自动解决 |
| Rule 4 | 架构变更 | 暂停，询问用户 |

同一 Wave 内 Rule 1-3 总计最多 3 次，超过升级到 Rule 4。详见 `deviation-handling.md`。

## 输出

```text
features/{id}/
├── STATE.md
├── code-review.md
├── 测试报告.md
├── VERIFICATION.md
└── notepads/learnings.md
```

代码变更统一由 `/tech:commit` 收口。

## 配套文档

`wave-execution.md` | `state-management.md` | `session-recovery.md` | `quality-gate.md` | `deviation-handling.md` | `context-preload.md`
