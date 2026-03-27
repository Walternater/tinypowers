---
name: tech:commit
description: 文档复写和代码提交的完整流程。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "1.0"
---

# /tech:commit

## 功能
文档复写 + 代码提交

## 输入
- 代码变更
- `features/{id}/技术方案.md`（原始）

## 执行步骤

### Phase 1: 文档复写
1. 调用 documenter 分析代码变更
2. 更新 `features/{id}/技术方案.md`
3. 更新项目 README.md（如果需要）

### Phase 2: Git操作
4. `git add` 变更文件
5. `git commit -m "[AI-Gen] {id}: {描述}"`
6. 输出提交结果

## 输出清单
- 更新的 `features/{id}/技术方案.md`
- 更新的 README.md
- Git提交记录

## 检查清单
- [ ] 技术方案已同步
- [ ] README已更新（如需要）
- [ ] Git提交成功

## 提交规范
```
[AI-Gen] {id}: {简短描述}      # AI生成代码
[AI-Review] {id}: {简短描述}   # Review修复
[Manual] {id}: {简短描述}      # 手动修改
```
