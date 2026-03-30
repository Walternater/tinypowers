# session-recovery.md

## 作用

`STATE.md` 是恢复依据，Snapshot 只是恢复入口。

## 生命周期

工作进行中 → 持续更新 STATE.md → Stop/PreCompact 生成 Snapshot → SessionStart 检测 → 用户确认恢复 → 读取 STATE.md → 从断点继续

## Hook 角色

由 `hooks/gsd-session-manager.js` 负责三个时机：

- `SessionStart`：检测未完成 Feature，注入 notepad 提示
- `Stop`：写入恢复快照，更新 `.tinypowers/notepad.md`
- `PreCompact`：压缩前保存最小恢复信息

## 持久化

`.tinypowers/notepad.md` 保存关键状态（PreCompact 前写入，resume 时读取）。

恢复顺序：SessionStart → 检测 notepad.md → 注入提示 → 用户确认 → 读取 STATE.md

## 恢复步骤

1. **检测 Snapshot**：SessionStart 检查 `/tmp` 下对应快照，无快照则静默开始新会话
2. **询问是否恢复**：提示未完成 Feature，读取 `.tinypowers/notepad.md` 注入关键状态
3. **读取 STATE.md**：当前阶段、Wave、已完成任务、阻塞项、偏差记录、上次操作
4. **从断点继续**：跳过已完成任务、回到当前 Wave/审查步骤、先处理阻塞项、延续原有决策、读取 `learnings.md`

## 恢复后约束

- 禁止忽略 STATE.md 从头重做
- 禁止删除已确认的正确实现
- 禁止借恢复机会修改锁定决策
- Snapshot 不覆盖 STATE.md 的结论

## 手动触发

```bash
node hooks/gsd-session-manager.js Stop
node hooks/gsd-session-manager.js SessionStart
```
