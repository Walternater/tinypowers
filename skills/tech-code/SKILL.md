---
name: tech:code
description: 读取 SPEC.md，执行任务，更新 STATE.md 和 VERIFICATION.md。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "8.0"
---

# /tech:code

## 作用

执行 SPEC.md 中定义的任务，产出 STATE.md 和 VERIFICATION.md。

## 输入

- `features/{id}-{name}/SPEC.md`
- `features/{id}-{name}/SPEC-STATE.md`

## 输出

- `features/{id}-{name}/STATE.md` - 任务执行状态
- `features/{id}-{name}/VERIFICATION.md` - 验证报告
- `features/{id}-{name}/notepads/learnings.md` - 学习笔记

## 生命周期

```
PLAN -> EXEC -> REVIEW -> DONE
```

- 进入时：SPEC-STATE 为 PLAN 或 EXEC
- 开始执行：推进到 EXEC
- 完成验证：推进到 REVIEW
- 禁止自动提交

## 主流程

```text
1. Gate Check（SPEC.md 非空 + 任务存在）
2. 更新 SPEC-STATE phase -> EXEC
3. 创建 STATE.md（如不存在）
4. 逐个执行任务，更新 STATE.md
5. 构建验证（mvn compile / npm run build）
6. 生成 VERIFICATION.md
7. 更新 SPEC-STATE phase -> REVIEW
```

## Gate Check

检查项：
- [ ] SPEC.md 存在且非空
- [ ] 任务列表有内容
- [ ] SPEC-STATE.track 已设置

## STATE.md 结构

| 编号 | 任务 | 状态 | 验证方式 |
|------|------|------|----------|
| T-01 | ... | [x] | mvn test |

## VERIFICATION.md 结构

- 结论：PASS / FAIL
- 构建命令和结果
- 关键验证点
- 风险与残留

## 注意事项

- STATE.md 和 VERIFICATION.md 放在 feature 根目录，不再按 Wave 划分
- 连续失败 3 次的任务应停止并讨论
- 代码和文档收口统一交给 `/tech:commit`
