# tinypowers 执行层生态整合方案

## 架构定位

```
tinypowers（编排层）
    ├── WHAT：定义门禁、交付物格式、流程阶段
    └── 调度执行层 → 多引擎可插拔

执行层生态（可选/可替换）
    ├── superpowers（默认）
    ├── get-shit-done
    ├── gstack
    ├── OpenSpec
    ├── cc-sdd
    └── ... 更多
```

## 核心原则

1. **不绑定单一执行层**：tinypowers 定义接口，多个执行引擎可实现
2. **渐进式采用**：从 superpowers 开始，按需引入其他引擎
3. **能力互补**：不同引擎解决不同问题，组合使用

---

## 执行层能力分析

### 1. superpowers（默认/基线）

| 能力 | 说明 | tinypowers 调度点 |
|------|------|------------------|
| brainstorming | 方案探索 | /tech:feature 阶段 |
| writing-plans | 任务拆解 | /tech:feature 阶段 |
| using-git-worktrees | 隔离环境 | /tech:code 阶段 |
| subagent-driven-development | Wave 执行 | /tech:code 阶段 |
| requesting-code-review | 代码审查 | /tech:code 阶段 |
| verification-before-completion | 完成验证 | /tech:code 阶段 |
| finishing-a-development-branch | 分支清理 | /tech:commit 阶段 |

**定位**：默认执行层，覆盖完整开发周期

---

### 2. get-shit-done（Wave 执行专家）

**核心能力**：
- **Wave Execution**：分波次执行，解决 context rot
- **Deviation Rules**：偏离检测与恢复
- **轻量级 Spec**：不需要复杂文档

**与 tinypowers 整合**：
```yaml
# tinypowers 调度配置
/tech:code:
  execution_engine: get-shit-done  # 替代 subagent-driven-development
  config:
    waves: 3                       # 分3波执行
    deviation_threshold: 0.8       # 偏离检测阈值
```

**适用场景**：
- 大 feature 需要分波执行
- Context window 紧张
- 快速原型开发

**调度点**：替代 /tech:code 中的 Wave Execution 部分

---

### 3. gstack（虚拟团队/角色专业化）

**核心能力**：
- **多角色 Agent**：CEO、Eng Manager、Designer、Reviewer、QA、Security Officer
- **专业化审查**：设计审查、安全审查、性能审查
- **真实浏览器 QA**：/qa 技能可打开浏览器测试

**与 tinypowers 整合**：
```yaml
# tinypowers 调度配置
/tech:feature:
  planning_engine: gstack
  roles:
    - ceo_review: /plan-ceo-review      # 产品视角审查
    - eng_review: /plan-eng-review      # 技术可行性审查
    - design_review: /plan-design-review # 设计审查

/tech:code:
  review_engines:
    - code_review: gstack/review        # 深度代码审查
    - qa_review: gstack/qa              # 真实浏览器 QA
    - security_review: gstack/cso       # 安全审查
```

**适用场景**：
- 需要多维度专业审查
- 前端项目需要真实浏览器测试
- 安全敏感项目

**调度点**：
- /tech:feature：增强规划阶段的多角色审查
- /tech:code：增强审查阶段的专业化

---

### 4. OpenSpec（增量 Spec 框架）

**核心能力**：
- **变更驱动**：proposal → apply → archive
- **轻量级**：不需要完整 PRD
- **快速迭代**：适合小改动

**与 tinypowers 整合**：
```yaml
# tinypowers 调度配置（简化路径）
/tech:feature:
  planning_engine: openspec
  path: fast                        # 使用 OpenSpec 快速路径
  
# 输出：
# - proposal.md（轻量级）
# - specs/（精简需求）
# - tasks.md
```

**适用场景**：
- Bug fix（替代完整 PRD）
- 小功能增强
- 快速原型

**调度点**：/tech:feature 的简化路径，替代 brainstorming + writing-plans

---

### 5. cc-sdd（Kiro-style Spec-Driven）

**核心能力**：
- **EARS 格式需求**：Given/When/Then 结构化
- **Steering Documents**：项目记忆与标准
- **8 Agent 统一工作流**：跨平台兼容

**与 tinypowers 整合**：
```yaml
# tinypowers 调度配置
/tech:feature:
  planning_engine: cc-sdd
  output_format: ears               # EARS 格式需求
  steering: true                    # 维护 steering documents
  
/tech:code:
  execution_engine: cc-sdd
  parallel: true                    # 支持并行任务执行
```

**适用场景**：
- 团队需要标准化需求格式
- 复杂项目需要 steering documents
- 多平台统一工作流

**调度点**：
- /tech:feature：EARS 格式需求生成
- /tech:code：并行任务执行

---

### 6. claude-code-spec-workflow（完整工作流）

**核心能力**：
- **Spec Workflow**：Requirements → Design → Tasks → Implementation
- **Bug Fix Workflow**：Report → Analyze → Fix → Verify
- **实时 Dashboard**：进度可视化

**与 tinypowers 整合**：
```yaml
# tinypowers 调度配置（替代完整流程）
workflow_engine: claude-code-spec-workflow

# 两种模式：
# 1. Spec 模式（新功能）
/spec-create → /spec-execute

# 2. Bug Fix 模式
/bug-create → /bug-analyze → /bug-fix → /bug-verify
```

**适用场景**：
- 需要完整替代 tinypowers 的场景
- Dashboard 可视化需求
- Bug fix 专项工作流

**调度点**：可作为 /tech:feature + /tech:code 的完整替代

---

### 7. oh-my-claudecode（工具集）

**核心能力**：
- **Missions**：任务管理
- **Bridge**：跨工具集成
- **Hooks**：生命周期拦截

**与 tinypowers 整合**：
```yaml
# tinypowers 调度配置
/tech:code:
  hooks:
    pre_execution: oh-my-claudecode/hooks
    post_execution: oh-my-claudecode/hooks
```

**适用场景**：
- 需要生命周期钩子
- 与其他工具链集成

---

## 整合架构设计

### 引擎注册表

```yaml
# tinypowers/engines.yaml
engines:
  superpowers:
    type: default
    skills:
      - brainstorming
      - writing-plans
      - subagent-driven-development
      - requesting-code-review
      - verification-before-completion

  get-shit-done:
    type: execution
    skills:
      - wave-execution
      - deviation-control
    scheduling:
      - /tech:code/wave

  gstack:
    type: review
    skills:
      - ceo-review
      - eng-review
      - design-review
      - code-review
      - qa
      - security-review
    scheduling:
      - /tech:feature/planning
      - /tech:code/review

  openspec:
    type: planning
    skills:
      - propose
      - apply
      - archive
    scheduling:
      - /tech:feature/fast

  cc-sdd:
    type: full-stack
    skills:
      - spec-init
      - spec-requirements
      - spec-design
      - spec-tasks
      - spec-impl
    scheduling:
      - /tech:feature/*
      - /tech:code/*
```

### 调度策略

```yaml
# 项目级配置 .tinypowers/config.yaml
scheduling:
  /tech:init:
    engine: tinypowers  # 独有，不委托

  /tech:feature:
    default_engine: superpowers
    fast_path_engine: openspec    # 小需求快速路径
    complex_path_engine: gstack   # 复杂需求多角色
    
  /tech:code:
    execution:
      default: superpowers/subagent-driven-development
      large_feature: get-shit-done/wave
    review:
      - tinypowers/compliance-reviewer  # 独有
      - gstack/review                   # 代码质量
      - gstack/qa                       # 真实测试
      - gstack/cso                      # 安全审查
    
  /tech:commit:
    engine: tinypowers  # 独有，不委托
    knowledge_capture: true
```

---

## 版本演进建议

### 1.0 - 基础（superpowers 默认）
- 使用 superpowers 作为唯一执行层
- 建立四技能框架
- 验证薄编排层可行性

### 1.2 - 多引擎（引入 get-shit-done）
- 支持 get-shit-done Wave Execution
- 大 feature 自动分波

### 1.4 - 专业化（引入 gstack）
- 支持 gstack 多角色审查
- 安全/QA 专业化

### 2.0 - 生态（完整引擎注册表）
- 支持 OpenSpec 快速路径
- 支持 cc-sdd EARS 格式
- 引擎自动选择

---

## 关键决策

| ID | 决策 | 理由 |
|----|------|------|
| D-010 | 不绑定单一执行层 | 生态丰富，各有所长 |
| D-011 | superpowers 作为默认 | 覆盖最全，作为基线 |
| D-012 | 引擎可插拔配置 | 项目按需选择 |
| D-013 | tinypowers 独有能力保持 | compliance-reviewer、knowledge capture 不可替代 |

---

**文档完成**: 2026-04-09
