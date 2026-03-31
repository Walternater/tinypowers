# Capability Map

这页文档用来回答一个问题：tinypowers 现在到底有哪些能力，它们分别落在哪一层。

## 分层关系

```text
Skills      -> 定义主流程
Agents      -> 承担独立角色职责
Contexts    -> 约束当前工作模式
Hooks       -> 运行期守护和提醒
Rules       -> 提供实现和审查标准
Templates   -> 初始化与交付物骨架
Manifests   -> 定义安装组件与 profile
Scripts     -> 提供 validate / doctor / repair / install-support
```

## Skills

| Skill | 默认 Context | 作用 |
|------|--------------|------|
| `tech-init` | `research` | 初始化目标项目骨架和入口文件 |
| `tech-feature` | `research` | 需求分析、歧义检测、技术方案、任务拆解 |
| `tech-code` | `dev` + `review` | Wave 执行、顺序审查、状态恢复 |
| `tech-commit` | `review` | 收口提交、PR、文档同步 |
| `tech-debug` | `debug` | 观察 → 假设 → 验证 → 修复 |
| `tech-quick` | `dev` | 快速处理小任务 |
| `tech-progress` | `research` | 汇总 `STATE.md` 与下一步建议 |
| `tech-note` | `research` | 记录 note / todo / seed |

## Agents

| Agent | 责任 |
|------|------|
| `architect` | 技术方案设计 |
| `decision-guardian` | 锁定关键决策，防止实现漂移 |
| `tech-plan-checker` | 编码前检查任务表和依赖关系 |
| `spec-compliance-reviewer` | 先审是否符合技术方案 |
| `security-reviewer` | 再审安全风险 |

> **已委托 superpowers:** 任务拆解 → `superpowers:writing-plans`，代码审查 → `superpowers:code-reviewer`，完成验证 → `superpowers:verification-before-completion`

## Contexts

| Context | 适用时机 | 行为 |
|---------|----------|------|
| `dev.md` | 编码与实现 | 先写代码，后解释 |
| `research.md` | 只读分析、方案确认 | 只读，不写 |
| `review.md` | 审查与验收 | 只看不改，输出结构化报告 |
| `debug.md` | 疑难问题排查 | 科学方法验证根因 |

## Hooks

| Hook | 默认状态 | 作用 |
|------|----------|------|
| `gsd-session-manager.js` | 默认启用 | 管理 SessionStart / Stop / PreCompact |
| `gsd-context-monitor.js` | 默认启用 | 监控上下文压力 |
| `config-protection.js` | 默认启用 | 防止弱化配置来“过检查” |
| `residual-check.js` | 默认启用 | Stop 时检查调试残留 |
| `gsd-code-checker.js` | 默认接线，`strict` 生效 | 提醒运行匹配的验证命令 |
| `hook-hierarchy.js` | 工具脚本 | 生成 hook level 配置说明 |

## 安装组件

| Component | 内容 |
|-----------|------|
| `core` | skills、agents、hooks、guides、脚本、多宿主分发元数据 |
| `rules-common` | 通用实现与审查规则 |
| `rules-java` | Java / Spring Boot 规则 |
| `rules-mysql` | MySQL DBA 规则 |
| `templates` | `CLAUDE.md`、PRD、技术方案、测试报告模板 |
| `contexts` | dev / research / review / debug 模式定义 |
| `tests` | 仓库脚本与 hooks 的最小回归测试 |

## 运维入口

| 命令 | 用途 |
|------|------|
| `npm run validate` | 检查仓库内容定义是否一致 |
| `npm run doctor` | 检查安装是否完整、hooks 是否接线 |
| `npm run repair` | 强制重装并重新跑 doctor |
| `npm run scaffold:feature -- --id CSS-1234 --name 用户登录` | 创建 feature change set 骨架 |
| `npm run spec-state:update -- --feature features/CSS-1234-用户登录 --to REQ --note "PRD ready"` | 推进 `SPEC-STATE.md` 阶段 |
| `npm test` | 跑最小脚本与 hook 回归测试 |

## 维护建议

- 流程变化优先更新 `skills/`
- 审查职责变化优先更新 `agents/`
- 运行期行为变化优先更新 `hooks/` 与 `doctor`
- 安装能力变化优先更新 `manifests/`、`install.sh`、多宿主文档
- 新能力如果无法映射到这张表，先确认是不是引入了重复层

## 延伸文档

- `docs/guides/runtime-matrix.md`
- `docs/guides/generated-vs-curated-policy.md`
- `docs/guides/change-set-model.md`
- `docs/guides/optimization-roadmap-2026.md`
