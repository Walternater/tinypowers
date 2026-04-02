---
name: tech:feature
description: 当用户开始新功能需求、需求模糊不完整、或需要先做技术方案和任务拆解时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "7.1"
---

# /tech:feature

## 作用

把一个模糊需求整理成"可执行的计划态"。本 skill 负责复杂度分级、需求澄清、方案锁定和任务拆解，并把生命周期状态统一收口到 `PLAN`。

## 默认骨架

所有 track 都只预生成最小必需工件：

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

PLAN 阶段内部用 `plan_step` 字段追踪规划进度（见 SPEC-STATE.md）：

```text
req -> tech-design -> tasks -> ready
```

## 复杂度分级

Phase 0 必须先做分级，**选最匹配的一档**：

| Track | 典型特征 |
|-------|---------|
| `Fast` | 单模块单链路、无表结构变更、无安全敏感、1-2 个任务 |
| `Medium` | 单系统内、3-8 个任务、有 DB 变更但无跨系统依赖 |
| `Standard` | 跨系统/架构级变更、>5 个任务、需求仍有明显歧义 |

> `Complex`（跨团队、架构级、>2 周）暂按 `Standard` 走，额外增加人工评审。

**升级信号**（出现任意一条立即升级）：
- Fast → Medium：任务超过 2 个、发现跨模块依赖、技术方案需多方案权衡
- Medium → Standard：发现跨系统依赖、任务超过 8 个、需求存在高优先级歧义

## 主流程

```text
Phase 0: 准备（解析需求 + 分级 + 脚手架）

Fast Route:
  Phase 1F: 需求理解 + 最小方案
  Phase 2F: 最小任务拆解 + PLAN 收口
  ★ 人工确认：方案与任务确认后方可进入 /tech:code

Medium Route:
  Phase 1M: 需求理解（批量确认）
  Phase 2M: 精简技术方案 + 任务拆解
  Phase 3M: PLAN 收口
  ★ 人工确认：方案与任务确认后方可进入 /tech:code

Standard Route:
  Phase 1: 需求理解 + 歧义检测
  Phase 2: 技术方案 + 决策锁定
  Phase 3: 任务拆解 + PLAN 收口
  ★ 人工确认：方案与任务确认后方可进入 /tech:code
```

## Phase 0: 准备

1. 解析需求 ID、标题、目录名
2. 判断 `track: fast | medium | standard`，明确说明理由
3. 运行脚手架：

```bash
node "${TINYPOWERS_DIR}/scripts/scaffold-feature.js" --root . --id {id} --name {name} --track {fast|medium|standard}
```

4. 更新 `SPEC-STATE.md` 的 `plan_step: req`（scaffold 默认值，无需手动改）

## Fast Route

适用于小需求快路径，目标是把流程压到 2 个阶段，但仍保留计划质量。

### Phase 1F: 需求理解 + 最小方案

- 在 `PRD.md` 写清背景、范围、验收标准（至少 1 条 AC-N）
- 在 `技术方案.md` 补齐：
  - 参考实现锚点
  - 最小设计
  - 锁定决策（至少 1 条 D-01，状态=已确认）
- 更新 `plan_step: tech-design`

### Phase 2F: 最小任务拆解 + PLAN 收口

- 在 `任务拆解表.md` 中压缩为 1-2 个最小可执行任务
- 每个任务必须写清验收标准和涉及文件
- 更新 `plan_step: ready`，保持 `SPEC-STATE = PLAN`

**★ 关键确认点**：输出技术方案和任务拆解表后，**暂停等待用户确认**。用户确认后再执行 PLAN 收口。

## Medium Route

适用于中等复杂度需求，有 DB 变更但不涉及跨系统。跳过歧义检测和 brainstorming，批量确认需求后直接出精简方案。

### Phase 1M: 需求理解（批量确认）

- 在 `PRD.md` 写清背景、范围、验收标准（至少 2 条 AC-N）
- 用 `requirements-guide.md` 的批量确认方式一次性提出所有澄清问题
- 跳过歧义检测（`ambiguity-check.md`）和 `superpowers:brainstorming`
- 更新 `plan_step: req`

### Phase 2M: 精简技术方案 + 任务拆解

- 在 `技术方案.md` 使用 Medium 精简模板（~80 行），覆盖：
  - 目标与范围
  - 方案概要（模块、数据流转）
  - 数据设计 / 接口设计
  - 锁定决策（至少 1 条 D-0N）
  - 风险与回滚
- 在 `任务拆解表.md` 使用平铺任务表（不强制 Epic → Story → Task）
- 每个任务必须写清验收标准和涉及文件
- 更新 `plan_step: tech-design`

### Phase 3M: PLAN 收口

- 检查三个文档完整性和一致性
- 完成后保持 `SPEC-STATE = PLAN`
- Medium 路由的 `mode: relaxed` 允许 `PLAN → EXEC` 直达（无需额外的 plan-check 说明）

**★ 关键确认点**：输出技术方案和任务拆解表后，**暂停等待用户确认**。用户确认后再执行 PLAN 收口。

Medium 路径一旦出现这些信号，应升级为 `Standard`：
- 需求有跨系统依赖
- 技术方案需要多方案权衡
- 发现架构级变更

## Standard Route

### Phase 1: 需求理解 + 歧义检测

读取 `PRD.md`，用 `requirements-guide.md` 形成结构化理解：
- 背景和目标
- 用户与场景
- 功能范围
- 验收标准
- 非功能需求
- 更新 `plan_step: req`

用 `ambiguity-check.md` 识别高优先级歧义，必要时用 `superpowers:brainstorming` 探索 2-3 个可行方案。更新 `plan_step: tech-design`。

### Phase 2: 技术方案 + 决策锁定

`技术方案.md` 至少要覆盖：
- 目标与范围
- 核心设计
- 接口 / 数据 / 配置影响（仅有变更时填写）
- 风险与回滚
- 锁定决策（关键决策标记 `已确认`）

关键决策使用可选编号 D-0N（如 D-01, D-02...），按需记录，不强制分类。

更新 `plan_step: tech-design`。

### Phase 3: 任务拆解 + PLAN 收口

复杂需求可委托 `superpowers:writing-plans`，但输出必须满足：
- 层级清晰（Wave / Task）
- 每个 Task 可验证
- 依赖关系明确

更新 `plan_step: ready`，保持 `SPEC-STATE = PLAN`，进入 `/tech:code`。

**★ 关键确认点**：输出技术方案和任务拆解表后，**暂停等待用户确认**。用户确认后再执行 PLAN 收口。

## PLAN 阶段门禁

进入 `/tech:code` 前至少要满足（`plan_step = ready`）：
- `PRD.md` 存在且包含至少 1 条验收标准（`AC-N` 或 EARS 格式）
- `技术方案.md` 存在且包含至少 1 条状态为「已确认」的决策
- `任务拆解表.md` 存在且任务可执行
- `track` 已明确，且与文档体量匹配

这些条件对应 `update-spec-state.js` 进入 EXEC 的实质内容检测，不需要额外 `--note`。

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
- Standard Phase 1 → `superpowers:brainstorming`（按需）
- Standard Phase 3 → `superpowers:writing-plans`
- Medium 不委托 superpowers，直接用精简模板完成

## Gotchas

- 小需求套完整流程会导致大量空文档，应优先判定 `Fast`
- Medium 是大多数后端需求的最适路由——有 DB 变更但没到架构级，不要过度升级到 Standard
- 决策不锁定，`/tech:code` 很容易边写边改方向
- 任务只有"功能正常"这类模糊验收标准，后续验证一定会失焦
- Medium 跳过 brainstorming 不等于跳过思考——方案概要和锁定决策仍然必须写
- `技术方案.md` 的"可选段"（上线准备、灰度策略、评审记录）默认不填，有需要再追加
