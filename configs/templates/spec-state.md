# SPEC-STATE: {Feature ID}

> 最后更新: {date} | 当前阶段: {phase}

## 阶段定义

| 阶段 | 标记 | 产物 |
|------|------|------|
| planned | PLAN | 规划产物已就位，可进入执行 |
| executing | EXEC | Wave 执行中 |
| reviewed | REVIEW | 审查和验证已完成 |
| done | DONE | 已提交、已归档 |

## 当前状态

```yaml
phase: PLAN
track: {{track}}
mode: {{mode}}
updated: {date}
plan_step: req   # req | tech-design | tasks | ready（仅 PLAN 阶段有效）
current_wave: 1 / 1   # 仅 EXEC 阶段有效
exec_progress: pending   # pending | in_progress | done（仅 EXEC 阶段有效）
blockers: 无   # 仅 EXEC 阶段有效
```

> `plan_step` 仅在 `phase: PLAN` 时有意义，追踪规划进度：
> - `req`：需求理解阶段（PRD 填写中）
> - `tech-design`：技术方案阶段
> - `tasks`：任务拆解阶段
> - `ready`：规划完成，可进入 EXEC
>
> `current_wave` / `exec_progress` / `blockers` 仅在 `phase: EXEC` 时有意义，
> 替代原 STATE.md 的执行进度追踪功能。

## 阶段历史

| 时间 | 从 | 到 | 备注 |
|------|-----|-----|------|
| {date} | - | PLAN | 需求目录创建 |

## 产物清单

| 产物 | 路径 | 状态 |
|------|------|------|
| PRD | PRD.md | pending |
| 技术方案 | 技术方案.md | pending |
| 任务拆解表 | 任务拆解表.md | pending |
| 生命周期状态 | SPEC-STATE.md | active |
| 验证报告 | VERIFICATION.md | pending |
| 测试计划 | 测试计划.md | pending |
| 测试报告 | 测试报告.md | pending |

## 判断规则

阶段推进必须满足前置条件：

```
PLAN -> EXEC:     PRD / 技术方案 / 任务拆解表满足当前路由门禁
EXEC -> REVIEW:   审查与验证证据齐备（Standard 路由还需测试报告）
REVIEW -> DONE:   代码已提交，VERIFICATION.md 结论 = PASS
```

`track: standard` 默认使用 `mode: strict`，按 `PLAN -> EXEC -> REVIEW -> DONE` 顺序推进。
`track: medium` 默认使用 `mode: relaxed`，允许跳过歧义检测和 brainstorming，PLAN 文档精简（~80 行技术方案），SPEC-STATE 允许 `PLAN -> EXEC` 直达。
`track: fast` 默认使用 `mode: relaxed`，允许更轻的 PLAN 文档，但进入 `EXEC` 后仍必须顺序推进。
