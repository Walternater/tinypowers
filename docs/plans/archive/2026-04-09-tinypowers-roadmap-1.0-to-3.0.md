# tinypowers 版本路线图 (1.0 → 3.0+)

## 架构定位

```
tinypowers（薄编排层）              superpowers（技能执行层）
─────────────────────────────────────────────────────────────

/tech:init ───────────────────────────────── (tinypowers 独有)
/tech:feature ─────────────────────────────→ brainstorming → writing-plans
/tech:code ────────────────────────────────→ worktrees → subagent → review → verification
/tech:commit ──────────────────────────────→ (独有) → finishing-branch

─────────────────────────────────────────────────────────────
tinypowers 定义 WHAT（做什么、门禁是什么、交付物格式）
superpowers 定义 HOW（怎么头脑风暴、怎么派子 agent、怎么做 review）
```

---

## 版本分层策略

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1.0-1.5          2.0-3.0           3.0+                               │
│  ─────────        ────────          ─────                              │
│  四技能定型        多语言扩展         能力边界探索                        │
│  Java only         技术栈扩展         四技能之外                          │
│  薄编排层          插件化准备           新技能探索                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: 四技能定型 (1.0 → 1.5)

**核心目标**: 四技能 (/init /feature /code /commit) 结构稳定，Java 场景跑通
**核心约束**: 薄编排层定位，委托 superpowers 执行

### 1.0 MVP - 四技能框架跑通

**交付物**:
```
tinypowers-1.0/
├── skills/
│   ├── tech-init/SKILL.md      # /tech:init
│   ├── tech-feature/SKILL.md   # /tech:feature
│   ├── tech-code/SKILL.md      # /tech:code
│   └── tech-commit/SKILL.md    # /tech:commit
├── agents/
│   └── compliance-reviewer.md  # tinypowers 独有
├── rules/common/
│   ├── coding-style.md
│   └── security.md
└── templates/
    ├── PRD.md
    ├── spec.md
    ├── tasks.md
    └── verification.md
```

**四技能与 superpowers 映射**:

| tinypowers | 职责 | 委托 superpowers |
|------------|------|-----------------|
| /tech:init | 技术栈检测、骨架初始化、版本检查 | (独有，无委托) |
| /tech:feature | 定义交付物格式、CHECK-1 门禁 | brainstorming → writing-plans |
| /tech:code | Pattern Scan、CHECK-2 门禁、阶段推进 | worktrees → subagent → review → verification |
| /tech:commit | 文档同步、knowledge capture、Git 提交 | finishing-a-development-branch |

**核心能力**:
- 硬门禁：无方案禁止编码，无验证禁止提交
- compliance-reviewer：方案符合性审查（tinypowers 独有）
- knowledge capture：知识沉淀飞轮（tinypowers 独有）

**验收标准**:
- [ ] Java feature 完整走通四技能
- [ ] 每个技能明确委托 superpowers 的部分
- [ ] CHECK-1/CHECK-2 门禁强制执行

---

### 1.1 工程化门禁

**核心目标**: 门禁自动化，减少人工确认

**新增能力**:
| 检查项 | 实现方式 | 阻断级别 |
|--------|---------|---------|
| 编译检查 | `mvn compile` | BLOCK |
| 代码格式化 | spotless/checkstyle | WARN |
| 依赖安全 | OWASP | BLOCK(高危) |

**交付物**:
```
+ scripts/
│   ├── check-compile.sh
│   ├── check-style.sh
│   └── check-owasp.sh
```

---

### 1.2 审查深度化

**核心目标**: compliance-reviewer + superpowers review 双轨审查

**新增能力**:
- compliance-reviewer 深度化（方案符合性 + 安全）
- 与 requesting-code-review 衔接定义

**文件增强**:
```
agents/compliance-reviewer.md
  ├── 方案符合性检查
  ├── 决策落地追踪
  └── 安全检查
```

---

### 1.3 测试集成

**核心目标**: 测试覆盖率门禁 + 测试生成

**superpowers 委托**:
- test-driven-development（新增）

**tinypowers 职责**:
- 定义覆盖率阈值（默认80%）
- CHECK-2 增加测试门禁

---

### 1.4 知识飞轮

**核心目标**: knowledge capture 自动化

**新增能力**:
- 自动提取可沉淀知识
- 自动更新 docs/knowledge.md
- 历史知识引用提示

**tinypowers 独有**: knowledge capture 是差异化价值

---

### 1.5 深度封顶

**核心目标**: 四技能稳定，准备 2.0 多语言

**工作内容**:
1. Bug 清理
2. 性能优化
3. 文档完善
4. 2.0 预研（多语言技术方案）

---

## Phase 2: 多语言扩展 (2.0 → 3.0)

**核心目标**: 从 Java 扩展到 Node.js/Go，保持四技能结构

### 2.0 多语言支持

**架构变化**:
```
tinypowers-2.0/
├── skills/
│   ├── tech-init/SKILL.md
│   ├── tech-feature/SKILL.md
│   ├── tech-code/SKILL.md
│   └── tech-commit/SKILL.md
├── agents/
│   ├── compliance-reviewer.md
│   ├── java-reviewer.md       # 细分
│   ├── nodejs-reviewer.md     # NEW
│   └── go-reviewer.md         # NEW
├── rules/
│   ├── common/
│   ├── java/
│   ├── nodejs/                # NEW
│   └── go/                    # NEW
└── templates/
    ├── common/
    ├── java/
    ├── nodejs/                # NEW
    └── go/                    # NEW
```

**技术栈自动检测**:
```bash
# /tech:init 自动检测
if [ -f "pom.xml" ] || [ -f "build.gradle" ]; then
  STACK="java"
elif [ -f "package.json" ]; then
  STACK="nodejs"
elif [ -f "go.mod" ]; then
  STACK="go"
fi
```

**四技能定义**:

| 技能 | 职责 | 触发条件 |
|------|------|---------|
| /tech:init | 项目初始化、技术栈检测、骨架生成 | 新项目首次使用 |
| /tech:feature | 需求规划、方案设计、CHECK-1 | 开始新需求 |
| /tech:code | 编码执行、审查、验证、CHECK-2 | 执行规划好的任务 |
| /tech:commit | 文档同步、知识沉淀、提交、PR | 编码完成准备交付 |

---

### 2.1-2.4 四技能打磨

每个版本聚焦打磨一个技能：

#### 2.1 /tech:init 强化
- 框架识别增强（Spring/Nest/Gin）
- 多模块检测
- 既有代码分析

#### 2.2 /tech:feature 强化
- 需求歧义自动检测
- 技术方案影响分析
- 任务智能拆分

#### 2.3 /tech:code 强化
- Pattern Scan 深度化
- 跨文件重构支持
- 性能优化建议

#### 2.4 /tech:commit 强化
- 提交信息生成
- PR 描述生成
- 多平台支持（GitHub/GitLab/Gitee）

---

### 3.0 生产就绪

**核心目标**: 四技能生产可用，建立插件机制

**新增能力**:
1. **插件机制**: 支持自定义规则、agent、模板
2. **配置系统**: 项目级/用户级/系统级三层配置
3. **遥测**: 匿名使用数据统计（可选）

---

## Phase 3: 边界探索 (3.0+)

**核心问题**: 除了 /init /feature /code /commit，还有什么可能？

### 候选新技能

| 技能 | 说明 | 触发场景 | 优先级 |
|------|------|---------|--------|
| /tech:review | 独立代码审查 | 收到 PR 后审查 | 高 |
| /tech:refactor | 大规模重构 | 技术债务改造 | 高 |
| /tech:test | 测试专项 | 补全测试覆盖 | 中 |
| /tech:docs | 文档专项 | 自动生成 API 文档 | 中 |
| /tech:debug | 调试辅助 | 分析日志定位问题 | 低 |
| /tech:arch | 架构设计 | 系统级架构规划 | 低 |

### 准入标准
新技能必须满足：
1. **独立性**: 不依赖四技能，可单独使用
2. **高频性**: 每周至少使用一次
3. **不可替代性**: 四技能无法很好解决
4. **可行性**: 技术可实现，成本可控

---

## 版本时间线（预估）

| 版本 | 周期 | 累计时间 | 关键里程碑 |
|------|------|---------|-----------|
| 1.0 | 3周 | 3周 | 四技能框架跑通 |
| 1.1 | 1周 | 4周 | 编译门禁自动化 |
| 1.2 | 2周 | 6周 | 审查深度化 |
| 1.3 | 2周 | 8周 | 测试集成 |
| 1.4 | 2周 | 10周 | 知识飞轮 |
| 1.5 | 2周 | 12周 | 深度封顶 |
| 2.0 | 4周 | 16周 | 多语言支持 |
| 2.1-2.4 | 8周 | 24周 | 四技能打磨 |
| 3.0 | 4周 | 28周 | 生产就绪 |

**总计约7个月到达3.0**（按单人半职投入估算）

---

## 关键决策记录

| 决策ID | 内容 | 版本 | 理由 |
|--------|------|------|------|
| D-001 | 薄编排层定位 | 1.0+ | tinypowers 定义 WHAT，superpowers 实现 HOW |
| D-002 | 四技能 1.0 拆分 | 1.0 | 与最终架构一致，避免重构 |
| D-003 | Java only 1.0-1.5 | 1.x | 先深度后广度 |
| D-004 | compliance-reviewer 独有 | 1.0+ | 方案符合性是 tinypowers 核心价值 |
| D-005 | knowledge capture 独有 | 1.0+ | 知识飞轮是 tinypowers 差异化能力 |
| D-006 | 3.0前不考虑多语言 | roadmap | 聚焦打磨核心能力 |

---

**文档完成时间**: 2026-04-09
**下一步**: 实现四技能 SKILL.md
