---
name: tech:feature
description: 当用户开始新功能需求、需求模糊不完整、或需要先做技术方案和任务拆解时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "6.0"
---

# /tech:feature

## 作用

把一个模糊需求整理成“可执行的计划态”。本 skill 负责复杂度分级、需求澄清、方案锁定和任务拆解，并把生命周期状态统一收口到 `PLAN`。

## 默认骨架

Standard / Fast 都只预生成最小必需工件：

```text
features/{需求编号}-{需求名称}/
├── SPEC-STATE.md
├── PRD.md
├── 技术方案.md
├── 任务拆解表.md
└── notepads/
    └── learnings.md
```

按需创建而不预生成：
- `CHANGESET.md`
- `评审记录.md`
- `seeds/`
- `archive/`

## 生命周期状态

`SPEC-STATE.md` 使用 4 态状态机：

```text
PLAN -> EXEC -> REVIEW -> DONE
```

- `/tech:feature` 结束时，Feature 应停留在 `PLAN`
- `/tech:code` 进入执行时推进到 `EXEC`
- `/tech:code` 完成审查和验证后推进到 `REVIEW`
- `/tech:commit` 提交完成后推进到 `DONE`

## 复杂度分级

Phase 0 必须先做分级：

- `Fast`：单模块或单链路、无表结构变更、无安全敏感、预计 1-2 个任务可完成
- `Standard`：超出以上任意一条，或需求仍存在明显歧义
- `Complex`：跨系统、架构级变更、预计超过 2 周

当前 skill 实际支持：
- `Fast`
- `Standard`

`Complex` 暂按 `Standard` 走，但应额外增加人工评审。

## 主流程

```text
Phase 0: 准备（解析需求 + 分级 + 脚手架）

Fast Route:
  Phase 1F: 需求理解 + 最小方案
  Phase 2F: 最小任务拆解 + PLAN 收口

Standard Route:
  Phase 1: 需求理解
  Phase 2: 歧义检测 + 方案探索
  Phase 3: 技术方案 + 决策锁定
  Phase 4: 任务拆解 + PLAN 收口
```

## Phase 0: 准备

1. 解析需求 ID、标题、目录名
2. 判断 `track: fast | standard`
3. 运行脚手架：

```bash
node "${TINYPOWERS_DIR}/scripts/scaffold-feature.js" --root . --id {id} --name {name} --track {fast|standard}
```

4. 明确输出：
- 为什么选择这个 track
- 当前需求是否需要额外 worktree（默认不需要）
- 哪些文档是按需补，不预生成

## Fast Route

适用于小需求快路径，目标是把流程压到 2 个阶段，但仍保留计划质量。

### Phase 1F: 需求理解 + 最小方案

- 在 `PRD.md` 写清背景、范围、验收标准
- 用 `requirements-guide.md` 的问题框架快速确认：
  - 为什么做
  - 谁使用
  - In Scope / Out of Scope
  - 验收标准
- 在 `技术方案.md` 补齐：
  - 参考实现锚点
  - 最小设计
  - 锁定决策（至少 1 条 D-0N）

### Phase 2F: 最小任务拆解 + PLAN 收口

- 在 `任务拆解表.md` 中压缩为 1-2 个最小可执行任务
- 每个任务必须写清：
  - 验收标准
  - 涉及文件/模块
  - 验证方式
- 明确是否允许并行
- 完成后保持 `SPEC-STATE = PLAN`

Fast 路径一旦出现这些信号，应立即升级为 `Standard`：
- 需求仍有高优先级歧义
- 技术方案需要权衡多个方案
- 任务超过 2 个
- 发现跨模块或跨系统依赖

## Standard Route

### Phase 1: 需求理解

读取 `PRD.md`，用 `requirements-guide.md` 形成结构化理解：
- 背景和目标
- 用户与场景
- 功能范围
- 验收标准
- 非功能需求

### Phase 2: 歧义检测 + 方案探索

遵循 `ambiguity-check.md`，先识别高优先级歧义，再用 `superpowers:brainstorming` 探索 2-3 个可行方案。

### Phase 3: 技术方案 + 决策锁定

`技术方案.md` 至少要覆盖：
- 目标与范围
- 核心流程
- 接口 / 数据 / 配置影响
- 风险与回滚
- 锁定决策

关键决策应记录为稳定 ID：
- D-01 架构 / 框架选型
- D-02 数据结构 / 表结构
- D-03 对外接口契约
- D-04 中间件或依赖选型
- D-05 特殊安全方案

### Phase 4: 任务拆解 + PLAN 收口

复杂需求可委托 `superpowers:writing-plans`，但输出必须满足：
- 层级清晰（Epic / Story / Task）
- 每个 Task 可验证
- 每个 Task 粒度可执行
- 依赖关系明确

完成后保持 `SPEC-STATE = PLAN`，进入 `/tech:code`。

## PLAN 阶段门禁

进入 `/tech:code` 前至少要满足：
- `PRD.md` 存在且非空
- `技术方案.md` 存在且包含锁定决策
- `任务拆解表.md` 存在且任务可执行
- `track` 已明确，且与文档体量匹配

## 完成标准

- 需求已被清晰表述
- 方案已被锁定到可执行粒度
- 任务顺序和验收方式明确
- 他人接手时能直接进入 `/tech:code`

## 配套文档

| 文档 | 作用 |
|------|------|
| `requirements-guide.md` | 需求理解引导 |
| `ambiguity-check.md` | 歧义检测规则 |

**委托 superpowers**:
- Standard Phase 2 → `superpowers:brainstorming`
- Standard Phase 4 → `superpowers:writing-plans`

## Gotchas

- 小需求套完整流程会导致大量空文档，应优先判定 `Fast`
- 决策不锁定，`/tech:code` 很容易边写边改方向
- 任务只有“功能正常”这类模糊验收标准，后续验证一定会失焦
