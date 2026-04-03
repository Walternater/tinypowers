# WP-D 实施清单

> 对应主方案: `docs/workflow-optimization-plan.md`  
> 范围: `WP-D commit 与知识沉淀收口`

配套执行计划：

- `docs/plans/2026-04-03-wp-d-commit-knowledge.md`

## 1. 目标

`WP-D` 解决两个收口层问题：

- `SPEC-STATE -> DONE` 目前天然制造额外 commit 噪音。
- `learnings -> knowledge` 链路目前只有原则，没有稳定触发和呈现方式。

完成后应该达到：

- 正常 feature 交付只需要一个最终业务 commit。
- `DONE` 与最终交付内容处于同一个版本面。
- knowledge capture 变成“可选但真实可用”的推荐动作，而不是每次都空转。

不在 `WP-D` 内处理：

- `WP-A` 的产物模型
- `WP-B` 的审查自动化
- `WP-C` 的安装分发
- 新的复杂状态机设计

## 2. 前置依赖

`WP-D` 依赖：

- `WP-A` 已明确 `VERIFICATION.md` 的角色
- `SPEC-STATE` 仍保持 `PLAN -> EXEC -> REVIEW -> DONE`

`D2` 还依赖：

- `A1` 已经把 `learnings.md` 改成按需创建，而不是 scaffold 默认生成

## 3. 执行顺序

严格按下面顺序做：

1. D1 重写 `DONE` 收口语义
2. D1 同步 commit 阶段文档与相关指南
3. D2 定义 knowledge capture 触发条件
4. D2 同步 `knowledge.md` / workflow docs
5. 回归检查

原因：

- 如果先做 knowledge capture，再改 commit 语义，交付阶段说明会重复返工。
- `DONE` 的时序是 commit 阶段的主问题，优先级更高。

## 4. D1 `DONE` 并入最终 feature commit

### 4.1 设计决策

执行版策略：

- 废弃“最终功能 commit 后，再额外提交一个 `chore: update spec state to DONE`”
- 最终交付前先将 `SPEC-STATE` 推进到 `DONE`
- 最终 feature commit 一次性包含：
  - 代码变更
  - 文档同步
  - `SPEC-STATE.md`

这意味着 `DONE` 的语义从：

- “提交成功后的后置状态提交”

改成：

- “最终交付快照的一部分”

### 4.2 改动文件

- `skills/tech-commit/SKILL.md`
- `docs/guides/workflow-guide.md`
- `docs/guides/change-set-model.md`
- 如 README 有明显冲突，再补 `README.md`

### 4.3 需要同步的内容

在 `tech:commit` 中明确：

- `Document Sync`
- 更新 `SPEC-STATE -> DONE`
- 一次性执行最终 commit
- Push / PR 在 commit 之后

需要删除或改写的表述：

- “提交成功后推进 DONE”
- “把 SPEC-STATE 作为独立 commit 提交”

### 4.4 完成定义

- `tech:commit` 文档不再要求独立 meta commit
- 所有说明文档对 `DONE` 的时序描述一致

## 5. D2 knowledge capture 改成半自动推荐

### 5.1 设计决策

knowledge capture 不做强制步骤，只做“有价值时推荐”。

推荐触发条件：

- 解决了非显而易见的 bug
- 发现了框架自身限制
- 形成了对后续 feature 有复用价值的决策经验
- 沉淀了不容易从公开资料直接获得的项目内知识

推荐保留 `[PERSIST]` 标记，用于区分：

- 只是 feature 内笔记
- 值得提升到项目知识库的内容

### 5.2 改动文件

- `skills/tech-commit/SKILL.md`
- `docs/knowledge.md`
- `docs/guides/workflow-guide.md`
- `docs/guides/change-set-model.md`

如后续决定实现自动抽取，再新增脚本；本轮不强制。

### 5.3 需要同步的内容

在 `tech:commit` 中明确：

- knowledge capture 不阻塞提交
- 空 `learnings.md` 不触发
- Fast 路径通常直接跳过
- 有 `[PERSIST]` 或满足触发条件时，才提示用户是否提升到 `docs/knowledge.md`

在 `docs/knowledge.md` 中补最小使用说明：

- 什么应写入
- 什么不应写入
- 推荐分类方式

### 5.4 完成定义

- knowledge capture 从“理论可选项”变成“清晰、可操作的推荐流程”
- 文档里不再暗示所有 feature 都应写知识库

## 6. 建议的回归检查

`WP-D` 主要是语义和文档收口，本轮不强制新增脚本测试，但至少要做：

- `npm run validate`
- 文本搜索检查

建议搜索：

```bash
rg -n "独立 commit|update spec state to DONE|提交成功后推进|learnings|knowledge|PERSIST" skills docs README.md
```

关注点：

- 是否还残留“DONE 额外 commit”的旧说法
- knowledge capture 是否仍被描述成固定步骤

## 7. 风险与注意事项

- 不要把 `DONE` 写成“提交前即可视为最终成功”，文档要表达的是“最终交付快照的一部分”，不是绕过提交成功。
- 如果后续真的实现 knowledge 自动抽取，必须避免把通用公开知识写进 `docs/knowledge.md`。
- `learnings.md` 的定位应该始终是 feature 暂存区，不应直接等价于项目知识库。

## 8. 完成后应该看到的结果

如果 `WP-D` 做对了，开发者的直观感受应该是：

- 不再为了关状态再补一个 commit。
- `tech:commit` 的时序说明更自然。
- knowledge capture 不再空转，但也不会强迫每个 feature 都沉淀。
