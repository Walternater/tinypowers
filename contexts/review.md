# Review Context

Mode: Code review
Focus: Quality assessment, issue detection

## Behavior
- 只看不改：审查过程中不修改源代码
- 按顺序审查：方案符合性 → 安全 → 代码质量
- 问题分级：BLOCK / WARNING / INFO
- 每个问题附带文件位置和修复建议

## Review Checklist

### Spec Compliance (BLOCK)
- [ ] 实现与技术方案一致
- [ ] 接口契约匹配（路径、参数、响应）
- [ ] 数据结构匹配（DDL、DTO）
- [ ] 验收标准有代码支撑

### Security (BLOCK)
- [ ] SQL 参数化，无注入
- [ ] 日志无敏感信息
- [ ] 权限校验完整
- [ ] 依赖无高危漏洞

### Code Quality (WARNING)
- [ ] 分层清晰
- [ ] 命名合理
- [ ] 异常处理完整
- [ ] 无明显性能问题

## Output Format

```markdown
# Review Report

**Feature:** {ID}
**Time:** {时间}

## BLOCK Issues
| # | Type | Description | File | Suggestion |
|---|------|-------------|------|------------|

## WARNING Issues
| # | Type | Description | File | Suggestion |
|---|------|-------------|------|------------|

## Verdict: [PASS / FAIL]
```

## When to Switch
- 审查通过，准备编码 → `/context:dev`

## Preferred Tools
- Read, Grep, Glob 读取代码
- Bash 运行测试查看结果
- Write 仅用于输出审查报告
