---
name: tech:code
description: 代码开发技能。执行编码任务，进行模式扫描、合规审查和 CHECK-2 门禁控制。
triggers: ["/tech:code"]
---

# /tech:code

代码开发技能。执行编码任务，进行模式扫描、合规审查和 CHECK-2 门禁控制。

---

## 触发条件

- 功能规划已完成 (CHECK-1 通过)
- 用户输入 `/tech:code` 或 `/tech:code [任务描述]`
- SPEC-STATE 为 PLAN

---

## 执行流程 (5 Phase)

### Phase 1: CHECK-2 进入门禁

调用 `scripts/check-gate-2-enter.sh` 验证进入条件：

```bash
./scripts/check-gate-2-enter.sh [项目路径]
```

**检查项**:
- [x] CHECK-1 已通过
- [x] spec.md 存在且有锁定决策 (D-XXX)
- [x] tasks.md 存在且任务数 ≤8 (T-XXX)
- [x] SPEC-STATE 为 PLAN

**结果处理**:
- **PASS**: 继续 Phase 2
- **FAIL**: 显示错误信息，终止执行

---

### Phase 2: Pattern Scan (模式扫描)

调用 `scripts/pattern-scan.sh` 扫描项目代码模式：

```bash
./scripts/pattern-scan.sh [项目路径] [输出路径]
```

**扫描维度**:
| 维度 | 扫描内容 | 用途 |
|------|----------|------|
| Controller | 命名风格、注解风格、路径风格、返回格式 | 确保新代码符合项目模式 |
| Service | 命名风格、接口/实现分离、事务模式 | 指导代码实现 |
| Repository | 命名风格、继承关系、查询方式 | 数据层模式参考 |
| Entity | 命名风格、ID 生成策略、字段注解、审计字段 | 实体定义参考 |
| Config | 命名风格、配置方式、Profile 使用 | 配置模式参考 |
| Exception | 全局异常处理、业务异常、错误码定义 | 异常处理参考 |

**输出**: `patterns.md` - 项目代码模式文档

---

### Phase 3: 编码执行 (superpowers 委托)

tinypowers 作为编排层，委托 superpowers 执行具体编码任务：

#### 3.1 建立隔离环境 (superpowers:using-git-worktrees)

委托 superpowers:using-git-worktrees 创建工作区隔离：

**委托内容**:
- 基于 main/master 创建独立 worktree
- 确保开发环境与主分支隔离

**期望返回**:
- worktree 路径
- 分支名称

#### 3.2 执行编码 (superpowers:subagent-driven-development)

委托 superpowers:subagent-driven-development 执行具体编码：

**委托内容**:
- 当前任务 (从 tasks.md 提取)
- spec.md 中的技术方案
- patterns.md 中的项目模式
- 验收标准 (从 PRD.md 提取)

**tinypowers 增强**:
- 确保代码符合 patterns.md 中的项目模式
- 确保锁定决策 (D-XXX) 在代码中得到落实
- 确保代码变更在需求范围内

#### 3.3 代码审查 (superpowers:requesting-code-review)

委托 superpowers:requesting-code-review 进行代码审查：

**委托内容**:
- 代码变更 (git diff)
- 技术方案 (spec.md)
- 项目模式 (patterns.md)

**期望返回**:
- 审查意见
- 建议修改项

#### 3.4 完成验证 (superpowers:verification-before-completion)

委托 superpowers:verification-before-completion 进行完成前验证：

**委托内容**:
- 代码实现
- 验收标准 (PRD.md)
- 测试要求

**期望返回**:
- 验证结果
- 测试覆盖率

---

### Phase 4: 审查 (compliance-reviewer)

调用 `agents/compliance-reviewer.md` 进行方案符合性审查：

**审查维度**:
| 维度 | 检查内容 | 级别 |
|------|----------|------|
| 决策落地 | spec.md 中的 D-XXX 是否在代码中实现 | BLOCK/WARN/PASS |
| 接口符合 | API 路径、参数、返回值是否与 spec 一致 | BLOCK/WARN/PASS |
| 数据符合 | Entity 字段、DB 变更是否与 spec 一致 | BLOCK/WARN/PASS |
| 范围符合 | 代码变更是否在 PRD.md 范围内 | BLOCK/WARN/PASS |
| 安全符合 | 输入校验、SQL 注入、权限检查等 | BLOCK/WARN/PASS |

**输出**: `compliance-review-report.md`

**处理规则**:
- **BLOCK = 0**: 审查通过，继续 Phase 5
- **BLOCK > 0**: 必须修复后才能继续
- **WARN > 0**: 建议修复，可选择接受风险

---

### Phase 5: CHECK-2 离开门禁

调用 `scripts/check-gate-2-exit.sh` 验证离开条件：

```bash
./scripts/check-gate-2-exit.sh [项目路径] [worktree路径]
```

**检查项**:
- [x] 代码编译通过 (人工确认)
- [x] compliance-reviewer 通过 (BLOCK = 0)
- [x] requesting-code-review 完成 (人工确认)
- [x] verification-before-completion 完成 (人工确认)
- [x] 决策自查完成 (所有 D-XXX 有对应代码位置)

**输出**: `VERIFICATION.md` - 验证报告

**结果处理**:
- **PASS**: 更新 SPEC-STATE 为 DONE，继续 /tech:commit
- **FAIL**: 显示错误信息，返回修复

---

## 与 superpowers 的边界

| 能力 | 归属 | 说明 |
|------|------|------|
| CHECK-2 门禁 | tinypowers | 独有的阶段检查 |
| Pattern Scan | tinypowers | 项目模式扫描脚本 |
| compliance-reviewer | tinypowers | 方案符合性审查 Agent |
| using-git-worktrees | superpowers | 工作区隔离，委托执行 |
| subagent-driven-development | superpowers | 编码执行，委托执行 |
| requesting-code-review | superpowers | 代码审查，委托执行 |
| verification-before-completion | superpowers | 完成验证，委托执行 |

**核心原则**: tinypowers 管 WHAT (做什么、门禁是什么、符合性标准)，superpowers 管 HOW (怎么编码、怎么审查)。

---

## 输出产物

| 文件 | 路径 | 用途 |
|------|------|------|
| patterns.md | 项目根目录 | 项目代码模式文档 |
| compliance-review-report.md | 项目根目录 | 合规审查报告 |
| VERIFICATION.md | 项目根目录 | 验证报告 |

---

## 状态流转

```
[PLAN] → CHECK-2进入 → Pattern Scan → 编码(委托) → 审查 → CHECK-2离开 → [DONE]
                              ↓              ↑
                         [BLOCK] ← compliance-reviewer ← [FAIL]
```

---

## 错误处理

| 场景 | 处理策略 |
|------|----------|
| CHECK-2 进入失败 | 提示用户先完成 feature 阶段 |
| Pattern Scan 失败 | 记录警告，继续执行 |
| 编码失败 | 显示错误信息，等待修复 |
| compliance-reviewer BLOCK | 显示详细问题，指导修复 |
| CHECK-2 离开失败 | 生成修复建议，返回 Phase 3 |

---

## 示例

### 完整流程示例

```
用户: /tech:code

AI: 执行 CHECK-2 进入门禁检查...
[PASS] CHECK-1 已通过
[PASS] spec.md 存在且有 3 条锁定决策
[PASS] tasks.md 存在且有 5 个任务
[PASS] SPEC-STATE 为 PLAN
结论: PASS

AI: 执行 Pattern Scan 扫描项目模式...
- Controller 模式: @RestController, 统一返回 Result
- Service 模式: 接口+实现分离, @Transactional
- Repository 模式: 继承 JpaRepository
patterns.md 已生成

AI: 委托 superpowers:using-git-worktrees 建立隔离环境...
[委托执行]
返回: worktree 路径 /tmp/project-feature-xxx

AI: 委托 superpowers:subagent-driven-development 执行编码...
[委托执行]
- 任务 T-001: 实现 UserController
- 任务 T-002: 实现 UserService
- 任务 T-003: 实现 UserRepository
返回: 编码完成，变更 5 个文件

AI: 执行 compliance-reviewer 审查...
| 维度 | 状态 | BLOCK | WARN |
| 决策落地 | PASS | 0 | 0 |
| 接口符合 | PASS | 0 | 0 |
| 数据符合 | PASS | 0 | 0 |
| 范围符合 | PASS | 0 | 0 |
| 安全符合 | WARN | 0 | 1 |
总体结论: PASS (有 1 个 WARN)

AI: 执行 CHECK-2 离开门禁检查...
[PASS] 代码编译通过
[PASS] compliance-reviewer 通过
[PASS] 代码审查完成
[PASS] 验证完成
结论: PASS

VERIFICATION.md 已生成

✅ 代码开发完成！
下一步: 使用 /tech:commit 提交代码
```

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-04-09 | 初始版本，定义 5 Phase 执行流程和 superpowers 委托点 |
