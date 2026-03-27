---
name: tech:code
description: 编码到code-review到test的循环流程。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "1.0"
---

# /tech:code

## 功能
编码 → review → test → 循环

## 输入
- `features/{id}/任务拆解表.md`

## 执行步骤

### Phase 1: 任务分发
1. 读取任务拆解表
2. 分析任务依赖
3. 确定并行/串行任务
4. 分发给编码Agent

### Phase 2: 编码（可并行）
5. 编码Agent实现代码
6. 运行自测
7. 报告完成状态

### Phase 3: 审查
8. 调用 security-reviewer 进行安全审查
9. 调用 tester 生成测试用例
10. 调用 code-reviewer 进行质量审查

### Phase 4: 循环
11. 如果审查发现问题：
    - 修复代码
    - 重新审查
    - 重复直到通过
12. 如果审查通过：
    - 输出 `code-review.md`
    - 输出 `测试报告.md`

## 输出清单
- `features/{id}/code-review.md`
- `features/{id}/测试报告.md`
- 代码变更

## 协作模式
执行阶段并行（多个编码Agent）

## 参考文档
- `docs/guides/code-review-checklist.md` - 代码审查清单
- `docs/guides/test-plan.md` - 测试计划规范
