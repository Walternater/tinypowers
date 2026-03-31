# quality-gate.md

## 作用

每个 Wave 结束后的最低通过标准。目的不是追求完美，而是防止明显有问题的实现带入下一轮。

## 默认检查项

| 检查项 | 级别 | 说明 |
|--------|------|------|
| 编译或构建 | 阻断 | 构建失败不能继续 |
| 单元测试 | 阻断 | 有失败测试不能继续 |
| 覆盖率 | 警告（可配为阻断） | 建议行覆盖率 >= 80% |
| 安全扫描 | 高危阻断 | 明显漏洞不应带入后续 |

## 执行顺序

Build → Test → Coverage → Security Scan。前面失败则不再继续。

## 命令来源

从项目 `CLAUDE.md` 的 `build_command` 字段读取。

| 技术栈 | Build | Test | Coverage | Security |
|--------|-------|------|----------|----------|
| Java (Maven) | `mvn compile` | `mvn test` | `mvn test jacoco:report` | `mvn dependency-check:check` |
| Node.js | `npm run build` | `npm test` | `npx c8 npm test` | `npm audit` |
| Go | `go build ./...` | `go test ./...` | `go test -coverprofile=cover.out ./...` | `govulncheck ./...` |

## 4-Level Verification

门禁通过后，对本轮产出做目标回溯验证：

| Level | Name | 验证内容 | 证据要求 |
|-------|------|----------|----------|
| L1 | Exists | 文件/方法存在 | 文件路径确认 |
| L2 | Substantive | 真实实现（非 stub） | 函数有完整逻辑，非空壳 |
| L3 | Wired | 被其他部分调用 | 调用链确认，grep 或引用 |
| L4 | Data Flow | 数据真实流通 | 集成测试或端到端数据验证 |

每个验证点必须附带具体证据。没有证据视为未完成。

## 覆盖率基线

| 场景 | 行覆盖率 | 分支覆盖率 |
|------|---------|-----------|
| 默认 | >= 80% | >= 70% |
| 核心业务逻辑 | >= 90% | >= 80% |
| 项目有更严门槛 | 以项目为准 | 以项目为准 |

## 报告格式

```markdown
## Wave 3 Gate Report
- Build: PASS
- Test: PASS
- Coverage: WARN (74% < 80%)
- Security: PASS
下一步：进入 Wave 4，补齐控制器测试。
```

## 失败处理

门禁失败时停止下一 Wave，在当前 Wave 内修复后重跑。同一问题连续 3 次失败，升级到 `deviation-handling.md`。

## 跳过条件

默认不建议跳过。确需跳过时：已知风险已记录、原因写入 `STATE.md`、团队接受返工成本。

## Gotchas

- **修复后必须重跑对应审查 Step**：不能跳步：修复后必须重跑对应审查 Step，不能直接推进

## Anti-Rationalization 自检

跳过检查前先问：是不是在找借口？

| 你可能在想 | 更可靠的判断 |
|-----------|--------------|
| 这只是个小改动 | 小改动同样可能破坏边界条件 |
| 我已经检查过了 | 自查不等于独立验证 |
| 用户催得急 | 带着已知风险继续，返工成本更高 |
| 这一步应该不会出问题 | "应该"不是证据，跑完检查才是 |
