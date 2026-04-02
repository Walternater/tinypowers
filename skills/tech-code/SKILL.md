---
name: tech:code
description: 当用户要求执行已规划的任务、开始编码实现、或继续未完成的 wave 执行时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "7.0"
---

# /tech:code

## 作用

把 `tech-feature` 产出的任务表和技术方案，落成可恢复、可审查、可验证的实现过程。

本 skill 是**薄编排层**——定义 WHAT（门禁、缝合策略、上下文），委托 superpowers 定义 HOW（怎么派 subagent、怎么做 review、怎么验证）。

## 复杂度路由

| 维度 | Fast | Standard |
|------|------|----------|
| 任务数 | 1-3 个简单任务 | 4+ 任务或有复杂依赖 |
| 变更范围 | 单文件或 2-3 文件小改动 | 多模块、跨层变更 |
| 架构影响 | 无新决策、无接口变更 | 涉及新决策或接口变更 |
| 隔离需求 | 可直接在当前分支编码 | 需要 worktree 隔离 |

**判断规则**：所有维度都满足 Fast 才走 Fast 路径；任一维度需要 Standard 则走 Standard。

## 输入

- `features/{id}-{name}/任务拆解表.md`、`技术方案.md`、`STATE.md`、`SPEC-STATE.md`
- `STATE.md` 不存在则启动时创建
- `SPEC-STATE.md` 存在时，当前 phase 必须为 `PLAN` 或 `EXEC`

<HARD-GATE>
**执行前门禁检查** - 以下条件必须全部满足才能进入执行：
1. `SPEC-STATE.md` 存在且当前 phase 为 `PLAN` 或 `EXEC`
2. `任务拆解表.md` 存在且通过 `tech-plan-checker` 验证
3. `技术方案.md` 存在且包含已锁定决策（D-0N 格式）

如果不满足上述任一条件，禁止进入执行，必须先完成对应阶段。
</HARD-GATE>

## 主流程

### Standard（6 Phase）

```text
Phase 0: Gate Check
Phase 1: Worktree Setup
Phase 2: Context Preparation
Phase 3: Pattern Scan
Phase 4: Execute (delegate to superpowers)
Phase 5: Review (tinypowers agents → superpowers)
Phase 6: Verify (delegate to superpowers)
```

### Fast（3 Phase）

```text
Phase 0: Gate Check
Phase 1: Context + Pattern Scan
Phase 2: Execute + Review
Phase 3: Verify
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

## Phase 1: Worktree Setup（Standard only）

委托 `superpowers:using-git-worktrees` 创建或复用隔离环境。

- `/tech:feature` 默认不建 worktree
- 如果当前已经在正确的隔离 worktree 中，直接复用
- 如果不存在隔离环境，完成 Gate Check 后再创建

## Phase 2: Context Preparation（Standard）

一次性读取共享文档：

- `技术方案.md`、`任务拆解表.md`、`STATE.md`
- `notepads/learnings.md`（如果存在）
- `docs/knowledge.md`（如果存在）

### 裁剪规则

| 内容类型 | 裁剪策略 | 理由 |
|---------|---------|------|
| 技术方案全文 | 只注入当前任务相关章节 | 避免全量注入 |
| 接口定义 | 只注入当前任务涉及的接口 | 按任务裁剪 |
| 数据库设计 | 只注入当前任务涉及的表 | 按任务裁剪 |
| 决策记录 | 全量注入 | 决策是全局约束 |
| 领域知识 | 平台约束全量注入，其余按任务相关性裁剪 | 约束是全局底线 |

## Phase 3: Pattern Scan（Standard）

为每个任务搜索最相似的已有实现。

### 搜索策略

| 搜索维度 | 方法 | 示例 |
|---------|------|------|
| 同类型文件 | 按文件类型/层匹配 | 新建 Controller → 搜现有 Controller |
| 同业务域 | 按目录名、模块名、接口路径匹配 | 用户模块 → 搜 src/user/ 下文件 |
| 同模式 | 按功能模式匹配 | CRUD → 找最近的 CRUD 实现 |

每个任务至少找到一个参考锚点，或标记 `GREENFIELD`。

### 缝合执行规则

非 GREENFIELD 任务必须先读取参考实现全文，理解其结构后再编码。编码顺序为：复制骨架 → 替换业务字段和接口地址 → 在差异点编写新逻辑。

## Phase 4: Execute（Standard）

**委托 `superpowers:subagent-driven-development` 执行。**

每个 subagent 的 task prompt 必须包含：
- 任务描述和验收标准
- 涉及文件和依赖接口
- 锁定决策（D-0N）
- Pattern Scan 结果（参考实现 + 缝合策略）
- 领域知识（按任务裁剪）
- TDD 要求

执行过程中发现的 learnings 实时记录到 `notepads/learnings.md`。

## Phase 5: Review（Standard）

先做 tinypowers 专项审查（确认"做对了东西"），再做 superpowers 代码质量审查。

<HARD-GATE>
**审查顺序不可跳步** — 前一步未通过禁止进入下一步：
1. 方案符合性未通过 → 禁止进入安全审查
2. 安全审查未通过 → 禁止进入代码质量审查
</HARD-GATE>

```text
1. agents/spec-compliance-reviewer      — 技术方案符合性（tinypowers 独有）
2. agents/security-reviewer             — 安全风险审查（tinypowers 独有）
3. superpowers:requesting-code-review    — 代码质量审查
```

每步最多重试 3 次，仍失败则暂停。

## Phase 6: Verify（Standard）

**委托 `superpowers:verification-before-completion` 执行。**

铁律：没有验证证据就不算完成。

默认覆盖率目标：行覆盖率 >= 80%，分支覆盖率 >= 70%，核心业务 >= 90%。项目有更严门槛则以项目为准。

## Fast Phase 1: Context + Pattern Scan

合并 Context Preparation 和 Pattern Scan，简化执行。

### 上下文加载

读取 `技术方案.md`、`任务拆解表.md`、`STATE.md`，按当前任务裁剪注入。领域知识只加载 `docs/knowledge.md` 中的平台约束部分。

### Pattern Scan（简化）

按文件类型搜一个最相似的参考文件即可。输出参考锚点或 `GREENFIELD`，不做缝合策略标注。

## Fast Phase 2: Execute + Review

直接编码，不派 subagent。

- 按任务表顺序逐个实现
- 缝合规则：有参考文件时先读后改，无参考时从零编写
- learnings 实时记录到 `notepads/learnings.md`

### 完成后综合自审

所有任务编码完成后，做一轮综合审查：

1. **方案符合性**：检查实现是否匹配技术方案的锁定决策
2. **安全检查**：检查输入校验、权限控制、SQL 注入等常见风险
3. **代码质量**：检查命名、结构、重复代码

发现问题直接修复，不需要单独的审查循环。

## Fast Phase 3: Verify

**委托 `superpowers:verification-before-completion` 执行。**

与 Standard Phase 6 相同。铁律：没有验证证据就不算完成。

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
- 执行失败：Fast 路径直接修复重试；Standard 路径按 superpowers 的 subagent 失败处理
- 连续 3 次失败：停止，转入架构质疑

## 配套文档

无独立子文档。Context preload 裁剪规则和 Pattern Scan 搜索策略已内联到对应 Phase。

**委托 superpowers**:
- Phase 1 (Standard) → `superpowers:using-git-worktrees`
- Phase 4 (Standard) → `superpowers:subagent-driven-development`
- Phase 5 (Standard) → `superpowers:requesting-code-review`
- Phase 6 / Fast Phase 3 → `superpowers:verification-before-completion`

## Gotchas

- **Fast 路径不应建 worktree**：小改动建 worktree 的开销大于收益，直接在当前分支编码
- **Fast 路径不用 subagent**：任务量小，自己编码比编排 subagent 更快
- **Fast 不等于跳过验证**：Fast 路径的 Verify 阶段与 Standard 相同，不能省略
- **裁剪粒度决定上下文质量**：注入太多无关内容会干扰编码判断，严格按任务边界裁剪
- **GREENFIELD 不等于乱写**：无参考实现时仍需遵循项目编码规范和目录结构约定
- **Fast→Standard 升级**：编码过程中发现任务比预期复杂，应切换到 Standard 路径
