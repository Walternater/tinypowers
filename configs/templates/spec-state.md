# SPEC-STATE: {Feature ID}

> 最后更新: {date} | 当前阶段: {phase}

## 阶段定义

| 阶段 | 标记 | 含义 | 产物 |
|------|------|------|------|
| planning | PLAN | 规划中 | PRD.md、技术方案.md、任务拆解表.md |
| executing | EXEC | 执行中 | STATE.md 已创建、Wave 执行中 |
| reviewing | REVIEW | 审查中 | 审查全部通过 |
| done | DONE | 已完成 | VERIFICATION.md 结论 = PASS |

## 当前状态

```yaml
phase: PLAN
mode: strict
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
| 需求理解确认 | 需求理解确认.md | pending |
| 技术方案 | 技术方案.md | pending |
| 任务拆解表 | 任务拆解表.md | pending |
| 生命周期状态 | SPEC-STATE.md | active |
| STATE | STATE.md | pending |
| 验证报告 | VERIFICATION.md | pending |

## 判断规则

阶段推进必须满足前置条件：

```
→ PLAN:     目录已创建、PRD 已就位
PLAN → EXEC: 技术方案 + 任务拆解表已确认
EXEC → REVIEW: 代码实现完成、测试通过
REVIEW → DONE: VERIFICATION.md 结论 = PASS
```

禁止跳步。任何阶段产物缺失，等于该阶段未完成。
