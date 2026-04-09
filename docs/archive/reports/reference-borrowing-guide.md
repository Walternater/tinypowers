# 11 个参考项目借用指南

> 日期: 2026-03-30
> 方法: 4 组并行子代理深度分析 → 综合裁决
> 原则: **借思维不借代码，借模式不借依赖**
> 前置: 与 `unified-optimization-plan.md` 配合执行

---

## 一、11 个项目定位与许可证

| 项目 | 定位 | 规模 | 许可证 | 可商用 |
|------|------|------|--------|--------|
| **superpowers** | 纪律驱动 Skills 库 | 72 md, 14 skills | MIT | ✅ |
| **get-shit-done** | 全生命周期管理 | 284 md, 75K 行, 16 agents | MIT | ✅ |
| **gstack** | 虚拟工程团队 | 25 skills + 浏览器 | MIT | ✅ |
| **OpenSpec** | Spec 驱动开发 | 130 ts 文件 | MIT | ✅ |
| **oh-my-openagent** | 多模型编排 | 1492 ts, 200K 行 | **SUL-1.0** | ❌ 不可商用 |
| **oh-my-claudecode** | 团队流水线 | 848 ts, 218K 行 | MIT | ✅ |
| **claude-code-spec-workflow** | Spec 工作流 | 54 md | MIT | ✅ |
| **cc-sdd** | Spec 驱动开发 | 177 md | MIT | ✅ |
| **everything-claude-code** | 125+ Skills 库 | 1238 md | MIT | ✅ |
| **claude-code-best-practice** | 最佳实践 | 103 md | 未声明 | ⚠️ 参考即可 |
| **agency-agents-zh** | 角色提示词库 | 230 md, 186 agents | MIT | ✅ |

**关键发现**: 除 oh-my-openagent (SUL-1.0 限制商用) 外，其余均可商用参考。

---

## 二、tinypowers 现有优势（11 个项目中领先）

这些是 **tinypowers 已有而其他项目没有的**，必须保留：

| 优势 | 独特性 |
|------|--------|
| Decision Guardian Agent | 11 个项目中独有 |
| Anti-Rationalization 模式 | 与 superpowers 的 persuasion-resistant 设计异曲同工，但 tinypowers 更实用 |
| 分层规则继承（common→java→mysql） | everything-claude-code 有类似三层但不如 tinypowers 干净 |
| Component-based install | GSD 和 OpenSpec 都没有这种灵活安装机制 |
| File-as-State + SPEC-STATE | GSD 有 .planning/ 但更复杂；tinypowers 的 STATE.md 更轻量 |

---

## 三、值得借用的模式（按价值排序）

### P0: 立即可做（配合统一优化计划 Phase 1/2）

#### 3.1 上下文按需裁剪规则 — 来源: claude-code-spec-workflow

**现状**: tinypowers 的 `context-preload.md` 只列了"读哪些文件"，没有裁剪控制。
**claude-code-spec-workflow 做了什么**: 通过分层上下文管理实现 60-80% token 缩减——不是全量注入，而是按任务阶段只加载相关部分。

**建议**: 在精简后的 `context-preload.md` 中加入裁剪规则表：

```markdown
| 内容类型       | 裁剪策略               | 理由             |
|--------------|----------------------|-----------------|
| 技术方案全文    | 只注入当前任务相关章节     | 避免全量注入      |
| 接口定义       | 只注入当前任务涉及的接口    | 按任务裁剪       |
| 数据库设计      | 只注入当前任务涉及的表      | 按任务裁剪       |
| 决策记录       | 全量注入               | 决策是全局约束     |
| 规则文件       | 不注入（由 Hook 加载）    | Hook 自动处理     |
```

**成本**: 零额外工作量，在精简 context-preload.md 时顺便加入。

#### 3.2 README 管道图 — 来源: gstack

**现状**: tinypowers README 缺少全局视角，新用户不知道 Skill 之间的关系。
**gstack 做了什么**: 用管道图展示全部 Skill 关系: `Think → Plan → Build → Review → Test → Ship → Reflect`。

**建议**: 在精简后的 README 中加入：

```
/tech:init → /tech:feature → /tech:code → /tech:commit
                                 ↗ /tech:debug
                                 ↗ /tech:quick
                                 ↗ /tech:progress
                                 ↗ /tech:note
```

**成本**: +10 行，纯文档。

#### 3.3 Agent YAML 前置元数据规范 — 来源: get-shit-done

**现状**: tinypowers 的 Agent 有 name + description，但格式不统一。
**GSD 做了什么**: 每个 Agent 文件用 YAML frontmatter 声明 name、description、tools、color、permissionMode。

**建议**: 统一 Agent 文件头部格式：

```yaml
---
name: architect
description: 系统架构设计和技术方案审查
triggers: [tech-feature, tech-code]
---
```

**成本**: 在精简 Agent 文件时顺便统一，零额外工作量。

#### 3.4 Hook JSON 协议规范 — 来源: get-shit-done

**现状**: tinypowers 的 hooks 使用各自不同的输出格式。
**GSD 做了什么**: 统一 JSON 输入/输出协议，所有 hook 共享相同结构。

**建议**: 在精简 hooks 时统一协议格式（不做功能增强，只做格式统一）。

**成本**: 精简 hooks 时顺便统一。

---

### P1: 中期改进（Phase 2 之后）

#### 3.5 SPEC-STATE 宽松模式 — 来源: OpenSpec

**现状**: SPEC-STATE 只支持严格线性推进（INIT→REQ→DESIGN→TASKS→EXEC→REVIEW→VERIFY→CLOSED）。
**OpenSpec 做了什么**: "No Phase Gate"——按需跳步，不强制线性推进。渐进式严谨。

**建议**: 在 spec-state 模板中增加 mode 字段：

```yaml
mode: strict        # strict | relaxed
# relaxed 模式下允许跳步，由用户决定推进顺序
```

**实现**: 修改 `scripts/update-spec-state.js` 支持 `--mode relaxed` 参数。
**成本**: ~30 行代码改动。

#### 3.6 项目级配置覆盖 — 来源: cc-sdd

**现状**: 不同团队需要不同的验收标准、审查清单和提交格式，但没有覆盖机制。
**cc-sdd 做了什么**: 通过 `.kiro/settings/templates/` 定义团队标准，一份配置所有 Agent 遵循。

**建议**: 引入 `project-overrides.json`：

```json
{
  "review_checklist": "docs/my-review-checklist.md",
  "acceptance_criteria_template": "EARS_RELAXED",
  "commit_prefix": "[TEAM-A]",
  "quality_gate_command": "mvn verify -P ci",
  "skip_phases": ["REQ"]
}
```

**实现**:
1. `/tech:init` 检测项目根目录是否存在 `project-overrides.json`
2. 存在时用它覆盖默认模板路径和配置
3. 不存在时使用默认行为

**成本**: ~100 行代码改动（init-steps.md + validate.js）。
**价值**: 这是**企业级接入的核心能力**——统一优化计划中唯一新增的企业特性。

#### 3.7 偏差处理规则细化 — 来源: get-shit-done

**现状**: tinypowers 有偏差处理，但规则较粗。
**GSD 做了什么**: 4 级偏差规则，前 3 级自动修复，第 4 级需人工确认。

**建议**: 在精简 `deviation-handling.md` 时参考 GSD 的 4 级分类：
- Rule 1: Bug 自动修复
- Rule 2: 缺失关键功能自动补充
- Rule 3: 阻塞问题自动修复
- Rule 4: 架构变更需用户确认

**成本**: 精简 deviation-handling.md 时顺便调整。

---

### P2: 长期方向（不在本次简化范围）

#### 3.8 Steering Documents 概念 — 来源: claude-code-spec-workflow

**概念**: 持久化项目上下文文件（product.md、tech.md、structure.md），跨 Feature 共享。
**现状**: tinypowers 的 CLAUDE.md 已承担部分此职责。
**建议**: 暂不引入，但记录此方向。当 Feature 数量 >5 时可能需要。

#### 3.9 测试分层思想 — 来源: gstack

| 层级 | 成本 | 覆盖率 |
|------|------|--------|
| Tier 1: 静态验证（validate + lint） | 免费 | ~95% |
| Tier 2: E2E 测试 | ~$4/次 | ~99% |
| Tier 3: LLM-as-judge | ~$0.15/次 | 质量 |

**建议**: tinypowers 保持 Tier 1（`npm run validate`）。Tier 2/3 由具体项目自行实现。

#### 3.10 完成 status 协议 — 来源: gstack

**概念**: 标准化步骤完成状态: DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT。
**现状**: tinypowers 没有标准化的状态报告格式。
**建议**: 可在未来引入到 Wave Execution 中。

---

## 四、坚决不借用的内容

| 项目 | 功能 | 不借用的原因 |
|------|------|-------------|
| **oh-my-openagent** | Hash-Anchored Edit | SUL-1.0 不可商用；且 PR #2 审查结论是删除该实现 |
| **oh-my-openagent** | 多模型路由 | 模型选择是环境配置，不是框架该管的 |
| **oh-my-openagent** | 48 个 Hooks | 过度工程 |
| **oh-my-claudecode** | 19 个 Agent | agent-agents-zh 的 186 个到 19 个都是反面教材 |
| **oh-my-claudecode** | Skill 三层叠加 | 增加认知负担 |
| **oh-my-claudecode** | tmux 集成 | 平台依赖，违反零依赖原则 |
| **everything-claude-code** | 125+ Skills | 数量堆砌的反面教材 |
| **everything-claude-code** | Instinct 评分系统 | 过度设计，统一优化计划已决定简化 |
| **gstack** | 浏览器集成 | 不属于工作流框架范畴 |
| **gstack** | 28 个 Skills | 太多，tinypowers 保持 8 个 |
| **get-shit-done** | 16 个 Agent | 太多，tinypowers 保持 10 个 |
| **get-shit-done** | Fork hooks | GSD hooks 为 75K 行架构设计，不匹配轻量模型 |
| **agency-agents-zh** | 186 个 Agent | 典型反面教材 |
| **OpenSpec** | npm 包依赖 | 给纯 markdown 框架加运行时依赖，违反零依赖原则 |
| **cc-sdd** | 8 平台支持 | tinypowers 专注 Claude Code + OpenCode |

---

## 五、反模式总结（从 11 个项目中提炼）

这些是 11 个项目的**通病**，tinypowers 必须避免：

| 反模式 | 典型项目 | tinypowers 应对 |
|--------|---------|----------------|
| **数量堆砌** | everything-claude-code (125+ skills), agency-agents-zh (186 agents) | 保持 8 skills + 10 agents |
| **过度抽象** | oh-my-openagent (多模型路由), oh-my-claudecode (三层叠加) | 每个概念只有一个实现方式 |
| **运行时依赖** | OpenSpec (npm), gstack (Bun 二进制), oh-my-openagent (LSP) | 零外部依赖，纯 markdown + JS 脚本 |
| **流程刚性** | superpowers (铁律不可违反), GSD (严格 checkpoint) | HARD-GATE 是约束不是锁链 |
| **全盘照搬** | 正是 tinypowers PR #1/##2 犯的错误 | **需要才借，不是能借就借** |

---

## 六、与统一优化计划的关系

本指南是 `unified-optimization-plan.md` 的**补充**，不是替代。执行顺序：

```
Phase 1: 删除 12 个文件（unified plan）
    ↓
Phase 2: 精简 18 个文件（unified plan）
    + 融入 P0 建议（3.1~3.4，零额外成本）
    ↓
Phase 3: 回滚与清理（unified plan）
    ↓
Phase 4: P1 改进（宽松模式 + project-overrides.json + 偏差细化）
    ↓
长期: P2 方向（steering docs / 测试分层 / status 协议）
```

---

## 七、最终判断

### 值得借用的（4 类）

1. **裁剪思维** — claude-code-spec-workflow 的上下文按需加载，不是全量注入
2. **可视化** — gstack 的管道图让框架更易理解
3. **企业定制** — cc-sdd 的项目级配置覆盖是企业接入的关键
4. **灵活推进** — OpenSpec 的宽松模式让框架适应更多场景

### 不值得借用的（其余全部）

- **不 fork 代码** — GSD hooks、superpowers skills 都不直接复制
- **不加依赖** — OpenSpec npm 包、gstack Bun 二进制都不引入
- **不加功能** — 浏览器集成、多模型路由、Instinct 评分都不需要
- **不加数量** — 125+ skills、186 agents、48 hooks 都是反面教材

### tinypowers 的差异化

tinypowers 在 11 个项目中的独特定位：**唯一一个同时做到轻量 + 企业级 + 零依赖 + 可定制的框架。** 不需要变成其他项目的组装件——精简自己比借用别人更有效。
