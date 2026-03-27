# pr-workflow.md

## Pull Request 工作流

本文档描述从分支创建到 PR 合并的完整流程。

---

## PR 创建流程

```
┌─────────────────────────────────────────────┐
│  Step 1: Pre-flight Check                   │
│  验证一切就绪                               │
└──────────────────┬────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Step 2: Sync & Push                       │
│  同步远程 + 推送分支                         │
└──────────────────┬────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Step 3: PR Body                           │
│  生成 PR 描述                               │
└──────────────────┬────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Step 4: Create PR                          │
│  gh pr create                               │
└──────────────────┬────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Step 5: Code Review                        │
│  请求审查 + 处理反馈                         │
└──────────────────┬────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│  Step 6: Merge                              │
│  Squash & Merge                              │
└─────────────────────────────────────────────┘
```

---

## Step 1: Pre-flight Check

### 检查清单

```bash
# 1. verification 通过
mvn test -q
IF $? != 0 THEN
  BLOCK "测试未通过，不能创建 PR"
END

# 2. 工作区干净
git status
IF 有 uncommitted changes THEN
  BLOCK "请先 commit 或 stash"
END

# 3. 分支正确
CURRENT=$(git branch --show-current)
EXPECTED="feature/CSS-{id}-{desc}"
IF CURRENT != EXPECTED THEN
  WARN "分支名可能不正确"
END

# 4. 远程已配置
git remote -v
IF remote 不存在 THEN
  BLOCK "请配置远程仓库"
END
```

---

## Step 2: Sync & Push

### 同步远程

```bash
# Fetch latest
git fetch origin

# Rebase onto main (保持线性历史)
git rebase origin/main

# 或者 Merge (如果需要保留完整历史)
git merge origin/main --no-ff
```

### 推送分支

```bash
BRANCH=$(git branch --show-current)
git push -u origin ${BRANCH}

# 如果远程已有分支
git push origin ${BRANCH}
```

---

## Step 3: PR Body 生成

### PR 模板

```markdown
## Summary
<一句话描述改动>

## Changes
- <改动点1>
- <改动点2>

## Requirements
- [ ] 测试通过
- [ ] 代码审查通过
- [ ] 文档已更新

## Testing
```
<测试命令和结果>
```

## Decisions
| 决策 | 理由 |
|------|------|
| <决策1> | <理由> |
```

### 自动生成示例

```bash
# 基于 commit 历史生成
COMMITS=$(git log origin/main..HEAD --oneline)
echo "## Summary"
echo "实现登录功能"
echo ""
echo "## Changes"
git log origin/main..HEAD --format="  - %s"
```

---

## Step 4: Create PR

### 命令

```bash
TITLE="feat(CSS-1234): 实现用户登录功能"
BODY=$(cat <<'EOF'
## Summary
实现基于Session的用户登录功能

## Changes
- 添加 POST /api/auth/login 接口
- 添加密码加密存储
- 集成Session管理

## Requirements
- [x] 单元测试通过
- [ ] 代码审查通过
- [x] 技术方案已更新

## Testing
```bash
mvn test -q
# All tests passed
```

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)

gh pr create \
  --title "${TITLE}" \
  --body "${BODY}" \
  --base main \
  --label "AI-Gen" \
  --reviewer "" \
  --assignee "@me"
```

---

## Step 5: Code Review

### 审查请求

```bash
# 指定审查者
gh pr review REQUEST \
  --reviewer user1,user2

# 添加评论
gh pr comment $PR_NUMBER \
  --body "请检查这段逻辑"
```

### 处理审查反馈

```bash
# 查看审查意见
gh pr view $PR_NUMBER --comments

# 修复问题
# ... 修改代码 ...
git add -A
git commit -m "[AI-Review] fix(CSS-1234): address review feedback"
git push
```

### 审查状态

| 状态 | 说明 |
|------|------|
| APPROVE | 可以合并 |
| REQUEST_CHANGES | 需要修复 |
| COMMENT | 仅评论 |

---

## Step 6: Merge

### Squash & Merge（推荐）

```bash
# Squash 并合并
gh pr merge $PR_NUMBER \
  --squash \
  --delete-branch \
  --merge-method squash

# 合并后自动删除本地分支
git checkout main
git pull origin main
git branch -d ${BRANCH}
```

### 其他合并方式

```bash
# Merge (保留完整历史)
gh pr merge $PR_NUMBER --merge --delete-branch

# Rebase (线性历史)
gh pr merge $PR_NUMBER --rebase --delete-branch
```

---

## PR 模板配置

### .github/pull_request_template.md

```markdown
## Summary
<!-- 一句话描述 -->

## Type
- [ ] Feature
- [ ] Bug Fix
- [ ] Refactor
- [ ] Documentation

## Changes
<!-- 详细改动 -->

## Testing
<!-- 测试说明 -->

## Checklist
- [ ] 代码自测通过
- [ ] 单元测试覆盖
- [ ] 文档已更新
- [ ] 无敏感信息泄露
```

---

## 标签管理

### 常用标签

| Label | 用途 |
|-------|------|
| `AI-Gen` | AI生成的代码 |
| `AI-Review` | Review修复 |
| `feature` | 新功能 |
| `bug` | Bug修复 |
| `docs` | 文档更新 |
| `refactor` | 重构 |
| `skip-changelog` | 不计入changelog |

### 自动添加

```bash
# 根据分支名自动添加标签
BRANCH=$(git branch --show-current)
if [[ $BRANCH == feature/* ]]; then
  gh pr edit $PR_NUMBER --add-label feature
elif [[ $BRANCH == bugfix/* ]]; then
  gh pr edit $PR_NUMBER --add-label bug
fi
```

---

## PR 关闭

### 手动关闭

```bash
gh pr close $PR_NUMBER
```

### 合并后自动行为

```yaml
# .github/workflows/pr-close.yml
on:
  pull_request:
    types: [closed]

jobs:
  cleanup:
    if: github.event.pull_request.merged == true
    steps:
      - name: Delete branch
        run: |
          # 远程分支已在 merge 时删除
          echo "Branch cleanup completed"
```
