# 11 个参考项目驱动的优化建议

> 日期: 2026-03-30
> 基于: `unified-optimization-plan.md` + 11 个参考项目深度分析
> 目标: 轻量、开箱即用、企业级接入

---

## 一、11 个参考项目速览

| 项目 | 定位 | 规模 | 适合借鉴 | 不适合借鉴 |
|------|------|------|---------|-----------|
| **superpowers** | 纪律驱动 Skills 库 | 72 md, 14 skills | 强制 Skill 触发、TDD 铁律、验证先行 | 过于教条的流程、14 个 skill 太多 |
| **get-shit-done** | 全生命周期管理 | 284 md, 75K 行, 16 agents | Wave 执行、文件状态、偏差规则、原子提交、上下文分层 | 75K 行太重、16 个 agent 太多 |
| **gstack** | 虚拟工程团队 | 25 skills + 浏览器 | Skill 管道、测试分层、模板生成文档 | 浏览器集成不属于框架范畴 |
| **OpenSpec** | Spec 驱动开发 | 130 ts 文件 | Delta Spec、渐进式严谨、无 Phase Gate | 需要 npm 包安装，CLI 偏重 |
| **oh-my-openagent** | 多模型编排 | 1492 ts, 200K 行 | Hash-Anchored Edit 概念、Agent 分类路由 | 多模型编排太复杂，48 hooks 过度 |
| **oh-my-claudecode** | 团队流水线 | 848 ts, 218K 行 | Skill 三层叠加、Notepad 持久化 | 19 个 Agent 太多、验证协议过重 |
| **claude-code-spec-workflow** | Spec 工作流 | 54 md | 上下文优化（60-80% token 缩减） | WebSocket 仪表盘过重 |
| **cc-sdd** | Spec 驱动开发 | 177 md | 多工具兼容模板、配置外部化 | Kiro IDE 特化部分 |
| **everything-claude-code** | 125+ Skills 库 | 1238 md | Instinct 学习概念 | 125+ skills 堆砌，不可取 |
| **claude-code-best-practice** | 最佳实践 | 103 md | Command→Agent→Skill 编排模式 | 教学示例太基础 |
| **agency-agents-zh** | 角色提示词库 | 230 md, 186 agents | 细分角色设计的思路 | 186 个 agent 是反面教材 |

---

## 二、tinypowers 当前 vs 参考项目的差距

### 2.1 tinypowers 已有优势（不应丢弃）

| 优势 | 在 11 个项目中独特或领先 |
|------|----------------------|
| Decision Guardian Agent | 11 个项目中独有（GSD 有 deviation handling 但不锁定决策） |
| Anti-Rationalization 模式 | 与 superpowers 的 persuasion-resistant 设计异曲同工，但 tinypowers 的表格更实用 |
| 分层规则继承（common→java→mysql） | 11 个项目中最干净的规则组织方式 |
| Component-based install | GSD 和 OpenSpec 都没有这种灵活的安装机制 |
| File-as-State + SPEC-STATE 状态机 | GSD 也有文件状态但更复杂；tinypowers 的 STATE.md 更轻量 |

### 2.2 tinypowers 明显缺失（应从参考项目补充）

| 缺失 | 最佳来源 | 说明 |
|------|---------|------|
| **上下文四层裁剪** | 自研 + claude-code-spec-workflow | context-preload.md 当前只有"读哪些文件"，缺少裁剪比例控制 |
| **README 管道图** | gstack | gstack 用一个管道图展示全部 Skill 关系，tinypowers 的 README 缺少全局视角 |
| **项目级配置覆盖** | cc-sdd | 企业项目需要覆盖默认规则/模板，当前没有外部化机制 |
| **Spec 状态支持宽松模式** | OpenSpec | 当前 SPEC-STATE 只支持严格线性推进，不支持跳步和并行 |

---

## 三、可直接引用的优化建议

### P0: 立即可做（配合统一优化计划 Phase 1/2）

#### 3.1 上下文四层裁剪（来自 claude-code-spec-workflow + 自研）

claude-code-spec-workflow 实现了 60-80% 的 token 缩减。tinypowers 的 `context-preload.md` 当前只有"读哪些文件"的清单，缺少裁剪比例控制。

**建议**：在精简后的 `context-preload.md`（~40 行）中加入裁剪规则表：

```markdown
| 内容类型 | 裁剪比例 | 说明 |
|---------|---------|------|
| 技术方案全文 | 只注入当前任务相关章节 | 不要全量注入 |
| 接口定义 | 只注入当前任务涉及的接口 | 按任务裁剪 |
| 数据库设计 | 只注入当前任务涉及的表 | 按任务裁剪 |
| 决策记录 | 全量注入 | 决策是全局约束 |
| 规则文件 | 不注入 | 规则由 Hook 自动加载 |
```

**成本**: 在精简 context-preload.md 时顺便加入，零额外工作量。

#### 3.2 README 管道图（来自 gstack）

gstack 用一个管道图展示全部 Skill 关系：

```
Think → Plan → Build → Review → Test → Ship → Reflect
```

tinypowers 的 README 缺少这种全局视角，新用户不知道 Skill 之间的关系。

**建议**：在精简后的 `README.md`（~280 行）中加入管道图：

```
/tech:init → /tech:feature → /tech:code → /tech:commit
                                  ↗ /tech:debug
                                  ↗ /tech:quick
                                  ↗ /tech:progress
                                  ↗ /tech:note
```

**成本**: +10 行，纯文档。

### P1: 中期改进

#### 3.3 Spec 状态支持宽松模式（来自 OpenSpec）

OpenSpec 的核心创新是"无 Phase Gate"——不需要严格线性推进，按需跳步。tinypowers 的 SPEC-STATE 当前只支持严格线性推进（INIT→REQ→DESIGN→TASKS→EXEC→REVIEW→VERIFY→CLOSED）。

**建议**：在 spec-state 模板中增加 `--mode` 字段：

```yaml
# 当前（严格模式）
current_phase: EXEC

# 新增宽松模式
mode: strict        # strict | relaxed
# relaxed 模式下允许跳步，由用户决定推进顺序
```

**实现**：修改 `scripts/update-spec-state.js` 支持 `--mode relaxed` 参数。

#### 3.4 项目级配置覆盖（来自 cc-sdd）

cc-sdd 允许通过项目配置覆盖默认模板和规则。这是**企业级接入的核心能力**——不同团队需要不同的验收标准、审查清单和提交格式。

**建议**：引入 `project-overrides.json`：

```json
{
  "review_checklist": "docs/my-review-checklist.md",
  "acceptance_criteria_template": "EARS_RELAXED",
  "commit_prefix": "[TEAM-A]",
  "quality_gate_command": "mvn verify -P ci",
  "skip_phases": ["REQ"]
}
```

**实现**：
1. `/tech:init` 检测项目根目录是否存在 `project-overrides.json`
2. 存在时用它覆盖默认模板路径和配置
3. 不存在时使用默认行为

**成本**: ~100 行代码改动（init-steps.md + validate.js）

### P2: 长期方向（不在本次简化范围）

#### 3.5 测试分层思想（来自 gstack）

gstack 的三层测试理念值得参考但不需要在框架层面实现：

| 层级 | 成本 | 覆盖率 |
|------|------|--------|
| Tier 1: 静态验证（validate + lint） | 免费 | ~95% |
| Tier 2: E2E 测试 | ~$4/次 | ~99% |
| Tier 3: LLM-as-judge | ~$0.15/次 | 质量 |

tinypowers 当前只有 Tier 1（`npm run validate`）。Tier 2/3 应由具体项目自行实现，不在框架层面强制。

---

## 四、坚决不借鉴的内容

| 项目 | 功能 | 不借鉴的原因 |
|------|------|-------------|
| oh-my-openagent | Hash-Anchored Edit（200+ 行） | PR #2 已经引入了 hashline-edit-hook.js，我们自己的审查结论是**删除它**。概念好但实现太重。 |
| oh-my-openagent | 多模型路由 | tinypowers 不应管模型选择，这是环境配置 |
| oh-my-claudecode | 19 个 Agent | 186 个（agency-agents-zh）到 19 个都是反面教材 |
| oh-my-claudecode | Skill 三层叠加 | 增加认知负担，不采用 |
| everything-claude-code | 125+ Skills | 堆砌数量的反面教材 |
| gstack | 浏览器集成 | 不属于工作流框架范畴 |
| GSD | 16 个 Agent | 太多，tinypowers 保持 10 个 |

---

## 五、综合优先级排序

按价值/成本排序：

| 优先级 | 建议 | 价值 | 成本 | 来源 |
|--------|------|------|------|------|
| **P0** | 执行统一报告 Phase 1（删除 12 个文件） | 高 | 极低 | 综合 |
| **P0** | 执行统一报告 Phase 2（精简 18 个文件） | 高 | 中 | 综合 |
| **P0** | 上下文四层裁剪规则 | 中高 | 低 | claude-code-spec-workflow |
| **P0** | README 管道图 | 中 | 极低 | gstack |
| **P1** | Spec 状态宽松模式 | 中 | 低 | OpenSpec |
| **P1** | project-overrides.json | 高（企业级） | 中 | cc-sdd |
| **P2** | 测试分层文档 | 低 | 极低 | gstack |

---

## 六、总结

### 借鉴原则

**不是"能借就借"而是"需要才借"。** 11 个参考项目中真正值得引入的只有 4 项：

1. **思维方式**，不是具体实现 — GSD 的文件状态、OpenSpec 的渐进严谨、superpowers 的验证先行
2. **简化方向**，不是功能堆叠 — 大多数项目的问题是太复杂，tinypowers 应该做反面
3. **企业级能力** — cc-sdd 的配置外部化是唯一适合企业接入的新增
4. **开发者体验** — gstack 的管道图和 claude-code-spec-workflow 的上下文裁剪让框架更易用

### 最终目标

| 维度 | 目标 |
|------|------|
| **轻量** | 新项目 5 分钟上手，一个 CLAUDE.md + 模板即可运行 |
| **开箱即用** | 默认配置覆盖 80% 场景，不需要调参 |
| **企业级** | project-overrides.json 支持项目级定制 |
| **可理解** | README 管道图 + 6 个核心概念（不多不少） |
