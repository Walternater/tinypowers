---
name: tech:code
description: Wave并行执行 + 三阶段审查循环，支持偏差处理、质量门禁和Session恢复。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "5.0"
---

# /tech:code

## 功能
Wave并行执行 + 三阶段审查循环

**核心特性：**
- Wave 并行执行（依赖分析 + 拓扑排序）
- 三阶段顺序审查（方案符合性 → 安全 → 代码质量）
- 偏差处理（Deviation Handling）
- 质量门禁（Quality Gate）
- Session 恢复（断点续传）
- STATE.md 活跃状态管理（实时追踪执行进度）
- 反浅层执行规则（强制先读再改 + grep 可验证验收标准）

**重要约束：**
- ⚠️ 禁止在 tech-commit 之前自动执行 git commit
- 所有代码变更仅标记为「待提交」，由 tech-commit 统一处理

## 输入

- `features/{id}/任务拆解表.md`
- `features/{id}/技术方案.md`
- `features/{id}/STATE.md`（存在时读取断点，不存在时创建）

---

## 执行流程

```
┌─────────────────────────────────────────────┐
│  Phase 0: 状态初始化                          │
│  创建或读取 STATE.md，确认当前进度              │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Phase 1: Plan Check                        │
│  验证任务表完整性和依赖正确性                 │
└──────────────────┬──────────────────────────┘
                   ↓失败→返回修改建议，重试(≤3次)
                   ↓通过
┌─────────────────────────────────────────────┐
│  Phase 2: Wave Execution                    │
│  - 分析任务依赖，分波次                      │
│  - 同Wave并行执行，不同Wave等待              │
│  - 质量门禁：每Wave结束检查                  │
│  - 偏差处理：发现问题自动处理或暂停          │
│  - Session恢复：断点续传                     │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Phase 3: Code Review（三阶段顺序审查）      │
│                                             │
│  Step 1: 方案符合性审查                     │
│    spec-compliance-reviewer                 │
│    对照技术方案逐项核查实现                  │
│    ↓ COMPLIANT 才能进入 Step 2             │
│                                             │
│  Step 2: 安全审查                           │
│    security-reviewer                        │
│    OWASP Top 10 漏洞扫描                    │
│    ↓ APPROVE 才能进入 Step 3              │
│                                             │
│  Step 3: 代码质量审查                       │
│    code-reviewer + java-reviewer            │
│    （如 Java 项目同时运行）                  │
│    ↓ APPROVE 才能进入 Phase 4             │
│                                             │
│  每步失败：修复 → 该步重审（≤3次）          │
└──────────────────┬──────────────────────────┘
                   ↓通过
┌─────────────────────────────────────────────┐
│  Phase 4: Verification                      │
│  目标回溯验证，检查是否达成目标              │
│  覆盖率门禁 + 交付清单                      │
└──────────────────┬──────────────────────────┘
                   ↓失败→补充测试/修复(≤3次)
                   ↓通过
            输出报告
```

---

## Phase 1: Plan Check

<TOOL-REQUIREMENT>
必须使用原生的 `task` 工具调用 `tech-plan-checker` 执行验证，禁止主 Agent 自行判断。
</TOOL-REQUIREMENT>

### 1.1 读取任务表

```
工具调用：task { subagent_name: "tech-plan-checker" }
输入：features/{id}/任务拆解表.md
```

### 1.2 决策合规预检

<TOOL-REQUIREMENT>
在执行任何编码任务之前，主 Agent 必须先主动回顾与本次需求相关的锁定决策。
Claude 的持久化记忆库中存有 `/tech:feature` 阶段写入的 D-0N 系列决策，
这些决策是绝对约束，不得在编码阶段擅自推翻或"优化"。

检查要点（对照技术方案.md 末尾的「已锁定决策」表）：
  1. 架构选型（D-01）：任务表中的技术选型是否与 D-01 一致？
  2. 数据库设计（D-02）：任务中的 DDL / 实体类是否与 D-02 一致？
  3. 接口契约（D-03）：任务中的接口定义是否与 D-03 一致？
  4. 其他 D-0N 决策逐项核对

IF 任意任务与锁定决策存在冲突 THEN
  立即暂停，输出冲突说明，等待人工确认是否需要变更决策
  禁止擅自"兼容处理"后继续执行
END
</TOOL-REQUIREMENT>

### 1.3 验证完整性

| 检查项 | 说明 |
|--------|------|
| 格式正确 | 表头完整，字段齐全 |
| 无循环依赖 | 依赖图无环 |
| 估时合理 | 单任务 < 3d |
| 关键任务无遗漏 | 技术方案中的功能点都有对应Task |

### 1.4 依赖分析

```
构建依赖图：
  - 任务ID → 依赖任务ID
  - 识别关键路径（最长路径）
  - 识别可并行任务组
```

### 1.5 失败处理

```
IF task 验证失败 THEN
  主 Agent 必须根据 tech-plan-checker 的反馈，主动使用文件编辑工具修复《任务拆解表》。
  修复完成后，再次使用 task 工具重新发起验证。
  最多重试 3 次，若仍失败则输出修改建议清单并暂停，等待人工介入。
END
```

---

## Phase 2: Wave Execution

<HARD-GATE>
在 Phase 1 Plan Check 通过之前，禁止：
- 执行任何 Task
- 调用 Subagent
- 启动任何 Wave

Phase 1 必须完整通过验证才能进入 Wave Execution。
</HARD-GATE>

<ANTI-RATIONALIZATION>
在跳过上述检查之前，先问自己：是不是在找借口？
详见 `anti-rationalization.md` 中的「Phase 1 Plan Check 门禁」合理化表格。
</ANTI-RATIONALIZATION>

调用 `wave-execution.md`：

### 2.1 初始化 STATE.md

```
IF features/{id}/STATE.md 存在 THEN
  读取 STATE.md，确认当前位置（阶段、Wave、已完成 Tasks）
  从断点继续
ELSE
  创建 STATE.md，初始化：
    - 位置：Phase 2 - Wave Execution
    - 决策：从技术方案.md 提取决策记录
    - 进度：所有 Wave 标记为 PENDING
    - 阻塞：无
    - 偏差：无
END
```

详见 `state-management.md`

### 2.2 Wave 分解

```
基于依赖图，拓扑排序分波次：

Wave 1: 无依赖任务（入度为0）
Wave 2: 依赖 Wave 1 完成后可执行的任务
Wave 3: 依赖 Wave 2 完成后可执行的任务
...
```

### 2.3 并行执行

```
FOR each Wave DO
  FOR each Task IN Wave DO
    # 强制：必须使用原生的 task 工具分配给独立的编码子代理
    # 严禁主 Agent 在当前上下文中直接写代码
    # prompt 中需包含：任务描述、验收标准、涉及文件路径、所依赖的上下文
    CALL task {
      subagent_name: "code-explorer",  # 实际执行时替换为具体编码子代理
      description: "Task-{id} 任务简述",
      prompt: "
        任务目标：{task.description}
        验收标准：{task.acceptance_criteria}
        相关文件：{task.files}
        技术方案参考：features/{feature_id}/技术方案.md
        完成后输出：修改了哪些文件、是否通过自测
      "
    }
  END

  # 同 Wave 内所有 task 工具并发发起，等待全部返回结果
  WAIT ALL

  # 质量门禁检查（由主 Agent 执行命令验证）
  RUN mvn compile && mvn test
  IF 质量门禁未通过 THEN
    暂停，等待修复后再继续下一 Wave
  END
END
```

### 2.4 质量门禁

每 Wave 结束后检查：

| 检查项 | 标准 | 未通过处理 |
|--------|------|-----------|
| 编译 | `mvn compile` | 阻断下一个 Wave |
| 单元测试 | 全部通过 | 阻断下一个 Wave |
| 行覆盖率 | ≥ 80% | 警告，可配置阻断 |
| 安全扫描 | 无高危漏洞 | 阻断下一个 Wave |

详见 `quality-gate.md`

### 2.5 偏差处理

执行中发现问题？

| 偏差类型 | 定义 | 处理策略 |
|-----------|------|----------|
| Scope 偏差 | 任务范围变化 | 记录，继续执行 |
| 依赖偏差 | 实际依赖与预期不符 | 自动补充依赖，重新分波 |
| 技术偏差 | 技术方案无法实现 | 暂停，询问用户 |

**熔断机制**：同一问题修复失败 3 次 → 停止修复，质疑架构设计。

详见 `deviation-handling.md`

### 2.6 Session 恢复

```
上下文满时 / 执行 /clear 后：
  1. STATE.md 已在执行中实时更新（无需额外保存）
  2. Snapshot 仅保存 /tmp 快照作为恢复入口

下次执行时：
  1. 读取 features/{id}/STATE.md（主数据源）
  2. 从 STATE.md 记录的位置继续
  3. 跳过已完成任务
  4. 如有阻塞项先处理阻塞
  5. 询问用户是否恢复
```

详见 `session-recovery.md` 和 `state-management.md`

### 2.7 每任务完成

```
Task 完成时：
  1. 运行自测
  2. 标记为「待提交」（不执行 git commit）
  3. 更新状态文件

⚠️ 禁止自动 git commit，统一由 tech-commit 处理
```

---

## Phase 3: Code Review（三阶段顺序审查）

<HARD-GATE>
三个审查步骤必须严格按顺序执行，不允许并行，不允许跳过：
1. 方案符合性审查（spec-compliance-reviewer）
2. 安全审查（security-reviewer）
3. 代码质量审查（code-reviewer）

前一步未通过 COMPLIANT / APPROVE，禁止启动下一步。
原因：如果实现的不是方案要求的功能，后续安全和质量审查针对的代码
可能会被推翻重写，审查成本完全浪费。

【核心指令】禁止自问自答！
本阶段所有审查，必须使用原生的 `task` 工具将审查任务分配给独立的 Subagent 执行，
实现上下文的物理隔离，避免主 Agent 被自己写的代码"护短"干扰判断。
</HARD-GATE>

<ANTI-RATIONALIZATION>
在跳过上述检查之前，先问自己：是不是在找借口？
详见 `anti-rationalization.md` 中的「Phase 3 Code Review 门禁」合理化表格。
</ANTI-RATIONALIZATION>

### 3.1 Step 1 — 方案符合性审查

**目的：** 验证「代码实现的是不是技术方案要求的那个东西」

```
工具调用：task { subagent_name: "spec-compliance-reviewer" }

输入 (作为 task 的 prompt)：
  - features/{id}/技术方案.md
  - 本次 Wave 的所有变更代码

审查维度：
  - 接口路径、入参、出参、错误码与方案一致
  - 业务逻辑与方案流程描述一致
  - 数据库表结构与方案 DDL 一致
  - 验收标准均有代码支撑
  - 无方案外的额外功能实现

结果：
  - COMPLIANT ✅：进入 Step 2 安全审查
  - NON-COMPLIANT ❌：
      → 修复缺失实现 / 偏差
      → 重新提交 Step 1 审查
      → 最多重试 3 次
```

### 3.2 Step 2 — 安全审查

**目的：** 检测安全漏洞，确保代码没有安全风险

**前置条件：** Step 1 必须已通过（COMPLIANT）

```
工具调用：task { subagent_name: "security-reviewer" }

审查维度（OWASP Top 10）：
  - SQL 注入（参数化查询）
  - 硬编码密钥 / 敏感信息
  - 日志中的 PII 泄露
  - 接口鉴权缺失
  - 不安全的反序列化
  - 依赖已知 CVE

结果：
  - APPROVE ✅：进入 Step 3 代码质量审查
  - BLOCK ❌：
      → 必须修复 CRITICAL / HIGH 问题
      → 重新提交 Step 2 审查（从 Step 2 开始，不回到 Step 1）
      → 最多重试 3 次
```

### 3.3 Step 3 — 代码质量审查

**目的：** 审查代码实现质量，确保可维护性

**前置条件：** Step 1 COMPLIANT + Step 2 APPROVE

```
工具调用（根据项目技术栈，并发多次调用 task 工具）：
  - task { subagent_name: "code-reviewer" } （通用，必选）
  - task { subagent_name: "java-reviewer" } （Java 项目，必选）
  - task { subagent_name: "springboot-reviewer" } （Spring Boot 项目，必选）

审查维度：
  - 代码结构与分层合规
  - 异常处理完整性
  - N+1 查询 / 无界查询
  - 代码可读性与命名规范
  - 测试覆盖充分性

结果：
  - APPROVE ✅：进入 Phase 4 Verification
  - WARNING ⚠️：记录问题，可推进但建议本迭代修复
  - BLOCK ❌：
      → 修复 CRITICAL / HIGH 问题
      → 重新提交 Step 3 审查（不回到 Step 1/2）
      → 最多重试 3 次
```

### 3.4 三阶段顺序说明

```
为什么不能并行？为什么顺序不可颠倒？

方案符合性 → 安全 → 质量

1. 方案符合性最先：
   确保审查的代码是「正确的东西」
   如果方向错了，安全和质量审查都是无效工作

2. 安全其次：
   安全问题是 BLOCK 级，影响能否上线
   质量问题相对可以在后续迭代修复
   安全漏洞一旦上线，修复成本和风险远高于代码质量问题

3. 代码质量最后：
   在确认「方向对 + 没有安全风险」之后
   再评价「实现得好不好」
   避免对最终会被推翻的代码做质量审查

失败重试边界：
  Step 1 失败 → 修复偏差 → 重新 Step 1（不跳）
  Step 2 失败 → 修复安全 → 重新 Step 2（不退回 Step 1）
  Step 3 失败 → 修复质量 → 重新 Step 3（不退回 Step 1/2）
```

### 3.5 失败处理与自动化重试机制

<TOOL-REQUIREMENT>
当任何一个审查步骤的 `task` 工具返回失败（NON-COMPLIANT / BLOCK）时：
1. 主 Agent 必须详细阅读 Subagent 返回的错误报告。
2. 主 Agent 必须亲自使用 `replace_in_file` 等原生工具修改代码以修复缺陷。
3. 修复完成后，主 Agent 必须**重新调用**对应的 `task` 工具发起该步骤的重审。
4. 严禁主 Agent 自行宣告修复成功，必须拿到 `task` 工具明确的 APPROVE。
</TOOL-REQUIREMENT>

```
超过 3 次重试仍失败：
  记录当前步骤、失败原因
  输出：features/{id}/REVIEW-BLOCKED.md
  暂停：等待人工决策
```

---

## Phase 4: Verification

<TOOL-REQUIREMENT>
必须使用原生的 `task` 工具调用 `tech-verifier` 执行最终验证。
</TOOL-REQUIREMENT>

### 4.1 目标回溯

```
工具调用：task { subagent_name: "tech-verifier" }

对照技术方案，检查：
  - [ ] 所有功能点已实现
  - [ ] 所有接口已开发
  - [ ] 所有数据库设计已落地
  - [ ] 所有验收标准已满足
```

### 4.2 覆盖率验证

| 指标 | 目标 | 实际 |
|------|------|------|
| 行覆盖率 | ≥ 80% | - |
| 分支覆盖率 | ≥ 70% | - |
| 核心业务覆盖率 | ≥ 90% | - |

### 4.3 交付清单

```
features/{id}/
├── code/                  # 代码变更
├── code-review.md        # 审查报告
├── 测试报告.md           # 测试报告
└── VERIFICATION.md      # 验证报告
```

---

## 输出清单

```
features/{id}/
├── code/                      # 代码变更（待提交）
├── code-review.md             # 审查报告
├── 测试报告.md                # 测试报告
└── VERIFICATION.md            # 验证报告
```

**注意**：代码变更状态为「待提交」，由 tech-commit 统一执行 git commit

---

## 验证失败与重试处理

<TOOL-REQUIREMENT>
若 Verification 的 `task` 工具返回失败：
主 Agent 应主动根据反馈补充缺失的测试用例或修复逻辑代码，随后再次调用 `task` 工具进行回归验证。
</TOOL-REQUIREMENT>

超过3次验证失败：

```
输出：features/{id}/VERIFICATION-FAILED.md
记录：所有未解决问题
暂停：等待人工决策
```

---

## 参考文档

- `wave-execution.md` — Wave 执行细节
- `deviation-handling.md` — 偏差处理策略（含 3 次失败→质疑架构规则）
- `quality-gate.md` — 质量门禁
- `session-recovery.md` — Session 恢复
- `state-management.md` — STATE.md 活跃状态管理（含战略压缩时机）
- `anti-rationalization.md` — 反合理化表格
- `@agents/tech-plan-checker.md` — 任务表验证 Agent
- `@agents/tech-verifier.md` — 目标回溯验证 Agent
- `@agents/decision-guardian.md` — 决策合规校验
- `@agents/spec-compliance-reviewer.md` — 方案符合性审查 Agent
- `@agents/security-reviewer.md` — 安全审查 Agent
- `@agents/code-reviewer.md` — 代码质量审查 Agent
- `@agents/agents/java/java-reviewer.md` — Java 审查 Agent
- `@agents/agents/java/springboot-reviewer.md` — Spring Boot 审查 Agent
- `@configs/rules/code-review-checklist.md` — 代码审查清单
- `@docs/guides/test-plan.md` — 测试计划
