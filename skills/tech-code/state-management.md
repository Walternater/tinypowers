# state-management.md

## STATE.md 活跃状态管理

执行过程中实时更新的状态文件，记录当前位置、已完成、阻塞项。
与 session-recovery 互补：session-recovery 处理「上下文丢失后恢复」，STATE.md 处理「正常执行中的状态追踪」。

---

## 设计理念

借鉴 GSD 的核心理念：
- **文件即宪法** — 所有状态以 Markdown 存储，人和 Agent 都可读
- **活跃记忆** — 每次关键操作后更新，不是事后补充
- **精简至上** — 保持在 100 行以内，是摘要不是归档

---

## 文件位置

```
features/{id}/STATE.md
```

每个 Feature 独立维护自己的 STATE.md。

---

## STATE.md 模板

```markdown
# STATE: {Feature ID}

> 最后更新: {datetime} | 当前阶段: {phase}

## 位置

- 当前技能: tech-code
- 当前阶段: Phase 2 - Wave Execution
- 当前 Wave: 3 / 5

## 决策

| ID | 决策内容 | 确认人 | 日期 |
|----|----------|--------|------|
| D-01 | {决策内容} | {用户} | {日期} |

## 进度

### Wave 1 DONE
- [x] T-001 数据库设计
- [x] T-002 User实体类

### Wave 2 DONE
- [x] T-003 LoginService
- [x] T-004 UserService

### Wave 3 IN_PROGRESS
- [ ] T-005 LoginController
- [ ] T-006 LoginPage

### Wave 4 PENDING
- [ ] T-007 登录测试

## 阻塞

无

## 偏差

无

## 上次操作

- Wave 2 完成，Gate 通过
- T-005 开始执行
```

---

## 更新时机

STATE.md 在以下节点**必须**更新：

| 时机 | 更新内容 |
|------|----------|
| tech-code 启动 | 创建或读取 STATE.md，确认当前阶段 |
| 每个 Task 完成 | 标记 `[x]`，更新「上次操作」 |
| 每个 Wave 完成 | 标记 Wave 状态，更新 Gate 结果 |
| Phase 切换 | 更新「当前阶段」 |
| 偏差发生 | 记录到「偏差」章节 |
| 遇到阻塞 | 记录到「阻塞」章节 |
| 新决策确认 | 追加到「决策」表格 |

---

## 读取时机

STATE.md 在以下节点**必须**读取：

| 时机 | 用途 |
|------|------|
| tech-code 启动 | 确认断点，决定从哪里继续 |
| Session 恢复 | 恢复工作现场 |
| Wave 开始前 | 确认前序 Wave 已完成 |
| Code Review 前 | 确认所有 Task 已完成 |
| Verification 前 | 确认所有 Wave 已完成 |

---

## 与 session-recovery 的关系

```
                    ┌──────────────┐
                    │  STATE.md    │ ← 实时更新（每个Task/Wave）
                    │  活跃状态    │    存储在 features/{id}/
                    └──────┬───────┘    提交到 Git
                           │
                    ┌──────▼───────┐
                    │  Snapshot    │ ← Stop/PreCompact 时创建
                    │  /tmp 快照   │    存储在 /tmp/
                    └──────┬───────┘    不提交
                           │
                    ┌──────▼───────┐
                    │ SessionStart │ ← 新会话启动时读取
                    │  恢复询问    │    读取 Snapshot → 引导读取 STATE.md
                    └──────────────┘
```

### 分工

| 组件 | 存储位置 | 生命周期 | 职责 |
|------|----------|----------|------|
| STATE.md | `features/{id}/` | 永久（Git 追踪） | 执行过程完整记录 |
| Snapshot | `/tmp/` | 临时（24h 过期） | 跨会话恢复入口 |

### 恢复流程

```
SessionStart → 检测 Snapshot
  → 注入询问：检测到未完成 Feature
  → 用户确认恢复
  → 读取 STATE.md（非 Snapshot）
  → 从 STATE.md 记录的位置继续
```

**关键**：恢复时以 STATE.md 为准，Snapshot 只是入口通知。

---

## 约束

<HARD-GATE>
STATE.md 管理规则：
1. 禁止不更新 STATE.md 就跳过 Task 或 Wave
2. 禁止标记未完成的 Task 为 [x]
3. 禁止删除或篡改已记录的决策
4. STATE.md 超过 100 行时，压缩已完成 Wave 为单行摘要

违反以上规则会导致状态不一致，恢复后可能重复执行或遗漏任务。
</HARD-GATE>

---

## 行压缩规则

当 STATE.md 超过 100 行时，压缩已完成的 Wave：

```markdown
### Wave 1 DONE
T-001 数据库设计, T-002 User实体类 (全部通过, Gate OK)

### Wave 2 DONE
T-003 LoginService, T-004 UserService (全部通过, Gate OK)
```

保留当前 Wave 和未完成 Wave 的完整任务列表。

---

## 战略压缩时机

借鉴 ECC 的 Strategic Compaction 原则：不要等到上下文告急才压缩，而是在逻辑断点主动执行 `/compact`。

### 何时压缩

| 时机 | 为什么 | 压缩后做什么 |
|------|--------|-------------|
| 探索完成 → 开始执行前 | 探索阶段积累的读取记录不再需要 | STATE.md 已记录关键发现，可以安全压缩 |
| 一个 Wave 完成 → 下一 Wave 开始前 | Wave N 的执行细节对 Wave N+1 无用 | STATE.md 已记录完成状态 |
| Phase 切换时（如 Phase 2 → Phase 3） | 前一阶段的上下文不再需要 | STATE.md 已记录阶段完成 |
| 连续修复失败后（见 3 次失败规则） | 失败尝试的上下文会干扰新思路 | 清理后重新审视架构 |
| 关键决策确认后 | 讨论过程不再需要，只需保留结论 | 决策已记录在 STATE.md |

### 何时不压缩

| 时机 | 为什么 |
|------|--------|
| Task 执行中 | 正在工作的代码上下文需要保留 |
| Code Review 中 | 审查意见需要对照代码理解 |
| 调试中（且未触发 3 次失败） | 错误上下文可能帮助定位问题 |

### 压缩前检查清单

```
IF 准备执行 /compact THEN
  1. STATE.md 是否已更新到最新？ ← 必须
  2. 当前 Task 是否已完成或已暂停？ ← 必须
  3. 是否有未保存的中间状态？ ← 必须处理
  4. 下一步操作是否在 STATE.md 中可恢复？ ← 必须
END
```

**核心原则**：只要 STATE.md 记录了足够信息让你从断点恢复，就可以放心压缩。
