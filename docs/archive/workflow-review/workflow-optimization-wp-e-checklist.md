# WP-E 实施清单

> 对应主方案: `docs/workflow-optimization-plan.md`
> 范围: `WP-E 体验增强`

配套执行计划：

- `docs/plans/2026-04-03-wp-e-experience-enhancements.md`

## 1. 目标

`WP-E` 聚焦两类体验问题：

- 运行时环境问题应该更早在 `doctor` 阶段暴露，而不是到 code 阶段才卡住。
- `feature -> code` 与 `code -> commit` 的边界应该有显式 checkpoint，但不能制造“伪审批”。

完成后应该达到：

- `doctor` 能提示 Java / 构建运行时缺口。
- 关键阶段有清晰摘要输出。
- AI 自驱时可以继续，但语义上明确是 `soft gate bypassed`，不是“已审批”。

不在 `WP-E` 内处理：

- `WP-A` 的产物模型
- `WP-B` 的审查结果生成
- `WP-C` 的安装收口
- `WP-D` 的 commit / knowledge 语义

## 2. 前置依赖

`WP-E` 依赖：

- `WP-B` 已把审查与验证结果沉到 `VERIFICATION.md`

原因：

- 第二个 checkpoint 如果没有审查结果和验证结论，就只能输出空摘要，体验价值很低。

`E1 doctor 运行时检查` 可以相对独立实施，但建议仍放在 `WP-C` 之后，以便避免和安装模式诊断改动冲突。

## 3. 执行顺序

严格按下面顺序做：

1. E1 增强 `doctor` 的运行时检查
2. E1 增加对应测试
3. E2 重设计 `feature -> code` checkpoint
4. E2 重设计 `code -> commit` checkpoint
5. 文档同步与回归检查

原因：

- `doctor` 的体验增强与 workflow 文案重设计相对独立，可先做。
- 两个 checkpoint 需要共享一套“显式 checkpoint / soft gate bypassed”语义，适合一起收口。

## 4. E1 doctor 运行时检查

### 4.1 设计决策

`doctor` 不只检查“框架装好了没有”，还应该回答“这台机器能不能跑这个项目”。

建议最小检查项：

- Java 版本要求
- Maven / Gradle 是否可用
- 必要时提示当前 shell 环境与项目要求不匹配

输出应区分：

- 框架安装问题
- 项目接线问题
- 运行时环境问题

### 4.2 改动文件

- `scripts/doctor.js`
- `tests/tooling.test.js`
- 如说明文字有变化，可补 `README.md`

### 4.3 完成定义

- `doctor` 能在项目运行时不匹配时给出明确提示
- 不把环境问题误报成框架缺失

## 5. E2 显式 checkpoint 重设计

### 5.1 设计决策

保留 2 个显式 checkpoint：

- `CHECK-1`: `feature -> code`
- `CHECK-2`: `code -> commit`

两个 checkpoint 的作用：

- 给人一个“是否继续”的清晰边界
- 给 AI 自驱一个“边界摘要”的显式输出格式

但语义必须明确：

- 有人工确认：继续执行
- 无人工确认：记录 `soft gate bypassed`
- 不能写成 `approved`
- 不能假装这是强审批

### 5.2 `CHECK-1` 目标

`feature -> code` 的 checkpoint 至少输出：

- 需求摘要
- 关键决策数量
- 任务数量 / 任务粒度
- 主要风险

### 5.3 `CHECK-2` 目标

`code -> commit` 的 checkpoint 至少输出：

- 变更摘要
- 测试结果
- 审查结论
- 决策合规性摘要
- 残留风险

### 5.4 改动文件

- `skills/tech-feature/SKILL.md`
- `skills/tech-code/SKILL.md`
- `docs/guides/workflow-guide.md`

如需要，再补：

- `docs/guides/capability-map.md`

### 5.5 完成定义

- 技能文档中不再只是写“暂停”，而是有明确 checkpoint 结构
- AI 自驱时不会制造“自动审批通过”的误导语义

## 6. 建议的回归检查

最少要做：

- `tests/tooling.test.js`
- `npm run validate`
- 文本搜索检查

建议搜索：

```bash
rg -n "暂停|checkpoint|soft gate bypassed|approved|doctor|Java版本" skills docs README.md scripts
```

关注点：

- 是否仍残留“超时自动审批”的说法
- 是否出现新的模糊表述

## 7. 风险与注意事项

- 不要把 checkpoint 做成新的强门禁，否则会重新引入流程负担。
- `doctor` 的环境检查要尽量做成“诊断提示”，不要轻易把可恢复问题全部升级成失败。
- checkpoint 文案必须简洁，否则体验提升会反过来变成流程膨胀。

## 8. 完成后应该看到的结果

如果 `WP-E` 做对了，开发者的直观感受应该是：

- `doctor` 更像真正的开工前诊断。
- 流程边界更清楚。
- AI 自驱继续顺滑，但不会假装拿到了人工批准。
