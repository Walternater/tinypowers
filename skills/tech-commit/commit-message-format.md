# commit-message-format.md

## 作用

这份文档定义 `/tech:commit` 的提交信息格式，目标是让 commit history 能被人和工具同时读懂。

## 默认格式

项目默认使用 Conventional Commits，并保留来源前缀：

```text
[prefix] type(scope): description

[Body]

[Trailers]
```

## Commit Trailer 格式

每个 commit 必须包含结构化的 trailer，记录决策上下文。这是 NEXUS 交接协议在 git 层面的体现。

### 必需 Trailer

```text
Constraint: [设计约束或特殊情况]
Rejected: [被拒绝的替代方案及原因]
Evidence: [验证结果或测试通过证据]
Confidence: [high/medium/low]
```

### Trailer 字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| `Constraint` | 设计约束、特殊情况或外部限制 | Auth service does not support token introspection |
| `Rejected` | 被拒绝的替代方案及原因 | Extend token TTL to 24h, security policy violation |
| `Evidence` | 验证证据，测试通过结果 | 127 tests passed, coverage 94% |
| `Confidence` | 对改动正确性的信心 | high / medium / low |

### 完整示例

```
feat(auth): prevent silent session drops

Add explicit session validation on each API call to prevent
silent authentication failures when tokens expire.

Constraint: Auth service does not support token introspection
Rejected: Extend token TTL to 24h | security policy violation
Evidence: 127 tests passed, coverage 94%
Confidence: high
```

```
fix(order): correct status transition race condition

Use database-level locking to prevent race conditions during
concurrent order status updates.

Constraint: High traffic module, must not impact performance
Rejected: Distributed lock | over-engineering for current scale
Evidence: 1000 concurrent request test passed, p99 < 50ms
Confidence: medium
```

## 组成部分

### 1. Prefix

用于说明改动来源：

| Prefix | 含义 |
|--------|------|
| `[AI-Gen]` | AI 生成的主要实现或文档 |
| `[AI-Review]` | 根据审查意见做的修复 |
| `[Manual]` | 以人工主导完成的改动 |

### 2. Type

常用类型：

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

### 3. Scope

建议优先使用与需求或模块相关的 scope，例如：
- Feature ID，如 `CSS-1234`
- 领域模块，如 `auth`、`order`
- 基础设施模块，如 `db`、`ci`、`docs`

如果 scope 会让标题更模糊，可以省略。

### 4. Description

description 应满足：
- 简短明确
- 使用动作表达
- 不写无意义词
- 不用句号收尾

推荐写法：
- `add login endpoint`
- `fix order status transition`
- `sync deployment guide`

不推荐写法：
- `update code`
- `fix bugs`
- `WIP`

## Body 和 Footer

当标题不足以说明上下文时，可以补 body。

body 适合写：
- 为什么要这样改
- 有哪些重要权衡
- 是否有额外风险或限制

footer 适合写：
- `Closes #123`
- `Fixes #456`
- `BREAKING CHANGE: ...`

## Commit Trailer 格式详解

### Constraint（约束）

记录影响设计的技术、业务或组织约束：

```text
Constraint: [约束内容]
```

常见约束类型：
- **技术约束**: 不支持某功能、遗留系统限制、性能要求
- **业务约束**: 第三方 API 限制、法规要求
- **组织约束**: 团队技能、发布时间要求

### Rejected（拒绝的方案）

记录被考虑但最终拒绝的替代方案：

```text
Rejected: [方案] | [拒绝原因]
```

格式：`方案 | 原因`，如果有多个拒绝方案，用 `|` 分隔：

```text
Rejected: Use MongoDB | team expertise gap | Redis for caching | not needed at current scale
```

### Evidence（证据）

记录验证结果，证明改动有效：

```text
Evidence: [证据内容]
```

常见证据：
- 测试结果: `127 tests passed`
- 覆盖率: `coverage 94%`
- 性能数据: `p99 < 50ms`
- 安全验证: `OWASP Top 10 passed`

### Confidence（信心）

评估对改动正确性的信心：

```text
Confidence: [high/medium/low]
```

| 级别 | 含义 |
|------|------|
| `high` | 有充分测试和验证，改动简单明了 |
| `medium` | 有测试覆盖，但有潜在风险或复杂逻辑 |
| `low` | 测试覆盖有限，或有未解决的权衡 |

## 什么时候拆多个 commit

建议拆分的情况：
- 功能实现和审查修复是两轮独立动作
- 文档同步很多，值得单独阅读
- 一个 commit 里混入了不相关改动
- 不同的 Constraint/Rejected 组合

不建议拆分的情况：
- 为了"看起来勤奋"把一个完整动作切成很多碎 commit
- 每改几行就提交一次

## 提交前自检

提交前至少看一遍：
- message 是否准确描述本次改动
- scope 是否有助于理解，而不是增加噪音
- 是否误把多件不相关的事塞进同一个 commit
- 是否保留了后续追溯所需的信息
- **是否包含完整的 Trailer（Constraint/Rejected/Evidence/Confidence）**

## 判断标准

一个好的 commit message，应当让后来的人在不打开全部 diff 的情况下，也能大致知道：
- 改动类型是什么
- 改动落在哪个 feature 或模块
- 这次提交最重要的变化是什么
- **为什么这样做（Constraint）**
- **为什么不用其他方案（Rejected）**
- **怎么验证的（Evidence）**
- **信心程度（Confidence）**
