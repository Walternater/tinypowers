# NEXUS 标准化交接协议

## 概述

NEXUS 是一套标准化的交接协议，定义了 Agent 之间、Phase 之间、标准交接场景下的信息传递格式。其目标是确保上下文在交接时不会丢失关键信息。

## 核心原则

1. **完整性**：交接文档必须包含接收者需要的所有信息
2. **可追溯性**：每个决策都有记录，清楚为什么这样做
3. **明确性**：拒绝的替代方案和风险必须显式说明
4. **独立性**：交接文档自包含，不依赖外部上下文

## NEXUS vs STATE.md 职责划分

| 维度 | NEXUS | STATE.md |
|------|-------|----------|
| **用途** | Agent/Phase 间交接的通信协议 | 执行期实时状态追踪 |
| **更新时机** | 交接时一次性生成 | 每个 Wave 完成后更新 |
| **内容** | Decided/Rejected/Risks/Remaining | 当前 Wave/进度/阻塞/偏差 |
| **格式** | 结构化文档模板 | 自由格式 Markdown |
| **消费者** | 接收交接的 Agent/用户 | 主 Agent 自己 |

**何时用 NEXUS**：
- Phase 转换时（REQ→DESIGN→TASKS→EXEC）
- Wave 交接时（Wave N → Wave N+1）
- Agent 协作时（主 Agent → 审查 Agent）
- 每日 standup 或 handoff 文档

**何时用 STATE.md**：
- 执行过程中追踪当前进度
- 记录遇到的阻塞和偏差
- 恢复中断的 session

## 交接模板

### 标准交接模板

```markdown
## NEXUS Handoff: [Source Phase/Agent] → [Target Phase/Agent]

### 交接类型
[Standard / QA Pass / QA Fail / Escalation / Phase Gate / Sprint / Incident]

### 时间戳
[ISO 8601 格式]

---

## 已决定事项 (Decided)

| 决策 ID | 决策内容 | 依据 | 确认人 |
|---------|----------|------|--------|
| D-001   | [内容]   | [原因] | [人]   |
| D-002   | [内容]   | [原因] | [人]   |

---

## 被拒绝的替代方案 (Rejected)

| 替代方案 | 拒绝原因 | 提出方 |
|----------|----------|--------|
| [方案 A] | [原因 1] | [人]   |
| [方案 B] | [原因 2] | [人]   |

---

## 风险登记 (Risks)

| 风险 | 概率 | 影响 | 缓解措施 | 责任人 |
|------|------|------|----------|--------|
| [描述] | [H/M/L] | [H/M/L] | [措施] | [人] |

---

## 待完成项 (Remaining)

| 项目 | 状态 | 依赖 | 截止日期 |
|------|------|------|----------|
| [任务] | [TODO/IN_PROGRESS/BLOCKED] | [依赖项] | [日期] |

---

## 交接证据 (Evidence)

- [ ] 测试结果: [命令和结果]
- [ ] 覆盖率报告: [数据]
- [ ] 验证截图: [链接或描述]
- [ ] 代码审查: [链接]

---

## 接收者检查清单

- [ ] 已阅读所有 Decided 事项
- [ ] 已理解 Rejected 方案及原因
- [ ] 已评估 Risks 并确认缓解措施
- [ ] 已识别 Remaining 项对后续影响
- [ ] 已验证 Evidence 完整性

---

## 签名
- 交出方: [Name] @ [Timestamp]
- 接收方: [Name] @ [Timestamp]
```

## 交接类型详解

### 1. Standard Handoff（标准交接）

最常见的交接类型，用于常规的 Phase 转换或 Agent 协作。

**触发时机**：
- `/tech:feature` → `/tech:code` 交接
- Wave 1 → Wave 2 交接
- 主 Agent → 审查 Agent 交接

### 2. QA Pass（质量保证通过）

当一个阶段的质量检查全部通过时的交接。

**必须包含**：
- 验证证据清单
- 测试覆盖率数据
- L1-L4 验证结果

```markdown
## QA Pass Handoff

### 验证结果
- [x] L1 Exists: [文件清单]
- [x] L2 Substantive: [验证详情]
- [x] L3 Wired: [调用链确认]
- [x] L4 Data Flow: [数据验证]

### 测试覆盖率
| 模块 | 行覆盖率 | 分支覆盖率 |
|------|----------|------------|
| [模块 A] | 95% | 88% |
| [模块 B] | 82% | 75% |

### 签字确认
QA 负责人: [Name] @ [Timestamp]
```

### 3. QA Fail（质量保证失败）

当质量检查未通过需要交接时使用。

**必须包含**：
- 失败原因
- 已尝试的修复方案
- 剩余问题及建议

```markdown
## QA Fail Handoff

### 失败原因
1. [问题 1 描述]
2. [问题 2 描述]

### 已尝试的修复
| 方案 | 结果 | 原因 |
|------|------|------|
| [修复 A] | 失败 | [原因] |
| [修复 B] | 失败 | [原因] |

### 剩余问题
| 问题 | 严重性 | 建议处理 |
|------|--------|----------|
| [问题] | [H/M/L] | [建议] |

### 升级决策
- [ ] 需要用户决策
- [ ] 需要架构讨论
- [ ] 需要外部支持
```

### 4. Escalation（升级交接）

当问题超出当前处理能力需要升级时使用。

**必须包含**：
- 问题描述和背景
- 已尝试的所有方案
- 升级原因
- 需要的支持

```markdown
## Escalation Handoff

### 问题描述
[详细描述问题，包括背景、影响范围、紧急程度]

### 已尝试方案
1. [方案 1] - 结果: [成功/失败] - 原因: [原因]
2. [方案 2] - 结果: [成功/失败] - 原因: [原因]

### 升级原因
- [ ] 超出当前 Agent 能力范围
- [ ] 需要用户决策
- [ ] 涉及架构变更
- [ ] 其他: [原因]

### 需要支持
- [ ] 决策: [需要什么决策]
- [ ] 资源: [需要什么资源]
- [ ] 知识: [需要什么信息]

### 上下文保留
[关键文件路径、相关决策、已锁定的内容]
```

### 5. Phase Gate（阶段门禁交接）

在阶段转换点使用的交接，类似于质量门禁。

**必须包含**：
- 阶段完成标准
- 当前完成情况
- 是否有条件通过

```markdown
## Phase Gate Handoff: [Phase A] → [Phase B]

### 进入条件
| 条件 | 标准 | 当前状态 | 结果 |
|------|------|----------|------|
| [条件 1] | [标准] | [状态] | [通过/未通过] |
| [条件 2] | [标准] | [状态] | [通过/未通过] |

### 门禁决策
- [ ] CLEAR - 可以进入下一阶段
- [ ] CONDITIONAL - 有条件通过，需确认以下事项
- [ ] BLOCKED - 不能进入下一阶段

### 条件说明（如果 CONDITIONAL）
[需要确认的事项清单]

### 签名
- 门禁检查人: [Name] @ [Timestamp]
- 下一阶段接收人: [Name] @ [Timestamp]
```

### 6. Sprint（冲刺交接）

用于敏捷开发中的 Sprint 边界交接。

**必须包含**：
- Sprint 目标达成情况
- 未完成项及原因
- 下一 Sprint 预备项

### 7. Incident（事件交接）

用于突发事件的交接处理。

**必须包含**：
- 事件描述
- 当前状态
- 已采取的行动
- 影响评估

## 在 tinypowers 中的应用

### Feature 内 Phase 交接

```
Phase 0 (INIT) → Phase 1 (REQ)
  └── 使用 Standard Handoff

Phase 1 (REQ) → Phase 2 (DESIGN)
  └── 使用 Phase Gate Handoff

Phase 2 (DESIGN) → Phase 3 (TASKS)
  └── 使用 Phase Gate Handoff + Decided 清单

Phase 3 (TASKS) → Phase 4 (EXEC)
  └── 使用 Standard Handoff + 所有 D-0N 决策

Phase 4 (EXEC) → Phase 5 (REVIEW)
  └── 使用 QA Pass Handoff

Phase 5 (REVIEW) → Phase 6 (VERIFY)
  └── 使用 QA Pass/Fail Handoff

Phase 6 (VERIFY) → Phase 7 (CLOSED)
  └── 使用 Phase Gate Handoff
```

### Wave 间交接

```
Wave 1 → Wave 2
  └── Standard Handoff
      - 已完成任务清单
      - 对后续任务的输入/输出约定
      - 已发现的风险

Wave 2 → Wave 3
  └── Standard Handoff
      - ...
```

### Agent 间交接

```
主 Agent → 审查 Agent
  └── Standard Handoff
      - 任务上下文
      - 验收标准
      - 关键决策

审查 Agent → 主 Agent
  └── QA Pass/Fail/Escalation Handoff
```

## 工具支持

### 自动生成

在关键节点自动生成 NEXUS Handoff 文档：
- `features/{id}/nexus-handoffs/` 目录
- 文件命名: `{from}-{to}-{timestamp}.md`

### 检查清单验证

交接完成前必须通过检查清单：
```bash
# 检查交接文档完整性
node scripts/validate-handoff.js features/{id}/nexus-handoffs/{file}
```

## HARD-GATE 约束

<HARD-GATE>
**交接完整性规则**：
1. Phase 转换必须包含 NEXUS Handoff 文档
2. Handoff 文档不完整禁止进入下一阶段
3. 接收方必须确认检查清单所有项目
</HARD-GATE>

## 参考

- NEXUS 交接协议源自 agency-agents-zh 项目的实践经验
- 7 种交接类型覆盖了大多数协作场景
