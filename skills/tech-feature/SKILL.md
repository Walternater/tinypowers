---
name: tech:feature
description: 当用户开始新功能需求、需求模糊不完整、或需要先做技术方案和任务拆解时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "8.2"
---

# /tech:feature

## 作用

把一个模糊需求整理成可直接进入开发的规划包：
- 需求理解
- 技术方案
- 任务拆解

这个阶段的重点是把"要做什么、怎么做、怎么验收"说清楚，而不是引入额外的流程概念。

## 默认骨架

```text
features/{需求编号}-{需求名称}/
├── SPEC-STATE.md
├── PRD.md
├── 技术方案.md
└── 任务拆解表.md
```

说明：
- `SPEC-STATE.md` 只记录粗粒度生命周期：`PLAN -> EXEC -> REVIEW -> DONE`
- `notepads/learnings.md` 不在默认 scaffold 中创建；只有后续确实有沉淀价值时才按需补充
- `STATE.md` 不在本阶段创建；仅复杂执行时由 `/tech:code` 按需生成

## 路由选择

### Fast

适用于：
- 单模块或单链路
- 1-2 个任务可完成
- 无明显跨系统依赖

### Medium

适用于：
- 单系统内需求
- 3-8 个任务
- 可有 DB 变更，但无跨系统依赖

### Standard

适用于：
- 跨系统、架构级或多模块改动
- 需求仍存在关键歧义
- 预计需要更完整隔离和审查

升级信号：
- Fast → Medium：任务超过 2 个，或发现明显跨模块依赖
- Medium → Standard：发现跨系统依赖、架构级变更、关键歧义

## 对外流程

```text
1. 需求理解
2. 技术方案
3. 任务拆解
4. CHECK-1（feature -> code）
5. 进入 /tech:code
```

### 1. 需求理解

基于 `PRD.md` 形成结构化理解：
- 背景和目标
- 用户与场景
- 范围边界
- 验收标准
- 非功能约束

默认采用批量确认：
- 一次性提出核心澄清问题
- 用户回答后只追问缺失项
- 避免 one-by-one 的低效往返

### 2. 技术方案

**编写方案前，先做现有模式采样**（避免设计脱离项目现实）：

```
现有模式采样清单（涉及哪项就采样哪项）
---------------------------------------
□ 有新接口  → 采样 1-2 个同域 Controller，确认路由前缀风格
□ 有枚举/常量引用 → 读一遍对应枚举类，确认已有值和命名约定
□ 有 Service 方法  → 采样相似 Service，确认事务注解、数据源切换等约定
□ 有 DB 变更  → 采样现有 Mapper XML，确认 namespace、resultMap 风格
```

采样结论直接用于方案设计，不单独写文档。

`技术方案.md` 至少需要覆盖：
- 目标与范围
- 核心设计
- 接口 / 数据 / 配置影响（有变更时填写）
- 上线计划（涉及发布、迁移、灰度、兼容性切换时必须填写）
- 风险与回滚
- 至少 1 条已确认的关键决策

要求：
- Fast 使用最小方案模板
- Medium 使用精简模板
- Standard 可以做更完整的方案探索

### 3. 任务拆解

`任务拆解表.md` 必须满足：
- 每个任务可执行
- 每个任务有验收标准
- 每个任务有涉及文件/模块
- 依赖关系清楚

Fast / Medium 不强制写成复杂层级。
Standard 需要显式表达依赖和建议顺序。

### 4. CHECK-1（feature -> code）

进入 `/tech:code` 前，按以下固定格式输出 checkpoint 摘要：

```
--- CHECK-1 ---
需求：{需求编号} {需求名称}
路由：{Fast / Medium / Standard}
决策：{N} 条锁定决策，主决策：{最关键的一条}
任务：{N} 个，{是/否}已达执行粒度
风险：{主要风险，无则填"无"}
未决：{未解决的边界问题，无则填"无"}
门禁：{人工确认 / soft gate bypassed}
---------------
```

语义：
- 有人工确认：按确认结果继续进入 `/tech:code`
- 无人工确认但需要自驱继续：`门禁` 填 `soft gate bypassed`
- `soft gate bypassed` 只是"继续执行的记录"，不是 `approved`

## 内部执行说明

以下能力可以保留，但不应成为主流程负担：
- Standard 需求可用 `superpowers:brainstorming` 做方案探索
- Standard 需求可用 `superpowers:writing-plans` 辅助拆任务
- `track` 是执行路由选择，不是额外的用户确认回合
- `SPEC-STATE.md` 用于门禁和阶段推进，不替代方案/任务本身

## 进入 `/tech:code` 的门禁

至少满足：
- `PRD.md` 非空，且包含验收标准
- `技术方案.md` 存在，且有至少 1 条已确认决策
- `任务拆解表.md` 存在，且任务具备执行粒度
- 已输出 `CHECK-1`
- 若无人确认继续执行，必须显式标注 `soft gate bypassed`

## 完成标准

- 需求已经说清楚
- 方案已经锁定到可执行粒度
- 任务拆解能直接指导开发
- 其他人接手时可以直接进入 `/tech:code`

## 配套文档

| 文档 | 作用 |
|------|------|
| `requirements-guide.md` | 需求理解引导 |
| `ambiguity-check.md` | 识别关键歧义 |

**委托 superpowers**:
- Standard 方案探索 → `superpowers:brainstorming`
- Standard 复杂任务拆解 → `superpowers:writing-plans`

## Gotchas

- 不要为了"显得完整"而补充没有决策价值的文档
- 决策只锁关键项，不要把显而易见的库选择写成流程负担
- 任务的验收标准不能只有"功能正常"这类空描述
- `SPEC-STATE.md` 是辅助门禁，不是 feature 阶段的主产物
