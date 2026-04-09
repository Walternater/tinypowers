# tinypowers 1.0 - 薄编排层设计

## 架构定位

```
tinypowers（薄编排层）              superpowers（技能执行层）
─────────────────────────────────────────────────────────────

/tech:init ───────────────────────────────── (tinypowers 独有)
  技术栈检测
  骨架初始化
  版本检查

/tech:feature ─────────────────────────────→ brainstorming
  需求理解、歧义检测                        ↓ 批准后
  交付物格式约束 ───────────────────────────→ writing-plans

/tech:code ────────────────────────────────→ using-git-worktrees
  Pattern Scan（缝合扫描）                    ↓
  门禁定义（CHECK-1/CHECK-2） ───────────────→ subagent-driven-development
  阶段推进 ─────────────────────────────────→ requesting-code-review
                                           ↓
                                           → verification-before-completion

/tech:commit ────────────────────────────── (tinypowers 独有)
  文档同步清单
  Knowledge Capture（物料飞轮） ────────────→ finishing-a-development-branch
  Git 提交 + PR

─────────────────────────────────────────────────────────────
tinypowers 定义 WHAT（做什么、门禁是什么）
superpowers 定义 HOW（怎么执行、怎么审查、怎么验证）
```

## 核心原则

1. **不重复造轮子**：superpowers 已有的能力，tinypowers 直接委托
2. **不侵入执行**：tinypowers 只定义门禁和交付物，不干预 superpowers 如何执行
3. **保持可替代**：如果不用 superpowers，可以替换为其他实现，接口不变

---

## 1.0 目录结构

```
tinypowers-1.0/
├── README.md
├── skills/
│   ├── tech-init/SKILL.md
│   ├── tech-feature/SKILL.md
│   ├── tech-code/SKILL.md
│   └── tech-commit/SKILL.md
├── agents/
│   └── compliance-reviewer.md    # tinypowers 独有：方案符合性审查
├── rules/
│   └── common/
│       ├── coding-style.md       # 精简版（<30条）
│       └── security.md           # 安全红线（10条）
└── templates/
    ├── PRD.md
    ├── spec.md
    ├── tasks.md
    └── verification.md
```

**总计：12个核心文件**

---

## 四技能详细设计

### /tech:init - 项目初始化

**独有职责**（无 superpowers 对应）：
- 技术栈自动检测（pom.xml/build.gradle）
- 项目骨架初始化（CLAUDE.md、目录结构）
- 版本检查（本地 vs 远端）

**触发条件**：新项目首次使用、用户主动要求

**交付物**：
- `CLAUDE.md` - 项目入口
- `docs/knowledge.md` - 领域知识骨架
- `.claude/settings.json` - Claude Code 配置

---

### /tech:feature - 需求规划

**委托 superpowers**：
```
brainstorming → (批准后) → writing-plans
```

**tinypowers 职责**：
- 定义交付物格式（PRD.md、spec.md、tasks.md）
- 定义 CHECK-1 门禁
- 确保输出符合 tinypowers 规范

**CHECK-1 门禁**：
```markdown
□ PRD.md 存在且非空，包含验收标准
□ spec.md 存在且有≥1条锁定决策
□ tasks.md 存在且任务≤8个
```

**输入**：用户一句话需求或模糊描述
**输出**：可直接进入 /tech:code 的规划包

---

### /tech:code - 编码执行

**委托 superpowers**：
```
using-git-worktrees
    ↓
subagent-driven-development (Wave Execution)
    ↓
requesting-code-review
    ↓
verification-before-completion
```

**tinypowers 职责**：
- **Pattern Scan**：扫描项目既有模式，供 superpowers 参考
- **CHECK-2 门禁**：定义准入/准出门禁
- **阶段推进**：管理 SPEC-STATE 生命周期
- **compliance-reviewer**：审查方案符合性（独有）

**CHECK-2 门禁（进入 /tech:code）**：
```markdown
□ CHECK-1 已通过
□ SPEC-STATE 为 PLAN
□ PRD/spec/tasks 已确认
```

**CHECK-2 门禁（离开 /tech:code）**：
```markdown
□ 代码审查通过（requesting-code-review）
□ 验证完成（verification-before-completion）
□ compliance-reviewer 方案符合性通过
□ 测试通过（如有）
```

**交付物**：
- 代码实现
- `VERIFICATION.md` - 验证证据
- 更新的 `SPEC-STATE.md`

---

### /tech:commit - 提交收口

**独有职责**（无 superpowers 完全对应）：
- 文档同步检查（实现与文档一致性）
- Knowledge Capture（知识沉淀飞轮）
- Git 提交与 PR 生成

**委托 superpowers**：
```
finishing-a-development-branch
```

**tinypowers 职责**：
- Document Sync 清单确认
- knowledge.md 更新
- 最终交付检查

**门禁**：
```markdown
□ SPEC-STATE 为 REVIEW
□ VERIFICATION.md 结论为 PASS
□ 文档已同步
□ 知识已捕获（如有）
```

**交付物**：
- Git commit
- PR/MR
- 更新的 `docs/knowledge.md`

---

## 与 superpowers 的边界

| 能力 | tinypowers | superpowers |
|------|-----------|-------------|
| 需求分析 | 定义交付物格式 | brainstorming |
| 任务拆解 | 定义任务格式 | writing-plans |
| 编码执行 | 定义门禁 | subagent-driven-development |
| 代码审查 | compliance-reviewer（方案符合性） | requesting-code-review（代码质量） |
| 验证 | 定义验证清单 | verification-before-completion |
| worktree 隔离 | 触发 | using-git-worktimes |
| 分支清理 | 触发 | finishing-a-development-branch |

---

## 1.0 约束

- **Java only**：技术栈检测和规则只支持 Java
- **单项目**：暂不支持多项目/团队功能
- **本地执行**：无 CI/CD 集成
- **硬编码规则**：rules 为 Markdown，无动态加载

---

## 版本演进

### 1.0 → 1.5 增强方向

| 版本 | 增强点 | superpowers 委托 |
|------|--------|-----------------|
| 1.1 | 编译/格式门禁自动化 | 新增委托脚本 |
| 1.2 | 审查深度 | requesting-code-review 增强 |
| 1.3 | 测试覆盖 | 新增 test-driven-development |
| 1.4 | 知识飞轮 | knowledge capture 自动化 |
| 1.5 | 深度封顶 + 2.0 预研 | 准备多语言支持 |

### 2.0 多语言

- 保留四技能结构
- 根据技术栈路由到不同 superpowers 实现
- Node.js/Go 规则集

---

## 关键决策

| ID | 决策 | 理由 |
|----|------|------|
| D-001 | 薄编排层定位 | tinypowers 定义 WHAT，superpowers 实现 HOW |
| D-002 | 四技能 1.0 拆分 | 与最终架构一致，避免 1.x 重构 |
| D-003 | Java only 1.0 | 先深度后广度 |
| D-004 | compliance-reviewer 独有 | 方案符合性是 tinypowers 核心价值 |
| D-005 | knowledge capture 独有 | 知识飞轮是 tinypowers 差异化能力 |

---

**设计完成**: 2026-04-09
**下一步**: 开始实现四技能 SKILL.md
