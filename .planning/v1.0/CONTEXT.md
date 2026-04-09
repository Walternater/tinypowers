# Phase Context: v1.0 MVP - 四技能框架

## Goal
建立四技能框架，Java 场景完整跑通，明确与 superpowers 边界。

**交付物**:
- 4个 SKILL.md (tech-init, tech-feature, tech-code, tech-commit)
- 9个脚本/模板
- compliance-reviewer Agent
- 完整门禁流程 (CHECK-1, CHECK-2)

## Phase Information
- **Phase Number**: 1.0
- **Duration**: 15天 (3周)
- **Start Date**: TBD
- **End Date**: TBD

## Key Deliverables

### Skills (4个)
1. `/tech:init` - 技术栈检测 + 骨架初始化 (Day 1-3)
2. `/tech:feature` - 需求规划 + CHECK-1 门禁 (Day 4-7)
3. `/tech:code` - 编码执行 + CHECK-2 门禁 + compliance-reviewer (Day 8-12)
4. `/tech:commit` - 文档同步 + Knowledge Capture + Git 提交 (Day 13-15)

### Scripts (5个)
- `scripts/detect-stack.sh` - 技术栈检测
- `scripts/check-gate-1.sh` - CHECK-1 门禁
- `scripts/check-gate-2-enter.sh` - CHECK-2 进入
- `scripts/check-gate-2-exit.sh` - CHECK-2 离开
- `scripts/pattern-scan.sh` - 项目模式扫描

### Templates (7个)
- `templates/CLAUDE.md` - 项目入口文档
- `templates/knowledge.md` - 领域知识文档
- `templates/PRD.md` - 需求文档
- `templates/spec.md` - 技术方案
- `templates/tasks.md` - 任务拆解
- `templates/commit-message.md` - 提交信息
- `templates/VERIFICATION.md` - 验证报告

### Agents (1个)
- `agents/compliance-reviewer.md` - 方案符合性审查

## Critical Path
```
1.0.1 (Day 1-3): init
  - 1.0.1.1 detect-stack.sh
  - 1.0.1.2 CLAUDE.md template
  - 1.0.1.3 knowledge.md template
  - 1.0.1.4 init SKILL.md
  - 1.0.1.5 init 测试

1.0.2 (Day 4-7): feature
  - 1.0.2.1 引导问答设计
  - 1.0.2.2 PRD.md template
  - 1.0.2.3 spec.md template
  - 1.0.2.4 tasks.md template
  - 1.0.2.5 check-gate-1.sh
  - 1.0.2.6 feature SKILL.md
  - 1.0.2.7 feature 测试

1.0.3 (Day 8-12): code
  - 1.0.3.1 Pattern Scan 设计
  - 1.0.3.2 pattern-scan.sh
  - 1.0.3.3 check-gate-2-enter.sh
  - 1.0.3.4 compliance-reviewer 设计
  - 1.0.3.5 compliance-reviewer.md
  - 1.0.3.6 check-gate-2-exit.sh
  - 1.0.3.7 code SKILL.md
  - 1.0.3.8 code 测试

1.0.4 (Day 13-15): commit
  - 1.0.4.1 文档同步检查设计
  - 1.0.4.2 Knowledge Capture 设计
  - 1.0.4.3 commit-message template
  - 1.0.4.4 commit SKILL.md
  - 1.0.4.5 四技能集成测试
  - 1.0.4.6 1.0 发布准备
```

## Key Decisions
- 薄编排层架构: tinypowers 定义 WHAT，superpowers 定义 HOW
- 四个独有技能: init, feature, code, commit (其中 feature 和 code 编排 superpowers)
- CHECK-1 (feature→code) 和 CHECK-2 (code→commit) 为 HARD-GATE
- compliance-reviewer 为 tinypowers 独有审查维度

## Constraints
- Java-only (Maven/Gradle)
- 必须安装 superpowers 插件
- 依赖 bash/zsh 环境

## Reference Documents
- `docs/plans/v1.0/v1.0-implementation.md` - 详细实现文档
- `docs/plans/v1.0/v1.0-tasks.md` - 22个任务清单
- `docs/plans/contracts/v1.0-interface.md` - 接口契约
- `docs/plans/contracts/data-formats.md` - 数据格式契约

## Success Criteria
- [ ] init → feature → code → commit 完整流程跑通
- [ ] CHECK-1/CHECK-2 门禁生效
- [ ] compliance-reviewer 能发现方案偏离
- [ ] 交付物符合契约规范
