---
name: tech:code
description: 当用户要求执行已规划的任务、开始编码实现、或继续未完成的 wave 执行时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "6.1"
---

# /tech:code

## 作用

把 `tech-feature` 产出的任务表和技术方案，落成可恢复、可审查、可验证的实现过程。

本 skill 是**薄编排层**——定义 WHAT（门禁、缝合策略、上下文），委托 superpowers 定义 HOW（怎么派 subagent、怎么做 review、怎么验证）。

## 复杂度路由

| 模式 | 判定条件 | 流程差异 |
|------|---------|---------|
| **Fast** | 单模块、≤3 个文件改动、无破坏性变更 | 跳过 Phase 1（Worktree）、跳过 Phase 3（Pattern Scan 简化为快速参考）、Phase 5 审查合并为 1 轮 |
| **Standard** | 多模块、有 DB 变更、跨层改动 | 完整 7 Phase 流程 |

## 输入

- `features/{id}-{name}/任务拆解表.md`、`技术方案.md`、`STATE.md`、`SPEC-STATE.md`
- `STATE.md` 不存在则启动时创建
- `SPEC-STATE.md` 存在时，当前 phase 必须为 `EXEC`

<HARD-GATE>
**执行前门禁检查** - 以下条件必须全部满足才能进入执行：
1. `SPEC-STATE.md` 存在且当前 phase 为 `EXEC`
2. `任务拆解表.md` 存在且通过 `tech-plan-checker` 验证
3. `技术方案.md` 存在且包含已锁定决策（D-0N 格式）

如果不满足上述任一条件，禁止进入 Wave Execution，必须先完成对应阶段。
</HARD-GATE>

## 主流程

```text
Phase 0: Gate Check
Phase 1: Isolated Worktree Setup（Standard only）
Phase 2: Context Preparation + Pattern Scan（Fast: 合并 / Standard: 分两步）
Phase 3: Execute (delegate to superpowers)
Phase 4: Review（Fast: 1 轮 / Standard: 3 轮串行）
Phase 5: Verify (delegate to superpowers)
```

## 硬约束

- 禁止在 `/tech:commit` 之前自动执行 `git commit`
- **缝合优先**：任务执行前必须搜索项目中最相似的已有实现作为锚点，复制骨架 → 替换业务字段 → 只在差异点写新代码。纯新模块标记 `GREENFIELD` 后可从零编写
- **TDD 强制门禁**：每个任务的实现必须遵循 RED-GREEN-REFACTOR 循环
- **偏差 3 次升级**：同一问题连续失败 3 次后停止同方向尝试，上升到架构层讨论

<TDD-GATE>
**TDD 例外条款**（不强制 TDD）：
- 小任务快速修复
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

## Phase 1: Isolated Worktree Setup（Standard only）

> Fast 模式跳过此 Phase，直接在当前分支开发。

默认在这里委托 `superpowers:using-git-worktrees` 创建或复用隔离环境。

- `/tech:feature` 默认不建 worktree
- 如果当前已经在正确的隔离 worktree 中，直接复用
- 如果不存在隔离环境，完成 Gate Check 后再创建

## Phase 2: Context Preparation + Pattern Scan

为后续 Phase 预加载上下文。

**上下文加载规则**：
- 读取 `技术方案.md`、`任务拆解表.md`、`STATE.md`
- 加载领域知识（`docs/knowledge.md`）
- 加载 feature 级 learnings（`notepads/learnings.md`）

**裁剪规则**：

| 内容类型 | 裁剪策略 | 理由 |
|---------|---------|------|
| 技术方案全文 | 只注入当前任务相关章节 | 避免全量注入 |
| 接口定义 | 只注入当前任务涉及的接口 | 按任务裁剪 |
| 数据库设计 | 只注入当前任务涉及的表 | 按任务裁剪 |
| 决策记录 | 全量注入 | 决策是全局约束 |
| 规则文件 | 不注入（由 Hook 加载） | Hook 自动处理 |

**Pattern Scan**（Standard 模式完整执行，Fast 模式简化为快速参考）：

为每个任务搜索最相似的已有实现。搜索策略：

| 搜索维度 | 方法 | 示例 |
|---------|------|------|
| 同类型文件 | 按文件类型/层匹配 | 新建 Controller → 搜现有 Controller |
| 同业务域 | 按目录名、模块名、接口路径匹配 | 用户模块 → 搜 src/user/ 下文件 |
| 同模式 | 按功能模式匹配 | CRUD → 找最近的 CRUD 实现 |

每个任务产出参考锚点或 `GREENFIELD` 标记。

缝合执行规则：非 GREENFIELD 任务必须先读取参考实现全文，理解其结构后再编码。编码顺序：复制骨架 → 替换业务字段和接口地址 → 在差异点编写新逻辑。

**Wave 内学习捕获**：Wave 执行过程中发现的经验，实时记录到 `notepads/learnings.md`。

捕获格式：
```markdown
### [日期] 简要描述
- **类型**: 踩坑 / 组件用法 / 平台约束 / 方案纠正
- **发现于**: T-XXX（任务 ID）
- **内容**: 具体描述
```

不记录的内容：公开文档能查到的通用知识、纯粹的 typos、重复已有的 learnings 条目。

**Anti-Rationalization 自检**：

| 你可能在想 | 更可靠的判断 |
|-----------|--------------|
| 这只是个小改动 | 小改动同样可能破坏边界条件 |
| 我已经检查过了 | 自查不等于独立验证 |
| 用户催得急 | 带着已知风险继续，返工成本更高 |
| 这一步应该不会出问题 | "应该"不是证据，跑完检查才是 |

## Phase 3: Execute

**委托 `superpowers:subagent-driven-development` 执行。**

每个 subagent 的 task prompt 必须包含：
- 任务描述和验收标准
- 涉及文件和依赖接口
- 锁定决策（D-0N）
- Pattern Scan 结果（参考实现 + 缝合策略）
- 领域知识（按任务裁剪）
- TDD 要求

> Fast 模式：简单任务可直接编码，不需要 subagent 委托。

执行过程中发现的 learnings 实时记录到 `notepads/learnings.md`。

## Phase 4: Review

先做 tinypowers 专项审查（确认"做对了东西"），再做 superpowers 代码质量审查。

<HARD-GATE>
**审查顺序不可跳步** — 前一步未通过禁止进入下一步。
</HARD-GATE>

**Standard 模式**（3 轮串行）：
```text
1. agents/spec-compliance-reviewer      — 技术方案符合性（tinypowers 独有）
2. agents/security-reviewer             — 安全风险审查（tinypowers 独有）
3. superpowers:requesting-code-review    — 代码质量审查
```

**Fast 模式**（1 轮综合审查）：
```text
1. 综合审查（方案符合性 + 安全 + 代码质量合并为一轮）
```

每步最多重试 3 次，仍失败则暂停。

## Phase 5: Verify

**委托 `superpowers:verification-before-completion` 执行。**

铁律：没有验证证据就不算完成。

默认覆盖率目标：行覆盖率 >= 80%，分支覆盖率 >= 70%，核心业务 >= 90%。项目有更严门槛则以项目为准。

## 输出

```text
features/{id}-{name}/
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

> context-preload 和 pattern-scan 已内联到本文件 Phase 2 中。

**委托 superpowers**:
- Phase 1 → `superpowers:using-git-worktrees`（Standard only）
- Phase 3 → `superpowers:subagent-driven-development`
- Phase 4 → `superpowers:requesting-code-review`（Standard only）
- Phase 5 → `superpowers:verification-before-completion`
