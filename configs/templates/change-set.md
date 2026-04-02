# CHANGESET: {{feature_id}} {{feature_name}}

## 基本信息

| 项目 | 内容 |
|------|------|
| 需求编号 | `{{feature_id}}` |
| 需求名称 | `{{feature_name}}` |
| 执行路由 | `{{track_label}}` |
| 当前状态 | `proposed` |
| 当前阶段 | `PLAN` |
| 创建时间 | `{{date}}` |
| 负责人 | |

## 目标与范围

- 为什么做：
- 这次变更要交付什么：
- 明确不做什么：

## 规范入口

| 工件 | 作用 |
|------|------|
| `PRD.md` | 需求来源、背景、范围、验收标准 |
| `技术方案.md` | 最小方案、锁定决策、风险、回滚 |
| `任务拆解表.md` | 可执行任务、依赖、验证方式 |
| `SPEC-STATE.md` | 跨阶段生命周期状态机 |
| `STATE.md` | 进入执行态后的活跃状态 |
| `评审记录.md` | 可选，记录关键评审结论 |

## 目录约定

```text
notepads/learnings.md -> feature 级经验沉淀
seeds/               -> 可选，暂不纳入本次变更的想法
archive/             -> 可选，后续归档材料
```

## 当前结论

- 规划骨架已创建
- 本次按 `{{track_label}}` 路由推进
- 正式阶段推进以 `SPEC-STATE.md` 为准
- 进入 `/tech:code` 后，以 `STATE.md` 作为执行期唯一真相源
