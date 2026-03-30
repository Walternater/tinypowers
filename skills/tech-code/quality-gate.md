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
