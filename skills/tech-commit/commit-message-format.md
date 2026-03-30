# commit-message-format.md

## 作用

定义 `/tech:commit` 的提交信息格式，让 commit history 能被人和工具同时读懂。

## 默认格式

```text
[prefix] type(scope): description

[Body]

[Trailers]
```

## 组成部分

### Prefix（来源）

| Prefix | 含义 |
|--------|------|
| `[AI-Gen]` | AI 生成的主要实现或文档 |
| `[AI-Review]` | 根据审查意见做的修复 |
| `[Manual]` | 以人工主导完成的改动 |

### Type（类型）

| Type | 适用场景 |
|------|----------|
| `feat` | 新功能 |
| `fix` | 缺陷修复 |
| `docs` | 文档更新 |
| `refactor` | 重构但不改变外部行为 |
| `test` | 测试补充或调整 |
| `chore` | 工具链、配置或杂项维护 |
| `perf` | 性能优化 |
| `ci` | CI/CD 相关 |
| `revert` | 回滚 |

### Scope（范围）

建议优先使用 Feature ID 或领域模块（如 `auth`、`order`），如果会让标题更模糊可以省略。

### Description（描述）

简短明确，使用动作表达，不用句号收尾。

推荐：`add login endpoint`、`fix order status transition`
不推荐：`update code`、`fix bugs`、`WIP`

## Body 和 Footer

body 写"为什么这样改"、重要权衡和额外风险。
footer 写 `Closes #123`、`BREAKING CHANGE: ...` 等。

## Commit Trailer（推荐，不强制）

推荐包含结构化 trailer 记录决策上下文。trivial 改动（typo 修复、格式调整）可省略。

```text
Constraint: [设计约束或特殊情况]
Rejected: [被拒绝的替代方案及原因]
Evidence: [验证结果或测试通过证据]
Confidence: [high/medium/low]
```

### 示例

```
feat(auth): prevent silent session drops

Add explicit session validation on each API call to prevent
silent authentication failures when tokens expire.

Constraint: Auth service does not support token introspection
Rejected: Extend token TTL to 24h | security policy violation
Evidence: 127 tests passed, coverage 94%
Confidence: high
```

### 特殊场景示例

回滚：
```
revert(auth): revert session validation change

Reverts commit abc123. Session validation caused
regression in token refresh flow.

Evidence: rollback test passed
Confidence: high
```

Breaking change：
```
feat(api)!: change user response format

BREAKING CHANGE: user endpoint now returns nested
profile object instead of flat fields.

Constraint: Backward compat not possible due to schema migration
Evidence: migration test passed, 89% coverage
Confidence: medium
```

## 什么时候拆多个 commit

建议拆分：
- 功能实现和审查修复是两轮独立动作
- 文档同步很多，值得单独阅读
- 不同 Constraint/Rejected 组合

不建议拆分：
- 为了"看起来勤奋"把一个完整动作切成很多碎 commit

## 提交前自检

- message 是否准确描述本次改动
- scope 是否有助于理解
- 是否误把不相关的事塞进同一个 commit
- 是否保留了后续追溯所需的信息
- trailer 中的 Evidence 是否引用了具体的测试结果
- Confidence 评级是否诚实（不确定时标 medium/low）
