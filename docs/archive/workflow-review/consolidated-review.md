# tinypowers 全流程审查整合报告

日期：2026-04-02

## 一句话结论

tinypowers 当前主线已经从“所有需求都走同样重的流程”进化到“有分级、有脚手架、有脚本化 init”的版本，但真实 dogfood 结果说明它仍然没有达到“顺滑可用”。

三份报告的共同结论是：

```text
最大问题已经不再是“完全没有分级”，
而是“流程对中小需求仍然偏重，且状态/验证/收口还有几处真实缺口”。
```

更具体地说：

- `tech:init` 已经明显进步，但仍然产物偏多、验证入口不统一，且 `doctor`/路径处理还有正确性问题
- `tech:feature` 仍然是全流程最重的一段，尤其对中等复杂需求不成比例
- `tech:code` 的主要负担已经不在编码，而在执行期文档与状态维护
- `tech:commit` 的最大问题仍是 `DONE` 状态与真实提交时序不自然

## 报告来源

本整合稿基于以下三份独立试跑/审查报告：

1. `Claude`：
   [pipeline-audit.md](/Users/wcf/personal/tinypowers/docs/workflow-review/pipeline-audit.md)
2. `OpenCode`：
   [dogfood-optimization-plan.md](/Users/wcf/personal/tinypowers/docs/workflow-review/dogfood-optimization-plan.md)
3. `Codex`：
   [2026-04-02-e2e-workflow-review-complex.md](/Users/wcf/personal/tinypowers/docs/workflow-review/2026-04-02-e2e-workflow-review-complex.md)

三份报告分别覆盖了：

- Java / Spring Boot 标准路径复杂需求
- Node.js / JWT Auth 中小项目 dogfood
- 当前主线下 Java 中等复杂需求再验证

因此，这三份报告互补性很强，既覆盖了“主流程设计”，也覆盖了“跨技术栈适配”和“已合并优化后的真实效果”。

## 三方共识

### 1. `tech:feature` 仍然是最重的阶段

三份报告都认为，当前流程最明显的瓶颈不在编码，而在 feature planning。

共识点：

- 需求理解与方案准备的交互仍然偏多
- 文档体量对中小需求不成比例
- 很多模板仍是“空骨架”，需要人工大量补写
- 对简单或中等复杂需求，planning 的边际收益开始下降

这点在三个场景里都出现了：

- `pipeline-audit.md` 里，Phase 1 的 “one question at a time” 被认为是最核心痛点
- `dogfood-optimization-plan.md` 里，feature 阶段 4 个文档对应一个 6 小时需求，被认为明显过载
- `2026-04-02-e2e-workflow-review-complex.md` 里，中等复杂需求的 planning 仍写了 374 行文档

结论：

```text
当前最大拖沓点，仍然是 feature 阶段对中小需求的规划成本过高。
```

### 2. `tech:init` 已进步，但还没到“足够轻”

三份报告都认可 init 已经比早期版本好很多，尤其是：

- Java-only 边界更清晰
- `.claude/`、rules、guides 已脚本化落地
- 不再依赖 AI 手工复制几十个文件

但共识问题仍然存在：

- 初始化产物数量仍偏多
- 首次接入时“复制很多文档”带来的心理负担仍大
- 验证入口不够统一
- 非 Java 或轻量项目仍容易感知“这套东西太重”

结论：

```text
init 已经不是最严重的问题，但它仍然没有收敛到“默认足够小、默认足够清晰”。
```

### 3. 状态管理仍然过度依赖 Markdown 人工维护

三份报告的表述不同，但都指向同一根因：

- `SPEC-STATE.md`、`STATE.md`、`VERIFICATION.md` 等文件仍然需要频繁人工维护
- 部分状态推进虽然已有脚本，但在真实执行中仍有“补文档”“改表格”“补说明”的手工成本
- 状态机已经简化，但执行期状态维护并未等比例简化

尤其需要注意的是，最新复杂试跑明确证明：

- `SPEC-STATE` 历史表插入 bug 在真实项目输出里仍然复现
- `DONE` 仍然和 commit 时序不自然，最终容易额外产生一个 meta commit

结论：

```text
当前状态机已经变轻，但状态文件维护成本还没有真正变轻。
```

### 4. 复杂度分级方向是对的，但分级还不够细

三份报告虽然具体提法不同，但都认为：

- “所有需求走一套流程”是不对的
- 需要让小需求和复杂需求走不同路径
- 当前已有分级仍然不够

其中：

- `dogfood-optimization-plan.md` 强调需要 `fast / standard`
- `2026-04-02-e2e-workflow-review-complex.md` 进一步证明 `fast / standard` 两档之间仍然缺一档
- `pipeline-audit.md` 从交互和 planning 成本角度，也支持继续细分路径

结论：

```text
复杂度分级不是“要不要做”的问题，而是“还要继续做细”的问题。
```

## 各报告独有的重要发现

### Claude 报告的独有价值

[pipeline-audit.md](/Users/wcf/personal/tinypowers/docs/workflow-review/pipeline-audit.md) 最大的价值，是把流程拖沓具体定位到“交互模式”和“规划仪式”上。

它补充了两个关键视角：

- Phase 1 “一次只问一个问题”会把原本可以 1 轮澄清的内容拉成 5 轮 round-trip
- 歧义检测与 brainstorming 对很多常见后端需求来说过度形式化，产生了人为制造决策点的问题

这份报告最有价值的提醒是：

```text
有些拖沓不是因为文档太多，而是因为对话和决策流程被切得太碎。
```

### OpenCode 报告的独有价值

[dogfood-optimization-plan.md](/Users/wcf/personal/tinypowers/docs/workflow-review/dogfood-optimization-plan.md) 最大的价值，是把“流程开销 > 编码时间”这件事量化了，而且是在 Node.js 项目里验证的。

它补充了三个关键视角：

- 文档模板/guide 缺少技术栈感知时，体验会直接劣化
- `init` 需要 profile，不应该默认把所有文档、规则和 agent 定义全量下发
- 审查、状态和文档产物都应该继续分级，而不是只在 feature 入口分级

这份报告最重要的提醒是：

```text
如果流程开销比写代码还贵，用户就会天然绕开流程。
```

### Codex 报告的独有价值

[2026-04-02-e2e-workflow-review-complex.md](/Users/wcf/personal/tinypowers/docs/workflow-review/2026-04-02-e2e-workflow-review-complex.md) 最大的价值，是它是在“当前已合并主线”上做的再验证，因此能把“哪些问题已解决、哪些问题仍然真实存在”分出来。

它新增确认了三件很重要的事：

1. `Fast / Standard` 两档之间确实还有空档  
2. `SPEC-STATE` 历史表 bug 不是纸面问题，而是在真实项目里仍会复现  
3. `doctor` 对 `/tmp` 和 `/private/tmp` 的路径判断不一致，是一个真实正确性问题

这份报告最有价值的地方，是把优化重点从“继续抽象讨论”拉回到了“修真实剩余缺口”。

## 统一判断：哪些问题已经解决，哪些还没解决

### 已明显改善的部分

- `tech:init` 已脚本化，不再需要 AI 手工落地 20+ 个文件
- 状态机已经从旧版更重的形态简化为更轻的主流程
- `Fast / Standard` 分流已经存在，不再是单一路径
- feature 骨架已经比早期更小
- `STATE.md` 已经开始支持自动生成初稿
- commit trailer 已经明显精简

这些改动说明主线方向是对的，而且已经产生了真实收益。

### 仍未解决的核心问题

1. `tech:feature` 对中小需求仍偏重  
2. `Fast / Standard` 两档之间缺中间层  
3. `SPEC-STATE` / `STATE` / `VERIFICATION` 仍然需要较多人工维护  
4. `DONE` 与提交时序仍然不自然  
5. `doctor` 和 init 验证入口仍不够统一  
6. 模板自动生成能力还不够强，很多内容仍需要人工从零写

## 统一优化路线

下面的路线综合了三份报告的优先级，并结合当前主线状态做了收束。

### P0：先修正确性和明显体验缺口

1. 修复 `update-spec-state.js` 的历史表插入逻辑  
目标：真实输出中的历史表必须结构正确。

2. 修复 `doctor.js` 的项目路径规范化  
目标：`/tmp/...` 与 `/private/tmp/...` 给出一致结果。

3. 统一 init 的推荐验证入口为 `doctor --project`  
目标：目标项目初始化后，有一个单一、明确、稳定的验证方式。

4. 梳理 `tech:init` 的默认最小产物  
目标：让首次接入默认更轻，减少“初始化产物太多”的感知负担。

### P1：继续把“中等复杂需求”从 Standard 里解放出来

5. 在 `Fast / Standard` 之间增加 `Medium` 或 `Standard-lite` 路由  
建议判定条件：
- 单服务或单模块
- 3-5 个任务
- 无数据库迁移
- 无跨系统依赖

建议目标：
- planning 文档控制在 120-180 行
- 保留任务拆解与关键决策
- 默认跳过歧义探索、brainstorming 和外部委托

6. 让 `tech:feature` 支持“从需求描述自动生成半成品文档”  
至少自动草拟：
- 目标与范围
- 接口草案
- 任务清单初稿
- 风险/边界初稿

7. 让 `tech:code` 支持 `VERIFICATION.md` 初稿生成  
至少能自动填入：
- 最近一次测试命令
- 测试结果
- 已覆盖场景骨架

### P2：继续降低执行期和收口期的人肉维护成本

8. 给 `STATE.md` 增加轻量更新命令  
例如：
- 标记 task 完成
- 标记 wave 完成
- 记录 blocker / deviation

9. 调整 `DONE` 收口机制  
目标：不再为了关闭 feature 状态额外补一个 meta commit。

10. 对无 GitHub/GitLab 平台的仓库提供明确降级说明  
目标：在本地 remote、bare remote 等场景下，commit 阶段体验更一致。

11. 继续收缩模板和 guide 的默认体积  
目标：只有在真正需要时，才显式展开更多规划/协作能力。

## 推荐实施顺序

### Phase 1：修剩余正确性问题

- 修 `update-spec-state.js` 历史表 bug
- 修 `doctor.js` 路径规范化
- 统一 init 验证入口

### Phase 2：补中间档位

- 新增 `Medium / Standard-lite`
- 收缩中等复杂需求的 planning 负担
- 默认关闭对中等需求不必要的 brainstorming / delegation

### Phase 3：把执行期文档从“手写”改成“半自动”

- `VERIFICATION.md` 初稿生成
- `STATE.md` 轻量更新命令
- `feature` 半成品文档自动草拟

### Phase 4：重做 commit 收口体验

- 解决 `DONE` 和 commit 时序问题
- 让收尾更接近“一次提交完成”
- 对无平台 remote 明确降级路径

## 最终结论

三份报告合起来，已经足够说明 tinypowers 当前的真实阶段：

```text
第一阶段的问题是：没有分级，所有需求都太重。
现在的问题是：虽然已经有分级，但中等复杂需求仍然找不到合适路径，
而且状态与验证层还有少数关键缺口没有补齐。
```

因此，下一轮优化不应该再做大而泛的重构，而应该非常聚焦：

1. 先修两处真实正确性问题：
   - `SPEC-STATE` 历史表
   - `doctor` 路径规范化
2. 再新增 `Medium / Standard-lite`
3. 然后把执行期和收口期的文档维护继续脚本化

如果只允许优先做一件产品层面的事，最值得做的是：

**新增 `Medium / Standard-lite` 路由。**

如果只允许优先做一件工程层面的事，最值得做的是：

**修复 `update-spec-state.js` 的历史表插入逻辑。**
