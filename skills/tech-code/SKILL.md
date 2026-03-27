---
name: tech:code
description: Wave并行执行 + 三阶段验证循环，支持偏差处理、质量门禁和Session恢复。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "3.0"
---

# /tech:code

## 功能
Wave并行执行 + 三阶段验证循环

**核心特性：**
- Wave 并行执行（依赖分析 + 拓扑排序）
- 偏差处理（Deviation Handling）
- 质量门禁（Quality Gate）
- Session 恢复（断点续传）

**重要约束：**
- ⚠️ 禁止在 tech-commit 之前自动执行 git commit
- 所有代码变更仅标记为「待提交」，由 tech-commit 统一处理

## 输入

- `features/{id}/任务拆解表.md`
- `features/{id}/技术方案.md`

---

## 执行流程

```
┌─────────────────────────────────────────────┐
│  Phase 1: Plan Check                       │
│  验证任务表完整性和依赖正确性                 │
└──────────────────┬────────────────────────┘
                   ↓
              [通过/失败]
                   ↓失败
            返回修改建议，重试(≤3次)
                   ↓通过
┌─────────────────────────────────────────────┐
│  Phase 2: Wave Execution                    │
│  - 分析任务依赖，分波次                       │
│  - 同Wave并行执行，不同Wave等待               │
│  - 质量门禁：每Wave结束检查                  │
│  - 偏差处理：发现问题自动处理或暂停          │
│  - Session恢复：断点续传                      │
└──────────────────┬────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Phase 3: Code Review                      │
│  安全审查 + 质量审查                         │
│  多Agent并行审查                            │
└──────────────────┬────────────────────────┘
                   ↓
              [通过/失败]
                   ↓失败
            修复 → 重审(≤3次)
                   ↓通过
┌─────────────────────────────────────────────┐
│  Phase 4: Verification                     │
│  目标回溯验证，检查是否达成目标              │
│  覆盖率门禁 + 交付清单                      │
└──────────────────┬────────────────────────┘
                   ↓
              [通过/失败]
                   ↓失败
            补充测试/修复(≤3次)
                   ↓通过
            输出报告
```

---

## Phase 1: Plan Check

### 1.1 读取任务表

```
读取：features/{id}/任务拆解表.md
```

### 1.2 验证完整性

| 检查项 | 说明 |
|--------|------|
| 格式正确 | 表头完整，字段齐全 |
| 无循环依赖 | 依赖图无环 |
| 估时合理 | 单任务 < 3d |
| 关键任务无遗漏 | 技术方案中的功能点都有对应Task |

### 1.3 依赖分析

```
构建依赖图：
  - 任务ID → 依赖任务ID
  - 识别关键路径（最长路径）
  - 识别可并行任务组
```

### 1.4 失败处理

```
IF 验证失败 THEN
  输出：修改建议清单
  等待用户修复后重试
  最多重试3次
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

调用 `wave-execution.md`：

### 2.1 Wave 分解

```
基于依赖图，拓扑排序分波次：

Wave 1: 无依赖任务（入度为0）
Wave 2: 依赖 Wave 1 完成后可执行的任务
Wave 3: 依赖 Wave 2 完成后可执行的任务
...
```

### 2.2 并行执行

```
FOR each Wave DO
  FOR each Task IN Wave DO
    并行启动 Subagent 执行 Task
  END

  # 等待 Wave 内所有任务完成
  WAIT ALL

  # 质量门禁检查
  IF 质量门禁未通过 THEN
    暂停，等待修复
  END
END
```

### 2.3 质量门禁

每 Wave 结束后检查：

| 检查项 | 标准 | 未通过处理 |
|--------|------|-----------|
| 编译 | `mvn compile` | 阻断下一个 Wave |
| 单元测试 | 全部通过 | 阻断下一个 Wave |
| 行覆盖率 | ≥ 80% | 警告，可配置阻断 |
| 安全扫描 | 无高危漏洞 | 阻断下一个 Wave |

详见 `quality-gate.md`

### 2.4 偏差处理

执行中发现问题？

| 偏差类型 | 定义 | 处理策略 |
|-----------|------|----------|
| Scope 偏差 | 任务范围变化 | 记录，继续执行 |
| 依赖偏差 | 实际依赖与预期不符 | 自动补充依赖，重新分波 |
| 技术偏差 | 技术方案无法实现 | 暂停，询问用户 |

详见 `deviation-handling.md`

### 2.5 Session 恢复

```
上下文满时 / 执行 /clear 后：
  1. 保存执行状态到 .claude/tech-code-state.json
  2. 记录：已完成 Wave、已完成 Task、当前状态

下次执行时：
  1. 检测是否有未完成状态
  2. 从断点继续，跳过已完成任务
  3. 询问用户是否恢复
```

详见 `session-recovery.md`

### 2.6 每任务完成

```
Task 完成时：
  1. 运行自测
  2. 标记为「待提交」（不执行 git commit）
  3. 更新状态文件

⚠️ 禁止自动 git commit，统一由 tech-commit 处理
```

---

## Phase 3: Code Review

### 3.1 多Agent并行审查

```
同时启动：
  - security-reviewer: 安全审查
  - code-reviewer: 质量审查

两者并行执行，结果汇总
```

### 3.2 审查维度

| Agent | 维度 | 严重程度 |
|-------|------|----------|
| security-reviewer | SQL注入、敏感信息、权限校验 | BLOCK |
| code-reviewer | 数据类型、分页、枚举、异常 | WARN |

### 3.3 失败处理

```
IF 审查失败 THEN
  按严重程度修复：
    - BLOCK: 必须修复
    - WARN: 建议修复

  修复后重新审查
  最多重试3次
END
```

---

## Phase 4: Verification

调用 `verification.md`：

### 4.1 目标回溯

```
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

## 验证失败处理

超过3次验证失败：

```
输出：features/{id}/VERIFICATION-FAILED.md
记录：所有未解决问题
暂停：等待人工决策
```

---

## 参考文档

- `wave-execution.md` — Wave 执行细节
- `deviation-handling.md` — 偏差处理策略
- `quality-gate.md` — 质量门禁
- `session-recovery.md` — Session 恢复
- `verification.md` — Verification 详情
- `@docs/guides/code-review-checklist.md`
- `@docs/guides/test-plan.md`
