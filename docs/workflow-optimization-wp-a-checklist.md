# WP-A 实施清单

> 对应主方案: `docs/workflow-optimization-plan.md`
> 范围: `WP-A 产物模型重构`

配套执行计划：

- `docs/plans/2026-04-03-wp-a-artifact-model-refactor.md`

## 1. 目标

`WP-A` 只做一件事：把 feature / code / commit 依赖的产物模型改正确。

完成后应该达到：

- PLAN 阶段不再生成无意义空模板。
- `SPEC-STATE.md` 不再把“文件存在”误判为“已经完成”。
- Fast / Medium / Standard 三条路径的验证产物定义清晰一致。

不在 `WP-A` 内处理：

- 审查 agent 自动执行
- knowledge capture 自动化
- checkpoint 交互体验优化

## 2. 执行顺序

严格按下面顺序做：

1. A1 scaffold 分阶段创建
2. A2 状态判断语义化
3. A3 按路径收敛验证产物
4. 文档同步
5. 回归测试

原因：

- A2 依赖 A1 的新产物布局。
- A3 依赖 A1 + A2，否则脚本门禁和产物状态会互相打架。

## 3. A1 scaffold 分阶段创建

### 3.1 设计决策

- `scripts/scaffold-feature.js` 默认只创建：
  - `SPEC-STATE.md`
  - `PRD.md`
  - `技术方案.md`
  - `任务拆解表.md`
- 不再默认创建：
  - `测试计划.md`
  - `测试报告.md`
  - `VERIFICATION.md`
  - `notepads/learnings.md`
- `STATE.md` 继续保持不默认创建

### 3.2 代码改动点

文件: `scripts/scaffold-feature.js`

- 调整 `ARTIFACTS` 常量：
  - 只保留 PLAN 阶段默认产物
  - 测试与验证产物改由后续阶段控制
- 调整 `TRACKS.*.templates`：
  - 删除 `test-plan.md`
  - 删除 `test-report.md`
- 删除默认创建 `notepads/learnings.md` 的逻辑
- 如需保留可扩展性，可引入显式参数：
  - `--phase plan|code`
  - 但本轮不是必须

文件: `configs/templates/spec-state.md`

- 更新“产物清单”默认值
- 默认产物状态不能再假设测试文件已存在

### 3.3 测试改动点

文件: `tests/scaffold-feature.test.js`

调整已有断言：

- Standard 路径：
  - 只断言 4 个规划产物存在
  - 断言 `测试计划.md` / `测试报告.md` 不存在
  - 断言 `notepads/learnings.md` 不存在
- Fast 路径：
  - 同样只断言 4 个规划产物存在
  - 保持 `track: fast` 断言
  - 保持 fast 模板内容断言

建议新增断言：

- `SPEC-STATE.md` 产物表中：
  - `PRD.md`、`技术方案.md`、`任务拆解表.md` 为 `done` 或后续新语义
  - 测试相关产物为 `pending`

### 3.4 完成定义

- scaffold 脚本跑完后目录结构明显变轻
- 现有 scaffold tests 全绿
- 没有任何代码路径仍偷偷创建 `测试计划.md` / `测试报告.md`

## 4. A2 状态判断语义化

### 4.1 设计决策

统一产物状态：

- `pending`
- `scaffolded`
- `filled`
- `verified`
- `active`
- `optional`

状态含义：

- `pending`: 文件不存在
- `scaffolded`: 文件已创建但仍是模板态
- `filled`: 内容已达到执行或审查需要
- `verified`: 已通过验证或审查
- `active`: 当前生命周期状态文件
- `optional`: 仅复杂需求按需启用

### 4.2 代码改动点

文件: `scripts/update-spec-state.js`

改造 `artifactStatus` 及相关辅助逻辑：

- 为 `PRD.md` 增加“验收标准存在”检测
- 为 `技术方案.md` 增加“已确认决策存在”检测
- 为 `任务拆解表.md` 增加“任务表已填写”检测
- 为 `VERIFICATION.md` 增加“PASS / FAIL 结论存在”检测
- 保留：
  - `SPEC-STATE.md -> active`
  - `STATE.md -> optional`

建议实现方式：

- 不要只用字符长度阈值
- 以关键结构字段为主，长度作为辅助信号

推荐判定优先级：

1. 文件不存在 -> `pending`
2. 文件存在但仍含明显模板占位、关键区块为空 -> `scaffolded`
3. 关键字段齐备 -> `filled`
4. 进入验证完成态 -> `verified`

文件: `configs/templates/spec-state.md`

- 更新“判断规则”说明
- 更新产物状态说明，避免继续出现 `done`

### 4.3 测试改动点

文件: `tests/spec-state.test.js`

建议新增/调整测试：

- scaffold 后查看 `SPEC-STATE.md`
  - `PRD.md` / `技术方案.md` / `任务拆解表.md` 初始应为 `scaffolded`
  - 测试相关产物应为 `pending`
- 填入有效内容后推进阶段
  - 状态应变为 `filled`
- 存在 `VERIFICATION.md` 且结论为 PASS
  - 状态应变为 `verified`

建议新增一个专门 case：

- “空模板不会显示为 done / filled”

### 4.4 完成定义

- `SPEC-STATE.md` 状态表能反映真实内容质量
- 空模板不再伪装成完成态
- `PLAN -> EXEC` 门禁仍保持严格

## 5. A3 按路径收敛验证产物

### 5.1 设计决策

路径规则：

- `fast`
  - `REVIEW` 前只要求 `VERIFICATION.md`
- `medium`
  - `REVIEW` 前要求 `测试计划.md` + `测试报告.md` + `VERIFICATION.md`
- `standard`
  - `REVIEW` 前要求 `测试计划.md` + `测试报告.md` + `VERIFICATION.md`

附加规则：

- `VERIFICATION.md` 不再由 scaffold 创建
- 由 `/tech:code` 在进入测试与验证阶段时创建或补全

### 5.2 代码改动点

文件: `scripts/update-spec-state.js`

- 在 `validatePrerequisites.REVIEW()` 中按 `track` 分支判断
- Fast 路径只校验 `VERIFICATION.md`
- Medium / Standard 维持三份验证产物要求

文件: `skills/tech-code/SKILL.md`

- 重写“测试与验证”部分
- 明确：
  - Fast 路径最小验证交付物
  - Medium / Standard 路径完整验证交付物

文件: `skills/tech-commit/SKILL.md`

- 重写前置条件
- 与 `update-spec-state.js` 保持同一规则

文件: `docs/guides/workflow-guide.md`

- 更新需求目录结构说明
- 标明哪些文件是“按路径可选”

文件: `docs/guides/change-set-model.md`

- 同步产物模型定义

### 5.3 测试改动点

文件: `tests/spec-state.test.js`

保留并改造现有 fast-track case：

- Fast 路径：
  - 无 `测试计划.md` / `测试报告.md`
  - 有 `VERIFICATION.md`
  - 可以进入 `REVIEW`

新增或改造 standard / medium case：

- 缺少任意一个测试文档时不能进入 `REVIEW`
- 三份齐备时可以进入 `REVIEW`

建议新增 case：

- “Fast 与 Standard 的 REVIEW 门禁不同”

### 5.4 完成定义

- 脚本、skills、guides 三处对路径规则描述一致
- Fast 路径不再被完整测试文档拖累
- Medium / Standard 保持可审计性

## 6. 文档同步清单

完成 A1-A3 后，至少同步以下文档：

- `docs/workflow-optimization-plan.md`
- `docs/guides/workflow-guide.md`
- `docs/guides/change-set-model.md`
- 如产物定义变化明显，补 `README.md`

同步重点：

- 目录树
- 路径差异
- 状态含义
- 进入 `REVIEW` / `DONE` 的门禁说明

## 7. 回归测试矩阵

最少跑下面这些：

### 7.1 单元/脚本测试

- `tests/scaffold-feature.test.js`
- `tests/spec-state.test.js`

### 7.2 关键场景

| 场景 | track | 期望 |
|------|-------|------|
| 新建最小 feature | standard | 仅生成规划产物 |
| 新建 fast feature | fast | 仅生成规划产物，保留 fast 模板差异 |
| 空模板状态检查 | standard | 显示 `scaffolded` / `pending` |
| Fast 进入 REVIEW | fast | 只要求 `VERIFICATION.md` |
| Standard 进入 REVIEW | standard | 仍要求测试计划、测试报告、验证报告 |

## 8. 风险与注意事项

- 不要把 `WP-A` 和审查自动化一起改，否则很难定位门禁问题来自哪一层。
- 不要用单纯字数阈值判断 `filled`，会导致误判。
- 改完 `update-spec-state.js` 后，一定要同步 `skills/` 文档，否则会出现“文档说 A，脚本执行 B”。
- 如果 `VERIFICATION.md` 的生成时机调整，记得检查 `tech:commit` 前置条件是否仍成立。

## 9. 完成后应该看到的结果

如果 `WP-A` 做对了，开发者的直观感受应该是：

- `/tech:feature` 结束后目录更干净。
- `SPEC-STATE.md` 看起来可信，不再有“明明没写完却显示 done”。
- Fast 路径推进明显更轻。
- Medium / Standard 仍然保持明确的证据链。
