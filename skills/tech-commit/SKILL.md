---
name: tech:commit
description: 收口文档、同步代码、提交 Git。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "5.0"
---

# /tech:commit

## 作用

收口 SPEC.md 实现、提交代码、推进 SPEC-STATE 到 DONE。

## 前置条件

- VERIFICATION.md 结论为 PASS
- 测试通过
- 工作区无无关改动

## 主流程

```text
1. 文档同步（确保 SPEC.md 与实现一致）
2. Git 提交
3. 更新 SPEC-STATE phase -> DONE
```

## 文档同步

检查并更新：
- SPEC.md 中"执行记录"章节
- README.md（如有变更）

## Git 提交

```bash
git checkout -b feature/{id}-{short-desc}
git add .
git commit -m "[AI-Gen] type(scope): description"
```

推荐格式：
```
[AI-Gen] feat(refund): 实现退款申请功能

- 添加 RefundController
- 实现退款金额计算
- 添加时效校验

Evidence: mvn test PASS
```

## 生命周期收口

完成后：
- SPEC-STATE phase -> DONE
- 添加执行记录到 SPEC.md

## 注意事项

- 提交信息必须包含 Evidence 证明构建/测试通过
- 简单需求可跳过文档同步中的非关键章节
- learnings.md 中的经验可选是否沉淀到 docs/knowledge.md
