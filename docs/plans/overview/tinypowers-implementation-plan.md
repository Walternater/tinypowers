# tinypowers 版本实现计划 - 总览

## 架构共识

```
tinypowers（薄编排层）              superpowers（技能执行层）
─────────────────────────────────────────────────────────────
/tech:init ───────────────────────────────── (独有)
/tech:feature ─────────────────────────────→ brainstorming → writing-plans
/tech:code ────────────────────────────────→ worktrees → subagent → review → verification
/tech:commit ──────────────────────────────→ (独有) → finishing-branch

tinypowers 定义 WHAT（门禁、交付物、流程）
superpowers 定义 HOW（怎么执行）
```

## 版本概览

| 版本 | 目标 | 周期 | 累计 | 关键产出 |
|------|------|------|------|----------|
| [1.0](../v1.0/) | 四技能框架跑通 | 15天 | 15天 | 4个SKILL.md, 9个脚本/模板 |
| [1.1](../v1.1/) | 工程化门禁 | 5天 | 20天 | 编译/格式/安全脚本 |
| [1.2](../v1.2/) | 审查深度化 | 10天 | 30天 | 50+规则库 |
| [1.3](../v1.3/) | 测试集成 | 8天 | 38天 | 覆盖率门禁/测试生成 |
| [1.4](../v1.4/) | 知识飞轮 | 8天 | 46天 | 知识自动提取 |
| [1.5](../v1.5/) | 深度封顶 | 14天 | 60天 | 指南文档/2.0预研 |
| [2.0](../v2.0/) | 多语言支持 | 24天 | 84天 | 执行层生态 + AI |

**总计：约 4 个月（半职）**

---

## 文档索引

### 1.0 MVP
- [设计文档](../v1.0/2026-04-09-tinypowers-1.0-thin-orchestration.md) - 薄编排层架构
- [实施详情](../v1.0/v1.0-implementation.md) - 功能清单与验收标准
- [逐日分解](../v1.0/v1.0-daily-breakdown.md) - 15天详细排期
- [任务清单](../v1.0/v1.0-tasks.md) - 22个任务分解

### 1.1 工程化门禁
- [实施详情](../v1.1/v1.1-implementation.md)
- [详细设计](../v1.1/v1.1-detailed-design.md) - 脚本完整实现
- [任务清单](../v1.1/v1.1-tasks.md) - 5个任务

### 1.2 审查深度化
- [实施详情](../v1.2/v1.2-implementation.md)
- [规则库](../v1.2/v1.2-compliance-rules.md) - 50+规则详细清单
- [任务清单](../v1.2/v1.2-tasks.md) - 7个任务

### 1.3 测试集成
- [实施详情](../v1.3/v1.3-implementation.md)
- [测试集成详情](../v1.3/v1.3-test-integration.md)
- [任务清单](../v1.3/v1.3-tasks.md) - 6个任务

### 1.4 知识飞轮
- [实施详情](../v1.4/v1.4-implementation.md)
- [知识捕获](../v1.4/v1.4-knowledge-capture.md)
- [任务清单](../v1.4/v1.4-tasks.md) - 6个任务

### 1.5 深度封顶
- [实施详情](../v1.5/v1.5-implementation.md)
- [任务清单](../v1.5/v1.5-tasks.md) - 6个任务

### 2.0 执行层生态 + 智能化
- [路线图](../v2.0/2026-04-09-tinypowers-detailed-roadmap-1.0-to-2.0.md)
- [实施详情](../v2.0/v2.0-implementation.md)
- [生态与智能设计](../v2.0/v2.0-ecosystem-intelligence.md)
- [任务清单](../v2.0/v2.0-tasks.md) - 14个任务

### 总览共享
- [任务依赖与关键路径](tasks-shared.md) - 依赖图+关键路径+文件汇总
- [实施检查清单](implementation-checklist.md) - 各版本验收检查项
- [审查报告](review-report.md) - 规划质量审查结果

### 契约文档 (版本间接口)
- [v1.0 接口契约](../contracts/v1.0-interface.md) - 1.0 提供的接口/格式/目录约定
- [数据格式契约](../contracts/data-formats.md) - 规则/报告/配置格式规范
- [扩展点契约](../contracts/extension-points.md) - 如何扩展技能/规则/脚本

### 其他
- [执行层生态](../ecosystem/) - 多引擎整合方案
- [归档](../archive/) - 历史设计文档

---

**文档完成**: 2026-04-09
