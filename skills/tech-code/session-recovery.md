# session-recovery.md

## 作用

这份文档定义 `/tech:code` 在上下文清空、压缩或会话结束后如何恢复工作。

核心原则只有一条：

`STATE.md` 是恢复依据，Snapshot 只是恢复入口。

## 生命周期

```text
工作进行中
  -> 持续更新 STATE.md
  -> Stop / PreCompact 时生成 Snapshot
  -> 下次 SessionStart 检测 Snapshot
  -> 用户确认恢复
  -> 读取 STATE.md
  -> 从断点继续
```

## Hook 角色

默认由 `hooks/gsd-session-manager.js` 负责三个时机：

- `SessionStart`：检测是否有未完成 Feature
- `Stop`：在会话结束时写入恢复快照
- `PreCompact`：在压缩前保存最小恢复信息

## 恢复顺序

### 1. 检测 Snapshot

在 `SessionStart` 时检查 `/tmp` 下是否存在对应快照。

如果没有快照，静默开始新会话。

### 2. 询问是否恢复

如果有快照，就提示当前存在未完成 Feature，让用户决定是否继续。

### 3. 读取 STATE.md

一旦用户确认恢复，必须读取：

```text
features/{id}/STATE.md
```

读取重点：
- 当前阶段
- 当前 Wave
- 已完成任务
- 阻塞项
- 偏差记录
- 上次操作

### 4. 从断点继续

恢复后的动作应该是：
- 跳过已完成任务
- 回到当前 Wave 或当前审查步骤
- 先处理仍然存在的阻塞项
- 延续原有决策，不重新发明方案

## Snapshot 中应该有什么

Snapshot 只保存最小恢复信息，例如：
- `feature_id`
- `feature_path`
- `current_wave`
- `completed_tasks`
- `blocked_tasks`
- `timestamp`

不要把 Snapshot 当作第二份完整状态文档。

## 恢复后的约束

- 禁止忽略 `STATE.md` 直接从头重做
- 禁止删除上次已确认的正确实现
- 禁止借恢复机会私自修改锁定决策
- 禁止让 Snapshot 覆盖 `STATE.md` 的结论

## 手动触发

如果需要手动验证恢复链路，可以直接运行 hook：

```bash
node .claude/hooks/gsd-session-manager.js Stop
node .claude/hooks/gsd-session-manager.js SessionStart
```

## 判断标准

一个可用的恢复机制应满足：
- 新会话能知道上次做到了哪里
- 不会重复执行已经完成的任务
- 不会丢失阻塞或偏差信息
- 恢复后可以继续原流程，而不是重新组织一次工作
