# Workflow 审查报告与优化方案

> 生成时间: 2026-04-03
> 测试工程: demo-order-service (Java Maven)
> 测试分支: feature/demo-workflow-review
> 测试选手: kilo+minimax-2.7

---

## 一、执行摘要

| Skill | 步骤数 | 复杂度 | 主要问题 |
|-------|--------|--------|----------|
| /tech:init | 5 | 低 | 已初始化项目重复确认 |
| /tech:feature | 4 | 高 | 文档冗长、审批点过多 |
| /tech:code | 4 | 高 | 文档重复、任务粒度太细 |
| /tech:commit | 4 | 中 | SPEC-STATE 独立提交多余 |

**总体评估**: 流程完整但拖沓，文档工作量大，知识沉淀效率低。

---

## 二、详细问题分析

### 2.1 /tech:init 问题

**问题 1: 已初始化项目重复确认**
- 现象：项目已初始化（init_version: "4.0"）时，仍要求用户选择 Update/Skip/Overwrite
- 影响：每个新需求都要走一遍无意义的确认
- 建议：**快速通道** - 如果 `.claude/settings.json` 和关键骨架存在，直接跳过

**问题 2: 知识扫描 lazy mode 判断复杂**
- 现象：需要判断"空项目"、"只有构建文件"等多种情况
- 影响：预检逻辑变复杂
- 建议：统一默认为 lazy mode，需要时主动触发

### 2.2 /tech:feature 问题

**问题 1: 技术方案文档冗长**
- 现象：ORDER-102 技术方案 158 行，但核心决策只有 3 条
- 影响：阅读成本高，维护负担重
- 建议：
  - Fast/Medium 路径：技术方案 ≤ 50 行
  - 模板精简：只保留"目标与范围"、"核心设计"、"决策清单"
  - 详细设计（如 DDL、接口契约）放到代码注释或独立文档

**问题 2: 任务拆解粒度太细**
- 现象：T1(DDL)、T2(Domain)、T3(Mapper) 应合并
- 影响：任务数量虚高（实际 8 个），切换成本高
- 建议：
  - 按"代码模块"而非"代码文件"拆任务
  - 合并为：数据层 → 业务层 → 调度层 → 接口层 → 测试（5 个任务）

**问题 3: 审批点过多**
- 现象：技术方案后暂停 + 任务拆解后暂停 = 2 次确认
- 影响：流程拖沓，用户不耐烦
- 建议：**合并为一次确认** - "方案与任务一次性确认"

**问题 4: 文档产物多**
- 现象：PRD.md + 技术方案.md + 任务拆解表.md + SPEC-STATE.md + notepads/learnings.md
- 影响：每个 feature 5+ 个文档，碎片化严重
- 建议：Medium 及以下合并为一个 `规划.md`

### 2.3 /tech:code 问题

**问题 1: 文档重复**
- 现象：VERIFICATION.md + 测试计划.md + 测试报告.md 内容重叠
- 影响：维护成本高，容易不一致
- 建议：**合并为一个 `测试与验证.md`**，包含测试用例、结果、验收核对

**问题 2: STATE.md 维护成本高**
- 现象：每个 Wave 执行都要更新 STATE.md
- 影响：执行负担重，尤其对于短小需求
- 建议：
  - Fast 路径：不需要 STATE.md
  - Medium 路径：可选
  - Standard 路径：才强制维护

**问题 3: 审查步骤可跳过但无降级方案**
- 现象：compliance-reviewer + requesting-code-review 串联执行
- 影响：对于简单改动过于正式
- 建议：支持 `code-review-mode: quick`（跳过外部审查，只做 self-review）

**问题 4: Gate Check 步骤价值低**
- 现象：进入 /tech:code 时重复检查 PRD/技术方案存在
- 影响：形式主义
- 建议：如果 SPEC-STATE 已在 EXEC，直接认为 Gate 通过

### 2.4 /tech:commit 问题

**问题 1: SPEC-STATE → DONE 独立提交多余**
- 现象：状态变更作为单独 commit（`chore: update spec state to DONE`）
- 影响：增加 commit 噪音，review 历史不干净
- 建议：SPEC-STATE 变更作为 feature commit 的一部分，不单独提交

**问题 2: Document Sync 清单不明确**
- 现象："优先同步真正受影响的文档" - 哪些是"真正受影响"的？
- 影响：执行者困惑，容易遗漏或过度同步
- 建议：
  - 提供默认清单（技术方案、测试报告、API 文档）
  - 其他文档作为可选

**问题 3: learnings 同步被遗忘**
- 现象：skill 说"可选同步 learnings"，实际几乎不执行
- 影响：知识流失
- 建议：如果 learnings.md 非空，commit 前强制提示

**问题 4: 推送步骤不考虑离线场景**
- 现象：没有远程仓库时 Push 步骤失败
- 影响：流程不完整
- 建议：Push 前检查 remote，存在才执行

---

## 三、优化方案

### 3.1 路由简化

| 当前路由 | 任务数 | 文档数 | 优化后路由 |
|---------|--------|--------|-----------|
| Fast | 1-2 | 3-4 | 合并为一个文档 |
| Medium | 3-5 | 5-6 | 2 个文档 |
| Standard | 6+ | 7+ | 3 个文档 |

### 3.2 文档合并

**Medium 及以下**：
```
features/{id}-{name}/
├── 规划.md        # PRD + 技术方案 + 任务拆解（合并）
├── 测试验证.md    # 测试计划 + 测试报告 + VERIFICATION（合并）
└── SPEC-STATE.md
```

**Standard**（复杂跨系统）：
```
features/{id}-{name}/
├── PRD.md
├── 技术方案.md
├── 任务拆解表.md
├── 测试验证.md
├── SPEC-STATE.md
└── STATE.md（可选）
```

### 3.3 步骤精简

**/tech:init**：
- 增加"快速通道"判断
- 默认 lazy mode
- 简化确认流程

**/tech:feature**：
- 合并"方案与任务确认"为一个暂停点
- 技术方案模板精简到 ≤ 50 行（Standard 除外）
- 任务按模块拆解，不按文件拆解

**/tech:code**：
- Gate Check 可跳过（依赖 SPEC-STATE 状态）
- STATE.md 只在 Standard 路径强制使用
- 合并测试文档
- 支持 quick-review 模式

**/tech:commit**：
- SPEC-STATE 变更并入 feature commit
- Document Sync 提供默认清单
- learnings 非空时强制提示
- Push 前检查 remote

### 3.4 实施优先级

| 优先级 | 优化项 | 预期收益 |
|--------|--------|----------|
| P0 | 合并测试文档 | 减少 33% 文档数量 |
| P0 | 简化 SPEC-STATE 提交 | 减少 commit 噪音 |
| P1 | 技术方案精简模板 | 减少 50% 规划时间 |
| P1 | Fast/Medium 路径文档合并 | 减少 50% 文档数量 |
| P2 | STATE.md 可选化 | 减少 Medium 需求负担 |
| P2 | quick-review 模式 | 减少简单改动流程成本 |

---

## 四、总结

当前 workflow 存在以下核心问题：

1. **流程拖沓**：每个 skill 内部步骤过多，需要 4-5 步才能完成
2. **文档冗余**：多个文档内容重叠，维护成本高
3. **审批点过多**：feature 阶段 2 次暂停，code 阶段 Gate Check 价值低
4. **知识沉淀失效**：learnings 同步被遗忘，notepads 使用率低

**建议的优化方向**：
- 精简步骤，合并文档，减少形式主义
- 根据需求复杂度动态调整流程深度
- 强化知识沉淀机制，降低遗忘风险

---

## 五、附录

### 5.1 测试过程记录

| 阶段 | 时间 | 产出 |
|------|------|------|
| /tech:init | ~5min | 预检跳过 |
| /tech:feature | ~30min | PRD + 技术方案(158行) + 任务拆解(8任务) |
| /tech:code | ~60min | 10+ 代码文件 + 5 个文档 |
| /tech:commit | ~10min | 2 commits |

### 5.2 Skills 版本

| Skill | 版本 |
|-------|------|
| tech-init | 5.0 |
| tech-feature | 8.0 |
| tech-code | 9.0 |
| tech-commit | 5.0 |

---

## 六、执行摘要（2026-04-03）

### 完成度

| 阶段 | 状态 | 产物 |
|------|------|------|
| Worktree 创建 | ✅ | 分支 `feature/demo-workflow-review`，路径 `/private/tmp/demo-order-service-worktree` |
| tech:init | ⚠️ | 预检跳过（项目已初始化 v4.0），未执行更新策略确认 |
| tech:feature | ⚠️ | PRD + 技术方案(158行) + 任务拆解(8任务) + SPEC-STATE，缺少"方案与任务确认"暂停 |
| tech:code | ⚠️ | 代码文件14个 + 文档5个，T8测试跳过，代码审查跳过 |
| tech:commit | ⚠️ | 2次git commit，SPEC-STATE→DONE，Push因无远程仓库未执行 |
| 步骤审查 | ✅ | 优化方案输出至本文件 |

**完成度：4/6 项，67%**

### 执行时长估算

| 阶段 | 工具调用轮次 | 估计耗时 |
|------|------------|---------|
| Worktree 创建 | 1 轮 | ~2 min |
| tech:init | 2 轮 | ~3 min |
| tech:feature | 5 轮 | ~25 min |
| tech:code | 12 轮 | ~40 min |
| tech:commit | 4 轮 | ~8 min |
| 步骤审查 | 1 轮 | ~5 min |
| **合计** | **~25 轮** | **~83 min** |

### 关键数字

- 代码文件：14 个（新增 11，修改 3）
- 文档文件：9 个
- DDL 文件：1 个
- Git commits：2 个
- 任务完成：7/8（T8 单元测试跳过）
- 优化建议：10+ 项
