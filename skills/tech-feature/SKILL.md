---
name: tech:feature
description: 当用户开始新功能需求、需求模糊不完整、或需要先做技术方案和任务拆解时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "5.0"
  references:
    - "@superpowers/brainstorming"
---

# /tech:feature

## 作用

把模糊需求整理成"可执行的需求定义"。不写代码，只产出方案。

## 最终产物

```text
features/{需求编号}-{需求名称}/
├── CHANGESET.md
├── SPEC-STATE.md          # 生命周期状态（各阶段产物追踪）
├── PRD.md
├── 需求理解确认.md
├── 技术方案.md
├── 任务拆解表.md
├── 评审记录.md
├── notes/
├── todos/
├── seeds/
└── archive/
```

## Spec 状态机

```text
INIT → REQ → DESIGN → TASKS → EXEC → REVIEW → VERIFY → CLOSED
```

前置条件（禁止跳步）：
| 推进到 | 必须存在的产物 |
|--------|--------------|
| REQ | PRD.md 非空 |
| DESIGN | 需求理解确认.md 含"已确认" |
| TASKS | 技术方案.md 含已锁定决策 |
| EXEC | 任务拆解表.md 通过 plan-check |

## 主流程

```text
Phase 0: 准备 → 解析需求、扫描种子、创建目录（见 requirements-guide.md）
Phase 1: 需求理解 → 读 PRD、one-at-a-time 确认（见 requirements-guide.md）
Phase 2: 歧义检测 → 多方案对比、消除高优先级歧义（见 ambiguity-check.md）
Phase 3: 技术方案 → 设计、用户确认、决策锁定(D-0N)（见 tech-design-guide.md）
Phase 4: 任务拆解 → Epic/Story/Task、依赖拓扑（见 task-breakdown.md）
```

<HARD-GATE>
**执行门禁** - 以下条件必须全部满足才能流入 `/tech:code`：
1. 高优先级歧义已清零
2. 技术方案已通过 `ask_followup_question` 显式确认
3. 关键决策已锁定（D-0N 格式）
4. 任务拆解表通过 plan-check
5. SPEC-STATE.md phase 已推进到 TASKS
</HARD-GATE>

## 完成标准

- [ ] PRD.md 存在且可读
- [ ] 需求理解确认文档已确认
- [ ] 高优先级歧义已澄清或被显式记录
- [ ] 技术方案.md 已确认
- [ ] 关键决策已锁定
- [ ] 任务拆解表.md 已确认可执行

## 配套文档

`requirements-guide.md` | `ambiguity-check.md` | `tech-design-guide.md` | `task-breakdown.md` | `verification.md`

## 方法论来源

Phase 1-2 采用 `@superpowers/brainstorming`：探索上下文 → one-at-a-time 澄清 → 多方案对比 → section-by-section 确认 → spec self-review
