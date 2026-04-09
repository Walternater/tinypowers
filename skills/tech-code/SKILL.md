<<<<<<< HEAD
<<<<<<< HEAD
---
name: tech:code
description: 当用户要求执行已规划的任务、开始编码实现、或继续未完成的执行时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "9.7"
---

# /tech:code

## 作用

把规划阶段的需求落成经过审查、测试和验证的实现。

这个阶段对外只强调四件事：
1. 开发执行
2. 审查修复
3. 测试与验证
4. 为提交准备交付证据

## 输入

- `features/{id}-{name}/PRD.md`
- `features/{id}-{name}/技术方案.md`
- `features/{id}-{name}/任务拆解表.md`
- `features/{id}-{name}/SPEC-STATE.md`
- `features/{id}-{name}/STATE.md`（可选，仅复杂执行时维护）
- `docs/knowledge.md` — **编码前必须显式读取**（平台约束、组件坑、踩坑记录）
- `notepads/learnings.md`（如存在，编码前应读取）

## 生命周期约束

- 进入本 skill 时，`SPEC-STATE` 必须为 `PLAN` 或 `EXEC`
- 开始执行后推进到 `EXEC`
- 完成审查和验证后推进到 `REVIEW`
- `/tech:commit` 前不自动提交

## 对外流程

```text
1. Gate Check
2. 开发执行
3. 审查修复（可迭代）
4. 测试与验证
5. CHECK-2（code -> commit）
```

### 1. Gate Check

进入执行前确认：
- `PRD.md` 非空且包含验收标准
- `技术方案.md` 存在且包含至少 1 条已确认决策
- `任务拆解表.md` 存在且任务明确

推进到 `EXEC` 的标准命令：

```bash
node "${TINYPOWERS_DIR}/scripts/update-spec-state.js" \
  --root . \
  --feature "{feature-dir-name}" \
  --to EXEC
```

### 2. 开发执行

**编码前必须完成上下文加载**：

```markdown
1. 读取 `docs/knowledge.md` — 项目级领域知识
2. 读取 `notepads/learnings.md`（如存在）— feature 级经验
3. 读取 `任务拆解表.md` — 当前任务详情
```

> 框架约束（HARD-GATE、Decision Lock 等）已在 README.md 覆盖，编码阶段通过 hooks 强制执行，不需要重复加载。

默认策略：
- 先复用已有模式
- 只加载当前任务真正需要的上下文
- 优先直接落代码，不把执行策略暴露成额外阶段

复杂需求时可以额外使用：
- worktree 隔离
- 多 Wave 执行
- `STATE.md` 跟踪复杂进度

`STATE.md` 建议在以下场景维护：
- 多任务 / 多 Wave
- 跨会话执行
- 需要 worktree 协作

### 3. 审查修复（可迭代）

> 本节以决策自查开头，作为开发执行（§2）收尾动作与正式审查之间的过渡检查点。

**编码完成后，进入正式审查前先做决策自查**：

```
决策落地自查（逐条核对）
----------------------------------------
逐条读取 技术方案.md 中的"锁定决策"，在代码中定位对应实现：
□ 每条决策 → 确认有对应代码体现（注解、异常处理、查询路由等）
□ 引用了项目枚举/常量 → 确认读过对应类的实际定义，未用不存在的值
□ 未落地的决策 → 立即补充，再继续

目的：把"本应在编码阶段发现的低级问题"拦截在自查阶段，
     减少 Compliance Review 的无效往返。
```

**编码规范补充**：

> 凡在代码中引用项目内的枚举或常量（非 JDK / 框架标准库），必须先读一遍对应定义文件，
> 确认枚举值存在且命名正确，再写调用代码。不得凭记忆或猜测使用枚举值。
>
> 此规范是 tech:feature 采样清单中"枚举/常量读取"要求的编码阶段补充——
> 若在 tech:feature 阶段已读过目标枚举的定义，此处可跳过重复读取。

**Java 工程编译验证**（强制执行）：

```bash
mvn compile -q
```

- 用于捕获错误 import、不存在的方法引用、编译期类型错误
- 编译失败 → 修复后再进入 Compliance Review
- **仅以下情况可申请 bypass**（需在 CHECK-2 中记录跳过原因）：
  - 工程依赖无法在本地启动的外部服务/数据库（如需连接 VPN 内网数据库才能编译）
  - 需要完整 CI 环境才能通过的注解处理器（如 MapStruct / Lombok 等须在 CI 才能生成代码）
  - bypass 时自查标准须更严格，逐行核查所有新增类型引用

自查通过后，进入正式审查：

固定顺序：

```text
compliance-reviewer（方案符合性 + 安全）
  -> code-reviewer（代码质量与工程风险）
  -> update-verification.js（写回 VERIFICATION.md）
  -> repair loop（如有问题则修复并复审）
```

原则：
- 先确认"做的是对的东西"
- 再确认"实现是否安全"
- 最后处理可维护性与代码质量问题

执行要求：
- `compliance-reviewer` 输出"决策合规性 + 安全审查"结构化结果
- `code-reviewer` 输出"代码质量与工程风险"结构化结果
- 两类结果都必须通过 `scripts/update-verification.js` 写回 `VERIFICATION.md`

阻塞规则：
- 任一审查出现 `BLOCK` 或 `FAIL`，不得推进到 `REVIEW`
- 出现 `WARNING` 或 `CONDITIONAL` 时，应进入修复循环；若决定暂不修复，必须作为残留风险写入 `VERIFICATION.md`
- 只有主要问题收敛并完成验证后，才允许推进到 `REVIEW`

### 4. 测试与验证

验证交付物按路径分级：

- `fast`
  - 至少完成与验收标准对应的验证
  - 创建并更新 `VERIFICATION.md`
  - 不要求 `测试计划.md` / `测试报告.md`
- `medium / standard`
  - 编写并更新 `测试计划.md`
  - 执行测试并填写 `测试报告.md`
  - 与验收标准对应的验证
  - 验证证据沉淀到 `VERIFICATION.md`

约束：
- `VERIFICATION.md` 不由 scaffold 预创建，应在进入测试与验证阶段时创建或补全
- `VERIFICATION.md` 必须给出明确结论，如 `PASS / FAIL` 或 `通过 / 失败`
- 审查结果必须通过 `update-verification.js` 合并，不手工随意追加区块
- `测试计划.md` 与 `测试报告.md` 在 `medium / standard` 路径可以轻量，但不应省略
- Fast 路径可以更简洁，但不能跳过验证证据

### 5. CHECK-2（code -> commit）

进入 `/tech:commit` 前，按以下固定格式输出 checkpoint 摘要：

```
--- CHECK-2 ---
变更：新增 {新增数} 个文件，修改 {修改数} 个文件
测试：{通过数}/{总数} TC 通过（如全通过可注明"全通过"）
审查：Compliance {PASS/FAIL}，Code Review {PASS/FAIL}
决策：{已落地数}/{总数} 条锁定决策已落地（如全落地可注明"全落地"）
残留风险：{风险描述，无则填"无"}
门禁：{人工确认 / soft gate bypassed}
---------------
```

语义：
- 有人工确认：按确认结果进入 `/tech:commit`
- 无人工确认但需要继续：`门禁` 填 `soft gate bypassed`
- `soft gate bypassed` 只是边界说明，不等于审批通过

## 内部执行说明

以下能力保留，但作为内部实现细节，不应成为默认公开流程：
- Pattern Scan
- Context Preparation
- Wave Execution
- worktree 隔离
- `STATE.md` 自动生成初稿

推荐使用方式：
- Fast / Medium：本地直接执行，必要时合并审查收口
- Standard：可使用 worktree、subagent、`STATE.md`

## 输出

```text
features/{id}-{name}/
├── VERIFICATION.md
├── 测试计划.md（可选，仅 medium / standard）
├── 测试报告.md（可选，仅 medium / standard）
└── STATE.md（可选，仅复杂执行时）
```

## 配套说明

- `VERIFICATION.md` 是进入 `/tech:commit` 的前置证据
- `测试计划.md` 和 `测试报告.md` 是 `medium / standard` 路径的显式交付物
- `docs/knowledge.md` 是项目级知识库；编码前必须读取，交付后如有新知识可回写
- `CHECK-2` 摘要是 `/tech:commit` 的直接输入之一
- 同一问题连续失败 3 次，应停止并上升到架构讨论

**委托 superpowers**:
- Standard worktree 隔离 → `superpowers:using-git-worktrees`
- 完成验证 → `superpowers:verification-before-completion`

**委托 tinypowers agents**:
- 方案符合性 + 安全 → `compliance-reviewer`
- 代码质量与工程风险 → `code-reviewer`

**配套脚本**:
- 审查结果写回 `VERIFICATION.md` → `scripts/update-verification.js`
=======
=======
---
name: tech:code
description: 代码开发技能。执行编码任务，进行模式扫描、合规审查和 CHECK-2 门禁控制。
triggers: ["/tech:code"]
---

>>>>>>> 3dae26e (fix: 修复审查报告中的 P1 问题)
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
>>>>>>> c5568cc (docs(v1.0): complete v1.0 release preparation)
