---
name: tech:feature
description: 分析需求，创建简化的 SPEC.md 规划文档。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "7.0"
---

# /tech:feature

## 作用

将模糊需求整理成可执行的 SPEC.md。

## 默认骨架

```
features/{id}-{name}/
├── SPEC.md              # 合并的规划文档
├── SPEC-STATE.md        # 状态机
└── notepads/
    └── learnings.md     # 学习笔记
```

## Track 选择

| Track | 适用场景 | 复杂度 |
|-------|---------|--------|
| simple | 1-3个任务，单模块，无外部依赖 | relaxed |
| standard | 多模块/多任务/外部系统 | strict |

**自动降级**：如果 simple track 发现任务数 > 3，自动建议改用 standard。

## 主流程

```text
1. 解析需求（ID、名称、背景）
2. 选择 track（simple | standard）
3. 运行 scaffold
4. 填充 SPEC.md 内容
5. 进入 PLAN 状态
```

## 运行

```bash
node "${TINYPOWERS_DIR}/scripts/scaffold-feature.js" \
  --id FEAT-123 \
  --name 功能名称 \
  --track simple
```

## SPEC.md 结构

### Simple Track
- 1. 概述（背景、一句话目标）
- 2. 任务清单（表格）
- 3. 验收标准
- 4. 执行记录

### Standard Track
- 1. 概述（背景、目标、范围）
- 2. 方案要点（核心设计、关键决策、数据影响）
- 3. 任务清单（带 Epic/Task 分层）
- 4. 验收标准
- 5. 风险与约束
- 6. 执行记录

## 门禁规则

进入 `/tech:code` 前：
- [ ] SPEC.md 存在且非空
- [ ] 任务列表至少 1 项
- [ ] 验收标准明确

## 注意事项

- 决策记录在"关键决策"表中，格式：D-01, D-02...
- 任务编号格式：T-01, T-02...
- 状态标记：[ ], [-], [x] 表示 pending, doing, done
