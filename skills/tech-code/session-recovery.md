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

## Snapshot 生成

Stop 和 PreCompact 时写入快照到 `/tmp/tinypowers-session-{session_id}.json`，包含：
- session_id、feature_id、feature_path
- current_wave
- timestamp（用于过期判断）
- summary（phase、wave、任务进度、阻塞项、上次操作）

## 恢复步骤

1. **检测 Snapshot**：SessionStart 检查 `/tmp` 下对应快照，无快照则静默开始新会话
2. **过期检查**：快照超过 24 小时自动丢弃
3. **有效性检查**：Feature 目录不存在则丢弃快照
4. **询问是否恢复**：提示未完成 Feature，读取 `.tinypowers/notepad.md` 注入关键状态
5. **读取 STATE.md**：当前阶段、Wave、已完成任务、阻塞项、偏差记录、上次操作
6. **从断点继续**：跳过已完成任务、回到当前 Wave/审查步骤、先处理阻塞项、延续原有决策、读取 `learnings.md`

## 恢复后约束

- 禁止忽略 STATE.md 从头重做
- 禁止删除已确认的正确实现
- 禁止借恢复机会修改锁定决策
- Snapshot 不覆盖 STATE.md 的结论

## 冲突处理

当 Snapshot 和 STATE.md 不一致时，以 STATE.md 为准。Snapshot 仅作恢复提示，不作权威源。

常见冲突场景：
- Snapshot 记录 Wave 3，但 STATE.md 已推进到 Wave 4 → 忽略快照，从 Wave 4 继续
- Snapshot 记录任务完成，但 STATE.md 标记为失败 → 以 STATE.md 为准
- Snapshot 过期但 STATE.md 仍活跃 → 丢弃快照，基于 STATE.md 恢复

## 多 Feature 场景

当 `features/` 目录下存在多个 Feature 时，恢复优先级：
1. 当前 git 分支对应的 Feature（`features/{id}`）
2. 最近修改的 `STATE.md` 所在 Feature
3. 用户手动选择

## 恢复失败降级

如果恢复过程出错（STATE.md 格式异常、文件缺失等）：
1. 尝试从 notepad.md 获取最小上下文
2. 通知用户恢复失败，建议手动检查 STATE.md
3. 不自动创建或修改 STATE.md

## 手动触发

```bash
node hooks/gsd-session-manager.js Stop
node hooks/gsd-session-manager.js SessionStart
```
