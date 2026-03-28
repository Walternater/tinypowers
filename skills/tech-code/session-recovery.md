# session-recovery.md

## Session 恢复机制

上下文满或 `/clear` 后，自动保存状态，下次可从断点续传。

**核心原则：STATE.md 是恢复主数据源，Snapshot 只是入口通知。**

---

## 生命周期

```
SessionStart hook
       ↓
  检测 Snapshot (/tmp)
       ↓ 存在
  注入询问 → 用户确认恢复
       ↓
  读取 STATE.md (features/{id}/) ← 主数据源
       ↓
  工作进行中（实时更新 STATE.md）
       ↓
   /compact
       ↓ (PreCompact hook 快照)
    压缩
       ↓
  读取 STATE.md 恢复现场
       ↓
  工作继续
       ↓
SessionEnd hook (Stop hook 基于 STATE.md 保存 Snapshot)
```

---

## Hooks 配置

在 `.claude/settings.json` 中配置：

```json
{
  "hooks": {
    "SessionStart": [{
      "type": "command",
      "command": "node \"{HOOKS_DIR}/gsd-session-manager.js\" SessionStart"
    }],
    "Stop": [{
      "type": "command",
      "command": "node \"{HOOKS_DIR}/gsd-session-manager.js\" Stop"
    }],
    "PreCompact": [{
      "type": "command",
      "command": "node \"{HOOKS_DIR}/gsd-session-manager.js\" PreCompact"
    }]
  }
}
```

---

## Hook 行为

### SessionStart

1. 检测 `/tmp/tinypowers-session-{session_id}.json` 快照文件
2. 存在 → 注入 `additionalContext` 询问是否恢复
3. 用户确认后 → **读取 `features/{id}/STATE.md`** 作为恢复依据
4. 不存在 → 静默退出

### Stop（SessionEnd）

会话结束时保存当前进度：
- 读取 `features/{id}/STATE.md`（主数据源）
- 创建 `/tmp` Snapshot（入口通知）

### PreCompact

压缩前：
- 快照关键上下文到 `/tmp`
- **STATE.md 已在执行过程中实时更新，无需额外操作**

---

## 状态文件格式

### Snapshot 文件

```json
// /tmp/tinypowers-session-{session_id}.json
{
  "session_id": "abc123",
  "feature_id": "CSS-1234",
  "feature_path": "features/CSS-1234",
  "current_wave": 3,
  "completed_waves": [1, 2],
  "completed_tasks": ["T-001", "T-002", "T-003"],
  "failed_tasks": [],
  "blocked_tasks": ["T-006"],
  "deviations": ["deviations/deviation-001.md"],
  "timestamp": 1743072600
}
```

### Feature STATE.md

```markdown
# STATE: CSS-1234

> 最后更新: 2026-03-27 15:30:00 | 当前阶段: Phase 2 - Wave Execution

## 位置
- 当前技能: tech-code
- 当前阶段: Phase 2 - Wave Execution
- 当前 Wave: 3 / 5

## 进度

### Wave 1 ✅
- T-001 数据库设计
- T-002 User实体类

### Wave 2 ✅
- T-003 LoginService
- T-004 UserService

### Wave 3 🔄 进行中
- T-005 LoginController (70%)
- T-006 LoginPage (等待)

### Wave 4 ⏳ 待开始
- T-007 登录测试

### Wave 5 ⏳ 待开始
- T-008 集成测试

## 偏差
- deviation-001.md: 依赖偏差（已自动修复）

## 上次操作
- Wave 2 完成，Gate 通过
- T-005 开始执行
```

---

## 恢复流程

```
SessionStart hook 触发
       ↓
检测到 /tmp/tinypowers-session-{id}.json (Snapshot)
       ↓
注入询问：
"检测到上次会话未完成，Feature: CSS-1234, Wave: 3/5"
       ↓
用户输入"恢复"
       ↓
读取 features/CSS-1234/STATE.md ← 主数据源
       ↓
恢复工作现场：
1. 解析 STATE.md 中的「位置」章节 → 确认当前阶段和 Wave
2. 解析「进度」章节 → 确认已完成/未完成 Tasks
3. 解析「阻塞」章节 → 确认是否有阻塞项
4. 从断点继续，跳过已完成 Tasks
5. 如果有阻塞项，先处理阻塞
```

---

## 手动保存/恢复

### 强制保存

```bash
# 手动触发 Stop hook
node .claude/hooks/gsd-session-manager.js Stop
```

### 清除快照

```bash
rm /tmp/tinypowers-session-{session_id}.json
```

---

## 约束

<HARD-GATE>
禁止在 Session 恢复后：
- 忽略已完成 Tasks，直接重新执行
- 删除已有的正确实现
- 改变用户已确认的决策

恢复后必须从断点继续，保持与上次会话状态一致。
</HARD-GATE>
