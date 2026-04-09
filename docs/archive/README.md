# Archive

这里存放 tinypowers 的历史设计稿、审计报告和优化共识文档。

这些材料的作用是保留演进上下文，而不是作为当前工作流的活跃入口。

## 目录约定

- `designs/`：历史设计稿和实现计划
- `reports/`：历史审计、对标、优化共识与外部参考分析

## 保留清单

当前 archive 只保留最小但够用的一组历史材料：

- `reports/unified-optimization-plan.md`
  作用：最终综合报告，汇总当时多方审查的共识与裁决
- `reports/simplify-plan.md`
  作用：最早的激进简化提案，保留原始删减思路
- `reports/audit-report.md`
  作用：工程复杂度基线审查，保留问题盘点视角
- `reports/audit-report-claude.md`
  作用：逐文件、偏平衡的原始审查样本
- `reports/reference-borrowing-guide.md`
  作用：外部项目借鉴的蒸馏版指南
- `designs/2026-03-31-thin-orchestration-refactor-design.md`
  作用：薄编排重构设计稿
- `designs/2026-03-31-tech-code-thin-orchestration.md`
  作用：对应的实现计划

## 删除原则

以下历史材料在归档瘦身时优先删除，而不是无限累积：

- 已被 `unified-optimization-plan.md` 吸收的重复总结报告
- 只是在不同模型之间重复表达相近结论的平行审查稿
- 已被 `reference-borrowing-guide.md` 提炼过的外部参考扫描与激进引用方案
- 不再服务当前仓库理解、只会增加检索噪音的过程性材料

本轮已移除的典型文件：

- `consolidated-optimization-report.md`
- `external-projects-analysis.md`
- `reference-driven-optimization.md`
- `reference-projects-analysis.md`
- `reference-strategy.md`
- `review-and-optimization-report.md`

## 使用原则

- 当前生效的能力定义仍以 `skills/`、`hooks/`、`configs/`、`docs/guides/` 为准
- archive 文档可以帮助理解为什么做过某些取舍，但不应覆盖当前规范
- 如果 archive 中的建议已经落地，应优先看主线文档，而不是回到旧报告执行
