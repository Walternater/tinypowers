# session-recovery.md

## Session 恢复机制

上下文满或 `/clear` 后，自动保存状态，下次可从断点续传。

---

## 状态保存

```json
// .claude/tech-code-state.json
{
  "feature_id": "CSS-1234",
  "current_wave": 3,
  "completed_waves": [1, 2],
  "completed_tasks": ["T-001", "T-002", "T-003", "T-004", "T-005"],
  "failed_tasks": [],
  "blocked_tasks": ["T-006"],
  "deviations": ["deviations/deviation-001.md"],
  "last_updated": "2026-03-27T15:30:00"
}
```

## 恢复流程

```
IF 存在 .claude/tech-code-state.json THEN
  询问："检测到未完成的执行，是否恢复？"
  IF 用户确认 THEN
    加载状态
    从断点继续
  ELSE
    删除状态文件
    重新开始
  END
ELSE
  正常开始
END
```
