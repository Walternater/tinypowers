<<<<<<< HEAD
<<<<<<< HEAD
---
name: tech:feature
description: 当用户开始新功能需求、需求模糊不完整、或需要先做技术方案和任务拆解时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "8.3"
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
决策：{锁定条数} 条，主决策：{最关键的一条}
任务：{总数} 个，{是/否}已达执行粒度
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
=======
=======
---
name: tech:feature
description: 功能规划技能。引导需求分析，生成 PRD、技术方案和任务拆解文档。
triggers: ["/tech:feature"]
---

>>>>>>> 3dae26e (fix: 修复审查报告中的 P1 问题)
# /tech:feature

功能规划技能。引导需求分析，生成 PRD、技术方案和任务拆解文档。

---

## 触发条件

- 开始新功能开发
- 用户输入 `/tech:feature [功能简述]`
- 项目已完成初始化 (存在 CLAUDE.md)

---

## 执行流程

### Step 1: 输入处理

解析用户输入，提取：
- 功能名称
- 初始需求描述 (可选)

如果用户仅输入 `/tech:feature` 无描述，直接进入引导问答。

---

### Step 2: 引导问答

使用 `docs/internal/feature-questions.md` 中的问答列表，按顺序引导用户回答 8 个核心问题：

| 序号 | 问题 | 目的 |
|------|------|------|
| Q1 | 背景与动机 | 理解业务价值 |
| Q2 | 功能范围 | 明确功能边界 |
| Q3 | 排除范围 | 防止范围蔓延 |
| Q4 | 验收标准 | 定义完成标准 (EARS 格式) |
| Q5 | 技术约束 | 识别技术限制 |
| Q6 | 依赖关系 | 识别前置条件 |
| Q7 | 风险评估 | 提前规划应对 |
| Q8 | 时间预期 | 评估可行性 |

**问答规则**:
1. 按 Q1 → Q8 顺序提问，每个问题必须得到回答才能进入下一个
2. 如果回答不满足"期望回答格式"，AI 应追问补充信息
3. 所有问答内容将用于生成后续文档

---

### Step 3: Brainstorming (superpowers 委托)

将问答结果整理为结构化需求，委托 superpowers:brainstorming 进行方法论层面的思考：

**委托内容**:
- 功能背景和业务价值
- 范围边界 (包含/排除)
- 技术约束和风险

**期望返回**:
- 技术方案思路
- 关键决策建议
- 潜在问题提醒

---

### Step 4: Writing Plans (superpowers 委托)

基于 brainstorming 结果，委托 superpowers:writing-plans 生成技术方案：

**委托内容**:
- PRD 草稿 (背景、范围、验收标准)
- 技术方案初稿 (架构、数据模型、接口)
- 任务拆解初稿

**tinypowers 增强**:
- 确保决策使用 D-XXX 格式
- 确保任务使用 T-XXX 格式
- 确保任务数量 ≤8
- 确保验收标准使用 EARS 格式

---

### Step 5: 生成文档

基于委托返回结果，渲染以下模板：

#### 5.1 PRD.md

使用 `templates/PRD.md`，填充：
- `{{FEATURE_NAME}}` - 功能名称
- `{{BACKGROUND_DESCRIPTION}}` - Q1 回答内容
- `{{INCLUDED_ITEM_X}}` - Q2 回答内容
- `{{EXCLUDED_ITEM_X}}` - Q3 回答内容
- `{{AC_TITLE_X}}` / `{{AC_XXX}}` - Q4 回答的验收标准
- 约束条件 - Q5 回答内容

#### 5.2 spec.md

使用 `templates/spec.md`，填充：
- 目标 - 基于业务价值
- 核心设计 - 基于 brainstorming 输出
- 锁定决策表格 - 提取 Q5 约束和 Q7 风险应对为 D-XXX 格式
- 风险评估表格 - Q7 回答内容

#### 5.3 tasks.md

使用 `templates/tasks.md`，填充：
- 任务列表 - 基于 writing-plans 输出
- 确保任务 ID 格式为 T-XXX
- 确保任务数量 ≤8
- 确保依赖关系明确

---

### Step 6: CHECK-1 门禁

调用 `scripts/check-gate-1.sh` 验证文档完整性：

```bash
./scripts/check-gate-1.sh [项目路径]
```

**检查项**:
- [x] PRD.md 存在且非空
- [x] spec.md 存在且有至少 1 条锁定决策 (D-XXX 格式)
- [x] tasks.md 存在且任务数 ≤8 (T-XXX 格式)

**结果处理**:
- **PASS**: 继续下一步
- **FAIL**: 根据错误信息修正文档，重新检查

---

### Step 7: 用户确认

向用户展示生成结果摘要：

```
✅ 功能规划完成

功能: [功能名称]
范围: [简要描述包含/排除]
任务: [N] 个 (预计 [X] 人天)
决策: [M] 条锁定决策

生成文档:
  - PRD.md (需求文档)
  - spec.md (技术方案)
  - tasks.md (任务拆解)

CHECK-1: PASS

下一步:
  1. 查看并确认文档内容
  2. 使用 /tech:code 开始编码
```

等待用户确认或提出修改意见。

---

## 与 superpowers 的边界

| 能力 | 归属 | 说明 |
|------|------|------|
| 引导问答 | tinypowers | 独有的需求收集流程 |
| CHECK-1 门禁 | tinypowers | 独有的阶段检查 |
| Brainstorming | superpowers | 方法论层面的思考，委托执行 |
| Writing Plans | superpowers | 技术方案生成，委托执行 |
| 格式规范 | tinypowers | D-XXX/T-XXX/EARS 等格式约束 |

**核心原则**: tinypowers 管 WHAT (做什么、门禁是什么)，superpowers 管 HOW (怎么生成方案)。

---

## 输出产物

| 文件 | 路径 | 用途 |
|------|------|------|
| PRD.md | 项目根目录或 feature/ 目录 | 需求文档 |
| spec.md | 同目录 | 技术方案 |
| tasks.md | 同目录 | 任务拆解 |

---

## 状态流转

```
[INIT] → 引导问答 → Brainstorming → Writing Plans → 生成文档 → CHECK-1 → [PLAN]
                                              ↓
                                         [FAIL] → 修正 → 重新检查
```

---

## 错误处理

| 场景 | 处理策略 |
|------|----------|
| 用户回答不完整 | 追问补充，提供示例 |
| CHECK-1 失败 | 显示具体错误，指导修正 |
| 任务数 >8 | 提示用户拆分功能或合并任务 |
| 无锁定决策 | 提示用户明确技术约束 |

---

## 示例

### 完整流程示例

```
用户: /tech:feature 订单筛选功能

AI: 我将帮您规划"订单筛选功能"。接下来请回答几个问题：

Q1: 背景与动机
为什么要做这个功能？解决什么业务问题？

用户: 客服反馈查询订单效率低...

[... 问答继续 ...]

AI: 问答完成，正在进行技术方案 brainstorming...
[委托 superpowers:brainstorming]

AI: 正在生成技术方案...
[委托 superpowers:writing-plans]

AI: 正在生成文档...
- PRD.md ✅
- spec.md ✅
- tasks.md ✅

AI: 执行 CHECK-1 门禁检查...
[PASS] PRD.md 存在且非空
[PASS] spec.md 存在且有 3 条锁定决策
[PASS] tasks.md 存在且有 5 个任务 (≤8)

结论: PASS

✅ 功能规划完成！
[展示摘要]
```
>>>>>>> 8eee60a (feat(skills): create tech-init and tech-feature SKILL.md for Wave 3)
