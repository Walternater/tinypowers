# agent-service Java生产工程实测报告

> **生成日期**: 2026-04-08  
> **测试工程**: agent-service（瓜子二手车经纪人服务，Spring Boot + MyBatis + dynamic-datasource）  
> **测试需求**: CSS-98765 经纪人配置变更审计日志（Medium 路由）  
> **Skill版本**: tech-init 5.0 / tech-feature 8.0 / tech-code 9.0 / tech-commit 5.0  
> **执行路径**: init（补全）→ feature → code → commit 完整链路

---

## 一、执行摘要

本次在一个**生产环境实际运行的大型 Java 工程**（agent-service）上完整执行了四阶段流程，实测发现了若干在 demo 工程中未暴露的问题。完整产出：

- 新增 Java 文件 5 个、XML 文件 1 个
- 修改现有文件 2 个（`AgentDispatchBusiness`、`AgentConfigController`）
- feature 文档 6 个（PRD、技术方案、任务拆解表、SPEC-STATE、VERIFICATION、测试计划/报告）
- 补全了原来近乎空壳的 `docs/knowledge.md`
- 最终成功 commit 到 worktree 分支

整体流程**可以跑通**，但有若干问题降低了效率和可信度，详见下文。

---

## 二、各阶段审查

### 2.1 tech:init 阶段

**已有骨架**：工程已完成过一次 init，CLAUDE.md、development-spec.md、workflow-guide.md 等均存在。

**发现问题**：

| 编号 | 问题 | 严重度 |
|------|------|--------|
| I-01 | `docs/knowledge.md` 在 init 完成后仍为空壳（仅有模板占位符） | **P0** |
| I-02 | SKILL.md 5.2 节要求"优先用 brainstorming 汇总 README、代码结构"，但没有验证机制，导致这一步被静默跳过 | **P1** |
| I-03 | init 完成没有强制验证 `docs/knowledge.md` 的实质内容，只检查文件是否存在 | **P1** |

**补救动作**：手工补充了 `docs/knowledge.md`，涵盖技术栈、数据源、RPC、缓存、枚举约定、开发规范等 8 个核心条目。补充后 knowledge.md 对后续 feature/code 阶段有了实质价值。

**审查结论**：init 阶段最核心的交付物（knowledge.md）缺乏完成质量的验收机制，是整个链路中风险最大的单点问题。

---

### 2.2 tech:feature 阶段

**执行路由**：Medium（5 个任务，单系统，有 DB 变更，无跨系统依赖）

**产出文件**：
- `PRD.md`：背景、验收标准（AC-1 ~ AC-5）、边界
- `技术方案.md`：核心设计、DB 表设计、4 条锁定决策（D-01 ~ D-04）
- `任务拆解表.md`：T-1 枚举 → T-2 Model/Mapper/XML → T-3 Service → T-4 接入点 → T-5 Controller

**发现问题**：

| 编号 | 问题 | 严重度 |
|------|------|--------|
| F-01 | 技术方案中接口路径设计（`/api/agent_service/config_change_log/list`）未参考项目现有 Controller 的路由风格（`/agent_service/api/agent_config/...`），导致后续 Controller 实现时偏差 | **P1** |
| F-02 | feature 阶段没有"现有代码模式采样"步骤，导致接口设计与现有风格不一致 | **P1** |
| F-03 | CHECK-1 摘要格式不固定，每次 AI 自由发挥，缺乏结构化约束 | **P2** |

**审查结论**：feature 阶段整体流畅，但缺少对"现有代码模式"的显式采样步骤，导致方案设计可能脱离项目现实。

---

### 2.3 tech:code 阶段

**编码产出**：

```
新增:
  enums/AgentConfigChangeTypeEnum.java           变更类型枚举
  db/model/AgentConfigChangeLog.java             ORM Model
  db/mapper/AgentConfigChangeLogMapper.java      Mapper 接口
  repository/AgentConfigChangeLogService.java    Service（写入+查询）
  vo/request/AgentConfigChangeLogQueryRequest.java
  vo/response/AgentConfigChangeLogResponse.java
  resources/mapping/AgentConfigChangeLogMapper.xml

修改:
  business/AgentDispatchBusiness.java            接入日志写入
  controller/AgentConfigController.java          新增查询接口
```

**审查过程发现的问题**（需要额外修复轮次）：

| 编号 | 发现阶段 | 问题 | 严重度 |
|------|---------|------|--------|
| C-01 | Compliance Review | `queryChangeLog` 方法缺少 `@DS("guazi_call_slave")` 注解，未走从库（D-02 决策未落地） | **P0（修复）** |
| C-02 | Code Review | `AgentConfigChangeLogService` 中误 import 了 `org.apache.ibatis.annotations.Mapper`（Service 不应有此 import） | **P1（修复）** |
| C-03 | 编码阶段 | `ActionFormEnum` 没有 `SYSTEM` 值，初版代码调用了不存在的枚举常量 | **P1（修复）** |
| C-04 | Compliance Review | 接口路径与技术方案定义不一致（F-01 的延续） | **P2（记录接受）** |

**关键发现**：

- **C-01 本应在编码阶段自检**：如果编码完成后有一次 `mvn compile`，`@DS` 注解遗漏是业务逻辑问题无法编译检测，但至少可以通过"对照技术方案 D-02 逐条自查"来提前发现，不应等到 Compliance Review 才被捕获
- **C-03 暴露了一个模式**：AI 在写调用代码之前，没有先采样对应枚举类的实际值。每次使用枚举/常量前应先读一遍

**审查结论**：审查流程有效捕获了两个 P0/P1 问题，但这些问题本应在编码阶段自检环节中发现，说明编码自检的力度不够。

---

### 2.4 tech:commit 阶段

**执行动作**：
1. Document Sync：补充 `docs/knowledge.md` 从库命名约定（`{主库名}_slave`）
2. SPEC-STATE → DONE
3. Git commit（worktree 分支）

**发现问题**：

| 编号 | 问题 | 严重度 |
|------|------|--------|
| M-01 | SKILL.md 第 1 步建议执行 `npm run commit:prepare-docs`，但这是 tinypowers 框架自身的 npm 脚本，在目标 Java 工程（没有 package.json）中执行会直接失败 | **P0** |
| M-02 | knowledge capture 依赖 `notepads/learnings.md` 中出现 `[PERSIST]` 标记，但整个流程中从未创建该文件，链路静默断裂 | **P1** |
| M-03 | commit 后没有强制检查 knowledge.md 是否有实质更新，增量更新质量无保障 | **P2** |

**审查结论**：commit 阶段的 `npm run commit:prepare-docs` 命令对 Java 工程完全无效，是一个**文档与现实脱节**的高危点。

---

## 三、问题汇总（按优先级）

### P0 — 必须修

| 编号 | 问题描述 | 影响阶段 | 修复方向 |
|------|---------|---------|---------|
| **I-01** | `docs/knowledge.md` 完成后缺乏内容质量验收，空壳通过 init | init | init 完成后验证 knowledge.md 有效字符数 > N |
| **M-01** | `npm run commit:prepare-docs` 在 Java 工程中无效，SKILL.md 未区分框架命令和目标工程命令 | commit | 移除或标注为"仅适用于含 package.json 的工程"；提供 Java 工程替代方案 |

### P1 — 重要优化

| 编号 | 问题描述 | 影响阶段 | 修复方向 |
|------|---------|---------|---------|
| **F-01/F-02** | 技术方案设计未参考现有代码模式（Controller 路由风格、枚举值等） | feature | feature 阶段的"技术方案"步骤增加"现有模式采样"动作：采样 1-2 个相似 Controller/Service 的代码 |
| **C-01** | 编码完成后没有对照技术方案决策逐条自查，遗漏 `@DS` 注解直到 Compliance Review 才发现 | code | 编码完成后增加"决策落地自查"：逐条核对技术方案中的锁定决策是否在代码中体现 |
| **C-03** | 使用枚举/常量前未先采样实际定义，导致调用了不存在的枚举值 | code | 编码规范：凡引用项目枚举/常量，必须先读一遍定义文件 |
| **M-02** | `notepads/learnings.md` 从未创建，knowledge capture 链路静默断裂 | commit | 明确 learnings.md 的创建时机（如 code 阶段开始时）；或改为 commit 阶段直接扫描本次变更的知识点 |

### P2 — 品质提升

| 编号 | 问题描述 | 影响阶段 | 修复方向 |
|------|---------|---------|---------|
| **I-02** | init 没有验证机制，brainstorming/知识扫描步骤容易被跳过 | init | init 完成脚本中增加 knowledge.md 内容检查 |
| **F-03** | CHECK-1 摘要每次格式不一致，不易回溯 | feature | 固定 CHECK-1 输出格式（模板化） |
| **C-02** | 编码时引入了错误 import，代码 lint 无法检测（Java 工程没有集成 linter 到 AI 流程） | code | 建议 code 阶段执行 `mvn compile` 做最低限度的语法和 import 验证 |
| **M-03** | commit 后 knowledge.md 的增量更新质量无保障 | commit | 增加 knowledge.md diff 检查：本次 commit 后是否有新知识条目 |

---

## 四、优化方案

### 方案 A：tech:commit SKILL.md 修复（P0，立即可做）

**问题**：SKILL.md 步骤 1 的 `npm run commit:prepare-docs` 在 Java 工程中无效。

**建议改法**：

```markdown
### 1. Document Sync

> **注意**：以下脚本仅适用于使用 npm 管理的项目。Java 工程请跳过脚本执行，
> 手动完成以下检查：

（可选，仅 npm 项目）
npm run commit:prepare-docs
npm run commit:check-docs

Java 工程替代方案：
1. 确认 技术方案.md 与实现一致（路径、方法名、决策）
2. 确认 VERIFICATION.md 结论为 PASS
3. 确认 docs/knowledge.md 有本次 feature 的新增知识（如有）
```

### 方案 B：feature 阶段增加"现有模式采样"步骤（P1）

**问题**：技术方案设计脱离项目现有代码风格。

**建议在 tech:feature SKILL.md 的"2. 技术方案"步骤中增加**：

```markdown
**现有模式采样（在写接口/DB设计前完成）**：
- 采样 1-2 个与本需求相同域的 Controller，确认路由前缀风格
- 采样相关枚举类，确认已有值
- 采样相似 Service 方法，确认注解约定（事务、数据源切换等）

目标：技术方案的接口路径、参数命名、注解用法与项目现有风格一致。
```

### 方案 C：tech:code 阶段增加"编码后决策自查"步骤（P1）

**问题**：编码完成后没有逐条核对技术方案锁定决策。

**建议在 tech:code SKILL.md 的"3. 审查修复"前增加**：

```markdown
**编码后决策自查（compliance-reviewer 前置）**：
- 逐条读取 技术方案.md 中的"锁定决策"
- 在代码中定位对应实现，确认已落地
- 未落地的决策立即修复，再进入正式 Compliance Review

目的：减少 Compliance Review 阶段的"本应在编码阶段发现"的低级问题。
```

### 方案 D：knowledge.md 质量门禁（P0/P2）

**建议在 tech:init SKILL.md 5.2 节末尾增加**：

```markdown
**完成验证**：
- `docs/knowledge.md` 有效字符数应 > 500
- 至少包含以下 4 个板块：技术栈、中间件、关键约定/坑位、分层规范
- 如果以上条件不满足，视为 init 未完成，需继续补充
```

### 方案 E：notepads/learnings.md 创建时机明确化（P1）

**问题**：learnings.md 从未创建，knowledge capture 链路断裂。

**两种可行方案**：

**E1（推荐）**：改为在 code 阶段开始时自动创建 `notepads/learnings.md`，并在文件头部说明用途。

**E2**：取消 learnings.md 中间层，改为 commit 阶段直接问一个结构化问题：
```
本次 feature 是否有以下类型的新知识值得沉淀到 docs/knowledge.md？
□ 发现了项目特殊约定或隐蔽坑位
□ 确认了某个中间件/框架的用法约束
□ 找到了对后续 feature 有参考价值的决策经验
```
用户/AI 勾选后直接写入 knowledge.md，去掉中间层。

---

## 五、正向验证（流程中有效的部分）

以下流程节点**按预期发挥了作用**，是当前设计的亮点：

| 节点 | 有效性 | 说明 |
|------|--------|------|
| **Compliance Review** | ✅ 有效捕获 | 发现了 D-02 从库注解遗漏（C-01），强制修复 |
| **Code Review** | ✅ 有效发现 | 发现了错误 import（C-02），清理了代码 |
| **CHECK-1 soft gate bypass** | ✅ 语义清晰 | 明确标注"未经人工确认，自驱继续"，可追溯 |
| **CHECK-2 摘要** | ✅ 结构完整 | 提供了变更摘要、审查结论、残留风险，质量合格 |
| **worktree 隔离** | ✅ 有效隔离 | feature 分支变更不污染主分支，git log 干净 |
| **SPEC-STATE 生命周期** | ✅ 基本有效 | PLAN → EXEC → REVIEW → DONE 状态流转清晰 |
| **D-01 异常安全（try-catch）** | ✅ 决策落地 | Service 写入方法 try-catch 完整，失败不影响主流程 |

---

## 六、总结与优先级建议

本次实测在生产级 Java 工程中完整跑通了 init → feature → code → commit 链路，整体方向正确，但暴露了以下优先级建议：

**立即修复（P0，不修复会造成执行错误）**：
1. `tech:commit` 中的 `npm run commit:prepare-docs` 命令需标注仅适用 npm 项目，并提供 Java 替代方案
2. `tech:init` 后的 `knowledge.md` 需要内容质量验收，不能只检查文件是否存在

**近期优化（P1，显著影响质量和效率）**：
3. `tech:feature` 技术方案设计前增加"现有模式采样"步骤
4. `tech:code` 编码完成后增加"决策自查"，而不是完全依赖 Compliance Review
5. `notepads/learnings.md` 创建时机明确化，或简化为 commit 阶段的直接问答

**品质提升（P2，有益但不紧急）**：
6. CHECK-1 摘要格式模板化
7. code 阶段建议执行 `mvn compile` 做最低限度验证
8. commit 后 knowledge.md 增量检查

---

**文档版本**: v1.0  
**测试日期**: 2026-04-08  
**测试工程**: agent-service（生产环境 Java 工程）  
**对比参考**: [workflow-optimization-plan.md](workflow-optimization-plan.md)（基于 demo 工程的综合优化方案）
