# 端到端工作流试跑审查报告

日期：2026-04-02

## 试跑范围

本次在独立测试工程中，基于已合并到 `main` 的 tinypowers 版本，真实执行了一遍：

```text
tech:init -> tech:feature -> tech:code -> tech:commit
```

试跑使用的环境：

- tinypowers 副本：`/tmp/tinypowers-e2e`
- 测试工程：`/tmp/tinypowers-test-app`
- 测试分支：`feature/TODO-101-completed-task-filter`

测试工程是一个最小 Java Maven 项目，原始能力只有：

- 新增任务
- 列出全部任务

试跑中新增的最小功能是：

- `TaskService#listCompletedTasks`

最终结果：

- 初始化产物已落地：`CLAUDE.md`、`docs/`、`configs/rules/`、`.claude/`、`features/`
- 功能已实现并通过测试
- `mvn test` 通过，3 个测试全绿
- 已完成本地提交与 push 模拟

## 总体结论

当前流程的核心理念是对的，骨架也基本完整，但对小需求明显过度流程化。

最大问题不是单个文档错误，而是 `tech:feature`、`tech:code`、`tech:commit` 三步之间的门禁、状态机、worktree 时机和提交边界还没有真正缝合成一条轻量顺滑的链路。

一句话总结：

```text
理念正确，落地偏重，小需求成本过高。
```

## 分步审查

### 1. tech:init

复杂度评价：中高

合理的地方：

- Java-only 收缩方向是对的
- `.claude/hooks + settings` 直接落地有明显价值
- 入口 `CLAUDE.md` 保持精简的思路是好的

主要问题：

1. Maven 默认 `build_command` 是错误值。
   `skills/tech-init/stack-detection.md` 中给 `Java (Maven)` 配的是 `mvn checkstyleMain testClasses`，这更像 Gradle 目标，不是合理的 Maven 默认命令。

2. Guide 产物存在隐式依赖。
   `configs/templates/CLAUDE.md` 明确引用了 `docs/guides/workflow-guide.md`，但 `tech:init` 主流程中更显式强调的是 `development-spec.md`。如果实现时只按显式检查项复制文件，很容易产出断链入口。

3. 模板变量校验口径和模板内容本身冲突。
   `CLAUDE.md` 模板末尾包含模板变量说明表，其中还保留了 `{{ProjectName}}` 等变量文本。这样“禁止遗留未替换变量”的朴素检查会误报。

4. 小项目知识扫描收益偏低。
   对一个最小测试工程，`docs/knowledge.md` 最终几乎只能是空模板，这一步的流程成本高于实际收益。

### 2. tech:feature

复杂度评价：高

合理的地方：

- `scripts/scaffold-feature.js` 一键起骨架，体验不错
- `SPEC-STATE.md` 作为阶段门禁载体是合理的

主要问题：

1. 文档负担过重。
   即使只是“两文件改动的小需求”，为了合法推进到 `TASKS`，仍需要补 `CHANGESET.md`、`PRD.md`、`需求理解确认.md`、`技术方案.md`、`任务拆解表.md`、`评审记录.md`、`SPEC-STATE.md`。

2. 模板太空，填写成本高。
   大多数模板都只是表格骨架，没有足够强的引导或默认值，导致大量时间花在“把表格填到能过门禁”上。

3. 状态机门禁偏弱。
   `scripts/update-spec-state.js` 对很多阶段的检查只验证“文件存在”或“是否含某个关键词”，而不是验证内容是否真的完成。

4. `SPEC-STATE.md` 历史表写入有格式问题。
   新增历史行会插到“## 阶段历史”标题和表头之间，导致表格结构不干净。

### 3. tech:code

复杂度评价：中

合理的地方：

- 真正进入编码后，执行路径反而相对顺
- TDD 路径可用：先补失败测试，再实现，再验证
- `STATE.md` 作为执行期状态文件的设计方向是对的

主要问题：

1. worktree 时机和前置流程冲突。
   `tech:feature` 默认不建 worktree，而 `tech:code` 再建 worktree；但前两步已经产生大量未提交文档，这时再切隔离环境会很别扭。

2. `EXEC` 门禁和文档承诺不一致。
   文档中强调要过 `tech-plan-checker`，但实际推进到 `EXEC` 时，只需要 `任务拆解表.md` 存在并附一个 `--note` 即可。

3. `STATE.md` 虽然会自动创建，但模板过空。
   进入执行态后，仍需手工把 wave、任务、阻塞重写成真正可用的执行状态。

### 4. tech:commit

复杂度评价：中高

合理的地方：

- 文档同步、知识沉淀、提交、PR 收口的拆分方式合理
- commit trailer 记录约束、拒绝方案、验证证据，这点很好

主要问题：

1. 首次 feature 的 commit 范围过大。
   这次试跑里，最终 commit 把 `init + feature + code` 的全部产物一起带进来了，28 个文件、3000+ 行，对 reviewer 很不友好。

2. `CLOSED` 状态和真实提交时序别扭。
   如果想把最终状态也收进同一个 commit，就必须在真正 `git commit` 前先把 `SPEC-STATE` 推进到 `CLOSED`，这在语义上是“状态先于事实”。

3. PR 步骤强依赖远程托管平台。
   纯本地试跑时可以验证 `push`，但 PR/MR 生成无法完整模拟。

## 试跑中发现的具体问题清单

### P0

1. 修正 Maven 默认命令
   把 `skills/tech-init/stack-detection.md` 中 `Java (Maven)` 的 `build_command` 改成真实可用的默认值，如 `mvn test`。

2. 修复 `SPEC-STATE` 历史表插入 bug
   `scripts/update-spec-state.js` 应把历史行插入表头之后，而不是插到标题和表头之间。

3. 强化 `SPEC-STATE` 门禁
   不要再只靠“文件存在”或“是否包含模板自带标题”。至少应识别空模板和未填写条目。

4. 明确 `tech:init` 的最小 guide 清单
   `workflow-guide.md` 已经是 `CLAUDE.md` 的显式依赖，应该纳入 init 的正式产物要求和验证项。

### P1

1. 增加“小需求快路径”
   建议判定条件：
   - 单模块改动
   - 不新增接口
   - 不涉及表结构
   - 任务数 <= 2

   快路径下 `/tech:feature` 只要求：
   - `CHANGESET.md`
   - `SPEC-STATE.md`
   - 轻量技术方案
   - 简化任务清单

2. 重构 worktree 时机
   可选方案：
   - 在 `/tech:feature` 开始就建隔离 worktree
   - 或允许 `/tech:code` 在“一次性测试仓库/已隔离仓库”中跳过 worktree

3. 让 `STATE.md` 自动从任务拆解表生成初稿
   进入 `EXEC` 时不应只创建一个空模板，应自动写入 Wave 和任务列表。

4. 把 `tech-plan-checker` 做成真正的执行门禁
   不要再只靠 `--note` 人工说明。

### P2

1. 小项目知识扫描改成 lazy mode
   对空项目或极小项目，只创建 `docs/knowledge.md` 模板，不把“显式扫描”作为固定步骤。

2. 拆分首次 onboarding 提交边界
   允许 `tech:init` 产物先单独提交，再进入 feature，实现 reviewer 可读性更好的提交历史。

3. 让 `CLOSED` 在 commit 之后自动回填
   避免 `SPEC-STATE` 先于真实提交完成。

## 推荐优化方向

推荐把下一轮优化重点放在“为小需求减负”，而不是继续加更多规则。

建议目标：

```text
小需求：
tech:init -> tech:feature(light) -> tech:code -> tech:commit

大需求：
tech:init -> tech:feature(full) -> tech:code -> tech:commit
```

其中：

- `light` 路径减少工件数
- `full` 路径保留完整治理能力
- 两条路径共用同一套状态机，但门禁深度不同

## 附：本次试跑交付物

测试工程中的关键产物：

- `CLAUDE.md`
- `docs/guides/development-spec.md`
- `docs/guides/workflow-guide.md`
- `docs/knowledge.md`
- `features/TODO-101-completed-task-filter/`
- `src/main/java/com/acme/todo/TaskService.java`
- `src/test/java/com/acme/todo/TaskServiceTest.java`

最终实现的最小功能：

- `TaskService#listCompletedTasks`

最终验证命令：

```bash
mvn test
```

最终提交：

```text
adc1e3d [AI-Gen] feat(TODO-101): add completed task filtering
```
