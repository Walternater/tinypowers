# Java 复杂需求端到端试跑审查报告（基于最新 Skill）

日期：2026-04-02

## 试跑前提

本次试跑明确基于当前 tinypowers 最新已合并主线进行，未混用旧版 skill。

执行基线：

- tinypowers 基线提交：`ff51822`
- `tech:init` 版本：`4.0`
- `tech:feature` 版本：`6.0`
- `tech:code` 版本：`7.0`
- `tech:commit` 版本：`4.0`

测试工程：

- 项目目录：`/private/tmp/tinypowers-e2e-java-latest`
- 远端仓库：`/private/tmp/tinypowers-e2e-java-latest-remote.git`
- 技术栈：Java 8 + Spring Boot 2.7 + Maven

测试需求：

```text
TASK-401 批量顺延与看板汇总

- GET /tasks 支持 owner / status / priority / tag / overdueOnly 组合筛选
- POST /tasks/bulk-reschedule 支持批量顺延任务并返回 updated / skipped / missing 结果
- GET /tasks/dashboard 返回状态分布、owner 负载、逾期数和关键风险任务摘要
```

这个需求比纯 CRUD 更复杂：

- 涉及 query 过滤、批处理、聚合摘要三类能力
- 涉及 controller / service / repository / DTO / tests
- 有明确任务拆解和两波执行
- 但不涉及数据库迁移、外部系统集成或跨服务联动

## 总体结论

当前最新 skill 确实比旧版明显进步了：

- `init` 已脚本化
- `Fast / Standard` 已存在
- `STATE.md` 已能自动生成初稿
- `commit trailer` 已经明显变轻

但完整试跑下来，流程仍然偏复杂拖沓，主要体现在三点：

```text
1. Standard 路由的 planning 成本仍偏高
2. EXEC / REVIEW / DONE 的状态维护仍然偏人工
3. 少数之前已知的问题，在最新主线里仍然真实存在
```

本次试跑中确认复现的问题包括：

- `doctor --project /tmp/...` 与 `/private/tmp/...` 结果不一致
- `SPEC-STATE` 历史表插入 bug 仍然存在
- `DONE` 仍然需要额外一个纯状态 commit 才能落干净

## 实际执行摘要

初始化阶段：

- 产出 `17` 个新文件
- 初始化 commit：`2805` 行新增

规划阶段：

- `PRD.md`: `97` 行
- `技术方案.md`: `192` 行
- `任务拆解表.md`: `60` 行
- `SPEC-STATE.md`: `52` 行（进入 EXEC 前）
- 规划文档合计：约 `401` 行

编码阶段：

- 功能提交涉及 `16` 个文件
- 提交体量：`882` 行新增，`4` 行删除
- 自动化测试：`6 tests, 0 failures`

提交阶段：

- 真正功能提交：`2d78ac5`
- 状态关闭提交：`d0249a8`
- 最终仍然是 `2` 个 commit 才完成一个 feature 的完整收口

## 分步骤审查

### 1. `tech:init`

实际执行：

1. 用 `scripts/init-project.js` 落地骨架
2. 按 skill 文档执行 `scripts/validate.js`
3. 再用 `scripts/doctor.js --project` 验证目标项目
4. 将初始化产物单独提交到 `main`

复杂度评价：中偏高

做得好的地方：

- `init-project.js` 已经把最重的复制、渲染、hooks 接线都脚本化了
- 初始化结果一次性可用，`CLAUDE.md`、`.claude/settings.json`、rules、guides 都能落下来
- 单独 init commit 的做法很合理，能显著改善后续 feature 分支的清晰度

这一步仍然不合理的地方：

1. 初始化产物仍然很多  
一次 init 就新增 `17` 个文件、`2805` 行，这对首次接入仍然很重。

2. skill 的验证入口和真正有效的验证入口不一致  
`tech:init` 文档仍写“初始化完成后执行 `validate.js`”，但这个命令验证的是 tinypowers 仓库自身，不是目标项目。  
对目标项目真正有用的是：

```bash
node scripts/doctor.js --project <project-root>
```

3. `doctor` 路径规范化 bug 仍在  
本次真实复现：

- `doctor --project /tmp/tinypowers-e2e-java-latest` 误报未初始化
- `doctor --project /private/tmp/tinypowers-e2e-java-latest` 结果正常

这不是感受问题，而是正确性问题。

4. init 输出对目录级产物的感知不完整  
`features/`、`docs/`、`docs/guides/` 这类 `ensureDir` 创建的目录没有出现在脚本“创建/更新内容”输出里，用户不容易一眼看到最终落地范围。

合理性判断：

```text
init 的方向已经对了，但“默认产物仍偏大”和“验证入口不统一”仍然让首次接入显得笨重。
```

### 2. `tech:feature`

实际执行：

1. 创建分支：`feature/TASK-401-bulk-reschedule-dashboard`
2. 运行：

```bash
node scripts/scaffold-feature.js --id TASK-401 --name 批量顺延与看板汇总 --track standard
```

3. 按 `Standard` 路由补齐：
- `PRD.md`
- `技术方案.md`
- `任务拆解表.md`
- `SPEC-STATE.md`

复杂度评价：高

为什么这次选 `Standard`：

- 任务数 `4`
- 涉及 query、批量操作、聚合摘要三类能力
- 涉及多个 DTO 和服务规则锁定
- 已明显超出 `Fast` 的 1-2 个任务边界

做得好的地方：

- 脚手架已经比旧版轻，默认只生成最小必需工件
- 不再强制生成一大堆一次性子文档
- 复杂度分级思路是正确的

这一步仍然偏重的地方：

1. Standard 路由的手工补全文档成本仍高  
即使不涉及数据库和外部系统，仍然写出了约 `401` 行 planning 文档。  
其中很大一部分不是“真正复杂”，而是模板空位很多，必须人工从头补。

2. 模板的“存在即通过”与“内容真的可执行”之间还有落差  
脚手架生成后，`SPEC-STATE` 的产物清单会把文档标成 `done`，但这只是因为文件存在，不代表内容已经满足可执行标准。

3. 这类需求仍然暴露出中间档位缺失  
本次需求比小改动复杂得多，但又不到跨系统改造。  
`Fast` 太轻，`Standard` 又偏重，这说明：

```text
Fast / Standard 两档之间仍然缺一个 Medium / Standard-lite。
```

合理性判断：

```text
Standard 用在这次需求上不算错，但它仍然比“刚好够用”重一截。
```

### 3. `tech:code`

实际执行：

1. `PLAN -> EXEC`
2. 自动生成 `STATE.md`
3. 补测试与实现
4. 运行 `mvn test`
5. 回填 `STATE.md`、`VERIFICATION.md`、`learnings.md`
6. `EXEC -> REVIEW`

复杂度评价：中偏高

做得好的地方：

- `STATE.md` 自动生成初稿确实有用，Wave 和 Task 能直接映射出来
- 代码实现本身是顺的，新的主要负担已经不是“写代码”
- `mvn test` 路径清晰，验证证据容易理解

这一步仍然拖沓的地方：

1. 执行期文档仍然要大量手工维护  
虽然 `STATE.md` 有初稿，但进度、决策、下一步仍要人工回填。  
`VERIFICATION.md` 也完全是手工写。

2. `SPEC-STATE` 历史表 bug 在真实执行中仍然复现  
本次 `PLAN -> EXEC -> REVIEW -> DONE` 真实产物如下：

```text
## 阶段历史
| 2026-04-02 | PLAN | EXEC | ... |
| 2026-04-02 | EXEC | REVIEW | ... |
| 2026-04-02 | REVIEW | DONE | ... |

| 时间 | 从 | 到 | 备注 |
|------|-----|-----|------|
| 2026-04-02 | - | PLAN | 需求目录创建 |
```

历史记录仍然被插到了表头前面，说明这是当前主线里的真实回归。

3. 测试与断言维护本身也会放大执行期负担  
本次并没有遇到复杂 bug，但仍然因为：
- 排序语义变化
- JsonPath 断言细节

多跑了几轮测试。  
也就是说，`code` 阶段虽然比 `feature` 顺，但一旦需求不止一个 endpoint，执行期产物维护和验证回填仍然会拖慢体感。

合理性判断：

```text
code 阶段已经比旧版合理很多，但“执行完成后的文档回填”仍然是明显阻力。
```

### 4. `tech:commit`

实际执行：

1. 从 `learnings.md` 提升一条规则到 `docs/knowledge.md`
2. 提交功能代码：

```text
[AI-Gen] feat(TASK-401): add bulk reschedule and dashboard

Evidence: mvn test
```

3. push 到远端分支
4. 再把 `SPEC-STATE` 从 `REVIEW` 推到 `DONE`
5. 额外提交一次状态收口：

```text
[AI-Gen] chore(TASK-401): close feature state
```

复杂度评价：高

做得好的地方：

- `Evidence` 单字段 trailer 足够轻
- 知识沉淀与 feature learnings 的关系清晰
- 在有真实远端分支的情况下，push 行为很自然

这一步最不合理的地方：

1. `DONE` 仍然天然制造第二个 meta commit  
本次完整复现了这个问题。  
如果遵守当前 skill 的语义：

- 真正功能提交先发生
- `DONE` 必须在提交后推进

那就很容易得到：

1. 功能提交
2. 纯状态关闭提交

这不是使用姿势问题，而是生命周期设计与 git 时序的天然冲突。

2. 本地 remote 场景的降级体验仍然不够明确  
本次 remote 是本地 bare repo，只能验证 push，无法完整验证 PR 创建链路。  
当前流程对这类场景没有更清晰的“到 push 为止就算完成”的降级说明。

合理性判断：

```text
commit 阶段现在最大的问题不是 trailer 太重，而是 DONE 状态与真实提交时序仍然不匹配。
```

## 这次试跑确认的真实问题

### P0

1. `doctor.js` 路径规范化问题仍然存在  
`/tmp/...` 与 `/private/tmp/...` 给出不同结果。

2. `update-spec-state.js` 的历史表插入逻辑仍然错误  
不是纸面问题，已经在真实 feature 生命周期里复现。

3. `tech:init` 的验证入口仍然写错重点  
skill 里把 `validate.js` 写成初始化后的验证步骤，但真实项目应优先使用 `doctor --project`。

### P1

4. `Fast / Standard` 之间仍然缺 `Medium / Standard-lite`  
像本次这种单服务、多接口、4 个任务的需求，`Standard` 还是重。

5. `feature` 文档仍然太依赖人工补全  
脚手架只是空模板，缺“从需求描述草拟半成品文档”的能力。

6. `VERIFICATION.md` 和 `STATE.md` 仍然偏手工  
自动化只走到“初稿”，没有走到“持续更新”。

7. `DONE` 仍然需要额外状态提交  
这会持续制造流程拖沓感。

### P2

8. `init-project.js` 对目录级产物的输出不完整  
用户对最终落地结构感知不直观。

9. 本地 remote / 无平台 remote 的 commit 阶段降级说明不够清晰

## 优化方案

### 第一优先级：修正确性和明显时序问题

1. 修复 `doctor.js` 对 `/tmp` 与 `/private/tmp` 的路径规范化  
这是正确性问题，必须优先。

2. 修复 `update-spec-state.js` 的历史表插入逻辑  
这已经影响真实输出可靠性。

3. 改写 `tech:init` 的验证建议  
将目标项目初始化后的首选验证入口改为：

```bash
node scripts/doctor.js --project <project-root>
```

仓库级 `validate.js` 只保留给 tinypowers 自身开发使用。

4. 重新设计 `DONE` 的收口时序  
建议方向三选一：
- 在提交前允许“预写 DONE”
- 提交后自动 amend / 自动回填
- 把 `DONE` 从 repo 内显式状态改成可推导状态

### 第二优先级：压缩中等复杂需求的规划负担

5. 增加 `Medium / Standard-lite` 路由  
建议判定条件：
- 单服务或单模块
- 3-5 个任务
- 无数据库迁移
- 无跨系统依赖

目标：
- planning 控制在 `120-180` 行
- 保留任务拆解与关键决策
- 跳过不必要的 brainstorming 和外部委托

6. 为 `tech:feature` 增加半自动草拟能力  
至少自动草拟：
- 需求概述
- In Scope / Out of Scope
- 接口清单
- 任务初稿

### 第三优先级：继续降低执行期与收口期的人肉维护

7. 为 `VERIFICATION.md` 提供最小生成器  
自动带出最近测试命令、测试数量、通过情况和待补风险。

8. 为 `STATE.md` 提供轻量更新命令  
例如：
- 标记 task done
- 标记 wave done
- 写 blocker

9. `init-project.js` 输出中显式列出目录级产物  
让用户对初始化结果更有感知。

10. 对本地 bare remote 场景给出明确降级说明  
例如明确写：
- 有平台 remote：push + PR
- 无平台 remote：push 即完成，PR 步骤跳过

## 最终判断

如果只看“是不是比旧版更好”，答案是明确的：**是**。

但如果看“现在这套流程对真实开发来说是不是已经足够顺滑”，答案仍然是：**还没有**。

这次基于最新 skill 的复杂需求试跑证明：

```text
现在的问题已经不再是“完全没有分级”，
而是“中等复杂需求仍然偏重，且状态与验证层还有几个结构性拖沓点没解决”。
```

如果下一步只做一件事，我会优先做：

**修 `DONE` 的收口时序。**

因为这是每个 feature 都会踩到、而且会直接制造“还得再补一个 commit”的体感问题。

如果下一步只做一件路线级优化，我会优先做：

**新增 `Medium / Standard-lite`。**

因为当前最新流程最明显的错配，已经不是小需求，而是“中等复杂需求没有合适档位”。*** End Patch
