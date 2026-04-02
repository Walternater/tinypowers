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
├── VERIFICATION.md
├── STATE.md                  # 可选，仅复杂执行时
└── notepads/
    └── learnings.md          # 可选，用于知识沉淀
```

说明：
- `SPEC-STATE.md` 负责粗粒度生命周期状态
- `技术方案.md` 是方案与关键决策的主文档
- `任务拆解表.md` 是执行入口
- `STATE.md` 仅在多任务、多 Wave、跨会话或 worktree 协作时维护
- `notepads/learnings.md` 与 `docs/knowledge.md` 组成知识沉淀链路，但不阻塞主流程

## 全流程总览

```text
PRD
  ↓
/tech:feature
  -> 需求理解
  -> 技术方案
  -> 任务拆解
  -> 确认后进入 /tech:code
  ↓
/tech:code
  -> 开发执行
  -> 审查修复（可迭代）
  -> 测试与验证
  ↓
/tech:commit
  -> 文档同步
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
- 确认任务已达到可执行粒度

硬门禁：
- 技术方案未经确认，不能进入编码
- 任务拆解不清晰，不能进入 `/tech:code`

### 2. `/tech:code`

这个阶段产出“经过审查、测试和验证的实现”。

默认顺序：

1. Gate Check
2. 开发执行
3. 审查修复
4. 测试与验证

复杂需求时可以额外展开：
- worktree 隔离
- `STATE.md` 状态恢复
- 多 Wave 执行

### 3. `/tech:commit`

这个阶段产出“可审阅的提交和 PR”。

主要步骤：
- 根据代码改动同步必要文档
- 生成规范化 commit message
- 执行提交和推送
- 生成 PR 内容

## 审查顺序为什么固定

tinypowers 默认采用下面的顺序：

```text
compliance-reviewer（方案符合性 + 安全） -> 代码质量
```

原因：
- 如果实现本身偏离方案，后续代码质量审查会失焦
- 如果存在安全问题，越早发现越能减少返工

## 状态文件怎么理解

- `SPEC-STATE.md`：回答“现在处于 PLAN / EXEC / REVIEW / DONE 的哪一阶段”
- `STATE.md`：回答“复杂执行时当前做到哪了”，不是每个需求都必须维护

换句话说：
- `SPEC-STATE.md` 是门禁
- `STATE.md` 是复杂执行辅助

## worktree 与知识库

- worktree 能力保留在 `/tech:code`，用于隔离高风险或多任务需求
- `docs/knowledge.md` 是项目级知识库
- `notepads/learnings.md` 是 feature 级暂存区，只有有价值的经验才回写知识库

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
- `features/{id}-{name}/技术方案.md`
- `features/{id}-{name}/任务拆解表.md`
- `features/{id}-{name}/VERIFICATION.md`
- 代码实现
- 提交记录 / PR

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
