# commit-message-format.md

## Commit Message 格式规范

本文档描述 Conventional Commits 标准格式。

---

## 格式

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

---

## 结构

### 1. Type（必需）

| Type | 描述 | 示例 |
|------|------|------|
| **feat** | 新功能 | `feat(auth): add TOTP login` |
| **fix** | Bug修复 | `fix(pay): resolve double-charge bug` |
| **refactor** | 代码重构 | `refactor(api): extract validation` |
| **docs** | 文档更新 | `docs: update API docs` |
| **test** | 测试相关 | `test(order): add integration tests` |
| **chore** | 构建/工具 | `chore: upgrade dependencies` |
| **perf** | 性能优化 | `perf(db): add index on user_id` |
| **ci** | CI/CD | `ci: add github actions` |
| **revert** | 回滚 | `revert: revert abc1234` |

### 2. Scope（可选）

表示影响的模块：

```
feat(auth): add login
feat(order): add create order
feat(billing): add payment
```

常用 scope：
- `auth`, `user`, `order`, `billing`, `product`, `inventory`
- `api`, `db`, `cache`, `queue`
- `ci`, `deps`, `docs`

### 3. Description（必需）

- 简短描述（<50字符）
- 使用动词开头
- 不使用句号结尾
- 小写字母

---

## AI 生成代码规范

### 前缀类型

```
[AI-Gen]     # AI生成的代码
[AI-Review]  # AI Review后的修复
[Manual]     # 手动修改
```

### 完整格式

```
[AI-Gen] feat(CSS-1234): add user login endpoint

- 实现登录接口 POST /api/auth/login
- 添加密码加密存储
- 集成Session管理

Closes #123
```

### 格式变体

根据分支类型自动适配：

| 分支模式 | Commit 格式 |
|---------|-------------|
| `feature/CSS-{id}-{desc}` | `[AI-Gen] feat({id}): {desc}` |
| `bugfix/{id}-{desc}` | `[AI-Gen] fix({id}): {desc}` |
| `hotfix/{id}-{desc}` | `[AI-Gen] fix({id}): {desc} (hotfix)` |

---

## Body 规范

### 作用

- 解释 **what** 和 **why**，不解释 **how**
- 说明做出的重大决策
- 记录技术债

### 示例

```
feat(auth): add two-factor authentication

采用TOTP算法实现2FA
支持Google Authenticator扫描
首次登录引导用户绑定

决定：
- 使用TOTP而非HOTP（更安全）
- 不支持短信验证码（成本考虑）
```

---

## Footer 规范

### 关联 Issue

```
Closes #123
Closes #123, #124
Fixes #456
```

### Breaking Change

```
BREAKING CHANGE: 移除 /api/v1/login 接口

请迁移到 /api/v2/auth/login
旧接口将于 2026-06-01 下线
```

---

## 提交频率

### 推荐

| 场景 | Commit 频率 |
|------|------------|
| 完成一个Task | 1次commit |
| 完成一个Wave | 1次commit（含多个Task） |
| Review修复 | 1次commit |
| 技术方案同步 | 1次commit |

### 避免

- 不要把不相关的变更放一起
- 不要每改一行就commit
- 不要整个功能完成才commit

---

## Commit Message 检查

### 自动化检查（.commitlintrc）

```json
{
  "rules": {
    "type-enum": [2, "always", ["feat", "fix", "docs", "style", "refactor", "test", "chore"]],
    "subject-case": [2, "never", ["sentence-case", "start-case"]],
    "subject-empty": [2, "never"],
    "type-empty": [2, "never"]
  }
}
```

### 手动检查清单

```
□ 格式正确：type(scope): description
□ 描述简洁，不超过50字符
□ 使用祈使语气
□ Body说明why而非how
□ Footer关联相关Issue
□ 无拼写错误
```

---

## 常见错误

### 错误示例

```
❌ "fixed the bug"
❌ "Updated code"
❌ "WIP"
❌ "asdfghjkl"
```

### 正确示例

```
✅ "fix(auth): resolve session timeout issue"
✅ "feat(user): add profile avatar upload"
✅ "docs: update API documentation"
```
