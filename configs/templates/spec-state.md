# SPEC-STATE: {Feature ID}

> 最后更新: {date} | 当前阶段: {phase}

## 阶段定义

| 阶段 | 标记 | 产物 |
|------|------|------|
| planned | PLAN | 规划产物已就位，可进入执行 |
| executing | EXEC | 已进入执行；复杂需求可维护 `STATE.md` |
| reviewed | REVIEW | 审查和验证已完成 |
| done | DONE | 已提交、已归档 |

## 当前状态

```yaml
phase: PLAN
track: {{track}}
updated: {date}
```

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
| 测试计划 | 测试计划.md | pending |
| 测试报告 | 测试报告.md | pending |
| 生命周期状态 | SPEC-STATE.md | active |
| STATE（复杂执行可选） | STATE.md | optional |
| 验证报告 | VERIFICATION.md | pending |

## 判断规则

阶段推进必须满足前置条件：

```
PLAN -> EXEC:     PRD / 技术方案 / 任务拆解表满足当前路由门禁
EXEC -> REVIEW:   审查、测试与验证证据齐备；如存在 STATE.md，则状态已收敛
REVIEW -> DONE:   代码已提交，VERIFICATION.md 结论 = PASS
```

`track` 用于选择执行路由：
- `standard`：复杂需求，允许 worktree / 多 Wave / 更完整审查
- `medium`：中等需求，文档和执行都保持精简
- `fast`：小需求快路径，默认不维护额外执行状态文件
