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

## Skill 加载前置规则（强制）

**任何涉及功能开发的工作，必须在开始前加载对应 Skill 并严格遵循其流程。**

### 意图路由

当用户的请求匹配以下模式时，必须立即用 Skill 工具加载对应的 SKILL.md 并遵循其流程，不允许跳步：

| 用户意图关键词 | 必须加载的 Skill | 禁止行为 |
|--------------|-----------------|---------|
| 新功能、需求分析、PRD、规划、优化方案、重构计划 | `skills/tech-feature/SKILL.md` | 直接写代码或直接改文件 |
| 编码、实现、开发、修复、写代码 | `skills/tech-code/SKILL.md` | 跳过 Plan Check 直接改文件 |
| 提交、commit、PR、收口 | `skills/tech-commit/SKILL.md` | 直接 git commit |
| 初始化、新项目 | `skills/tech-init/SKILL.md` | 跳过检测步骤 |
| 调试、排查问题 | `skills/tech-debug/SKILL.md` | 瞎猜原因不系统排查 |

### 强制检查清单

在响应功能开发类请求前，逐项确认：

1. **是否匹配某个 Skill 触发条件？** → 如果是，立即加载该 SKILL.md
2. **是否存在 active feature 目录？** → 如果是，检查 SPEC-STATE.md 当前阶段
3. **当前阶段是否允许我要执行的操作？** → 如果不允许，先推进阶段
4. **我是否在跳步？** → 如果 SPEC-STATE 没到 EXEC 阶段，禁止编辑代码文件

### 为什么这是强制的

历史教训：AI 看到分析结果后直接跳到编码阶段，跳过了需求确认、技术方案、任务拆解等所有规划阶段。
SPEC-STATE 门禁和意图路由是为了防止这种行为。Hook 层 (`spec-state-guard.js`) 会在运行时拦截违规操作，
但更期望 AI 在 prompt 层就自觉遵循。

## 硬约束

- 提交前必须通过 `npm run validate && npm test`
- Hook 文件禁止含 `console.log`（residual-check 会报错）
- `manifests/components.json` 的 source 路径禁止引用生成产物
- 所有 Skill 和 Agent 必须有 `name` + `description` 元数据
- 标签（HARD-GATE、ANTI-RATIONALIZATION、TOOL-REQUIREMENT）必须正确闭合
- **功能开发类任务必须先加载对应 Skill**（见上方 Skill 加载前置规则）

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
