---
name: tech:code
description: 当用户要求执行已规划的任务、开始编码实现、或继续未完成的执行时触发。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "10.0"
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

- \`features/{id}-{name}/方案.md\` — 合并后的需求、设计、任务
- \`docs/knowledge.md\` — **编码前必须显式读取**
- \`notepads/learnings.md\`（如存在，编码前应读取）

## 生命周期约束

- 进入本 skill 时，\`方案.md\` 的 frontmatter status 必须为 \`PLAN\` 或 \`EXEC\`
- 开始执行后推进到 \`EXEC\`
- 完成审查和验证后推进到 \`REVIEW\`
- \`/tech:commit\` 前不自动提交

## 对外流程

\`\`\`text
1. Gate Check
2. Pattern Scan（强制）
3. 开发执行
4. 审查修复（可迭代）
5. 测试与验证
6. CHECK-2（code -> commit）
\`\`\`

### 1. Gate Check

进入执行前确认：
- \`方案.md\` 存在且非空
- \`方案.md\` 包含验收标准
- \`方案.md\` 第 2 节有至少 1 条已确认决策
- \`方案.md\` 第 3 节有明确的任务拆解

推进到 \`EXEC\`：
\`\`\`bash
node "${TINYPOWERS_DIR}/scripts/update-spec-state.js" \
  --root . \
  --feature "{feature-dir-name}" \
  --to EXEC
\`\`\`

### 2. Pattern Scan（强制）

**编码前必须完成模式扫描，不假设 API 存在**：

\`\`\`markdown
1. 读取 \`docs/knowledge.md\` — 项目级领域知识
2. 读取 \`notepads/learnings.md\`（如存在）— feature 级经验
3. **扫描同目录现有代码** — 了解实际 API：
   - 创建 Model 前：读取现有 Model 类，确认字段命名规范
   - 创建 Mapper 前：读取现有 Mapper 接口，确认方法命名
   - 创建 Service 前：读取现有 Service，确认事务边界
   - 创建 Controller 前：读取现有 Controller，确认响应格式
4. **编译验证** — 每完成一个文件立即 \`mvn compile\` 验证
\`\`\`

**HARD-GATE**: 未完成 Pattern Scan 不得开始编码。
这是防止 AI 假设不存在 API 的关键步骤。

### 3. 开发执行

默认策略：
- 先复用已有模式
- 只加载当前任务真正需要的上下文
- 优先直接落代码，不把执行策略暴露成额外阶段

渐进式实现：
1. 先写接口定义
2. 编译通过后再写实现
3. 每个 public 方法后 \`mvn compile\` 验证

复杂需求时可以额外使用：
- worktree 隔离
- 多 Wave 执行

### 4. 审查修复（可迭代）

固定顺序：

\`\`\`text
compliance-reviewer（方案符合性 + 安全）
  -> code-reviewer（代码质量与工程风险）
  -> update-verification.js（写回 VERIFICATION.md）
  -> repair loop（如有问题则修复并复审）
\`\`\`

原则：
- 先确认"做的是对的东西"
- 再确认"实现是否安全"
- 最后处理可维护性与代码质量问题

执行要求：
- \`compliance-reviewer\` 输出"决策合规性 + 安全审查"结构化结果
- \`code-reviewer\` 输出"代码质量与工程风险"结构化结果
- 两类结果都必须通过 \`scripts/update-verification.js\` 写回 \`VERIFICATION.md\`

阻塞规则：
- 任一审查出现 \`BLOCK\` 或 \`FAIL\`，不得推进到 \`REVIEW\`
- 出现 \`WARNING\` 或 \`CONDITIONAL\` 时，应进入修复循环
- 只有主要问题收敛并完成验证后，才允许推进到 \`REVIEW\`

### 5. 测试与验证

验证交付物按路径分级：

- \`fast\`
  - 至少完成与验收标准对应的验证
  - 创建并更新 \`VERIFICATION.md\`
- \`medium / standard\`
  - 编写并更新 \`测试计划.md\`
  - 执行测试并填写 \`测试报告.md\`
  - 验证证据沉淀到 \`VERIFICATION.md\`

约束：
- \`VERIFICATION.md\` 必须给出明确结论，如 \`PASS / FAIL\`
- 审查结果必须通过 \`update-verification.js\` 合并
- Fast 路径可以更简洁，但不能跳过验证证据

### 6. CHECK-2（code -> commit）

进入 \`/tech:commit\` 前，输出一个显式 checkpoint 摘要：

- 变更摘要
- 测试结果
- 审查结论
- 决策合规性摘要
- 残留风险

语义：
- 有人工确认：按确认结果进入 \`/tech:commit\`
- 无人工确认但需要继续：记录 \`soft gate bypassed\`

## 输出

\`\`\`text
features/{id}-{name}/
├── 方案.md              # 状态更新为 DONE
├── VERIFICATION.md      # 验证证据
├── 测试计划.md（可选）   # medium / standard
└── 测试报告.md（可选）   # medium / standard
\`\`\`

## 配套说明

- \`VERIFICATION.md\` 是进入 \`/tech:commit\` 的前置证据
- \`docs/knowledge.md\` 是项目级知识库；编码前必须读取
- \`CHECK-2\` 摘要是 \`/tech:commit\` 的直接输入之一
- 同一问题连续失败 3 次，应停止并上升到架构讨论

**委托 superpowers**:
- Standard worktree 隔离 → \`superpowers:using-git-worktrees\`
- 完成验证 → \`superpowers:verification-before-completion\`

**委托 tinypowers agents**:
- 方案符合性 + 安全 → \`compliance-reviewer\`
- 代码质量与工程风险 → \`code-reviewer\`

**配套脚本**:
- 审查结果写回 \`VERIFICATION.md\` → \`scripts/update-verification.js\`

## Gotchas

- **Pattern Scan 是 HARD-GATE**：不完成扫描不得编码
- **编译验证要即时**：每文件后 \`mvn compile\`，不累积错误
- **不假设 API 存在**：必须先读现有代码确认
- **优先渐进式实现**：接口 -> 编译 -> 实现 -> 编译
