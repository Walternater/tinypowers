# tinypowers 工程复杂度审查报告

> 版本: 1.0.0  
> 日期: 2026-03-30  
> 审查范围: 全项目  
> 目标: 识别过度复杂性，提出精简建议

---

## 一、复杂度概览

### 1.1 核心指标

| 维度 | 数量 | 复杂度评估 |
|------|------|-----------|
| Agents | 10 | 中 |
| Skills | 8 (+16 子文档) | 高 |
| Hooks | 6 | 中 |
| Contexts | 4 | 低 |
| Templates | 10 | 中 |
| Rules (common/java/mysql) | 12 | 中 |
| Scripts | 7 | 中 |
| Docs/guides | 10 | 高 |
| **总文档文件** | ~75 | **高** |

### 1.2 项目定位 vs 实际复杂度

| 定位（宣称） | 实际 |
|-------------|------|
| 轻量级 AI 开发工作流框架 | 75+ 文档文件，8 个 Skill，每个 Skill 平均 4+ 子文档 |
| 简单实用 | `SKILL.md` 平均 250+ 行，`wave-execution.md` 178 行 |
| 聚焦核心 | 分散在 10 个 `docs/guides/` 文档中 |

---

## 二、问题诊断

### 2.1 结构性过载

#### 问题 1: Skill 子文档膨胀

单个 `/tech:code` 技能配套 **11 个子文档**：

```
skills/tech-code/
├── SKILL.md              (326 行)
├── anti-rationalization.md
├── context-preload.md
├── deviation-handling.md
├── deviation-log.md
├── model-tiering.md
├── quality-gate.md
├── session-recovery.md
├── state-management.md
├── tdd-cycle.md
└── wave-execution.md
```

**问题**: 一个技能需要阅读 12 个文件才能完整理解如何执行。这已经超过"文档组织良好"变成"文档过载"。

#### 问题 2: 文档指南过载

`docs/guides/` 包含 10 个指南文档：

```
capability-map.md
change-set-model.md
development-spec.md
generated-vs-curated-policy.md
optimization-roadmap-2026.md
prd-analysis-guide.md
repo-normalization-summary.md
runtime-matrix.md
test-plan.md
workflow-guide.md
```

**问题**: 其中 `optimization-roadmap-2026.md` 和 `repo-normalization-summary.md` 看起来是历史文档，`capability-map.md` 和 `runtime-matrix.md` 可能是临时研究产物。

#### 问题 3: Agent 描述冗长

以 `architect.md` (145行) 和 `planner.md` (108行) 为例：
- 包含大量"我是谁、我的记忆、我的经验"类描述
- 实际执行规则淹没在大量叙述中
- Agent 应该是一张执行卡片，不是小说

### 2.2 概念过载

#### 问题 4: 并行概念过多

| 概念 | 来源 | 必要性 |
|------|------|--------|
| Wave | 任务并行 | ✅ 核心 |
| Epic/Story/Task | 任务层级 | ⚠️ 可选 |
| Seed/Note/Todo | 想法管理 | ❌ 框架不该管 |
| NEXUS Handoff | 交接协议 | ❌ 过度设计 |
| Commit Trailer | 决策记录 | ⚠️ 可选 |
| 4-Level Verification | 验证层级 | ⚠️ 可选 |
| Model Tiering | 模型选择 | ❌ 框架不该管 |
| TDD 强制循环 | TDD 强制 | ⚠️ 可选 |

#### 问题 5: 状态文件过多

单个 Feature 产生：

```
features/{id}/
├── CHANGESET.md
├── SPEC-STATE.md
├── PRD.md
├── 需求理解确认.md
├── 技术方案.md
├── 任务拆解表.md
├── 评审记录.md
├── STATE.md
├── code-review.md
├── 测试报告.md
├── VERIFICATION.md
├── nexus-handoff.md
├── deviation-log.md
├── notepads/learnings.md
├── commands/T-XXX-execute.md  (每个任务一个)
├── notes/
├── todos/
├── seeds/
└── archive/
```

**问题**: 框架为每个 feature 生成了 **20+ 文件**，这与"轻量"完全矛盾。

### 2.3 规范过载

#### 问题 6: 规则层过多

```
configs/rules/
├── common/          # 4 files
├── java/            # 2 files
└── mysql/           # 6 files
```

加上 Glob 作用域规则、`Glob:` frontmatter 验证、validate.js 中的规则校验...

**问题**: 规则系统本身已经成为需要规则来管理的复杂系统。

#### 问题 7: 硬约束标签过多

当前有：
- `<HARD-GATE>` - 强制门禁
- `<ANTI-RATIONALIZATION>` - 防止自我合理化
- `<ANTI_DUPLICATION>` - 防止重复工作
- `<TOOL-REQUIREMENT>` - 工具要求

**问题**: 每加一个标签就需要 validate.js 增加校验逻辑。"防呆"机制本身成了维护负担。

---

## 三、根本原因分析

### 3.1 "完美主义"驱动

tinypowers 的设计思路是：
> "如果有一个概念可能有用，就先加进去"

结果：
- 8 个 Skills 不是因为实际用到 8 个，而是"理论上可能需要"
- NEXUS 交接协议不是因为实际用过，而是"大项目可能需要"
- Model Tiering 不是因为实际验证过，而是"理论上可以节省成本"

### 3.2 "学院派" vs "实战派"

很多设计看起来是为了：
- 写出一篇漂亮的 PRD
- 设计一个完美的架构图
- 整理一份完整的交接文档

而不是：
- 让 AI 实际跑通一个 feature
- 快速交付一个可用的功能
- 减少上下文消耗

### 3.3 "规则inflation"

每发现一个问题，新增：
- 一个 Gotchas 条目
- 一个 HARD-GATE 标签
- 一个规则文件
- 一个检查函数

这些"补丁"越叠越多，导致：
- 新人学习成本：理解所有规则才能使用
- 维护成本：每个新规则需要配套校验代码
- 理解成本：规则之间有隐藏的依赖关系

---

## 四、具体优化建议

### 4.1 Skill 精简（高优先级）

**建议**: 将 `/tech:code` 的 11 个子文档压缩为 3 个

当前：
```
skills/tech-code/
├── SKILL.md              (326 行)
├── anti-rationalization.md
├── context-preload.md
├── deviation-handling.md
├── deviation-log.md
├── model-tiering.md
├── quality-gate.md
├── session-recovery.md
├── state-management.md
├── tdd-cycle.md
└── wave-execution.md
```

建议压缩为：
```
skills/tech-code/
├── SKILL.md              (保留核心流程和硬约束)
├── execution.md          (合并 wave-execution + context-preload + tdd-cycle)
├── review.md             (合并 quality-gate + 4-level verification)
└── recovery.md           (合并 session-recovery + deviation-handling)
```

**理由**: 
- `anti-rationalization.md` 只有 20 行，可以直接内联到 SKILL.md
- `model-tiering.md` 应该完全删除，框架不该管模型选择
- `deviation-log.md` 是输出格式，不是执行指南

### 4.2 Agent 精简（中优先级）

**建议**: 将 Agent 描述压缩到 50 行以内

当前 `architect.md` (145行) 包含：
- 身份描述（10+ 行）
- "记忆"段落（8+ 行）
- "经验"段落（8+ 行）
- 成功指标（6+ 行）

建议改为：
```markdown
# Architect Agent

## Metadata
- **name**: architect
- **description**: 系统架构设计专家
- **model**: sonnet

## 核心职责
- 系统架构设计
- 技术选型决策
- 风险分析

## 交付标准
- 接口设计含错误场景
- 数据库设计含索引
- 技术选型含备选方案

## 硬约束
- 禁止过度设计
- 禁止只给结论不给理由
- 禁止忽略降级策略
```

### 4.3 Feature 文件精简（高优先级）

**建议**: 删除 seed/note/todo 三层想法系统

```
删除:
features/{id}/notes/
features/{id}/todos/
features/{id}/seeds/
```

**理由**:
- AI 协作工具不适合做个人笔记管理
- 实际上 `/tech:note` 从未被真正使用
- 这些目录只是增加认知负担

**保留**:
```
features/{id}/
├── CHANGESET.md
├── SPEC-STATE.md
├── PRD.md
├── 技术方案.md
├── 任务拆解表.md
├── STATE.md              # 执行状态
└── learnings.md          # 简化后的学习记录
```

### 4.4 文档指南精简（中优先级）

**建议**: 删除或归档以下文档

| 文档 | 建议 | 理由 |
|------|------|------|
| `optimization-roadmap-2026.md` | 删除 | 历史文档，已过期 |
| `repo-normalization-summary.md` | 删除 | 历史文档 |
| `capability-map.md` | 归档 | 临时研究产物 |
| `test-plan.md` | 归档 | 临时研究产物 |
| `generated-vs-curated-policy.md` | 保留 | 仍有参考价值 |

### 4.5 概念精简（中优先级）

| 概念 | 建议 | 理由 |
|------|------|------|
| NEXUS Handoff | 移除 | 大项目才需要，框架不该强制 |
| Commit Trailer | 简化为可选 | 决策记录可以放 PR description，不需要每个 commit 都带 |
| 4-Level Verification | 简化为 2 级 | L1/L2/L3/L4 太细，实际只用 L1/L4 |
| TDD 强制循环 | 改为推荐 | TDD 不是所有项目都适用 |
| Model Tiering | 完全删除 | 框架不该管模型选择 |

### 4.6 规则系统简化（低优先级）

**建议**: 移除 `Glob:` frontmatter 验证

当前 `validate.js` 增加了对 `Glob:` 字段的检测，但这引入了：
- 新的 frontmatter 规范
- 新的校验逻辑
- 新的理解负担

**理由**: 规则文件本来就应该按需加载（按文件类型），不需要显式声明。

---

## 五、推荐的"极简版"结构

### 5.1 目标结构

```
tinypowers/
├── agents/              # 6 个核心 Agent（移除 java-specific agents）
│   ├── architect.md
│   ├── planner.md
│   ├── decision-guardian.md
│   ├── spec-compliance-reviewer.md
│   ├── security-reviewer.md
│   └── tech-verifier.md
├── skills/             # 5 个核心 Skill
│   ├── tech-init/
│   ├── tech-feature/   # (3 子文档)
│   ├── tech-code/      # (4 子文档)
│   ├── tech-commit/
│   └── tech-progress/
├── hooks/              # 4 个核心 Hook（移除 gsd-context-monitor）
├── contexts/           # 4 个工作模式（不变）
├── configs/
│   ├── rules/          # common + java + mysql（不变）
│   └── templates/      # 8 个模板（删除 CLAUDE.md 和 test-report.md）
├── scripts/            # 4 个核心脚本（删除 hashline-edit-hook.js 等）
├── docs/guides/        # 4 个核心指南
└── manifests/          # (不变)
```

### 5.2 Feature 目标结构

```
features/{id}/
├── SPEC-STATE.md       # 状态机
├── PRD.md              # 需求
├── 技术方案.md          # 设计
├── 任务拆解表.md        # 任务
├── STATE.md            # 执行状态
└── learnings.md        # 学习记录
```

**从 20+ 文件减少到 6 个核心文件**

---

## 六、实施路径

### Phase 1: 删除明显冗余（低风险）

1. 删除 `features/{id}/notes/`, `todos/`, `seeds/` 目录
2. 删除 `docs/guides/optimization-roadmap-2026.md`
3. 删除 `docs/guides/repo-normalization-summary.md`
4. 删除 `skills/tech-code/model-tiering.md`
5. 删除 `skills/tech-code/anti-rationalization.md`（内容内联到 SKILL.md）

### Phase 2: 合并子文档（中风险）

1. 合并 `wave-execution.md` + `context-preload.md` + `tdd-cycle.md` → `execution.md`
2. 合并 `quality-gate.md` + 4-level verification → `review.md`
3. 合并 `session-recovery.md` + `deviation-handling.md` → `recovery.md`
4. 合并 `tech-feature` 下的 `requirements-guide.md` + `ambiguity-check.md` → `requirements.md`

### Phase 3: 简化 Agent（低风险）

1. 将所有 Agent 描述压缩到 50 行以内
2. 移除"身份/记忆/经验"类描述
3. 保留核心职责和硬约束

### Phase 4: 概念精简（需讨论）

1. 移除 NEXUS Handoff 强制要求
2. 将 Commit Trailer 改为可选
3. 将 TDD 强制改为推荐

---

## 七、评估指标

### 7.1 精简成功标准

| 指标 | 当前 | 目标 |
|------|------|------|
| Skill 子文档总数 | 16 | < 8 |
| Feature 核心文件数 | 20+ | 6 |
| docs/guides 文件数 | 10 | < 5 |
| Agent 平均行数 | ~120 | < 60 |
| SKILL.md 平均行数 | ~250 | < 150 |

### 7.2 复杂度维持原则

精简后应保持：

✅ **保留的核心价值**:
- Decision Guardian（决策守护）
- Anti-Rationalization（防止自我合理化，可简化）
- File-as-State（文件即状态）
- Ordered Review Pipeline（有序审查）
- 分层规则（common/java/mysql）
- Component-based install（组件化安装）

❌ **移除的过度设计**:
- NEXUS 强制交接协议
- Model Tiering
- Seed/Note/Todo 三层想法系统
- Per-Task 命令文件
- 4-Level Verification
- Confidence 评分体系

---

## 八、附录

### A. 当前文件清单

```
agents/                    (10 files)
├── agents/java/          (2 files)
└── *.md                  (8 files)

skills/                    (8 main + 16 sub-docs)
├── tech-init/            (1 doc)
├── tech-feature/         (5 docs)
├── tech-code/            (11 docs)
├── tech-commit/          (5 docs)
├── tech-progress/        (0 sub-docs)
├── tech-note/            (0 sub-docs)
├── tech-debug/           (0 sub-docs)
└── tech-quick/           (0 sub-docs)

hooks/                    (6 files)

contexts/                 (4 files)

configs/
├── rules/common/        (4 files)
├── rules/java/           (2 files)
├── rules/mysql/          (6 files)
└── templates/            (10 files)

scripts/                  (7 files)

docs/guides/              (10 files)

manifests/                (2 files)
```

### B. 参考资料

- tinypowers 官网: https://tinypowers.ai（暂无）
- 原始设计灵感: obra/superpowers
