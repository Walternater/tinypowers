# changelog-update.md

## Changelog 更新策略

本文档描述如何维护 CHANGELOG.md。

---

## 格式标准

### Keep a Changelog 格式

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Feature descriptions

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Vulnerability fixes

## [1.2.0] - 2026-03-27

### Added
- Login endpoint
- User profile API
```

---

## Commit → Changelog 映射

### Type 映射规则

| Commit Type | Changelog Section |
|-------------|------------------|
| feat | Added |
| fix | Fixed |
| perf | Added (or Changed) |
| refactor | Changed |
| docs | Changed |
| test | Added |
| chore | Changed |
| revert | Fixed |

### 自动生成命令

```bash
# 生成 Unreleased 段的 changelog
git-changelog \
  --from-ref HEAD \
  --to-ref origin/main \
  --output CHANGELOG.tmp.md

# 或者手动生成
git log --format="%s" \
  --grep "^[AI-Gen]" \
  origin/main..HEAD \
  | while read line; do
      echo "- $line"
    done
```

---

## 更新时机

### 自动更新触发

| 场景 | 更新内容 | 方式 |
|------|---------|------|
| 完成 Task | 单个 commit | 手动追加 |
| 完成 Wave | 多个 commit | 脚本生成 |
| 发布版本 | 完整 changelog | 脚本生成 |
| 技术方案变更 | 文档路径 | 手动更新 |

### 手动更新流程

```bash
# 1. 确认要添加的 commits
git log --oneline origin/main..HEAD

# 2. 读取当前 CHANGELOG
cat CHANGELOG.md

# 3. 更新 Unreleased 段
# ... 编辑 CHANGELOG.md ...

# 4. 提交
git add CHANGELOG.md
git commit -m "docs(changelog): update for CSS-1234"
```

---

## 版本发布

### 预发布检查

```bash
# 1. 确认所有 PR 已合并
gh pr list --state=closed --base main

# 2. 确认 CHANGELOG 已更新
git diff origin/main CHANGELOG.md

# 3. 确认版本号更新
grep "## \[${VERSION}\]" CHANGELOG.md
```

### 版本发布步骤

```bash
# 1. 更新 CHANGELOG
# ... 编辑，移除 Unreleased，添加日期 ...

# 2. 提交 CHANGELOG
git add CHANGELOG.md
git commit -m "chore(release): prepare v1.2.0"

# 3. 创建 tag
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0

# 4. GitHub Release 自动生成
```

---

## GitHub Release 集成

### Release 模板

```yaml
# .github/release.yml
changelog:
  exclude:
    labels:
      - skip-changelog
      - on-hold
  categories:
    - title: 🚀 Features
      labels:
        - feat
        - feature
    - title: 🐛 Bug Fixes
      labels:
        - fix
        - bug
    - title: 📚 Documentation
      labels:
        - docs
    - title: ♻️ Refactoring
      labels:
        - refactor
    - title: 🔧 Tooling
      labels:
        - chore
        - ci
    - title: ⚡ Performance
      labels:
        - perf
```

### 自动生成配置

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
          generate_release_notes: true
```

---

## AI 生成代码的 Changelog

### 标记规则

```
[AI-Gen] 开头的 commits 自动计入 changelog
[Skip-Changelog] 开头的 commits 不计入
```

### AI Commit 分类

```bash
# 生成 AI 相关的 changelog
git log --format="%s" \
  --grep "^\[AI-Gen\]" \
  origin/main..HEAD \
  | sed 's/^\[AI-Gen\] //' \
  > /tmp/ai-changes.txt
```

---

## 常见问题

### Q: 如何处理 Breaking Change？

```markdown
### Changed
- API响应格式变更

### ⚠️ Breaking Changes
- `/api/v1/users` 已废弃，请使用 `/api/v2/users`
- `User.name` 字段类型从 String 改为 UserInfo
```

### Q: 如何处理多 Issue 在一个 PR？

```markdown
### Fixed
- 修复用户登录问题 (Closes #123)
- 修复订单创建失败 (Closes #124, #125)
```

### Q: Changelog 遗漏了怎么办？

```bash
# 1. 找到遗漏的 commit
git log --oneline | grep "CSS-1234"

# 2. 追加到 CHANGELOG.md
# 3. 创建补发 commit
git commit -m "docs(changelog): add missing entry for CSS-1234"
```
