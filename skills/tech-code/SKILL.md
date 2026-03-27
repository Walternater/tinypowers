---
name: tech:code
description: 编码到code-review到test的循环流程，支持Wave并行执行和三阶段验证。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "2.0"
---

# /tech:code

## 功能
Wave并行执行 + 三阶段验证循环

## 输入
- `features/{id}/任务拆解表.md`

## 执行流程

```
┌─────────────────────────────────────────────┐
│  1. Plan Check (tech-plan-checker)        │
│  验证任务表完整性和依赖正确性               │
└──────────────────┬────────────────────────┘
                   ↓
              [通过/失败]
                   ↓失败
            返回修改建议，重试(≤3次)
                   ↓通过
┌─────────────────────────────────────────────┐
│  2. Wave Execution                         │
│  - 分析任务依赖，分波次                      │
│  - 同Wave并行执行，不同Wave等待            │
│  - 每任务完成后自动提交                      │
└──────────────────┬────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  3. Code Review (security + code reviewer) │
│  安全审查 + 质量审查                        │
└──────────────────┬────────────────────────┘
                   ↓
              [通过/失败]
                   ↓失败
            修复 → 重审(≤3次)
                   ↓通过
┌─────────────────────────────────────────────┐
│  4. Verification (tech-verifier)           │
│  目标回溯验证，检查是否达成目标              │
└──────────────────┬────────────────────────┘
                   ↓
              [通过/失败]
                   ↓失败
            补充测试/修复(≤3次)
                   ↓通过
            输出报告
```

## 详细步骤

### Phase 1: Plan Check
1. 读取 `任务拆解表.md`
2. 调用 `tech-plan-checker` 验证：
   - 任务表格式正确
   - 无依赖环
   - 估时合理
   - 关键任务无遗漏
3. 失败则返回修改建议，最多重试3次

### Phase 2: Wave Execution
4. 分析任务依赖关系
5. 拓扑排序，分波次
6. 执行计划：

```
Wave 1: 无依赖任务 → 并行执行
Wave 2: 依赖Wave1完成 → 并行执行
Wave 3: 依赖Wave2完成 → 并行执行
...
```

7. 每任务完成后：
   - 运行自测
   - 提交代码：`feat({id}): {task-name}`

### Phase 3: Code Review
8. 调用 `security-reviewer` 安全审查
9. 调用 `code-reviewer` 质量审查
10. 失败则修复后重审，最多重试3次

### Phase 4: Verification
11. 调用 `tech-verifier` 目标验证
12. 检查代码是否达成技术方案目标
13. 验证测试覆盖率
14. 失败则补充测试/修复，最多重试3次

## 输出清单
- `features/{id}/code-review.md` - 审查报告
- `features/{id}/测试报告.md` - 测试报告
- `features/{id}/VERIFICATION.md` - 验证报告
- 代码变更（已提交）

## 验证失败处理
超过3次验证失败：
- 输出 `features/{id}/VERIFICATION-FAILED.md`
- 记录所有未解决问题
- 暂停等待人工决策

## 参考文档
- `docs/guides/code-review-checklist.md`
- `docs/guides/test-plan.md`
