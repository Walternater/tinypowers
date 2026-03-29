# CLAUDE.md

> 本文件是 tinypowers 框架自身的项目入口，由框架自己管理。

## 元数据

```yaml
version: 1.0.0
last_updated: 2026-03-29
framework: tinypowers
project_name: tinypowers
tech_stack: Node.js
build_command: npm run validate && npm test
```

## 项目概况

| 信息 | 值 |
|------|-----|
| 项目名称 | tinypowers |
| 技术栈 | Node.js |
| 构建工具 | npm |
| 测试命令 | `npm test` |
| 校验命令 | `npm run validate` |
| 脚手架 | `npm run scaffold:feature` |
| 阶段推进 | `npm run spec-state:update` |

## 项目结构

```text
tinypowers/
├── agents/          # Agent 角色定义（10 个）
├── configs/
│   ├── rules/       # 分层编码规范（common / java / mysql）
│   └── templates/   # 文档模板（CLAUDE.md、PRD、技术方案等）
├── contexts/        # 工作模式（dev / review / debug / research）
├── docs/            # 使用指南和设计文档
├── features/        # Change set 工作区（运行时生成）
├── hooks/           # Claude Code hooks
├── manifests/       # 安装清单和组件定义
├── scripts/         # validate / doctor / repair / scaffold / update-spec-state
├── skills/          # Skill 定义（tech:init / feature / code / commit / debug / note / progress / quick）
└── tests/           # 脚本和 hook 回归测试
```

## 规则入口

| 文档 | 用途 |
|------|------|
| `configs/rules/common/coding-style.md` | 通用编码规范 |
| `configs/rules/common/security.md` | 安全要求 |
| `configs/rules/common/testing.md` | 测试要求 |

## 硬约束

- 提交前必须通过 `npm run validate && npm test`
- Hook 文件禁止含 `console.log`（residual-check 会报错）
- `manifests/components.json` 的 source 路径禁止引用生成产物
- 所有 Skill 和 Agent 必须有 `name` + `description` 元数据
- 标签（HARD-GATE、ANTI-RATIONALIZATION、TOOL-REQUIREMENT）必须正确闭合

## AI 编辑边界

以下文件不建议 AI 直接修改，除非用户明确要求：
- `CLAUDE.md`（本文件）
- `README.md`
- `.claude/settings.json`

## 常用工作流命令

| 命令 | 用途 |
|------|------|
| `/tech:feature` | 用自己的流程分析新需求 |
| `/tech:code` | 用自己的 Wave 执行编码 |
| `/tech:commit` | 用自己的提交流程 |
| `npm run validate` | 校验全部定义完整性 |
| `npm test` | 跑回归测试 |
| `npm run doctor` | 诊断安装状态 |

## 质量门禁

门禁命令从本文件 `build_command` 字段读取：
- **Build + Test**: `npm run validate && npm test`
- **Coverage**: 框架自身无覆盖率要求，但要求所有测试通过
- **Security**: `npm audit`（高危阻断）
