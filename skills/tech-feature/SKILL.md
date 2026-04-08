---
name: tech:feature
description: 当用户开始新功能需求、需求模糊不完整、或需要先做技术方案和任务拆解时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "9.0"
---

# /tech:feature

## 作用

把一个模糊需求整理成可直接进入开发的规划包：
- 需求理解
- 方案设计
- 任务拆解

这个阶段的重点是把"要做什么、怎么做、怎么验收"说清楚，**而不是**引入额外的流程概念。

## 默认骨架（简化版）

\`\`\`text
features/{需求编号}-{需求名称}/
├── 方案.md          # 合并：PRD + 技术方案 + 任务拆解
└── VERIFICATION.md  # 验证证据（tech:code 阶段生成）
\`\`\`

说明：
- \`方案.md\` 用 YAML frontmatter 记录状态（\`status: PLAN|EXEC|REVIEW|DONE\`）
- \`notepads/learnings.md\` 不在默认 scaffold 中创建；只有后续确实有沉淀价值时才按需补充
- **不再创建** \`SPEC-STATE.md\`、\`STATE.md\`，状态内联到方案.md

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

\`\`\`text
1. 需求理解
2. 方案设计（技术方案 + 任务拆解）
3. CHECK-1（feature -> code）
4. 进入 /tech:code
\`\`\`

### 1. 需求理解

基于 \`方案.md\` 第 1 节形成结构化理解：
- 背景和目标
- 用户与场景
- 范围边界
- 验收标准

默认采用批量确认：
- 一次性提出核心澄清问题
- 用户回答后只追问缺失项
- 避免 one-by-one 的低效往返

### 2. 方案设计

\`方案.md\` 至少需要覆盖：

**第 1 节 - 需求与目标**：
- 背景与问题
- 目标用户与场景
- 范围边界（In Scope / Out of Scope）

**第 2 节 - 核心设计**：
- 整体思路
- 关键决策（至少 1 条已确认）
- 接口/数据/配置影响（有变更时填写）

**第 3 节 - 任务拆解**：
- 每个任务可执行
- 每个任务有验收标准
- 依赖关系清楚

**第 5 节 - 风险与回滚**：
- 主要风险
- 回滚方式

要求：
- Fast 可删减非必要章节
- Medium 使用标准模板
- Standard 可以做更完整的方案探索

### 3. CHECK-1（feature -> code）

进入 \`/tech:code\` 前，输出一个显式 checkpoint 摘要：

- 需求摘要
- 关键决策数量与主决策
- 任务数量 / 当前拆解是否已达执行粒度
- 主要风险与未决边界

语义：
- 有人工确认：按确认结果继续进入 \`/tech:code\`
- 无人工确认但需要自驱继续：明确记录为 \`soft gate bypassed\`

## 进入 \`/tech:code\` 的门禁

至少满足：
- \`方案.md\` 非空，且包含验收标准
- \`方案.md\` 第 2 节有至少 1 条已确认决策
- \`方案.md\` 第 3 节任务具备执行粒度
- 已输出 \`CHECK-1\`
- 若无人确认继续执行，必须显式标注 \`soft gate bypassed\`

## 完成标准

- 需求已经说清楚
- 方案已经锁定到可执行粒度
- 任务拆解能直接指导开发
- 其他人接手时可以直接进入 \`/tech:code\`

## 配套文档

| 文档 | 作用 |
|------|------|
| \`requirements-guide.md\` | 需求理解引导 |
| \`ambiguity-check.md\` | 识别关键歧义 |

**委托 superpowers**:
- Standard 方案探索 → \`superpowers:brainstorming\`
- Standard 复杂任务拆解 → \`superpowers:writing-plans\`

## Gotchas

- 不要为了"显得完整"而补充没有决策价值的文档
- 决策只锁关键项，不要把显而易见的库选择写成流程负担
- 任务的验收标准不能只有"功能正常"这类空描述
- **状态记录在方案.md 的 YAML frontmatter 中**，不单独维护 SPEC-STATE
- Fast 路径可以进一步删减章节，保持轻量
