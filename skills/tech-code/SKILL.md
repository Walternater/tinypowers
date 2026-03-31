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

本 skill 是**薄编排层**——定义 WHAT（门禁、缝合策略、上下文），委托 superpowers 定义 HOW（怎么派 subagent、怎么做 review、怎么验证）。

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
Phase 0: Gate Check
Phase 1: Context Preparation
Phase 2: Pattern Scan
Phase 3: Execute (delegate to superpowers)
Phase 4: Review (delegate to superpowers + tinypowers agents)
Phase 5: Verify (delegate to superpowers)
```

## 硬约束

- 禁止在 `/tech:commit` 之前自动执行 `git commit`
- **缝合优先**：任务执行前必须搜索项目中最相似的已有实现作为锚点，复制骨架 → 替换业务字段 → 只在差异点写新代码。纯新模块标记 `GREENFIELD` 后可从零编写
- **TDD 强制门禁**：每个任务的实现必须遵循 RED-GREEN-REFACTOR 循环
- **偏差 3 次升级**：同一问题连续失败 3 次后停止同方向尝试，上升到架构层讨论

<TDD-GATE>
**TDD 例外条款**（不强制 TDD）：
- `tech:quick` 模式下的快速修复
- 纯配置变更（application.yml、properties 等）
- 文档更新（README、API docs）
- 基础设施/脚手架代码（Dockerfile、CI 配置等）
- 原型探索阶段（feature flag 保护的实验性代码）
</TDD-GATE>

## Phase 0: Gate Check

确认可以进入执行。

- 如果 `SPEC-STATE.md` 存在，更新 phase 为 `EXEC`
- 调用 `tech-plan-checker` 检查任务表格式、依赖关系、任务粒度
- 对照 `技术方案.md` 锁定决策，确认无偏离 D-0N 约束
- 最多重试 3 次，仍失败则暂停

## Phase 1: Context Preparation

为后续 Phase 预加载上下文。详见 `context-preload.md`。

- 读取 `技术方案.md`、`任务拆解表.md`、`STATE.md`
- 加载领域知识（`docs/knowledge.md`）
- 加载 feature 级 learnings（`notepads/learnings.md`）

## Phase 2: Pattern Scan

为每个任务搜索最相似的已有实现。详见 `pattern-scan.md`。

- 按文件类型、业务域、功能模式三个维度搜索
- 每个任务产出参考锚点或 `GREENFIELD` 标记
- 缝合策略：标注保留/替换/新增

## Phase 3: Execute

**委托 `superpowers:subagent-driven-development` 执行。**

每个 subagent 的 task prompt 必须包含：
- 任务描述和验收标准
- 涉及文件和依赖接口
- 锁定决策（D-0N）
- Pattern Scan 结果（参考实现 + 缝合策略）
- 领域知识（按任务裁剪）
- TDD 要求

执行过程中发现的 learnings 实时记录到 `notepads/learnings.md`（格式见 `pattern-scan.md`）。

## Phase 4: Review

先委托 superpowers 审查，再追加 tinypowers 专项审查。

```text
1. superpowers:requesting-code-review    — 代码质量审查
2. agents/spec-compliance-reviewer      — 技术方案符合性（tinypowers 独有）
3. agents/security-reviewer             — 安全风险审查（tinypowers 独有）
```

每步最多重试 3 次，仍失败则暂停。

## Phase 5: Verify

**委托 `superpowers:verification-before-completion` 执行。**

铁律：没有验证证据就不算完成。

默认覆盖率目标：行覆盖率 >= 80%，分支覆盖率 >= 70%，核心业务 >= 90%。项目有更严门槛则以项目为准。

## 输出

```text
features/{id}/
├── STATE.md
├── VERIFICATION.md
└── notepads/learnings.md
```

代码变更统一由 `/tech:commit` 收口（包括知识沉淀）。

## 失败与恢复

- 门禁失败：先修复再进
- 执行失败：按 superpowers 的 subagent 失败处理
- 连续 3 次失败：停止，转入架构质疑

## 配套文档

`pattern-scan.md` | `context-preload.md`

## Anti-Rationalization 自检

| 你可能在想 | 更可靠的判断 |
|-----------|--------------|
| 这只是个小改动 | 小改动同样可能破坏边界条件 |
| 我已经检查过了 | 自查不等于独立验证 |
| 用户催得急 | 带着已知风险继续，返工成本更高 |
| 这一步应该不会出问题 | "应该"不是证据，跑完检查才是 |

## 交接检查清单

- [ ] **关键决策及依据**：列出所有 D-XXX 决策及其理由
- [ ] **被拒绝方案及原因**：记录否决的替代方案及否决理由
- [ ] **已识别风险**：当前已知的技术风险和阻塞项
- [ ] **未完成项**：明确哪些任务/Wave 尚未完成
- [ ] **验证证据**：附上测试通过、覆盖率、审查结论等证据
- [ ] **偏差记录**：汇总已发生的偏差类型和处理结果
- [ ] **下一步行动**：交接后应立即执行的第一个动作
