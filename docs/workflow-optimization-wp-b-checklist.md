# WP-B 实施清单

> 对应主方案: `docs/workflow-optimization-plan.md`
> 范围: `WP-B 审查闭环自动化`

配套执行计划：

- `docs/plans/2026-04-03-wp-b-review-automation.md`

## 1. 目标

`WP-B` 只解决一个问题：把 `/tech:code` 里的审查环节从“文档上存在”变成“流程里会执行、结果会沉淀”。

完成后应该达到：

- `compliance-reviewer` 不再只是一个可选概念，而是 `tech:code` 审查链路中的显式步骤。
- 增加一个独立的 `code-reviewer` agent，负责代码质量和风险检查。
- 审查结果自动写入 `VERIFICATION.md`，形成决策合规性和质量结论的证据链。

不在 `WP-B` 内处理：

- `WP-A` 的产物模型重构
- commit 收口策略
- knowledge capture 自动化
- checkpoint 交互体验

## 2. 前置依赖

`WP-B` 依赖 `WP-A`，至少需要这些前提成立：

- `VERIFICATION.md` 的角色已经稳定
- Fast / Medium / Standard 的验证产物规则已经明确
- `SPEC-STATE` 不再使用“文件存在即 done”的旧语义

如果先做 `WP-B`，会遇到两个问题：

- 审查结果不知道该写到哪个最终载体
- 审查通过与否会被旧的状态模型误读

## 3. 执行顺序

严格按下面顺序做：

1. B1 定义审查输出契约
2. B2 增加 `code-reviewer` agent
3. B3 设计并实现 `update-verification.js`
4. B4 改造 `tech:code`，串起审查链路
5. B5 增加脚本与文档测试

原因：

- 没有统一输出契约，就没法稳定写入 `VERIFICATION.md`
- 没有独立 `code-reviewer`，`tech:code` 无法形成双审查结构
- 没有写入脚本，审查结果只能继续手工贴

## 4. B1 定义审查输出契约

### 4.1 设计决策

两个审查步骤统一输出为结构化 Markdown，而不是自由文本：

- `Compliance Review`
- `Code Review`

它们至少都要包含：

- 审查对象
- 发现项
- 严重级别
- 总体结论

推荐严重级别：

- `BLOCK`
- `WARNING`
- `SUGGESTION`

推荐总体验证映射：

- `PASS`
- `CONDITIONAL`
- `FAIL`

### 4.2 代码改动点

文件: `agents/compliance-reviewer.md`

- 统一输出字段
- 明确哪些问题会阻塞
- 明确与 `VERIFICATION.md` 对接的 section 名称

文件: `agents/code-reviewer.md`（新增）

- 与 `compliance-reviewer` 使用同样的严重级别和 verdict 体系

### 4.3 完成定义

- 两个 agent 的输出格式能稳定拼接
- 审查结果可以不依赖人工整理，直接进入验证报告

## 5. B2 增加代码质量审查 agent

### 5.1 设计决策

`code-reviewer` 的职责边界：

- 只看代码质量、可维护性、常见工程风险
- 不重复做技术方案符合性判断
- 不替代最终验证

重点检查：

- 命名与职责是否清晰
- 复杂度是否过高
- 异常处理是否完整
- 测试覆盖是否支持关键逻辑
- 常见安全和并发风险是否被忽略

### 5.2 代码改动点

文件: `agents/code-reviewer.md`

- 创建 frontmatter
- 补齐核心使命、审查原则、沟通风格、交付格式
- 产出格式要与 `compliance-reviewer` 对齐

文件: `scripts/validate.js`

- 确保新增 agent 能通过元数据和推荐章节校验

### 5.3 完成定义

- 仓库中存在独立 `code-reviewer` agent
- `npm run validate` 不会因为新增 agent 报错

## 6. B3 设计并实现验证报告写入器

### 6.1 设计决策

新增 `scripts/update-verification.js`，负责把审查结果写入 `VERIFICATION.md`。

这个脚本的角色不是“生成完整验证报告”，而是“合并审查结果到既有验证载体”。

建议最小能力：

- 如果 `VERIFICATION.md` 不存在，创建最小骨架
- 写入或更新以下区块：
  - `## 决策合规性`
  - `## 代码审查`
  - `## 已知问题 / 残留风险`
  - `## 结论`

输入方式建议：

- `--feature <dir>`
- `--root <project-root>`
- `--compliance-report <path>`
- `--code-review-report <path>`

### 6.2 代码改动点

文件: `scripts/update-verification.js`（新增）

- 解析 feature 目录
- 读取两个审查报告
- 将结果合并进 `VERIFICATION.md`
- 当发现 BLOCK / FAIL 时，把总结区块更新为非 PASS

文件: `scripts/validate.js`

- 把新脚本纳入“框架骨架完整性”检查

### 6.3 测试改动点

建议新增测试文件：

- `tests/update-verification.test.js`

最少覆盖：

- 从空文件生成骨架
- 合并 compliance report
- 合并 code review report
- 发现 BLOCK / FAIL 时结论不为 PASS

### 6.4 完成定义

- `VERIFICATION.md` 可由脚本稳定更新
- 审查结果不再依赖手工复制粘贴

## 7. B4 改造 `tech:code` 串起审查链路

### 7.1 设计决策

`/tech:code` 的审查链路明确为：

1. `compliance-reviewer`
2. `code-reviewer`
3. `update-verification.js`
4. 修复循环
5. 最终验证

规则：

- 先做方案符合性和安全
- 再做代码质量
- 最后统一回写 `VERIFICATION.md`

### 7.2 改动文件

- `skills/tech-code/SKILL.md`
- 如需要，补 `docs/guides/workflow-guide.md`
- 如需要，补 `docs/guides/capability-map.md`

### 7.3 完成定义

- `tech:code` 文档不再只是“建议顺序”
- 审查步骤、结果载体、失败处理三者一致

## 8. B5 测试与回归

最少需要覆盖：

- `npm run validate`
- `tests/update-verification.test.js`
- 与 `VERIFICATION.md` 相关的已有脚本测试

建议检查项：

- 新增 `code-reviewer` 不破坏 validate
- `update-verification.js` 能处理空文件和重复写入
- 审查结果可重复合并，不会无限追加脏内容

## 9. 文档同步清单

至少同步以下文档：

- `docs/workflow-optimization-plan.md`
- `docs/guides/workflow-guide.md`
- `docs/guides/capability-map.md`
- 如验证产物角色有变化，补 `docs/guides/change-set-model.md`

同步重点：

- 审查顺序
- 审查产物
- `VERIFICATION.md` 中新增区块
- 审查失败如何阻塞后续推进

## 10. 风险与注意事项

- 不要让 `code-reviewer` 和 `compliance-reviewer` 职责重叠，否则输出会互相打架。
- `update-verification.js` 应该做“合并”，不是每次覆盖全文重写。
- 如果 `VERIFICATION.md` 的最终结论由脚本更新，必须定义清楚 BLOCK / WARNING / PASS 的映射规则。
- `tech:code` 文档与脚本行为必须同步，否则团队会继续把审查当成“理论流程”。

## 11. 完成后应该看到的结果

如果 `WP-B` 做对了，开发者的直观感受应该是：

- `/tech:code` 的审查步骤变得可信，不再只是说明文字。
- `VERIFICATION.md` 能看到决策合规性和代码审查结果。
- 审查结论能直接影响后续收口，而不是靠人工记忆。
