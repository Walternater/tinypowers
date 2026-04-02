# tinypowers 工作流三方审查整合报告

日期：2026-04-02

整合来源：

- [2026-04-02-e2e-workflow-review.md](/Users/wcf/personal/tinypowers/docs/workflow-review/2026-04-02-e2e-workflow-review.md)
- [pipeline-audit.md](/Users/wcf/personal/tinypowers/docs/workflow-review/pipeline-audit.md)
- [optimization-plan.md](/Users/wcf/personal/tinypowers/docs/workflow-review/optimization-plan.md)

## 一、统一结论

三份报告的主结论高度一致：

```text
当前流程的理念正确，但对简单需求明显过度流程化。
```

问题核心不在某一个 skill 写错了，而在于整条链路对“小任务 / 标准 CRUD / 单模块改动”没有复杂度分级，导致：

- 文档产出过多
- 状态流转过细
- 外部委托过多
- 上下文切换过多
- 真正编码时间占比过低

可以把这次三方审查的共识压缩成一句话：

```text
复杂需求需要治理，简单需求需要快路径；当前流程把两者混成了一套。
```

## 二、三份报告的共识

### 1. `/tech:feature` 是全流程最重的环节

三份报告都认为，当前工作流里最重的不是 `init` 或 `commit`，而是 `feature`。

共识点：

- Phase 太多
- 模板太空、填写成本高
- 对简单需求仍要求完整 PRD / 需求确认 / 技术方案 / 任务拆解 / 评审记录
- 交互轮次过多

统一判断：

- 当前 `feature` 更像“为复杂需求设计的完整治理流程”
- 但它被默认套用到了所有需求上

### 2. 缺少复杂度分级是第一性问题

三份报告都明确提出，应把需求按复杂度分级。

共识点：

- 小需求不该和大需求走同一条流程
- CRUD、单模块改动、小修复应有 fast-track / light 路径
- 复杂需求保留完整治理能力

统一判断：

- 这是影响最大的优化项
- 如果不先做分级，后续任何“删文档 / 缩模板 / 减 phase”都只能缓解，不能根治

### 3. 文档和模板整体偏重

三份报告都指出模板利用率偏低、骨架预生成过多。

共识点：

- `需求理解确认.md`
- `评审记录.md`
- `CHANGESET.md`
- `seeds/`
- `archive/`

这些内容在简单需求里经常是低价值或空置的。

统一判断：

- 当前 feature 骨架更适合完整项目治理，不适合作为所有需求的默认起点

### 4. `SPEC-STATE` 状态机过细

三份报告都认为状态机过细，且门禁设计和实际执行存在不一致。

共识点：

- 状态太多
- 推进太频繁
- 一些门禁只是在检查“文件存在”或“关键词存在”
- 对简单需求很多状态只是形式化流转

统一判断：

- `SPEC-STATE` 方向没错
- 但需要“降状态数 + 提高门禁真实性”

### 5. `tech:code` 的主要问题不是编码，而是上下文和切换成本

三份报告都认为，真正进入编码后流程并不算最差，主要摩擦来自：

- worktree 时机
- 多轮委托
- 多轮审查串行
- feature/code 之间的重复门禁

统一判断：

- `code` 不是最大问题
- 真正该优化的是它和 `feature` 之间的衔接

### 6. `tech:commit` 总体方向合理，但收口偏重

共识点：

- Document Sync 合理
- Knowledge Capture 合理，但小需求价值有限
- Git Commit 合理
- PR / Cleanup 合理

问题在于：

- 首次 feature 往往会把 init + feature + code 的全部产物一起提交
- `CLOSED` 状态和真实 commit 时序别扭
- 对小需求来说 trailer 和外部委托偏重

统一判断：

- `commit` 不需要大改
- 只需要减轻小需求的收口负担

## 三、三份报告的差异

### 1. `tech:init` 的判断略有差异

差异点：

- e2e 报告认为 `init` 复杂度“中高”，但主要问题集中在坏默认值、隐式依赖和知识扫描收益低
- pipeline-audit 认为 `init` 的真正重负担在 Step 4 全靠 AI 手工落地、缺少脚本化
- optimization-plan 相对更宽容，认为 `init` 可以通过合并扫描/策略/knowledge 三步来显著瘦身

统一后结论：

- `init` 不是最重的 skill
- 但有两个必须先修的工程化问题：
  1. 修坏默认值和隐式依赖
  2. 把落地步骤脚本化

### 2. 对 superpowers 委托的态度不同

差异点：

- pipeline-audit 对 7 个外部委托最敏感，倾向大幅减少委托
- optimization-plan 也主张把大量委托内化，只保留极少数必要委托
- e2e 报告更保守，重点放在“门禁和衔接不一致”，而不是先砍委托

统一后结论：

- 委托本身不是原罪
- 真问题是“小需求也要走完整委托链”
- 所以优化顺序应是：
  1. 先做复杂度分级
  2. 再决定哪些委托只保留在 Standard / Complex 路径

### 3. 对 `commit trailer` 的评价不同

差异点：

- pipeline-audit 认为 `Constraint / Rejected / Evidence / Confidence` 太定制化，不实用
- optimization-plan 倾向把 trailer 大幅简化
- e2e 报告认为 trailer 方向是好的，但确实不适合把它作为所有小需求的默认负担

统一后结论：

- `Evidence` 值得保留
- `Constraint / Rejected / Confidence` 不应强推到所有提交
- 更适合：
  - Complex 需求保留更完整 trailer
  - Fast 路径只保留自然语言 body + Evidence

## 四、整合后的问题排序

### P0：必须先修

1. 引入需求复杂度分级
   没有 Fast / Standard / Complex 分流，后续所有优化都会被“默认完整流程”抵消。

2. 修正 `init` 的错误默认值与显式依赖
   至少包括：
   - Maven `build_command`
   - `workflow-guide.md` 纳入正式产物与验证项
   - 模板变量校验与说明表冲突

3. 修复 `SPEC-STATE` 的实现缺陷
   至少包括：
   - 历史表插入 bug
   - 门禁从“关键词存在”升级为“真实内容完成”

### P1：第二阶段收敛

1. 精简 `tech:feature`
   目标：
   - Fast 路径只保留最小需求定义
   - Standard 路径保留完整治理

2. 重构 `feature -> code` 衔接
   重点：
   - worktree 时机
   - plan-check 重复调用
   - `STATE.md` 自动生成初稿

3. 脚本化 `tech:init` 落地步骤
   把大量“复制文件 + 替换变量 + 安装 hooks + 生成 settings”的动作从手工执行转成脚本。

### P2：后续体验优化

1. 模板分级
   为 PRD、技术方案、任务拆解提供 `simple/full` 两套版本。

2. Feature 骨架精简
   默认只生成真正高频使用的文件，其余按需创建。

3. 精简 `commit` 收口
   包括：
   - `CLOSED` 改成 commit 后回填
   - 小需求简化 trailer
   - 小需求弱化 knowledge capture

## 五、整合后的推荐方案

### 方案主线：双轨流程

推荐将工作流拆成两条主路径：

```text
Fast Path
适用：单模块、小改动、标准 CRUD、≤ 2 人天

Standard Path
适用：跨模块、有数据结构变更、有外部依赖、需要评审锁定的常规需求
```

必要时再保留 `Complex Path` 作为 Standard 的增强版，而不是默认路径。

### Fast Path 建议

```text
/tech:init
  -> 仅保留必要初始化

/tech:feature(light)
  -> 需求摘要
  -> 简化技术方案
  -> 简化任务表

/tech:code(light)
  -> Gate
  -> Pattern Scan
  -> Execute
  -> 合并审查
  -> Verify

/tech:commit(light)
  -> 文档同步/知识沉淀合并
  -> Commit
  -> Push/PR
```

建议目标：

- 总步骤数减半
- 外部委托显著减少
- 文档/代码比降到合理范围

### Standard Path 建议

保留当前完整治理思路，但做三类收敛：

1. 减少重复检查
   - `tech-plan-checker` 不要在 feature/code 各跑一次

2. 合并连续信息收集阶段
   - `Context Preparation + Pattern Scan`
   - `Task Breakdown + Validation`

3. 弱化空模板
   - 强化真实门禁
   - 降低纯形式化填写

## 六、建议实施路线

### Phase 1：先修正确性和骨架问题

目标：让当前流程“至少正确、可跑、不卡人”

包含：

- 修 `build_command`
- 修 `SPEC-STATE` 历史表
- 修门禁弱校验
- 明确 init 产物最小清单

### Phase 2：上线 Fast Path

目标：让简单需求不再被完整治理流程压垮

包含：

- 增加复杂度判定
- 给 `feature` 提供 light 模板
- 给 `code` 提供 light 路径
- 调整 worktree 策略

### Phase 3：减委托、减模板、减骨架

目标：把标准路径也收敛到更易执行的状态

包含：

- 减少 superpowers 委托
- 精简 feature 骨架
- 简化 commit trailer 和状态回填

## 七、最终整合结论

三份报告没有本质冲突，只有侧重点不同：

- e2e 报告更强调“真实跑下来哪里卡”
- pipeline-audit 更强调“管道结构本身哪里重”
- optimization-plan 更强调“怎么裁成更适合简单需求的版本”

整合后的最终判断是：

```text
tinypowers 现在缺的不是更多规则，而是复杂度分级。
```

如果只做一件事，应该先做：

```text
为简单需求提供 Fast Path。
```

因为这一步能同时解决：

- 流程过长
- 文档过多
- 委托过多
- 状态过细
- worktree 不协调
- commit 收口过重

这是三份报告的最大共识，也是最值得先落地的优化方向。
