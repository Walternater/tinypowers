# SPEC-STATE: {Feature ID}

> 最后更新: {date} | 当前阶段: {phase}

## 阶段定义

| 阶段 | 标记 | 产物 |
|------|------|------|
| planning | PLAN | 需求+方案+任务表已产出 |
| executing | EXEC | STATE.md 已创建，Wave 执行中 |
| reviewed | REVIEW | 审查通过、验证完成 |
| done | DONE | 已提交、已归档 |

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
| 技术方案 | 技术方案.md | pending |
| 任务拆解表 | 任务拆解表.md | pending |
| 生命周期状态 | SPEC-STATE.md | active |
| STATE | STATE.md | pending |
| 验证报告 | VERIFICATION.md | pending |

## 判断规则

阶段推进必须满足前置条件：

```
PLAN -> EXEC:   任务拆解表.md 存在且非空
EXEC -> REVIEW: STATE.md 标记所有 Wave DONE
REVIEW -> DONE: VERIFICATION.md 结论 = PASS
```

禁止跳步（`fast` 模式允许 PLAN→EXEC 直达）。任何阶段产物缺失，等于该阶段未完成。
