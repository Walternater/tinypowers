# SPEC-STATE: {Feature ID}

> 最后更新: {date} | 当前阶段: {phase}

## 阶段定义

| 阶段 | 标记 | 产物 |
|------|------|------|
| initialized | INIT | 目录已创建、PRD 已就位 |
| requirements-done | REQ | 需求理解确认.md 已产出、歧义已澄清 |
| design-approved | DESIGN | 技术方案.md 已确认、决策已锁定 |
| tasks-approved | TASKS | 任务拆解表.md 已确认 |
| executing | EXEC | STATE.md 已创建、Wave 执行中 |
| reviewed | REVIEW | 审查全部通过 |
| verified | VERIFY | VERIFICATION.md 已产出 |
| closed | CLOSED | 已提交、已归档 |

## 当前状态

```yaml
phase: INIT
mode: strict
updated: {date}
```

## 阶段历史

| 时间 | 从 | 到 | 备注 |
|------|-----|-----|------|
| {date} | - | INIT | 需求目录创建 |

## 产物清单

| 产物 | 路径 | 状态 |
|------|------|------|
| CHANGESET | CHANGESET.md | done |
| PRD | PRD.md | pending |
| 需求理解确认 | 需求理解确认.md | pending |
| 技术方案 | 技术方案.md | pending |
| 任务拆解表 | 任务拆解表.md | pending |
| 生命周期状态 | SPEC-STATE.md | active |
| STATE | STATE.md | pending |
| 阶段评审 | 评审记录.md | pending |
| 审查记录 | code-review.md | pending |
| 验证报告 | VERIFICATION.md | pending |

## 判断规则

阶段推进必须满足前置条件：

```
INIT -> REQ:      PRD.md 存在且非空
REQ -> DESIGN:    需求理解确认.md 存在且包含"已确认"标记
DESIGN -> TASKS:  技术方案.md 存在且包含"已锁定决策"章节
TASKS -> EXEC:    任务拆解表.md 存在且 plan-check 通过
EXEC -> REVIEW:   STATE.md 标记所有 Wave DONE
REVIEW -> VERIFY: 审查报告 Verdict = APPROVE 或 WARNING
VERIFY -> CLOSED: VERIFICATION.md 结论 = PASS
```

禁止跳步。任何阶段产物缺失，等于该阶段未完成。
