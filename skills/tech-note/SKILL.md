---
name: tech:note
description: 当用户要求快速记录想法、添加待办事项、或捕获远期种子想法时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "1.0"
---

# /tech:note

## 作用

`/tech:note` 用来把执行中产生的零碎想法快速落到仓库里，避免它们只停留在上下文中然后丢失。

它支持三种粒度：
- `note`：即时想法
- `todo`：可执行任务
- `seed`：暂时不做，但未来可能被触发的方向

## 存储约定

默认落在当前 Feature 目录下：

```text
features/{id}/
├── notes/
├── todos/
└── seeds/
```

## 主流程

```text
确定当前 Feature
  -> 判断模式
  -> 写入对应记录
  -> 必要时更新 STATE.md 引用
```

## 1. 确定当前 Feature

优先根据活跃的 `features/*/STATE.md` 判断当前工作上下文。

处理原则：
- 只有一个活跃 Feature：自动使用
- 有多个活跃 Feature：让用户确认
- 没有活跃 Feature：让用户指定 Feature，或提醒先开始需求流程

## 2. 模式说明

| 输入 | 用途 | 输出位置 |
|------|------|----------|
| `/tech:note` 或 `note` | 记录即时想法 | `features/{id}/notes/` |
| `/tech:note todo` | 记录可执行待办 | `features/{id}/todos/` |
| `/tech:note seed` | 记录未来可能触发的方向 | `features/{id}/seeds/` |
| `/tech:note list` | 查看已有记录 | 仅读取，不写文件 |

## 3. Note 模式

适合“先记下来再说”的内容，不要求结构完整。

写入建议：
- 文件名使用时间戳
- 正文直接保留用户原始表达
- 不强制补充复杂字段

最小格式示例：

```markdown
---
type: note
created: {datetime}
feature: {id}
---

{原始想法}
```

## 4. Todo 模式

适合已经能转成执行动作的事项。

建议包含：
- 简短描述
- 当前状态
- 大致领域或影响范围
- 验收标准或完成条件

如果能判断出和当前 `STATE.md` 中的决策或偏差有关，建议把引用一起补上。

## 5. Seed 模式

适合“现在不做，但将来在某些条件下应该被提醒”的内容。

除了正文外，最好补两个信息：
- 触发条件
- 预估规模

最小结构示例：

```markdown
---
type: seed
id: SEED-{NNN}
status: dormant
created: {datetime}
feature: {id}
trigger_when: {条件}
scope: {Small/Medium/Large}
---

## 为什么值得保留

{想法正文}
```

## 6. List 模式

用于快速查看当前 Feature 下已有的 `note`、`todo` 和 `seed`。

推荐至少展示：
- 类型
- ID 或时间
- 状态
- 摘要

如果后续要做升级操作，也应基于这里的结果，例如：
- 把 note 提升为 todo
- 把 dormant seed 手动激活
- 把 todo 标记为完成

## 与 STATE.md 的关系

`/tech:note` 不替代 `STATE.md`。

分工应保持：
- `STATE.md` 记录执行主线状态
- `note/todo/seed` 记录补充性信息和未来线索

当某条 todo、seed 已经影响主线推进时，应在 `STATE.md` 中留下引用或摘要。

## 判断标准

一条合格的记录，应该让未来的新会话也能理解：
- 这条内容属于哪个 Feature
- 它只是想法、待办还是未来方向
- 现在需不需要处理
- 什么时候再回来看它

## Gotchas

> 已知失败模式，从实际使用中发现，有机增长。

- **记录后不引用**：在 note 中写了 ideas 但在 `/tech:code` 中从不看 → seed 永远不会被激活：seed 只在 `/tech:feature` Phase 0 被扫描，必须在那个时机引用才能生效
- **把 note 当 todo 用**：把"我要做 X"记在 note 里而不是 todo → 没有验收标准无法关闭：没有清晰完成标准的应该记在 todo 而不是 note
- **seed 堆积不看**：seeds 目录下有 20+ 个未处理的种子 → 积累过多失去价值：seed 只保留活跃相关的，超过 10 个应定期清理或合并
