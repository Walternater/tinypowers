# 2026-04-08 Java Worktree Dogfood Review

## 执行范围

- tinypowers skill 版本：
  - `tech:init` v5.0
  - `tech:feature` v8.0
  - `tech:code` v9.0
  - `tech:commit` v5.0
- 隔离方式：`git worktree` 分支 `codex/java-workflow-dogfood`
- 测试工程：`dogfood/order-pricing-service`
- 演练需求：`OPS-2001 smart-pricing-quote`
- 需求复杂度：中等偏上，包含会员折扣、优惠码择优、运费规则、风险提示、接口与测试

## 结果摘要

- 流程已完整跑通：`init -> feature -> code -> commit`
- Java 测试工程已可运行，`mvn test` 通过，6/6 用例通过
- feature 生命周期已从 `PLAN -> EXEC -> REVIEW -> DONE`
- 工作流最有价值的部分：`init-project.js`、`scaffold-feature.js`、`update-spec-state.js`、`update-verification.js`
- 最大摩擦点：目标项目并不自带本地脚本入口，feature/code/commit 文档同步和知识沉淀仍偏重，commit 文档校验出现过一次不稳定现象

## 逐步审查

### `/tech:init`

| 步骤 | 实际体验 | 复杂性 | 合理性 |
|------|----------|--------|--------|
| 0. 预检 | 合理，但这次真正阻塞点不是“是否 Java”，而是必须先有人把 Java 工程骨架建出来 | 低 | 合理 |
| 1. 技术栈检测 | 只看 `pom.xml` / `build.gradle`，判断非常快 | 低 | 合理 |
| 2. 检测结果确认 | 对真实人机协作有价值；对自驱执行基本是重复确认 | 中 | 部分合理 |
| 3. 更新策略 | 对已初始化项目重要；对全新项目价值低 | 中 | 部分合理 |
| 4. 运行 `init-project.js` | 一步完成骨架、hooks、guides、README/knowledge 初始化，收益很高 | 低 | 高度合理 |
| 5. README / knowledge 同步 | README 有价值；`docs/knowledge.md` 在空项目阶段偏模板化，信息密度不高 | 中 | README 合理，knowledge 偏重 |

结论：
- `init` 最强的一步是脚本化落地。
- 当前最大缺口是“不能从空目录直接初始化成可 dogfood 的 Java 工程”，导致用户若说“新建一个 Java 工程并 init”，还需要先手工建 Maven/Spring Boot 骨架。

### `/tech:feature`

| 步骤 | 实际体验 | 复杂性 | 合理性 |
|------|----------|--------|--------|
| 1. 需求理解 | PRD 模板清晰，但仍需大量手工填充 | 中 | 合理 |
| 2. 技术方案 | 中等复杂需求下需要，但 PRD / 技术方案 / 任务表三者有重复 | 中高 | 合理但可压缩 |
| 3. 任务拆解 | Medium 模板已经比较克制，7 个任务足够指导执行 | 中 | 合理 |
| 4. CHECK-1 | 如果单独出文件会显得累赘；嵌入任务表更自然 | 低 | 合理，但应内联 |

结论：
- `feature` 阶段已经比旧方案克制。
- 但三个文档仍会重复写“范围、风险、验收、任务”四类信息，知识沉淀质量取决于作者是否主动压缩，而不是流程天然保证。

### `/tech:code`

| 步骤 | 实际体验 | 复杂性 | 合理性 |
|------|----------|--------|--------|
| 1. Gate Check | `update-spec-state.js` 把 PLAN->EXEC 的门禁做实了，价值明确 | 低 | 高度合理 |
| 2. 开发执行 | worktree + `STATE.md` 可用，但 `STATE.md` 只有在明确 Wave 执行时才值得保留 | 中 | 条件合理 |
| 3. 审查修复 | `update-verification.js` 很好用，但审查输入格式仍要手工组织 | 中 | 合理 |
| 4. 测试与验证 | Medium 路径要求 `测试计划.md + 测试报告.md + VERIFICATION.md`，证据充分，但同步成本明显 | 高 | 合理但偏重 |
| 5. CHECK-2 | 放进 `VERIFICATION.md` 最自然；若再单独出文件会过度设计 | 低 | 合理 |

结论：
- `tech:code` 里最成熟的是状态推进和 verification merge。
- 最大摩擦不在编码，而在“测试计划 / 测试报告 / VERIFICATION / STATE”这几类文档的同步。
- 这次确实发现一个真实 bug：测试数据没触发优惠门槛，修复成本很小，但要额外同步测试与状态文档。

### `/tech:commit`

| 步骤 | 实际体验 | 复杂性 | 合理性 |
|------|----------|--------|--------|
| 1. Document Sync | `prepare-commit-docs` 自动增量更新 README/knowledge，方向是对的 | 中 | 合理 |
| 2. `SPEC-STATE -> DONE` | 与最终提交绑定在一起，比独立 meta commit 好很多 | 低 | 高度合理 |
| 3. Git Commit | 一次性提交代码+文档+状态，符合 reviewer 视角 | 低 | 高度合理 |
| 4. Push / PR | 本次未执行，非本次目标核心 | 低 | 合理 |

结论：
- `tech:commit` 相比旧版已经明显收敛。
- 但有两个现实问题：
  1. 初始化后的 Java 项目里并没有可直接执行的 `npm run commit:prepare-docs` 入口，文档对项目用户来说不够自洽。
  2. 本次首次执行 `check-commit-docs` 时出现过“prepare 已更新但 check 仍报缺块”的现象，二次重跑后通过，值得排查是否存在非确定性。

## 关于知识沉淀

这次流程确实产出了不少文档，但“有效知识沉淀”仍然不够自动：

- `init` 阶段的 `docs/knowledge.md` 主要是模板和初始化摘要，适合作为入口，不适合作为高价值知识库。
- `commit` 阶段能把锁定决策摘录进 knowledge，但对真实 learnings 支持不足。
- 本次最有价值的执行知识，其实是：
  - `init` 不能直接从空目录启动 Java dogfood
  - `commit` 文档入口对 Java 项目不自洽
  - Medium 路径文档证据齐全，但同步成本已经接近“为了流程写文档”

这些知识不是自动产生的，而是需要额外复盘。也就是说，当前流程更擅长“留下文档”，还不够擅长“提炼经验”。

## 主要问题

### P1. 缺少“从空目录直达可 init Java 工程”的入口

现象：
- 为了执行 `/tech:init`，我必须先手工建一个最小 Maven/Spring Boot 工程。

影响：
- 用户说“新建一个 Java 测试工程并跑 workflow”时，第一步不在 tinypowers 内。
- `init` 作为入口命令的感知被削弱。

建议：
- 新增 `tech:init --bootstrap-java` 或独立 `scripts/bootstrap-java-project.js`
- 最低支持：
  - Spring Boot Maven 骨架
  - Java 8/17 选项
  - `src/main/java` / `src/test/java`
  - 最小 `pom.xml`

### P1. Java 项目里的 commit 命令入口不自洽

现象：
- skill 文档建议执行 `npm run commit:prepare-docs`、`npm run commit:check-docs`
- 但被 init 的 Java 项目并不会得到这些 npm script

影响：
- 文档写的是一条“用户在项目里可以执行”的命令，但真实环境里不可执行。

建议：
- 二选一：
  - 给初始化后的项目生成 `.claude/tinypowers/*.sh` 包装脚本
  - 或把 skill 文档统一改成 `node $TINYPOWERS_DIR/scripts/...`

### P1. Medium 路径文档还是偏多，知识与证据混在一起

现象：
- `技术方案.md`、`任务拆解表.md`、`测试计划.md`、`测试报告.md`、`VERIFICATION.md`、可选 `STATE.md` 都可能存在。

影响：
- 证据充分，但写作和同步成本高。
- 很容易把“文档存在”误当成“知识沉淀已经发生”。

建议：
- Medium 默认只强制：
  - `技术方案.md`
  - `任务拆解表.md`
  - `VERIFICATION.md`
- `测试计划.md` / `测试报告.md` 改成：
  - 模板内嵌到 `VERIFICATION.md`
  - 或仅在测试复杂度超过阈值时展开

### P2. `STATE.md` 的适用条件还不够硬

现象：
- 这次因为刻意做多 Wave，`STATE.md` 有价值。
- 如果需求再小一点，它就会立刻变成同步噪音。

建议：
- 只在满足任一条件时启用：
  - 任务数 > 5
  - 需要 worktree / 跨会话
  - 预计执行超过 2 个 Wave
- 否则不创建 `STATE.md`

### P2. `prepare/check commit docs` 需要排查一次稳定性

现象：
- 本次第一次 `check-commit-docs` 报告 README/knowledge 缺块，二次执行后正常通过。

判断：
- 当前证据不足以下结论说脚本一定有 bug。
- 但用户体验上已经会被感知为“不稳定”。

建议：
- 增加一条 regression test：
  - `prepare-commit-docs` 执行后立即执行 `check-commit-docs`
  - 期望首轮必过

### P2. knowledge capture 还没有真正“只提炼高价值经验”

现象：
- 自动沉淀的是决策摘录，不是执行中发现的复用经验。

建议：
- 在 `tech:commit` 前只扫描两类候选知识：
  - 明确标记 `[PERSIST]`
  - 或匹配固定结构：`场景 / 约束 / 反例 / 建议`
- 没有命中就不要写入 `docs/knowledge.md`

## 优化方案

### 方案 A：把入口做完整

- 新增 Java bootstrap 能力，让 `tech:init` 真正成为“从零开始”的入口
- 统一 commit/doc 脚本调用方式，避免 Java 项目出现 npm 命令幻觉

### 方案 B：把 Medium 文档压缩成“规格 + 证据”

- 保留：
  - `PRD.md` 或 `技术方案.md`
  - `任务拆解表.md`
  - `VERIFICATION.md`
- 合并：
  - `测试计划.md` 和 `测试报告.md` -> `VERIFICATION.md` 的测试区块
  - `CHECK-1 / CHECK-2` -> 内联到任务表和 verification

### 方案 C：把知识沉淀改成“挑重点”而不是“全量留痕”

- `init` 阶段只写项目级骨架
- `commit` 阶段只提升明确可复用 learnings
- 把“执行日志”与“项目知识”分离

## 建议优先级

1. 修正文档中不自洽的 commit 命令入口。
2. 给 `tech:init` 增加 Java bootstrap 能力。
3. 压缩 Medium 路径的测试计划/测试报告要求，优先合并进 `VERIFICATION.md`。
4. 为 `prepare -> check commit docs` 增加稳定性回归测试。
5. 给 knowledge capture 增加更严格的晋升门槛。

## 附：本次 dogfood 的真实有效产出

- 新建并初始化了一个 Spring Boot Java 测试工程
- 完成了复杂需求 `OPS-2001 smart-pricing-quote`
- 实现了统一报价接口、规则编排和 6 个测试
- 完整走通了状态推进、审查合并、文档同步和最终提交准备
- 产出了一份基于真实执行而不是静态阅读的优化建议
