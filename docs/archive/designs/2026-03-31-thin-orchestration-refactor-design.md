# tinypowers 薄编排层重构设计

> 日期: 2026-03-31
> 状态: DRAFT
> 前置: 胶水编程四层物料已集成 (commit 4c19468)

## 目标

tinypowers 从"自己实现所有环节"变成"只做 superpowers 做不到的事"。

原则: tinypowers 定义 WHAT（门禁、知识库、缝合策略），superpowers 定义 HOW（怎么 brainstorm、怎么派 subagent、怎么做 review）。

## 删除清单

### Agent（3 个重叠，删除）

| 文件 | 理由 | 替代 |
|------|------|------|
| `agents/code-reviewer.md` | 与 superpowers:code-reviewer 重叠 | superpowers:code-reviewer |
| `agents/planner.md` | 与 superpowers:writing-plans 重叠 | superpowers:writing-plans |
| `agents/tech-verifier.md` | 与 superpowers:verification-before-completion 重叠 | superpowers:verification-before-completion |

### Agent（7 个独有，保留）

- `agents/architect.md` — 技术方案设计文档
- `agents/security-reviewer.md` — OWASP 安审
- `agents/spec-compliance-reviewer.md` — 技术方案符合性审查
- `agents/tech-plan-checker.md` — 任务表格式/依赖验证
- `agents/decision-guardian.md` — 决策锁定、防范围蔓延
- `agents/java/java-reviewer.md` — Java 专项审查
- `agents/java/springboot-reviewer.md` — Spring Boot 专项审查

### Skill 子文档（删除冗余）

| 文件 | 理由 |
|------|------|
| `skills/tech-code/wave-execution.md` | Wave 执行由 superpowers:subagent-driven-development 处理 |
| `skills/tech-code/state-management.md` | 状态管理由 superpowers 执行框架处理 |
| `skills/tech-code/session-recovery.md` | superpowers 有自己的恢复机制 |
| `skills/tech-code/deviation-handling.md` | 偏差处理合并进 SKILL.md 硬约束（3 条规则足够） |
| `skills/tech-code/quality-gate.md` | 质量门禁合并进 SKILL.md |

### Skill 子文档（保留、精简）

| 文件 | 理由 |
|------|------|
| `skills/tech-code/context-preload.md` | tinypowers 独有：领域知识 + 参考代码预加载 |
| `skills/tech-code/wave-execution.md` | 只保留 Pattern Scan 和学习捕获部分，删除 Wave 调度逻辑 |

## 各 Skill 重构方案

### tech:init — 不变

已经是 tinypowers 独有，无 superpowers 对应。保持现状。

### tech:feature — 薄化

**现状**: Phase 1-4 自己实现了需求分析、技术方案、任务拆解。已在元数据引用 `@superpowers/brainstorming`。

**重构后**:

```text
Phase 0: Seeds 扫描（tinypowers 独有）
Phase 1: SPEC-STATE 门禁推进（tinypowers 独有）
Phase 2: 调用 superpowers:brainstorming 完成需求探索
Phase 3: 调用 agents/architect 生成技术方案 + 决策锁定
Phase 4: 调用 superpowers:writing-plans 生成任务拆解
Phase 5: 调用 agents/tech-plan-checker 验证任务表
```

**删除**: Phase 1-2 中的自定义头脑风暴流程，改为直接引用 brainstorming skill。
**保留**: SPEC-STATE 门禁、Seeds 管理、决策锁定（D-0N）、tech-plan-checker 校验。

### tech:code — 大幅精简

**现状**: 240 行，自建 Wave 执行、3 步审查、验证流程。

**重构后** (目标 ~100 行):

```text
Phase 0: SPEC-STATE 门禁（tinypowers 独有）
Phase 1: 上下文准备（tinypowers 独有）
  - Pattern Scan（缝合扫描）
  - 领域知识预加载
  - 参考代码预加载
  - 锁定决策注入
Phase 2: 调用 superpowers:using-git-worktrees 建隔离环境
Phase 3: 调用 superpowers:subagent-driven-development 执行任务
  - 每个 subagent task prompt 包含: Pattern Scan 结果 + 缝合策略 + 领域知识
  - 偏差规则: 3 次失败升级（保留为硬约束）
Phase 4: 调用 superpowers:requesting-code-review
  - 如需技术方案符合性审查，追加 agents/spec-compliance-reviewer
  - 如需安全审查，追加 agents/security-reviewer
Phase 5: 调用 superpowers:verification-before-completion
Phase 6: 输出收口（tinypowers 独有）
  - learnings 写入 notepads/learnings.md
  - 交接检查清单
```

**硬约束保留**:
- SPEC-STATE 门禁
- 缝合优先
- TDD 强制门禁（CLAUDE.md 要求）
- 偏差 3 次升级
- 禁止自动 commit

**硬约束删除**:
- Wave 执行细节 → superpowers 处理
- 审查顺序（方案→安全→质量）→ 改为"先 superpowers:code-review，再 tinypowers 专项审查"
- STATE.md 详细格式 → superpowers 有自己的状态管理

**子文档变更**:
- `context-preload.md` — 保留，增强 Pattern Scan 输出格式
- `wave-execution.md` → 重命名为 `pattern-scan.md`，只保留 Pattern Scan + 学习捕获
- 其他子文档删除

### tech:commit — 微调

**现状**: 已包含知识沉淀飞轮。

**重构后**:

```text
Step 1: Document Sync
Step 2: Knowledge Capture（物料飞轮）
Step 3: Commit Preparation
Step 4: Git Commit
Step 5: PR Workflow
Step 6: Changelog Update
Step 7: 调用 superpowers:finishing-a-development-branch 清理分支
```

**新增**: Step 7 引用 finishing-a-development-branch。
**其他**: 不变。

## manifests/components.json 更新

删除 3 个重叠 Agent 的引用:
- `agents/code-reviewer.md`
- `agents/planner.md`
- `agents/tech-verifier.md`

## 上下文桥接协议

tinypowers → superpowers 的上下文传递方式:

```text
tinypowers 准备的上下文:
1. Pattern Scan 结果 → 写入 features/{id}/STATE.md 的「参考实现」段落
2. 领域知识 → 从 docs/knowledge.md 裁剪后注入 task prompt
3. 锁定决策 → 从 技术方案.md 提取 D-0N 列表注入 task prompt
4. 缝合策略 → 每个任务的「保留/替换/新增」标注

superpowers 消费方式:
- subagent-driven-development 的每个 task prompt 就是上述 4 项的打包
- 不需要 superpowers 理解 tinypowers 的文件结构
```

## 不变的部分

以下文件/机制完全不动:
- `configs/rules/` — 开发规范
- `configs/templates/` — 文档模板
- `configs/templates/knowledge.md` — 知识库模板
- `docs/knowledge.md` — 领域知识库
- `scripts/` — validate / doctor / repair / scaffold / update-spec-state
- `hooks/` — spec-state-guard 等 6 个 hook
- `contexts/` — dev / review / debug / research
- `.claude-plugin/` — 插件元数据
- tech:init / tech:quick / tech:debug / tech:note / tech:progress — 无变化
