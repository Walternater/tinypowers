# 新需求工作流

本文档面向使用 tinypowers 的开发者，说明一个需求从分析到交付的标准路径。

如果你只记住一句话，可以记这个：

```text
/tech:feature -> /tech:code -> /tech:commit
```

## 工作流目标

这套流程的目标是让交付过程稳定，但不把内部执行机制暴露成额外负担：
- 先确认理解，再确认方案
- 先拆出可执行任务，再进入开发
- 先确认方案符合性和安全，再看代码质量
- 保留 worktree、知识库、状态恢复等能力，但只在复杂需求时展开

## 入口命令

| 命令 | 用途 |
|------|------|
| `/tech:init` | 初始化目标项目骨架 |
| `/tech:feature` | 需求理解、技术方案、任务拆解 |
| `/tech:code` | 开发执行、审查修复、测试验证 |
| `/tech:commit` | 文档同步、提交、推送、PR |

## 需求目录结构

单个需求的标准工作目录：

```text
features/{需求编号}-{需求名称}/
├── SPEC-STATE.md
├── PRD.md
├── 技术方案.md
├── 任务拆解表.md
├── VERIFICATION.md           # 可选，进入验证阶段后创建
├── 测试计划.md                # 可选，medium / standard 路径需要
├── 测试报告.md                # 可选，medium / standard 路径需要
├── STATE.md                  # 可选，仅复杂执行时
└── notepads/
    └── learnings.md          # 可选，仅有明确复用价值时创建
```

说明：
- `SPEC-STATE.md` 负责粗粒度生命周期状态
- `技术方案.md` 是方案与关键决策的主文档
- `上线计划` 应作为技术方案的一部分保留，不再靠自由发挥追加
- `任务拆解表.md` 是执行入口
- `VERIFICATION.md` 是最终验证主载体，Fast 路径只要求这一份
- `测试计划.md` 与 `测试报告.md` 只在 `medium / standard` 路径作为显式交付物
- `STATE.md` 仅在多任务、多 Wave、跨会话或 worktree 协作时维护
- `notepads/learnings.md` 与 `docs/knowledge.md` 组成知识沉淀链路，但不再默认预创建

默认 scaffold 只会创建：
- `SPEC-STATE.md`
- `PRD.md`
- `技术方案.md`
- `任务拆解表.md`

按阶段或按路径补充创建：
- `VERIFICATION.md`：进入测试与验证阶段后创建
- `测试计划.md` / `测试报告.md`：仅 `medium / standard` 路径创建
- `STATE.md`：复杂执行时创建
- `notepads/learnings.md`：确实有可沉淀经验时创建

## 全流程总览

```text
PRD
  ↓
/tech:feature
  -> 需求理解
  -> 技术方案
  -> 任务拆解
  -> CHECK-1（feature -> code）
  ↓
/tech:code
  -> 开发执行
  -> 审查修复（可迭代）
     -> compliance-reviewer
     -> code-reviewer
     -> update-verification.js
     -> 必要时修复并复审
  -> 测试与验证
  -> CHECK-2（code -> commit）
  ↓
/tech:commit
  -> 文档同步
  -> SPEC-STATE -> DONE
  -> 提交 / 推送 / PR
```

## 阶段说明

### 1. `/tech:feature`

这个阶段产出“可执行的需求定义”。

主要步骤：
- 读取 `PRD.md`
- 形成结构化需求理解
- 产出技术方案
- 锁定关键决策
- 生成任务拆解表
- 输出 `CHECK-1` 摘要，作为进入开发前的显式边界

技术方案至少应覆盖：
- 目标与范围
- 核心设计
- 接口 / 数据 / 配置影响
- 上线计划
- 风险与回滚

硬门禁：
- 技术方案未达到可执行粒度，不能进入编码
- 任务拆解不清晰，不能进入 `/tech:code`
- 规划包未形成可执行摘要，不能进入 `/tech:code`

`CHECK-1` 至少应说明：
- 需求摘要
- 关键决策
- 任务数量 / 执行粒度
- 主要风险

人工确认仍然优先；如果需要 AI 自驱继续，语义上应明确记为 `soft gate bypassed`，而不是“已审批”。

### 2. `/tech:code`

这个阶段产出“经过审查、测试和验证的实现”。

默认顺序：

1. Gate Check
2. 开发执行
3. 审查修复
   审查链固定为 `compliance-reviewer -> code-reviewer -> update-verification.js`
4. 测试与验证
5. CHECK-2（code -> commit）

按路径区分验证交付物：

- `fast`
  - 最小交付物是 `VERIFICATION.md`
  - 不要求 `测试计划.md` / `测试报告.md`
- `medium / standard`
  - 需要 `测试计划.md`
  - 需要 `测试报告.md`
  - 需要 `VERIFICATION.md`

复杂需求时可以额外展开：
- worktree 隔离
- `STATE.md` 状态恢复
- 多 Wave 执行

`CHECK-2` 至少应说明：
- 变更摘要
- 测试结果
- 审查结论
- 决策合规性摘要
- 残留风险

如果无人确认但要继续进入 `/tech:commit`，同样记为 `soft gate bypassed`。

### 3. `/tech:commit`

这个阶段产出“可审阅的提交和 PR”。

主要步骤：
- 根据代码改动同步必要文档，包括 README / 部署说明、ReDoc / OpenAPI / 接口说明，以及必要的 API / 数据库文档
- 推进 `SPEC-STATE -> DONE`
- 生成规范化 commit message
- 一次性提交最终交付快照并推送
- 生成 PR 内容

正常情况下，不再为 `DONE` 单独补一个 meta commit。

## 审查顺序为什么固定

tinypowers 默认采用下面的顺序：

```text
compliance-reviewer（方案符合性 + 安全）
  -> code-reviewer（代码质量与工程风险）
  -> update-verification.js（把结论写回 VERIFICATION.md）
```

原因：
- 如果实现本身偏离方案，后续代码质量审查会失焦
- 如果存在安全问题，越早发现越能减少返工
- 如果审查结论不稳定写回 `VERIFICATION.md`，提交阶段就无法可靠判断能否收口

审查结论与推进规则：
- 任一审查出现 `BLOCK` 或 `FAIL`，不能推进到 `REVIEW`
- `WARNING` / `CONDITIONAL` 默认进入修复循环；若保留，必须写成残留风险
- 只有审查结果和验证结果都进入 `VERIFICATION.md` 后，才算完成 review 收口

## 状态文件怎么理解

- `SPEC-STATE.md`：回答“现在处于 PLAN / EXEC / REVIEW / DONE 的哪一阶段”
- `STATE.md`：回答“复杂执行时当前做到哪了”，不是每个需求都必须维护

`SPEC-STATE.md` 中的产物状态不再使用笼统的 `done`，而是：
- `pending`：文件不存在
- `scaffolded`：文件存在，但仍是模板态
- `filled`：内容已达到执行门禁所需粒度
- `verified`：验证产物已有明确结论
- `active`：当前生命周期状态文件
- `optional`：按需创建，不作为默认缺失

换句话说：
- `SPEC-STATE.md` 是门禁
- `STATE.md` 是复杂执行辅助

## worktree 与知识库

- worktree 能力保留在 `/tech:code`，用于隔离高风险或多任务需求
- `docs/knowledge.md` 是项目级知识库
- `notepads/learnings.md` 是 feature 级暂存区
- 只有出现 `[PERSIST]` 或满足明确复用条件时，才建议回写 `docs/knowledge.md`
- `/tech:init` 阶段则应优先把 README 与当前工程里的关键选型沉淀到 `docs/knowledge.md`

## 日常使用建议

### 开新需求

```text
1. /tech:feature
2. 准备 PRD.md
3. 确认技术方案
4. 确认任务拆解
5. /tech:code
6. /tech:commit
```

### 中断后继续

```text
1. 查看活跃 Feature 的 SPEC-STATE.md
2. 如果有 STATE.md，按 STATE.md 恢复复杂执行上下文
3. 按当前阶段继续 /tech:feature 或 /tech:code
```

## 交付清单

一个完整需求通常至少应包含：
- `features/{id}-{name}/SPEC-STATE.md`
- `features/{id}-{name}/PRD.md`
- `features/{id}-{name}/技术方案.md`
- `features/{id}-{name}/任务拆解表.md`
- `features/{id}-{name}/VERIFICATION.md`
- 代码实现
- 提交记录 / PR
- 最终交付 commit 中包含 `DONE` 状态的 `SPEC-STATE.md`

`medium / standard` 路径通常还应包含：
- `features/{id}-{name}/测试计划.md`
- `features/{id}-{name}/测试报告.md`

复杂需求可额外包含：
- `features/{id}-{name}/STATE.md`
- `features/{id}-{name}/notepads/learnings.md`

## 相关文档

- [development-spec.md](./development-spec.md)
- [prd-analysis-guide.md](./prd-analysis-guide.md)
- [test-plan.md](./test-plan.md)
- [tech-feature skill](../../skills/tech-feature/SKILL.md)
- [tech-code skill](../../skills/tech-code/SKILL.md)
- [tech-commit skill](../../skills/tech-commit/SKILL.md)
- [change-set-model.md](./change-set-model.md)
