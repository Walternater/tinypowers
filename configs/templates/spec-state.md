# SPEC-STATE: {Feature ID}

> 最后更新: {date} | 当前阶段: {phase}

## 阶段

| 阶段 | 说明 |
|------|------|
| PLAN | 规划完成，待执行 |
| EXEC | 执行中 |
| REVIEW | 审查验证中 |
| DONE | 已完成 |

## 当前状态

```yaml
phase: {phase}
track: {track}
mode: {mode}
updated: {date}
```

## 产物

| 产物 | 状态 |
|------|------|
| SPEC.md | pending |
| STATE.md | pending |
| VERIFICATION.md | pending |

## 阶段历史

| 时间 | 从 | 到 | 变更 |
|------|-----|-----|------|
| {date} | - | {phase} | 初始化 |

## 门禁规则

```
PLAN -> EXEC:     SPEC.md 存在且任务列表非空
EXEC -> REVIEW:   STATE.md 任务全部 DONE，构建通过
REVIEW -> DONE:   VERIFICATION.md 结论为 PASS
```
