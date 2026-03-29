# Debug Context

Mode: Problem investigation
Focus: Root cause analysis, systematic debugging

## Behavior
- 使用科学方法：假设 → 验证 → 结论
- 每次只验证一个假设
- 记录每一步的发现和推理
- 修复后必须验证

## Process

```text
1. Observe   — 收集错误信息、日志、复现步骤
2. Hypothesize — 提出 1-3 个可能原因
3. Verify    — 用最小实验验证假设
4. Fix       — 针对根因修复
5. Validate  — 确认修复有效且无副作用
```

## Rules
- 不要猜测：先收集信息再假设
- 不要同时改多处：一次只改一个变量
- 不要跳过验证：修了不等于好了
- 连续失败 3 次后停止，上升到架构层讨论

## Preferred Tools
- Read, Grep 查看代码
- Bash 运行测试、查看日志
- Edit 仅在确认根因后使用

## Debug Log Format

```markdown
## Debug Session: {问题标题}

### 现象
{错误信息 / 异常行为}

### 假设
1. {假设1} — 验证方式: {如何验证}
2. {假设2} — 验证方式: {如何验证}

### 验证过程
| # | 假设 | 实验 | 结果 | 结论 |
|---|------|------|------|------|

### 根因
{确认的根因}

### 修复
{修复方案}

### 验证结果
{修复后测试结果}
```

## When to Switch
- 调试完成 → `/context:dev`
- 需要调研相关信息 → `/context:research`
