# Workflow Review — ORDER-102 演练复盘

> 基于 demo-order-service / ORDER-102 订单退款申请与审批流的完整演练
> 演练日期：2026-04-03
> 执行路径：init → feature → code → commit（Standard 路由）
> 测试选手: codebuddy+default

---

## 一、整体判断

当前 workflow（v5~v9）已建立了正确的骨架：**规划先行、门禁保护、可追溯提交**。
核心价值是真实的。问题集中在三个方面：

1. **文档密度过高**：相同信息在多个文档中重复出现
2. **AI 自驱时暂停点失效**：设计为"人机协作"的暂停点，在 AI 自驱场景中变成空转
3. **路由分级不够彻底**：Fast/Medium/Standard 的差异体现在口头描述，但文档模板、步骤数量几乎相同

---

## 二、逐步骤问题明细

### tech:init

| 问题 | 现象 | 影响 |
|------|------|------|
| 不区分"主树 init"与"worktree 继承" | worktree 已有完整骨架，init 流程仍走完整确认 | 产生无效确认轮次 |
| 更新策略（Update/Skip/Overwrite）在 worktree 场景无意义 | worktree 从主树继承文件，没有独立 init 的概念 | 流程噪音 |
| 检测结果确认 4 项（技术栈/构建工具/规则集/MySQL）对已 init 项目冗余 | 每次进入 worktree 都要重新确认 | 上下文污染 |

**建议**：
- 增加 `--skip-if-initialized` 快速路径：检测到 `CLAUDE.md` + `.claude/` 完整后，输出一行确认并跳过后续步骤
- Worktree 检测：检测到 `.git` 文件（非目录）时，识别为 worktree，直接跳到 Step 5（知识扫描）

---

### tech:feature

| 问题 | 现象 | 影响 |
|------|------|------|
| PRD 与技术方案内容重叠 | 范围边界（In Scope/Out of Scope）在 PRD 和技术方案中各写一遍；接口设计在技术方案和任务拆解中重复描述 | 维护两份文档，改一处要改两处 |
| 双暂停点在 AI 自驱时失效 | "输出技术方案后暂停"和"输出任务拆解后暂停"在 AI 自驱场景中没有人响应，变成文字描述 | 确认机制形式化 |
| 路由选择标准模糊 | "跨系统依赖"是升级到 Standard 的信号，但没有明确定义什么算"跨系统" | AI 路由选择随机性高 |
| notepads/learnings.md 在 PLAN 阶段创建但内容为空 | feature 阶段创建文件，code 阶段才有内容，commit 阶段才沉淀 | 空文件噪音 |

**建议**：
1. **PRD + 技术方案合并为单文件**（`DESIGN.md`）：结构化为"需求 + 方案 + 决策"三节，消除重复
2. **暂停点明确化**：不用文字描述"暂停"，而是直接在文档末尾加 `## ✅ 等待人工确认`，并在 SPEC-STATE 中加 `PLAN-CONFIRMED` 子状态
3. **路由决策表**：用二维表（任务数 × 跨系统）替代文字描述，避免歧义
4. **learnings.md 延迟创建**：改为 EXEC 阶段按需创建，不在 PLAN 阶段创建空文件

---

### tech:code

| 问题 | 现象 | 影响 |
|------|------|------|
| 审查两步（compliance → code review）在 AI 自驱时等于自审自查 | AI 写了代码，AI 做了审查，没有真正的外部视角 | 安全和质量风险无法被发现 |
| 测试计划 + 测试报告强制两个文件 | 本次 6 个验收标准，测试计划 20 行，测试报告 15 行，内容高度重叠 | 文档碎片化，维护负担 |
| STATE.md 在单 session 执行时冗余 | Standard 路由要求 STATE.md，但单次连续执行时 STATE 只是对任务拆解表的翻版 | 重复文档 |
| Wave 粒度与任务拆解表重复 | 任务拆解表已有 Wave 列，STATE.md 再记录一遍 | 一致性维护成本 |

**建议**：
1. **合并测试计划和测试报告为 `TEST.md`**：计划（用例列表）+ 执行结果（PASS/FAIL）在同一文件，用时间戳区分轮次
2. **STATE.md 仅在跨 session 时强制**：单 session 内不要求；跨 session 重入时自动生成初稿
3. **审查步骤改为明确暂停**：AI 完成编码后输出"审查请求"（代码 diff 摘要 + 关注点），等待人工确认后才继续；若人工不可用，记录"AI 自审"并注明局限性
4. **`compliance-reviewer` 内联**：不单独作为一轮，而是在 Gate Check 时一并完成安全检查清单

---

### tech:commit

| 问题 | 现象 | 影响 |
|------|------|------|
| Push / PR 步骤在本地 demo 仓库中不可执行 | 生成了 PR 链接格式描述，实际无法使用 | 噪音输出 |
| Document Sync 容易触发"把已正确文档重写一遍" | AI 倾向于"做了些什么"，会对无需修改的文档做微调 | 不必要的 diff 污染 |
| SPEC-STATE → DONE 独立 commit 是正确的，但步骤描述过重 | 描述了 4 个子步骤，实际只需 1 个命令 | 阅读负担 |
| 知识沉淀"不为沉淀而沉淀"原则执行时难自律 | AI 倾向于把任何内容都写入 knowledge.md，包括显而易见的决策 | knowledge.md 膨胀，信噪比下降 |

**建议**：
1. **Document Sync 改为差量检查**：仅列出"本次新增/修改了哪些接口/表/配置"，明确说明"以下文档需要更新"，不泛化为"同步所有相关文档"
2. **Push/PR 改为条件步骤**：检测 `git remote` 是否存在，无 remote 则跳过，避免生成无用输出
3. **SPEC-STATE → DONE 简化**：直接给出命令，不展开 4 个子步骤
4. **knowledge.md 写入门槛**：仅在 learnings.md 明确标注 `[PERSIST]` 的条目才写入；Fast 路由默认不沉淀

---

## 三、核心问题归因

### 问题根因 1：文档系统为"人工读者"设计，AI 自驱时产生大量冗余

当前 features/ 目录在一次 Standard 需求后产生了：

```
PRD.md / 技术方案.md / 任务拆解表.md / SPEC-STATE.md /
STATE.md / 测试计划.md / 测试报告.md / VERIFICATION.md /
notepads/learnings.md
```

**9 个文件**，约 600-800 行文档，其中真正不可删除的核心是：
- `DESIGN.md`（PRD + 方案 + 决策）— **不可省**
- `VERIFICATION.md`（验收证据）— **不可省**
- `SPEC-STATE.md`（门禁状态）— **不可省**

其余 6 个文件存在不同程度的冗余，可合并或按需创建。

### 问题根因 2：暂停点设计假设了同步人机协作，但 AI 自驱是异步的

`tech:feature` 和 `tech:code` 各设计了 2 个人机确认点，总计 4 次。在真正的人机协作场景中这是合理的。但当 AI 被要求"自驱完整执行"时，这 4 个暂停点全部失效，变成 AI 自问自答。

**根本矛盾**：Skill 设计基于"AI 做提案、人做决策"的模型，但使用场景常常是"AI 做全流程演练"。

### 问题根因 3：路由分级在产物数量上没有体现差异

Fast / Medium / Standard 的口头差异清晰，但实际生成的文件结构几乎相同。Fast 路由和 Standard 路由都会创建同样的 9 个文件，只是某些文件"可以更简洁"。这导致 Fast 路由失去了其应有的轻量优势。

---

## 四、优化方案

### 方案 A：文档整合（高收益，低风险）

| 现状 | 优化后 | 节省 |
|------|--------|------|
| PRD.md + 技术方案.md + 任务拆解表.md | `DESIGN.md`（3节合1） | -2 文件 |
| 测试计划.md + 测试报告.md | `TEST.md`（计划+结果） | -1 文件 |
| STATE.md（跨 session 时） | 仅跨 session 时按需创建 | -1 文件（多数情况） |
| notepads/learnings.md（PLAN 阶段空文件） | EXEC 阶段按需创建 | -1 空文件 |

**效果**：Standard 需求从 9 文件降到 4 文件（DESIGN.md / TEST.md / VERIFICATION.md / SPEC-STATE.md）

### 方案 B：路由产物明确分层（中收益，需要 Skill 改写）

| 路由 | 必须产物 | 可选产物 |
|------|---------|---------|
| Fast（1-2 tasks） | DESIGN.md（轻模板）/ SPEC-STATE.md | VERIFICATION.md（简版）|
| Medium（3-8 tasks）| DESIGN.md / TEST.md / VERIFICATION.md / SPEC-STATE.md | STATE.md |
| Standard（跨系统）| 全部，含 STATE.md | - |

**关键变化**：Fast 路由不强制写 VERIFICATION.md，只需 commit message Evidence 字段。

### 方案 C：暂停点重设计（高价值，需要流程改动）

将 4 个隐式暂停改为 2 个显式检查点：

1. **CHECK-1（feature → code 边界）**：`DESIGN.md` 完成后，AI 输出"📋 方案摘要"（3-5 行），等待人工 `go` 指令；无人响应则记录 `[AI-SELF-APPROVED]` 标注
2. **CHECK-2（code → commit 边界）**：`VERIFICATION.md` 完成后，AI 输出"🔍 变更摘要"（新增/修改文件列表 + 测试结果），等待人工 `go`

**效果**：2 次有意义的暂停 vs 当前 4 次无效暂停。

### 方案 D：knowledge.md 写入门控（低收益，高质量）

在 `learnings.md` 中引入显式标记：

```markdown
<!-- [PERSIST] -->
`cancelByIdAndVersion` 必须双条件 WHERE，仅 version 有复用风险
<!-- /PERSIST -->
```

commit 阶段只将 `[PERSIST]` 块写入 `knowledge.md`，其余内容作为 feature-local 笔记保留在 `notepads/`。

---

## 五、优先级建议

| 优先级 | 方案 | 改动范围 | 预期效果 |
|--------|------|---------|---------|
| P0 | 方案 A（文档整合） | 4 个 Skill 模板改写 | 立竿见影，减少 50% 文档碎片 |
| P1 | 方案 C（暂停点重设计） | tech:feature + tech:code SKILL.md | 消除"自问自答"暂停点 |
| P2 | 方案 B（路由产物分层） | 3 个 Skill + scaffold 脚本 | Fast 路由真正轻量化 |
| P3 | 方案 D（knowledge 门控） | tech:commit SKILL.md + notepads 模板 | 知识库信噪比提升 |

---

## 六、不建议改动的部分

以下设计是**正确的**，不应在"简化"名义下删除：

- **SPEC-STATE 门禁**：防止跳步，有真实价值
- **Gate Check 在 tech:code 入口**：3 项前置检查，低成本高价值
- **CAS + OutBox 模式的决策记录**：knowledge 沉淀的真正价值载体
- **commit message Evidence 字段**：可追溯性的核心
- **SPEC-STATE → DONE 必须在 commit 成功后**：顺序约束正确，不可省

---

## 附录：本次演练产物清单

| 产物 | 路径 |
|------|------|
| Worktree | `/private/tmp/demo-order-service-refund` (branch: feature/ORDER-102-order-refund) |
| 功能代码 | 8 个新 Java 文件 + 1 个改动 |
| 测试 | `RefundServiceTest.java`（6 cases），全部 PASS |
| Feature 文档 | `features/ORDER-102-订单退款申请与审批/` （9 文件）|
| Git Commits | `1829ec5`（功能）+ `c104c09`（SPEC-STATE DONE）|
