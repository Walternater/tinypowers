# commit-message-format.md

## 作用

这份文档定义 `/tech:commit` 的提交信息格式，目标是让 commit history 能被人和工具同时读懂。

## 默认格式

项目默认使用 Conventional Commits，并保留来源前缀：

```text
[prefix] type(scope): description
```

常见示例：

```text
[AI-Gen] feat(CSS-1234): add login endpoint
[AI-Review] fix(CSS-1234): address auth validation gap
[AI-Gen] docs(CSS-1234): sync tech design
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

## 什么时候拆多个 commit

建议拆分的情况：
- 功能实现和审查修复是两轮独立动作
- 文档同步很多，值得单独阅读
- 一个 commit 里混入了不相关改动

不建议拆分的情况：
- 为了“看起来勤奋”把一个完整动作切成很多碎 commit
- 每改几行就提交一次

## 提交前自检

提交前至少看一遍：
- message 是否准确描述本次改动
- scope 是否有助于理解，而不是增加噪音
- 是否误把多件不相关的事塞进同一个 commit
- 是否保留了后续追溯所需的信息

## 判断标准

一个好的 commit message，应当让后来的人在不打开全部 diff 的情况下，也能大致知道：
- 改动类型是什么
- 改动落在哪个 feature 或模块
- 这次提交最重要的变化是什么
