---
name: tech:commit
description: 文档复写 + 代码提交 + PR 创建的完整流程。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "2.0"
---

# /tech:commit

## 功能
文档复写 + 代码提交 + PR 创建

**核心特性：**
- Conventional Commit 格式
- 文档自动同步
- PR 自动化创建
- Changelog 维护

## 输入

- 代码变更（已通过 tech-code 验证）
- `features/{id}/技术方案.md`
- `features/{id}/任务拆解表.md`

---

## 执行流程

```
┌─────────────────────────────────────────────┐
│  Phase 1: Document Sync                     │
│  代码变更 → 技术文档同步                      │
│  技术方案 / API文档 / README                 │
└──────────────────┬────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Phase 2: Git Commit                        │
│  格式化 → 提交                              │
│  Conventional Commit 规范                   │
└──────────────────┬────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Phase 3: PR Create                         │
│  检查 → 生成 → 创建                          │
│  自动填充 PR 模板                            │
└──────────────────┬────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Phase 4: Changelog                         │
│  更新 CHANGELOG.md                          │
│  Unreleased 段                              │
└─────────────────────────────────────────────┘
```

---

## Phase 1: Document Sync

调用 `documenter-guide.md`：

### 1.1 分析变更

```bash
# 获取变更文件列表
git diff --name-only origin/main..HEAD

# 识别影响的功能模块
git diff --stat origin/main..HEAD
```

### 1.2 同步技术方案

```bash
IF 技术方案.md 需要更新 THEN
  更新实现记录
  更新接口文档
  更新验收标准状态
END
```

### 1.3 同步其他文档

| 文档 | 条件 |
|------|------|
| API 文档 | 有 Controller 变更 |
| README.md | 有重大变更 |
| 数据库文档 | 有 Entity 变更 |

详见 `documenter-guide.md`

---

## Phase 2: Git Commit

调用 `commit-message-format.md`：

### 2.1 生成 Commit Message

```bash
# AI 生成代码格式
[AI-Gen] feat({id}): {简短描述}

# Review 修复格式
[AI-Review] fix({id}): {简短描述}

# 手动修改格式
[Manual] {type}({id}): {简短描述}
```

### 2.2 提交

```bash
# 添加相关文件
git add {files}

# 提交
git commit -m "[AI-Gen] feat(CSS-1234): {描述}"

# 推送
git push
```

详见 `commit-message-format.md`

---

## Phase 3: PR Create

调用 `pr-workflow.md`：

### 3.1 Pre-flight Check

```bash
# 验证通过
mvn test -q
IF $? != 0 THEN BLOCK

# 工作区干净
git status
IF 有 uncommitted THEN BLOCK

# 远程配置
git remote -v
IF 无 remote THEN BLOCK
```

### 3.2 生成 PR Body

```markdown
## Summary
<一句话描述>

## Changes
- 改动点1
- 改动点2

## Requirements
- [x] 测试通过
- [ ] 代码审查
- [x] 文档已更新

## Testing
<测试命令和结果>

🤖 Generated with [Claude Code](https://claude.ai/code)
```

### 3.3 创建 PR

```bash
gh pr create \
  --title "feat(CSS-1234): {描述}" \
  --body "${PR_BODY}" \
  --base main \
  --label "AI-Gen"
```

详见 `pr-workflow.md`

---

## Phase 4: Changelog

调用 `changelog-update.md`：

### 4.1 检查更新需求

```bash
# 查看 AI 相关的 commits
git log --format="%s" --grep "^\[AI-Gen\]"

# 决定是否需要更新
```

### 4.2 更新 CHANGELOG.md

```markdown
## [Unreleased]

### Added
- feat(CSS-1234): 实现用户登录功能
- feat(CSS-1235): 添加订单创建接口
```

### 4.3 Commit

```bash
git add CHANGELOG.md
git commit -m "docs(changelog): update for CSS-1234"
git push
```

详见 `changelog-update.md`

---

## 输出清单

```
features/{id}/
├── 技术方案.md        # 已同步
├── code/             # 代码变更
└── code-review.md    # 审查报告

PR:
├── Git Commit        # 已提交
├── PR Created        # 已创建
└── CHANGELOG.md      # 已更新
```

---

## 验证

### Commit 检查

```
□ 格式正确：type(scope): description
□ 描述简洁，不超过50字符
□ 使用祈使语气
□ 无拼写错误
```

### PR 检查

```
□ 标题格式正确
□ Summary 简洁
□ Changes 列出所有改动
□ Requirements 已勾选
□ Testing 有测试结果
```

---

## 参考文档

- `commit-message-format.md` — Commit Message 规范
- `pr-workflow.md` — PR 创建流程
- `changelog-update.md` — Changelog 维护
- `documenter-guide.md` — 文档同步指南
