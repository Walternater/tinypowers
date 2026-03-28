---
name: tech:note
description: 零摩擦想法捕获。支持 note（即时记录）、todo（可执行任务）、seed（远期触发）三种粒度。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "1.0"
---

# /tech:note

## 功能

三层递进式想法捕获，借鉴 GSD 的 note → todo → seed 梯度设计。

| 命令 | 粒度 | 触发 | 存储 |
|------|------|------|------|
| `/tech:note` | 轻量便签 | 随时 | `features/{id}/notes/` |
| `/tech:note todo` | 可执行任务 | 随时 | `features/{id}/todos/` |
| `/tech:note seed` | 远期种子 | 新 Feature 时 | `features/{id}/seeds/` |

---

## 执行步骤

### 1. 确定当前 Feature

```
扫描 features/*/STATE.md：
  IF 只有一个活跃 Feature THEN
    自动选择该 Feature
  ELIF 有多个活跃 Feature THEN
    列出列表，询问用户选择
  ELSE
    询问用户：输入 Feature ID 或创建新的
  END
```

### 2. 路由到对应模式

根据用户输入的参数路由：

| 输入 | 路由到 |
|------|--------|
| 无参数 / `note` | Step 3: 便签模式 |
| `todo` | Step 4: 待办模式 |
| `seed` | Step 5: 种子模式 |
| `list` | Step 6: 列表模式 |

---

### Step 3: 便签模式（Note）

零摩擦记录。不提问，直接保存。

**输入**：用户消息中 `note` 之后的所有内容作为便签正文。

```
创建文件：features/{id}/notes/{date}-{HHmm}.md

内容：
---
type: note
created: {datetime}
feature: {id}
---

{用户输入的便签内容}
```

**示例**：
```
用户：/tech:note 订单超时取消应该用延迟队列而不是定时轮询

结果：创建 features/CSS-123/notes/2026-03-28-1430.md
```

---

### Step 4: 待办模式（Todo）

结构化待办。自动推断领域和优先级。

**输入**：用户消息中 `todo` 之后的所有内容作为待办描述。

```
1. 从描述中推断 area（api/database/ui/performance/security/other）
2. 检查是否与现有 todo 重复（标题相似度 > 80%）
3. 如果重复，提示用户而非重复创建

创建文件：features/{id}/todos/{NNN}-{slug}.md

内容：
---
type: todo
id: TODO-{NNN}
status: pending
created: {datetime}
feature: {id}
area: {推断的领域}
priority: {high/medium/low}
---

## 任务描述

{用户输入的待办描述}

## 验收标准

{自动从描述中提取，如果无法提取则留空让用户补充}

## 关联

- 相关文件: {从描述中推断}
- 相关决策: {从 STATE.md 决策表推断}
```

**更新 STATE.md**：在「偏差」或单独的「待办」章节中追加 TODO 引用。

---

### Step 5: 种子模式（Seed）

面向未来的想法。需要交互收集触发条件。

**交互流程**：

```
1. 收集种子的核心描述（用户输入中 seed 之后的内容）
2. 询问：「这个想法应该在什么条件下被提醒？」
   示例答案：当开始做支付相关功能时 / 当用户提到性能优化时
3. 询问：「预期工作量？」
   选项：Small（<1天）/ Medium（1-3天）/ Large（>3天）
4. 自动搜索代码库，找到与种子相关的文件和决策（面包屑）
```

**创建文件**：`features/{id}/seeds/SEED-{NNN}-{slug}.md`

```markdown
---
type: seed
id: SEED-{NNN}
status: dormant
created: {datetime}
feature: {id}
trigger_when: {触发条件描述}
scope: {Small/Medium/Large}
---

## 为什么重要

{用户描述的种子内容}

## 触发条件

{结构化的触发条件列表，如：}
- 新 Feature 涉及支付模块
- 用户提到"订单超时"
- 技术方案讨论到消息队列选型

## 工作量估计

{scope} — {简要说明}

## 面包屑

{自动发现的关联文件和决策：}
- `src/main/java/com/xxx/OrderService.java` — 订单核心逻辑
- D-03 决策：使用 Redis 做缓存（可能受影响）
```

**触发机制**：当用户执行 `/tech:feature` 开始新需求分析时，系统扫描所有 `features/*/seeds/` 下的 dormant 种子，将 trigger_when 条件与新需求描述进行匹配，匹配到的种子自动呈现给用户。

---

### Step 6: 列表模式（List）

查看和操作已记录的内容。

```
列出 features/{id}/ 下的所有 note/todo/seed：

| 类型 | ID | 创建时间 | 状态 | 摘要 |
|------|----|----------|------|------|
| note | - | 03-28 14:30 | - | 订单超时应该用延迟队列 |
| todo | TODO-003 | 03-27 10:00 | pending | 补充订单状态流转测试 |
| seed | SEED-001 | 03-26 16:00 | dormant | 支付模块重构（触发：支付相关Feature） |

操作选项：
  promote {id} — 将 note 升级为 todo
  done {id}    — 标记 todo 为完成
  trigger {id} — 手动激活种子
  delete {id}  — 删除记录
```

---

## 种子触发集成

`/tech:feature` 在 Phase 1（需求分析）开始前自动执行种子扫描：

```
扫描 features/*/seeds/*.md：
  FOR each seed WHERE status == dormant:
    比较 seed.trigger_when 与新需求描述
    IF 匹配 THEN
      输出："💡 发现相关种子：SEED-{NNN}: {简述}"
      询问用户是否纳入本次需求
      IF 纳入 THEN
        seed.status → triggered
        种子内容合并到需求分析中
      END
    END
  END
```

---

## 文件结构

```
features/{id}/
├── notes/          # 便签（轻量）
│   ├── 2026-03-28-1430.md
│   └── 2026-03-28-1600.md
├── todos/          # 待办（中等）
│   ├── TODO-001-add-index.md
│   └── TODO-002-refactor-order.md
├── seeds/          # 种子（远期）
│   └── SEED-001-payment-refactor.md
├── STATE.md
└── ...
```

---

## 参考文档

- GSD `plant-seed` — 种子触发机制
- GSD `note`/`add-todo` — 三层递进式捕获
