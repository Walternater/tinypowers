# tinypowers Workflow 优化方案

> 版本: 可执行版
> 更新日期: 2026-04-03
> 基线分支: `main`
> 基于: `tech-init 5.0 / tech-feature 8.0 / tech-code 9.0 / tech-commit 5.0`

配套清单：

- `WP-A` 详细实施清单：`docs/workflow-optimization-wp-a-checklist.md`
- `WP-B` 详细实施清单：`docs/workflow-optimization-wp-b-checklist.md`
- `WP-C` 详细实施清单：`docs/workflow-optimization-wp-c-checklist.md`
- `WP-D` 详细实施清单：`docs/workflow-optimization-wp-d-checklist.md`
- `WP-E` 详细实施清单：`docs/workflow-optimization-wp-e-checklist.md`

## 1. 目标

本方案不再按“问题清单”展开，而是直接回答四件事：

1. 当前主干到底卡在哪里。
2. 哪些问题已经部分落地，哪些仍未解决。
3. 应该按什么顺序实施，避免互相打架。
4. 每个工作包改哪些文件，做到什么算完成。

本轮优化的总目标：

- 减少无意义产物和提交噪音。
- 让 `SPEC-STATE.md` 反映真实状态，而不是“文件存在即完成”。
- 把审查、测试、验证真正接成闭环。
- 保留 Fast / Medium / Standard 分级，不把复杂方案强压给小需求。

非目标：

- 不重新设计 `/tech:*` 命令体系。
- 不引入新的复杂状态机。
- 不为了“AI 自驱”牺牲关键门禁的可信度。

## 2. 当前状态快照

当前主干不是“完全未优化”，而是“部分优化已落地，但模型仍不一致”。

补充说明：
- 本文档下述 `WP-A` 已在当前优化 worktree 中落地并通过测试。
- 在合并回主干前，仍应以“分支内已验证、主干待合并”理解这些状态。

| 主题 | 当前状态 | 结论 |
|------|----------|------|
| 安装方式 | 已支持 `install.sh --global` | 不是从零开始，重点是收口默认策略和安装清单 |
| 需求分级 | 已有 `fast / medium / standard` | 保留，不再回退到单一路径 |
| 生命周期 | 已收敛到 `PLAN -> EXEC -> REVIEW -> DONE` | 正确方向，继续沿用 |
| scaffold | 当前分支已收敛为最小 4 件套，测试/learnings 改为按需创建 | 主干待合并 |
| 状态判断 | 当前分支已改为 `pending / scaffolded / filled / verified` | 主干待合并 |
| 审查闭环 | `tech:code` 写了审查顺序，但没有真正自动执行 | 需要补齐 |
| 验证产物 | 当前分支已按路径收敛：Fast 只要求 `VERIFICATION.md` | 主干待合并 |
| commit 收口 | `SPEC-STATE -> DONE` 仍是独立 commit | 需要简化 |
| knowledge capture | 仍是可选说明，没有形成稳定触发 | 可以后置优化 |

## 3. 关键判断

本方案采用以下判断，作为后续所有改动的前提：

### 3.1 先改产物模型，再改执行闭环

如果继续保留现在的脚手架和状态判断逻辑，那么：

- 空模板会继续被标成 `done`
- review 和 verification 仍会写到错误的载体上
- commit 阶段仍然需要围绕“伪完成产物”做收口

所以第一优先级不是 UI 文案，也不是 checkpoint，而是产物模型。

### 3.2 测试文档不做“一刀切三合一”

原始审查报告建议把 `测试计划.md`、`测试报告.md`、`VERIFICATION.md` 全部合并为一个文件。这个方向只适合 Fast 路径。

执行版策略：

- `fast`: 只保留 `VERIFICATION.md`
- `medium / standard`: 保留 `测试计划.md`、`测试报告.md`、`VERIFICATION.md`

原因：

- Fast 路径需要更少文档负担。
- Medium / Standard 仍然需要把“测试设计”“执行结果”“最终验证”分层保存。
- 这样可以减少文档量，同时不牺牲复杂需求的可审计性。

### 3.3 `DONE` 应并入最终 feature commit

当前 `tech:commit` 采用“提交成功后再改 `SPEC-STATE`，再单独 commit 一次”的方式，历史噪音偏大。

执行版策略：

- 在最终提交前完成 `SPEC-STATE -> DONE`
- 将代码、文档、`SPEC-STATE.md` 一并纳入最终 feature commit

这样可以保持：

- 只有一个交付 commit
- `DONE` 与最终交付内容同版本
- 不再制造额外 chore commit

### 3.4 “人工确认”必须是软门禁，不是假装强门禁

AI 自驱场景下，“等待 go，超时自动继续”可以作为体验提示，但不能把它包装成严格审批。

执行版策略：

- 明确保留 2 个显式 checkpoint
- 无人工确认时记录为 `soft gate bypassed`
- 不能把超时继续记为“已审批”

## 4. 工作包

### WP-A 产物模型重构

目标：先修正脚手架、状态语义和验证产物，消除“假完成”。

当前状态：
- 当前优化分支已完成实现
- 已通过 `node --test tests/scaffold-feature.test.js tests/spec-state.test.js`
- 已通过全量 `npm test`

#### A1. scaffold 分阶段创建

决策：

- `feature` 阶段默认只创建：
  - `SPEC-STATE.md`
  - `PRD.md`
  - `技术方案.md`
  - `任务拆解表.md`
- `fast` 路径不预创建测试相关文档
- `STATE.md` 和 `notepads/learnings.md` 改为按需创建

改动文件：

- `scripts/scaffold-feature.js`
- `configs/templates/spec-state.md`
- `tests/scaffold-feature.test.js`

验收标准：

- 新建 feature 后目录默认只有 4 个主产物
- Fast / Medium / Standard 三条路径的 scaffold 测试都通过
- 不再自动生成空的 `测试计划.md`、`测试报告.md`、`learnings.md`

当前分支实现结果：
- 已完成
- `STATE.md`、`VERIFICATION.md`、`notepads/learnings.md` 现在都改为按需创建

#### A2. 状态判断从“文件存在”改为“内容有效”

决策：

- 统一状态枚举为：`pending / scaffolded / filled / verified`
- `pending`: 文件不存在
- `scaffolded`: 文件存在，但仍是模板态
- `filled`: 已填写到可执行粒度
- `verified`: 审查或验证已完成

关键规则：

- `PRD.md` 需要至少 1 条验收标准
- `技术方案.md` 需要至少 1 条已确认决策
- `任务拆解表.md` 需要具备任务粒度
- `VERIFICATION.md` 需要有明确 PASS / FAIL 结论

改动文件：

- `scripts/update-spec-state.js`
- `configs/templates/spec-state.md`
- `tests/spec-state.test.js`

验收标准：

- 空模板不再显示 `done`
- `PLAN -> EXEC` 仍受现有硬门禁约束
- 状态表中的产物状态可稳定反映真实内容

当前分支实现结果：
- 已完成
- `SPEC-STATE.md` 现在使用 `pending / scaffolded / filled / verified / active / optional`

#### A3. 按路径收敛验证产物

决策：

- `fast`:
  - 只要求 `VERIFICATION.md`
- `medium / standard`:
  - 继续要求 `测试计划.md`
  - 继续要求 `测试报告.md`
  - 继续要求 `VERIFICATION.md`

改动文件：

- `skills/tech-code/SKILL.md`
- `skills/tech-commit/SKILL.md`
- `scripts/update-spec-state.js`
- `docs/guides/workflow-guide.md`
- `docs/guides/change-set-model.md`
- `tests/spec-state.test.js`

验收标准：

- Fast 路径可在无 `测试计划.md` / `测试报告.md` 时进入 `REVIEW`
- Medium / Standard 路径仍需三份验证产物
- 技能文档、脚本门禁、测试行为三者一致

当前分支实现结果：
- 脚本门禁与测试行为已完成
- guides 已同步
- `skills/tech-code/SKILL.md` 与 `skills/tech-commit/SKILL.md` 仍待在 `WP-B` / `WP-D` 实施时一起收口描述

依赖：

- A3 依赖 A1、A2

### WP-B 审查闭环自动化

目标：把 `tech:code` 中“建议顺序”变成真正会执行、会沉淀的流程。

#### B1. 自动执行决策合规审查

决策：

- 读取 `技术方案.md` 的锁定决策
- 读取本次变更代码或 diff
- 输出每条决策的 `PASS / WARN / FAIL`

改动文件：

- `skills/tech-code/SKILL.md`
- `agents/compliance-reviewer.md`

验收标准：

- 审查步骤有明确输入、输出、失败处理
- `VERIFICATION.md` 中能看到决策合规性区块

#### B2. 自动执行代码质量审查

决策：

- 增加独立 `code-reviewer` agent，负责质量与常见风险
- 问题等级统一为：
  - `critical`
  - `warning`
  - `suggestion`

改动文件：

- `agents/code-reviewer.md`
- `skills/tech-code/SKILL.md`

验收标准：

- `tech:code` 审查环节不再只是文档描述
- `critical` 问题会阻塞收口
- `warning / suggestion` 默认进入修复循环

#### B3. 审查结果自动沉到验证产物

决策：

- 新增统一写入逻辑
- 将决策合规性和代码审查结果写入 `VERIFICATION.md`

改动文件：

- `scripts/update-verification.js`（新增）
- `skills/tech-code/SKILL.md`
- `tests/` 新增对应脚本测试

验收标准：

- `VERIFICATION.md` 自动包含“决策合规性”“已知问题/残留风险”
- 审查结果与最终 PASS / FAIL 结论一致

依赖：

- B3 依赖 WP-A 完成

### WP-C 安装与分发收口

目标：降低项目污染，但不打破现有能力。

#### C1. 固化全局安装为推荐路径

决策：

- 保留项目级安装
- 文档和默认建议统一切到 `--global`
- `doctor` 明确识别全局安装与项目级安装

改动文件：

- `README.md`
- `install.sh`
- `scripts/doctor.js`

验收标准：

- 全局安装路径、项目级安装路径说明一致
- `doctor --global` 能给出明确结果

#### C2. 收敛复制清单

决策：

- `core` 组件只保留运行时必需文件
- 归档文档、框架内部审计文档不进入默认安装面
- 如需保留完整框架副本，走显式组件选择

改动文件：

- `manifests/components.json`
- `scripts/install-manifest.js`
- `README.md`

验收标准：

- 默认安装不再复制 `docs/archive/`
- 安装后目标项目中的框架副本显著减少

依赖：

- 无

### WP-D commit 与知识沉淀收口

目标：减少提交噪音，把知识沉淀变成真实可用的后处理。

#### D1. `DONE` 并入最终 feature commit

决策：

- 废弃独立 `chore: update spec state to DONE`
- 最终 commit 前完成 `SPEC-STATE -> DONE`
- 最终 feature commit 一次性包含状态收口

改动文件：

- `skills/tech-commit/SKILL.md`
- 如有需要，补充 `scripts/update-spec-state.js` 调用说明

验收标准：

- 正常交付只产生一个 feature commit
- `SPEC-STATE.md` 中的 `DONE` 与最终代码同 commit

#### D2. 知识沉淀改成“半自动推荐”

决策：

- 不强制所有 feature 产出 learnings
- 只有满足沉淀条件时才提示写入 `docs/knowledge.md`
- 建议保留 `[PERSIST]` 标记，便于抽取

改动文件：

- `skills/tech-commit/SKILL.md`
- `docs/knowledge.md` 使用说明
- 如后续实现自动抽取，再新增脚本

验收标准：

- Fast 路径不因空 learnings 卡住提交
- 有价值条目可以被稳定识别并提示用户确认

依赖：

- D2 不依赖 B，但依赖 A1 中“learnings 按需创建”的策略

### WP-E 体验增强

目标：把容易误导或后置暴露的问题提前，但不改变主流程语义。

#### E1. doctor 运行时检查

决策：

- 检查 Java 版本
- 检查 Maven / Gradle 可用性
- 报告中明确区分“框架安装正常”和“项目运行时缺失”

改动文件：

- `scripts/doctor.js`

验收标准：

- 在 Java 版本不匹配时给出明确失败原因和建议
- 不把运行时问题误报成框架缺失

#### E2. 显式 checkpoint 重设计

决策：

- 保留 2 个 checkpoint：
  - `feature -> code`
  - `code -> commit`
- 无人工确认时记录为 `soft gate bypassed`
- 不写成“自动审批通过”

改动文件：

- `skills/tech-feature/SKILL.md`
- `skills/tech-code/SKILL.md`

验收标准：

- 用户能在关键边界看到摘要
- AI 自驱时不会制造“假审批”语义

依赖：

- E2 依赖 WP-B，因为没有审查结果就无法输出高质量的第二个 checkpoint 摘要

## 5. 实施顺序

按依赖关系，推荐顺序如下：

1. `WP-A` 产物模型重构
2. `WP-C` 安装与分发收口
3. `WP-B` 审查闭环自动化
4. `WP-D` commit 与知识沉淀收口
5. `WP-E` 体验增强

原因：

- `WP-A` 是底座，不先改它，后面所有状态与文档判断都会继续失真。
- `WP-C` 相对独立，可以并行推进。
- `WP-B` 依赖明确的验证产物模型。
- `WP-D` 需要在验证与状态模型稳定后再调整。
- `WP-E` 主要改善体验，不应阻塞主闭环。

## 6. 里程碑

### Milestone 1: 产物语义一致

范围：

- A1
- A2
- A3

通过标准：

- Fast / Medium / Standard 三条路径的产物定义一致
- 状态表不再出现“空模板即 done”
- 相关测试全部通过

### Milestone 2: 审查与验证闭环

范围：

- B1
- B2
- B3

通过标准：

- 审查结果能自动进入 `VERIFICATION.md`
- `critical` 问题阻塞收口
- 决策合规性可追溯

### Milestone 3: 安装与交付收口

范围：

- C1
- C2
- D1
- D2

通过标准：

- 默认安装不再污染项目
- feature 最终只需一个交付 commit
- knowledge capture 变成真实可用的可选动作

### Milestone 4: 体验增强

范围：

- E1
- E2

通过标准：

- 运行时问题能在 doctor 阶段暴露
- checkpoint 摘要清晰但不制造伪审批

## 7. 验证方案

### 7.1 回归场景

使用 demo Java 项目至少覆盖以下场景：

- Fast 路径小需求
- Medium 路径含 DB 变更
- Standard 路径含跨模块改动

### 7.2 核心检查项

| 检查项 | 通过标准 |
|--------|---------|
| scaffold 产物 | PLAN 阶段默认只有规划产物 |
| 状态准确性 | 空模板显示 `scaffolded`，不是 `done` |
| Fast 验证路径 | 无 `测试计划.md` / `测试报告.md` 也可进入 `REVIEW` |
| Medium/Standard 验证路径 | 仍要求测试计划、测试报告、验证报告 |
| 审查闭环 | `VERIFICATION.md` 含决策合规性和审查结论 |
| commit 收口 | 正常交付只有一个 feature commit |
| 安装清洁度 | 默认安装不复制归档文档 |

### 7.3 建议保留的指标

| 指标 | 当前 | 目标 |
|------|------|------|
| 文档/代码比 | 偏高 | Fast 明显下降，Medium/Standard 保持可审计 |
| 提交文件数 | 偏高 | 默认安装显著下降 |
| 假完成状态 | 存在 | 消除 |
| 决策合规可追溯性 | 弱 | 强 |

## 8. 暂不实施

以下提案本轮不直接执行：

- 把所有测试产物统一强制合并成单一 `VERIFICATION.md`
- 用“超时自动继续”冒充人工审批
- 在没有产物模型重构之前先做 checkpoint 文案优化

原因：

- 它们会把复杂需求的证据层次压平，或者提前优化了错误的层。

## 9. 结论

这轮优化不应再按“问题条目”逐个修，而应该围绕两个核心目标推进：

1. 先让产物和状态真实可信。
2. 再让审查、验证、提交真正闭环。

只要 `WP-A` 和 `WP-B` 落地，tinypowers 的主流程就会从“文档上合理、执行时漂移”，变成“模型清晰、门禁可信、交付可追溯”。
