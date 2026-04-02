---
name: tech:init
description: 初始化项目环境，只复制必要骨架文件。
license: MIT
compatibility: Claude Code
metadata:
  author: tinypowers
  version: "5.0"
---

# /tech:init

## 作用

初始化项目的基础工作流骨架。只复制必要文件到目标项目。

## 默认骨架

```
{project}/
├── configs/rules/        # 编码规范
├── docs/guides/          # 开发指南
└── .claude/hooks/       # Hook 脚本
```

## 主流程

```text
1. 检测项目目录
2. 复制 configs/rules/
3. 复制 docs/guides/
4. 复制 .claude/hooks/
5. 验证完成
```

## 运行

```bash
node "${TINYPOWERS_DIR}/scripts/init-project.js" --root .
```

## 验证

```bash
node "${TINYPOWERS_DIR}/scripts/validate.js"
```

## 产物

- `configs/rules/` - 编码规范（common, java, mysql）
- `docs/guides/` - 开发指南（development-spec.md, workflow-guide.md）
- `.claude/hooks/` - Hook 脚本

## 注意事项

- 不复制 agents/, skills/, scripts/ 等框架自身文件
- 不创建空目录
- CLAUDE.md 和 .claude/settings.json 由用户项目自行管理
