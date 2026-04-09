# 端到端工作流试跑审查报告（中等复杂需求）

日期：2026-04-02

## 试跑范围

本次基于当前已合并主线后的 tinypowers 版本，重新做了一次更接近真实研发场景的端到端试跑：

```text
tech:init -> tech:feature -> tech:code -> tech:commit
```

测试工程：
- 项目目录：`/tmp/tinypowers-e2e-complex-app`
- 远端仓库：`/tmp/tinypowers-e2e-complex-remote.git`
- 技术栈：Java 8 + Spring Boot 2.7 + Maven

测试需求：

```text
TODO-201 任务组合筛选与摘要统计

- GET /tasks 支持 priority / status / overdueOnly 组合筛选
- 新增 GET /tasks/summary 返回总数、待办数、逾期数、高优先级未完成数
```

这是一个“略高于 CRUD、小于跨系统重构”的中等复杂后端需求：
- 涉及 controller + service + DTO + tests
- 涉及 4 个明确任务
- 不涉及数据库迁移和外部系统

## 总体结论

当前流程相比最早版本已经明显变轻，但对“中等复杂需求”仍然偏重。

新的核心结论是：

```text
Fast / Standard 两档还不够。
Fast 适合很小的改动，Standard 对单服务多文件改动又偏重，
中间缺一个真正可用的“Standard-lite / Medium”档。
```

本次试跑的实际成本：
- init 产出：17 个新文件，单独形成 1 个初始化提交
- feature 规划文档：374 行
- feature 分支改动：13 个文件，+622 / -3
- feature 收口：需要 2 个 commit 才能让 `DONE` 状态和 git 历史同时干净

## 逐步审查

### 1. tech:init

实际执行：
- 运行 `scripts/init-project.js`
- 再用 `scripts/doctor.js --project` 验证目标项目
- 最终把初始化产物单独 commit 到 `main`

复杂度评价：中

做得好的地方：
- 初始化落地已经明显脚本化，不再需要 AI 手工复制 rules / guides / hooks
- `CLAUDE.md`、`.claude/settings.json`、rules、guides、knowledge 都能一次性落地
- 单独做一个 init commit 后，后续 feature 分支会清晰很多

发现的问题：
- 初始化产物仍然很多。一次 init 直接带来 17 个新文件、2805 行新增，对首次接入来说体量不小。
- `doctor` 对 `/tmp/...` 和 `/private/tmp/...` 的结果不一致：
  - 用 `/tmp/tinypowers-e2e-complex-app` 作为 `--project` 时，错误报告项目未初始化
  - 用 `/private/tmp/tinypowers-e2e-complex-app` 时结果正常
  这说明 `doctor` 的项目路径规范化存在缺口。
- 当前 init 文档仍倾向让人去跑仓库级 `validate.js`，但对目标项目来说，真正有用的是 `doctor --project`。
- `init-project.js` 的“创建/更新内容”输出没有把 `features/`、`docs/`、`docs/guides/` 这些由 `ensureDir` 创建的目录明确列出来，用户对最终产物的感知不完整。

合理性判断：
- 当前 init 已经比过去合理很多，但“验证入口不统一”仍是明显体验问题。

### 2. tech:feature

实际执行：
- 走 `Standard` 路由
- 运行 `scaffold-feature.js --track standard`
- 手工补齐：
  - `PRD.md`
  - `技术方案.md`
  - `任务拆解表.md`
  - `SPEC-STATE.md` 默认保留

复杂度评价：高

量化数据：
- `PRD.md`: 93 行
- `技术方案.md`: 171 行
- `任务拆解表.md`: 59 行
- `SPEC-STATE.md`: 51 行
- 仅规划阶段就写了 374 行

做得好的地方：
- 骨架已经比过去轻，默认只生成最小必需文档
- `STATE.md` 在进入 `EXEC` 时自动生成，这个方向是对的
- `Fast / Standard` 分流确实存在，不再是所有需求都走同一路

发现的问题：
- 对本次这种“单服务、多文件、4 个任务”的需求，Fast 明显太轻，Standard 又明显太重。
- `Standard` 路由仍然要求写完整 PRD、完整技术方案、完整任务拆解。对一个不涉及数据库、不涉及外部系统的需求来说，文档成本依然偏高。
- 标准模板还是偏空壳，很多内容必须人工大段补全，没有把“已有需求描述 -> 半成品设计/任务”自动化。
- docs 里仍然保留了 `brainstorming`、`writing-plans` 这类委托说明，但本次真实执行完全没有必要使用它们，只增加理解负担。

合理性判断：
- 对复杂需求，这套 planning 仍然合理。
- 对中等复杂需求，当前 Standard 仍偏重，说明“只有 Fast / Standard 两档”的设计还不够。

### 3. tech:code

实际执行：
- 先补失败测试
- `mvn test` 失败，暴露缺失能力
- 实现 controller/service/DTO
- 再跑 `mvn test`，6 个测试全部通过
- 手工补 `STATE.md` 进度、`VERIFICATION.md`、`notepads/learnings.md`
- 推进 `SPEC-STATE: EXEC -> REVIEW`

复杂度评价：中偏高

做得好的地方：
- 进入 `EXEC` 时自动生成的 `STATE.md` 比空模板有明显帮助
- TDD 路径是顺的：先红，再绿，再补验证
- 本次实现里“筛选逻辑与摘要逻辑共用服务层规则”这种重要约束，也比较容易沉淀到 learnings / knowledge

发现的问题：
- `VERIFICATION.md` 仍需要完全手工编写，没有最小生成器或从最近测试结果自动抽取证据。
- `STATE.md` 虽然初稿是自动生成的，但后续进度更新仍全靠人工维护。
- `SPEC-STATE` 历史表插入 bug 仍然真实存在。当前实际产物是：

```text
## 阶段历史
| 2026-04-02 | PLAN | EXEC | ... |
| 2026-04-02 | EXEC | REVIEW | ... |
| 2026-04-02 | REVIEW | DONE | ... |

| 时间 | 从 | 到 | 备注 |
|------|-----|-----|------|
| 2026-04-02 | - | PLAN | 需求目录创建 |
```

历史记录被插到了表头前面，表结构仍然是坏的。这说明之前认为修好的问题，在真实项目输出里仍存在。
- `Standard` 路由文档仍然强调 worktree / subagent / review delegation，但本次真实执行没有一项是必须的；执行成本更多来自产物维护，而不是编码本身。

合理性判断：
- code 阶段比 feature 阶段顺得多。
- 当前最大的拖沓点不在编码，而在“执行期产物的人工维护”。

### 4. tech:commit

实际执行：
- 把 `notepads/learnings.md` 中 1 条通用经验提升到 `docs/knowledge.md`
- 用提交信息：

```text
[AI-Gen] feat(TODO-201): add task filtering and summary

Evidence: mvn test
```

- push 到本地 bare remote
- 再推进 `SPEC-STATE: REVIEW -> DONE`

复杂度评价：高

做得好的地方：
- `Evidence` 作为最小 trailer 足够用，不再需要更重的提交尾注
- 知识沉淀和 feature learnings 的关系比较清楚

发现的问题：
- 为了让 `DONE` 状态真实落到仓库里，最终不得不多做一个 meta commit：

```text
[AI-Gen] chore(TODO-201): close feature state
```

结果是单个 feature 需要 2 个 commit：
1. 真正的功能提交
2. 仅用于把 `SPEC-STATE` 从 `REVIEW` 推到 `DONE`

这和之前的 E2E 试跑结论一致：`DONE` 在“提交后推进”的设计下，会天然制造一次额外提交或一次脏工作树。
- PR 步骤依赖远端平台。本次本地 bare remote 只能验证 push，无法完整验证 PR 链接与提交流程。
- `commit` 阶段的“文档同步 + 知识沉淀 + 状态收口”仍然偏手工，没有真正的一键收尾能力。

合理性判断：
- 当前 commit 设计在理念上是对的。
- 但“提交后再写 DONE”这个点在实际操作里仍然不合理。

## 新增关键发现

这次相对上一轮试跑，新增的最重要结论有两个：

### 发现 1：Fast / Standard 两档之间仍有空档

本次需求已经明显比纯 CRUD 更复杂，但又远没到“跨系统 / 跨模块重构”的程度。

结论：
- 用 Fast：太轻，无法自然承载 4 个任务、2 个 Wave、controller + service + tests 的拆解
- 用 Standard：又要写 374 行规划文档，明显偏重

这说明当前流程缺一个“Medium / Standard-lite”层。

### 发现 2：已知的 SPEC-STATE 历史表 bug 在真实项目里仍然复现

这不是文档上的担忧，而是实际输出中的回归。测试用例通过，不代表真实项目文件结构已经正确。

## 优化方案

### P0

1. 修复 `update-spec-state.js` 的历史表插入逻辑  
当前真实产物仍把历史行插到表头前，必须优先修。

2. 修复 `doctor.js` 的项目路径规范化  
对 `/tmp/...` 和 `/private/tmp/...` 应给出一致结果，避免 init 后马上误报“项目未初始化”。

3. 把 init 的推荐验证入口统一为 `doctor --project`  
不要再让目标项目初始化后去跑仓库级 `validate.js` 作为主要验证。

### P1

4. 在 Fast / Standard 之间增加 `Medium` 或 `Standard-lite` 路由  
推荐判定条件：
- 单服务或单模块
- 3-5 个任务
- 无 DB 变更
- 无跨系统依赖

目标：
- planning 文档控制在 120-180 行
- 跳过歧义探索和外部委托
- 保留任务拆解和锁定决策

5. 给 `tech:feature` 增加“从需求描述生成半成品文档”的能力  
至少把以下内容自动草拟：
- PRD 概述
- 技术方案的目标/范围/接口草案
- 任务拆解初稿

6. 给 `tech:code` 增加 `VERIFICATION.md` 初稿生成  
可以从最近一次测试命令、测试数量、关键场景自动生成最小验证骨架，用户只补少量结论。

7. 调整 `DONE` 收口机制，避免为了关状态再补一个 commit  
可选方向：
- 在 commit 前允许“预写 DONE + pending commit hash”
- commit 后自动 amend
- 或把 `DONE` 从 repo 内状态改为“git 已提交 + VERIFICATION PASS”的推导态

### P2

8. 让 `STATE.md` 不只生成初稿，还能提供轻量更新命令  
例如：
- 标记 task done
- 标记 wave done
- 写入阻塞项

9. 为本地 remote / 无平台 remote 提供更明确的 commit 阶段降级说明  
当没有 GitHub/GitLab 远端时，明确告诉用户“本阶段以 push/本地提交完成”为准。

10. init 完成后建议单独提交一次初始化产物  
这次试跑里，单独提交 init 明显让后续 feature 分支更干净。这个实践可以内建到文档里。

## 最终判断

相较前一轮试跑，当前流程确实已经比旧版轻了很多：
- 状态机已经压到 4 态
- Fast/Standard 分级已经存在
- init 已脚本化
- feature 骨架已缩小

但这次中等复杂需求的真实试跑证明：

```text
当前问题已经不再是“所有需求都一样重”，
而是“Fast 和 Standard 之间还缺一档”。
```

如果下一步只做一件事，我会推荐：

**新增 `Medium / Standard-lite` 路由，并同时修掉 `SPEC-STATE` 历史表 bug。**

前者解决“中等复杂需求仍然拖沓”，后者解决“状态文件真实输出仍然不可信”。
