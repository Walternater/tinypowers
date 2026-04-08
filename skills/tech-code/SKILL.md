---
name: tech:code
description: 当用户要求执行已规划的任务、开始编码实现、或继续未完成的执行时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "9.1"
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

**编码完成后，进入正式审查前先做决策自查**：

```
决策落地自查（逐条核对，5 分钟内完成）
----------------------------------------
逐条读取 技术方案.md 中的"锁定决策"，在代码中定位对应实现：
□ 每条决策 → 确认有对应代码体现（注解、异常处理、查询路由等）
□ 引用了项目枚举/常量 → 确认读过对应类的实际定义，未用不存在的值
□ 未落地的决策 → 立即补充，再继续

目的：把"本应在编码阶段发现的低级问题"拦截在自查阶段，
     减少 Compliance Review 的无效往返。
```

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
变更：新增 {N} 个文件，修改 {N} 个文件
测试：{N}/{N} TC 通过
审查：Compliance {PASS/FAIL}，Code Review {PASS/FAIL}
决策：{N}/{N} 条锁定决策已落地
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
