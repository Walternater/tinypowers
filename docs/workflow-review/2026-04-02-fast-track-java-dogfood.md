# Fast Track Java 小需求端到端试跑审查报告

日期：2026-04-02  
执行者：AI 自跑（无人工介入）  
测试工程：`/tmp/demo-app`（Java Maven，Spring Boot）  
测试需求：`DEMO-001 用户登录`（POST /api/auth/login + JWT，预计 < 1 人天）

---

## 试跑路径

```text
tech:init -> tech:feature (Fast) -> tech:code (Fast) -> tech:commit (Fast)
```

每步均先执行、后审查，最后汇总。

---

## 一、`tech:init` 审查

### 执行步骤回溯

```bash
# Step 0: 预检（手动判断：有 pom.xml，Java 项目，未初始化）
# Step 1: 技术栈检测（手动扫描 pom.xml）
# Step 2: 向用户确认检测结果（此次自跑跳过）
# Step 3: 确认更新策略（默认 Update）
# Step 4: 运行脚本
node init-project.js \
  --root /tmp/demo-app \
  --install-root /Users/wcf/personal/tinypowers \
  --project-name demo-app \
  --tech-stack "Java (Maven)" \
  --tech-stack-short java \
  --build-tool Maven \
  --build-command "mvn test" \
  --include-mysql
# Step 5: 知识扫描 → lazy mode（空项目，跳过）
# Step 6: validate.js（初始化验证通过）
```

### 发现的问题

| # | 问题 | 严重度 |
|---|------|--------|
| I-1 | SKILL.md 描述了 6 个 Phase，实际脚本只有 1 步 `init-project.js`；AI 需要把 6 个 Phase 全部手动推进，3/6 步是"手动判断+等待用户确认"，流程叙述远重于实际工作 | HIGH |
| I-2 | `init-project.js` 需要 8+ 个命令行参数，但 SKILL.md 只给出了样例，AI 实际拼参数时容易出错（`--tech-stack-short`、`--build-command` 等名字不直觉） | MEDIUM |
| I-3 | `workflow-guide.md`（已部署到目标项目）仍包含旧产物名：`CHANGESET.md`、`需求理解确认.md`、`评审记录.md`，与当前 feature SKILL.md 不一致 | MEDIUM |
| I-4 | `workflow-guide.md` 中的"日常使用建议"仍是旧版 6 步路径，与 Fast/Standard 分级不匹配 | MEDIUM |
| I-5 | `development-spec.md` 末尾引用了 3 个不存在的文档：`prd-analysis-guide.md`、`test-plan.md`、`change-set-model.md` | MEDIUM |
| I-6 | stderr 出现 `awk: syntax error`、`grep: unrecognized option` 等壳层噪音（来自 `.zshrc` 环境），虽不影响运行但会让 AI 误判失败 | LOW |

### 复杂度判断

**过重**。SKILL.md 设计了 6 个正式 Phase，但实际有意义的操作只有 2 步：运行脚本 + 验证。Phase 2（确认检测结果）和 Phase 3（更新策略）对 AI 来说是多余的打断——AI 自己能检测，不需要再问用户确认一次才能继续。

---

## 二、`tech:feature` 审查

### 执行步骤回溯

```bash
# Phase 0: scaffold
node scaffold-feature.js --root /tmp/demo-app --id DEMO-001 --name 用户登录 --track fast

# Phase 1F: 填写 PRD.md（AI 手动写入内容）
# Phase 2F: 填写 技术方案.md（含锁定决策）
#            填写 任务拆解表.md
# 结果: SPEC-STATE = PLAN
```

### 发现的问题

| # | 问题 | 严重度 |
|---|------|--------|
| F-1 | Fast 路径产出了 4 个文件（PRD + 技术方案 + 任务拆解表 + SPEC-STATE），对"用户登录"这种 1 人天需求，PRD 和技术方案有大量空白字段无法填写（如非功能要求、外部依赖、risk），最终产出空白模板而非真实文档 | HIGH |
| F-2 | PRD 模板包含 `EARS 格式说明表`（4 行示例），这部分内容在模板里是说明性的，但 AI 往往把它当正文保留，导致每份 PRD 都携带一份"格式说明书" | MEDIUM |
| F-3 | `技术方案.md` Fast 版有"Fast Route 适用性 checkbox"，这 4 个 checkbox 本应在 Phase 0 分级时就已经判定，在文档里重复出现是冗余的 | MEDIUM |
| F-4 | `任务拆解表.md` Fast 版末尾有"可执行性确认"区块，状态为 `待确认`，但 Fast 路径的 SPEC-STATE 门禁会在 `update-spec-state.js` 里做验证，这里的确认区块是流程里的第二把锁，职责重叠 | LOW |
| F-5 | `scaffold-feature.js` 生成的 `learnings.md` 包含"关键决策"表格，而决策已经记录在 `技术方案.md`，两处重复维护 | LOW |

### 复杂度判断

**中等偏重**。Fast 路径的初衷是"压缩到 2 个阶段"，但模板本身没有随之瘦身——仍然是 Standard 模板减去一部分的形态，而不是从 Fast 场景出发设计的最小模板。AI 填充时面对大量"不适用"字段，反而花更多时间判断"这个要不要填"。

---

## 三、`tech:code` 审查

### 执行步骤回溯

```bash
# Gate Check（通过）
# Pattern Scan → 无参考实现，标记 GREENFIELD
# 直接编码 AuthController.java
# 写 VERIFICATION.md
# update-spec-state --to REVIEW
```

### 发现的问题

| # | 问题 | 严重度 |
|---|------|--------|
| C-1 | Gate Check 要验证"技术方案.md 存在且包含锁定决策"，`update-spec-state.js` 用正则 `/(已锁定决策\|决策记录\|锁定决策)/` 检测，但 Fast 版模板的表头是"锁定决策"——只要 AI 没有照模板填写，这个关键词可能对不上，造成误拦或漏拦 | MEDIUM |
| C-2 | STATE.md 由 `update-spec-state.js` 自动从任务拆解表生成，但生成逻辑依赖"T-\d+ 开头的表格行"正则匹配；如果任务表里有中文编号或其他格式，STATE.md 就会生成空 Wave | MEDIUM |
| C-3 | Fast 路径不要求写 `notepads/learnings.md`，但脚手架强制创建了该文件（带空模板），提交时会带入一个意义不大的空文件 | LOW |
| C-4 | `VERIFICATION.md` 格式完全自由，没有模板约束；`update-spec-state.js` 在推进到 DONE 时用正则 `/(PASS\|通过)/` 检测，AI 如果不知道这个约定，写了"✅ 全部通过"就会被拦截 | MEDIUM |

### 复杂度判断

**合理**。这是整个流程里最轻的一步。唯一的隐患是两处正则门禁（锁定决策 / PASS|通过）对模板外的写法不鲁棒，容易造成"写了但被拦"或"没写但放行"的误判。

---

## 四、`tech:commit` 审查

### 执行步骤回溯

```bash
# Document Sync：无需更新（无 API 文档、README 无关）
# Knowledge Capture：learnings.md 空白，跳过
# Git Commit（[AI-Gen] 格式）
# update-spec-state --to DONE
```

### 发现的问题

| # | 问题 | 严重度 |
|---|------|--------|
| M-1 | `tech:commit` SKILL.md 要求检查"工作区无无关改动"，但没有任何脚本或 hook 支撑这个检查，完全依赖 AI 自觉 | MEDIUM |
| M-2 | `推进到 DONE` 是 commit 后的一个独立命令，需要 AI 记得执行；如果 AI 忘了，Feature 目录会永远停留在 REVIEW，影响下次 spec-state-guard 的判断 | HIGH |
| M-3 | Fast 路径的 Document Sync 没有定义"最小检查集"，AI 容易陷入"我需要检查哪些文档"的犹豫，而 Standard 路径的清单（技术方案/API文档/README/数据库文档）对 Fast 小需求又明显过重 | MEDIUM |

### 复杂度判断

**轻量但有漏洞**。commit 本身很快，但"推进到 DONE"是容易遗漏的隐式步骤，且无任何提醒机制。一旦遗漏，spec-state-guard 会在下次开新需求时误判当前还有活跃 Feature，拦截编码操作。

---

## 五、横向问题汇总

### 5.1 文档与代码比例失衡

| 阶段 | 文档操作次数 | 代码操作次数 |
|------|------------|------------|
| init | 9（写入 9 个文件） | 0 |
| feature | 4（填写 4 个模板） | 0 |
| code | 2（VERIFICATION + STATE更新） | 1（写业务代码） |
| commit | 2（推进状态 × 2） | 1（git commit） |
| **总计** | **17** | **2** |

一个"用户登录"接口，产生了 17 次文档操作 vs 2 次代码操作。

### 5.2 状态机过于细碎

当前状态机：`PLAN → EXEC → REVIEW → DONE`，每次推进都需要：
1. 运行 `update-spec-state.js`（带 5 个参数）
2. 手动填写 `--note`
3. 验证前置条件（脚本内部）

对于 Fast 路径，4 次状态推进（创建时 PLAN、进入编码 EXEC、完成 REVIEW、提交 DONE）都需要显式命令触发，而且命令本身不直觉（参数繁琐）。

### 5.3 "旧文档"问题影响信任

`workflow-guide.md`（已安装到目标项目）存在与当前 SKILL.md 不一致的内容：
- 旧产物列表（CHANGESET.md、需求理解确认.md）
- 旧的 6 步路径
- 不存在的文档引用

这是一个"文档漂移"问题：SKILL.md 已经迭代，但 guide 模板没有跟上。AI 读了 guide 会拿到错误的流程指引。

---

## 六、优化建议（补充 dogfood-optimization-plan.md）

以下是本次 Fast Track 小需求试跑新发现的问题，作为对现有优化计划的补充。

### 补充 P0：DONE 推进自动化

**问题**：commit 后"推进到 DONE"是最容易遗漏的步骤，且遗漏后果严重（影响下次编码）。

**建议**：在 `tech:commit` 的 SKILL.md 中，把"推进 SPEC-STATE 到 DONE"从"完成后"改为"commit 命令的下一步"，并在 commit 步骤末尾加入显式检查提示：

```bash
# 推荐：将两步合并为一个"收口动作"
git commit -m "..." && node scripts/update-spec-state.js --feature {name} --to DONE --note "已提交"
```

### 补充 P1：Fast 路径模板专项瘦身

**问题**：Fast 模板是 Standard 模板的"删减版"，而不是"Fast 场景重新设计版"。

**建议**：

`PRD.md` Fast 版应只保留：
```markdown
## 背景（1-3 句话）
## In Scope / Out of Scope（列表）
## 验收标准（EARS 格式，无需格式说明表）
```

`技术方案.md` Fast 版应删除：
- Fast Route 适用性 checkbox（在 PLAN 分级时已决定）
- 任务与验证映射（已在任务拆解表中）

`learnings.md` Fast 路径不预创建，只在有内容时由 AI 手动创建。

### 补充 P1：VERIFICATION.md 标准化

**问题**：VERIFICATION.md 完全自由格式，但 `update-spec-state.js` 硬依赖 `/(PASS|通过)/` 正则。

**建议**：在 `configs/templates/` 中增加 `verification.md` 模板，scaffold 在进入 EXEC 时同步创建（空白），AI 填写后格式有保障：

```markdown
# VERIFICATION

## 结论
**PASS** / **FAIL**

## 检查项
| 检查 | 结果 |
```

### 补充 P2：workflow-guide.md 同步更新

**问题**：已安装到目标项目的 `workflow-guide.md` 包含旧产物名和旧路径，与当前 SKILL.md 不一致。

**建议**：
1. 删除 `workflow-guide.md` 中的旧产物清单（CHANGESET.md、需求理解确认.md、评审记录.md）
2. 更新"全流程总览"图为 Fast/Standard 双路径
3. 删除 3 个不存在的文档引用（`prd-analysis-guide.md`、`test-plan.md`、`change-set-model.md`）

### 补充 P2：锁定决策关键词统一

**问题**：`update-spec-state.js` 用 `/(已锁定决策|决策记录|锁定决策)/` 检测技术方案合法性，但模板中的表头可能用"锁定决策"或"已确认"等变体，导致检测不稳。

**建议**：在所有技术方案模板中统一使用固定标记行：

```markdown
<!-- DECISIONS-LOCKED -->
```

脚本改为检测该注释行，比正则更可靠。

---

## 七、当前状态 vs 优化后预期

| 指标 | 当前（Fast Track） | 优化后目标 |
|------|-------------------|-----------|
| init 需要 AI 拼装的参数数 | 8+ | 2（--root + --auto） |
| feature 模板空白字段比例 | ~40%（Fast 场景） | < 10% |
| code → commit 需要的显式状态推进次数 | 2（REVIEW + DONE） | 1（合并为 commit 后自动推进 DONE） |
| VERIFICATION.md 格式合规率 | 取决于 AI 记忆 | 100%（有模板） |
| workflow-guide.md 与 SKILL.md 一致性 | ❌ 不一致 | ✅ 同步 |

---

## 八、不建议动的部分

以下机制经过这次试跑验证是合理的，**不建议改动**：

1. **`spec-state-guard.js`**：PLAN 阶段拦截代码编辑的门禁机制有效，没有误拦，也没有漏拦。
2. **`update-spec-state.js` 的前置条件校验**：从 PLAN→EXEC 时验证 PRD/技术方案/任务拆解表存在，是有价值的门禁，不应删除。
3. **Fast/Standard 双路径分级**：逻辑清晰，分级判断合理，核心设计正确。
4. **STATE.md 从任务拆解表自动生成**：这个机制工作正常，减少了手动维护，应保留。
