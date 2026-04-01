# 简化计划

> 版本: 1.0.0  
> 日期: 2026-03-30  
> 目标: 回归轻量，让 tinypowers 保持简单实用的核心价值

## 问题诊断

当前版本引入的复杂度膨胀：

| 复杂度项 | 引入原因 | 问题 |
|---------|---------|------|
| Confidence 评分体系 | Task Wisdom 积累 | 太主观，收益不明显 |
| Gap Analyzer agent | 5.6 Extended Agent Roster | 增加检查负担 |
| Schema YAML (8 phases, 13 artifacts) | 4.3 Schema-Driven Workflow | 过度设计 |
| Delta Spec 模板 | 5.3 Delta Specs | 大项目才需要 |
| Per-Task 命令文件 | 3.3 Executor Preload | 增加工作流复杂性 |
| Handoff JSON + Notepad 双持久化 | 3.2 Session Persistence | 过度工程 |
| Context Budget 四层质量 | 3.1 Context Budget | 增加认知负担 |

## 简化决策

### ✅ 保留（核心价值）

| 功能 | 理由 |
|------|------|
| Decision Guardian | 决策守护是 tinypowers 特色 |
| Anti-Rationalization | 防止过度理性，符合 AI 协作实际 |
| File-as-State | 简单有效 |
| Ordered Review Pipeline | 有序审查流程 |
| 分层规则（common/java/mysql） | 按需扩展，不强制 |
| Component-based install | 灵活组合 |

### ❌ 移除/回滚

| 项目 | 操作 | 涉及文件 |
|------|------|---------|
| Schema YAML | 删除 | `configs/schema.yaml` |
| Delta Spec 模板 | 删除 | `configs/templates/delta-spec.md` |
| Gap Analyzer agent | 删除 | `agents/gap-analyzer.md` |
| Confidence 评分体系 | 简化 | `.tinypowers/instincts.md`（移除评分，只保留模式描述）|
| learnings.md Instinct 格式 | 简化 | `scripts/scaffold-feature.js`（移除 Instinct 表）|
| wave-execution.md 智慧提取 | 回滚 | `skills/tech-code/wave-execution.md`（移除 Step 5）|
| Context Budget 四层 | 简化 | `configs/templates/state.md`（保留简单说明）|
| Per-Task 命令文件模式 | 回滚 | `skills/tech-code/context-preload.md`（恢复原简单逻辑）|
| configs/README.md | 合并/简化 | 合并到 `configs/rules/README.md` 或删除 |

### 🔄 简化（非删除）

| 项目 | 简化方案 |
|------|---------|
| EARS 格式 | 保留格式指南，但 PRD 模板不强制全格式 |
| Handoff JSON | 简化为单一 notepad.md，不再生成 JSON |
| Anti_Duplication tag | 保留在 architect/planner 中 |

## 实施步骤

- [ ] 1. 删除 `configs/schema.yaml`
- [ ] 2. 删除 `configs/templates/delta-spec.md`
- [ ] 3. 删除 `agents/gap-analyzer.md`
- [ ] 4. 简化 `.tinypowers/instincts.md` — 移除 Confidence 列
- [ ] 5. 简化 `learnings.md` 模板 — 移除 Instinct 表格，恢复简单笔记格式
- [ ] 6. 回滚 `wave-execution.md` Step 5（智慧提取）
- [ ] 7. 简化 `state.md` Context Budget 部分
- [ ] 8. 简化 `context-preload.md` — 移除 Per-Task 命令文件复杂性
- [ ] 9. 简化 `gsd-session-manager.js` — 移除 Handoff JSON，只保留 notepad.md
- [ ] 10. 删除或合并 `configs/README.md`
- [ ] 11. 移除 `skills/tech-feature/requirements-guide.md` 中的 EARS 强制要求
- [ ] 12. 运行 `npm run validate && npm test` 确保通过

## 目标指标

简化后：
- Agent: 10 个（移除 gap-analyzer）
- Skill: 8 个（不变）
- Hook: 6 个（不变）
- Template: 9 个（移除 delta-spec）
- Rule layers: 3 层（不变）
- 新增 complexity files: 0（移除 schema.yaml）
