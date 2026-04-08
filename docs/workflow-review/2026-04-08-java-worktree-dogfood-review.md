# tinypowers Workflow 全流程验证报告

**验证日期**: 2026-04-08
**测试项目**: agent-service (Java 生产项目)
**验证范围**: init → feature → code → commit 完整流程
**执行模式**: Worktree 隔离 + 复杂需求实测

---

## 1. 执行摘要

| 阶段 | 预期耗时 | 实际耗时 | 产出质量 | 主要问题 |
|------|----------|----------|----------|----------|
| /tech:init | 5-8 min | ~8 min | 高 | 端口默认值错误 |
| /tech:feature | 15-20 min | ~20 min | 高 | 文档模板过多 |
| /tech:code | 30-45 min | ~40 min | 中 | 编译错误需手动修复 |
| /tech:commit | 5-10 min | ~8 min | 高 | worktree 清理步骤缺失 |
| **总计** | **~1h** | **~1.2h** | - | - |

---

## 2. 逐阶段详细审查

### 2.1 /tech:init

**执行路径**:
1. 预检（检测到已初始化）
2. 技术栈检测（Maven + Spring Boot）
3. 知识扫描（生成 README + knowledge.md）
4. Wrap-up

**产出验证**:
- ✅ README.md: 项目职责、技术栈、模块说明、快速开始
- ✅ knowledge.md: 组件用法、平台约束、踩坑记录

**发现的问题**:
| 问题 | 严重程度 | 描述 |
|------|----------|------|
| 端口默认值错误 | 低 | CLAUDE.md 模板使用 8080，实际项目为 8066 |
| brainstorming 误用 | 中 | SKILL.md 提到用 brainstorming 汇总，但实际 superpowers:brainstorming 是新功能设计 skill |

**优化建议**:
1. 模板变量应从 `application.yml` 动态读取，而非硬编码
2. 明确区分 "brainstorming 方法论" vs "superpowers:brainstorming skill"

---

### 2.2 /tech:feature

**执行路径**:
1. 需求理解（选择技能组路由需求）
2. PRD.md 编写
3. 技术方案.md 编写
4. 任务拆解表.md 编写
5. CHECK-1 确认

**产出验证**:
- ✅ PRD.md: 背景、目标、验收标准、数据影响、上线计划
- ✅ 技术方案.md: 架构图、关键决策、风险回滚、配置项
- ✅ 任务拆解表.md: 6 个任务、依赖关系、风险任务

**流程痛点**:
| 痛点 | 描述 | 优化建议 |
|------|------|----------|
| 文档模板过多 | PRD/技术方案/任务拆解/SPEC-STATE/VERIFICATION 共 5+ 个文件 | 合并 PRD + 技术方案，任务拆解内联到技术方案 |
| SPEC-STATE 维护成本 | 需手动更新阶段和检查项 | 提供 CLI 工具自动推进 |
| 路由选择不明确 | Fast/Medium/Standard 的边界模糊 | 提供决策树或自动检测 |

---

### 2.3 /tech:code

**执行路径**:
1. Gate Check
2. Worktree 隔离创建
3. 开发执行（Task 1-4 核心代码）
4. 审查修复（compliance + code review）
5. VERIFICATION.md 创建
6. CHECK-2

**代码产出**:
- SkillGroupRouter.java（路由核心）
- SkillGroupCache.java（两级缓存）
- WeightedLoadBalancer.java（加权轮询）
- ClueTaskJob.java（Job 集成）
- WeightedLoadBalancerTest.java（单元测试）

**严重问题**:
| 问题 | 影响 | 根因 |
|------|------|------|
| Java 8 兼容性问题 | 编译失败 | 使用了 `List.of()` 等 Java 9+ API |
| 模型字段不存在 | 编译失败 | Agent 类没有 getStatus()/getBusyStatus() |
| Mapper 方法不存在 | 编译失败 | AgentMapper 没有 selectByPrimaryKey() |

**根本原因分析**:
代码生成阶段 AI 假设了不存在的 API，没有先读取实际模型类定义。

**优化建议**:
1. **强制 Pattern Scan**: 编码前必须读取同类型文件（Model/Mapper/Business）了解实际 API
2. **编译验证前置**: 每个文件创建后立即 `mvn compile` 验证
3. **渐进式实现**: 先写接口和测试，再填充实现

---

### 2.4 /tech:commit

**执行路径**:
1. Document Sync（VERIFICATION.md → feature 目录）
2. SPEC-STATE → DONE
3. Git Commit（11 个文件）
4. PR 链接生成

**产出验证**:
- ✅ Commit message: 包含 type(scope)、描述、关键决策、Evidence
- ✅ PR URL: 自动检测 GitLab 并生成链接
- ✅ 文件完整: 代码 + 文档 + SPEC-STATE

**问题**:
| 问题 | 描述 |
|------|------|
| Worktree 被误添加 | `git add -A` 会把 worktree 目录作为子模块添加 |
| 文档同步命令不存在 | `npm run commit:prepare-docs` 未定义 |

**优化建议**:
1. 自动清理 worktree 目录或添加到 .gitignore
2. 提供文档同步脚本或简化文档同步流程

---

## 3. 核心问题总结

### 3.1 流程复杂度问题

**现状**:
- 4 个阶段 × 5-6 个文档 = 20+ 个交付物
- 每个阶段有独立的 state 文件（SPEC-STATE/STATE/VERIFICATION）
- 多个 checkpoint（CHECK-1/CHECK-2）需要人工确认

**用户反馈**:
> "整个流程还是太复杂拖沓了，输出的文档比较凌乱，也没有形成有效的知识沉淀"

**数据支持**:
| 交付物类型 | 数量 | 必要性 |
|------------|------|--------|
| PRD | 1 | 高 |
| 技术方案 | 1 | 高 |
| 任务拆解 | 1 | 高 |
| SPEC-STATE | 1 | 中 |
| STATE | 1 | 低（仅复杂需求）|
| VERIFICATION | 1 | 中 |
| 测试计划 | 1 | 低（Fast 路径可省）|
| 测试报告 | 1 | 低（Fast 路径可省）|

### 3.2 知识沉淀问题

**现状**:
- knowledge.md 模板化严重，需要显式调用才能填充
- 缺乏从 feature 到 knowledge 的自动提升机制
- 文档存在 ≠ 知识沉淀

**验证结果**:
- init 后生成的 knowledge.md 内容详实（100+ 行具体内容）
- 但 init 过程需要较多人工介入

### 3.3 代码生成质量

**现状**:
- AI 假设 API 存在而没有验证
- Java 8/9/11 特性混用
- 编译错误集中在最后才暴露

---

## 4. 优化方案

### 4.1 简化文档体系（优先级：P0）

**目标**: 减少 50% 的文档数量

**方案**:
```
Before:                     After:
├── PRD.md                  ├── 需求.md（PRD + 验收标准）
├── 技术方案.md              ├── 方案.md（技术方案 + 任务拆解）
├── 任务拆解表.md            └── VERIFICATION.md（验证证据）
├── SPEC-STATE.md
├── STATE.md（可选）
├── VERIFICATION.md
├── 测试计划.md（可选）
└── 测试报告.md（可选）
```

**实施步骤**:
1. 重写 tech-feature SKILL.md，合并 PRD + 技术方案模板
2. SPEC-STATE 内联到方案.md 头部（YAML frontmatter）
3. 删除 STATE.md，复杂需求使用 GitHub/GitLab Projects 跟踪

### 4.2 编码前置验证（优先级：P0）

**目标**: 编译错误在 5 分钟内暴露

**方案**:
```yaml
tech-code 流程调整:
  Phase 1: Pattern Scan（强制）
    - 读取同目录现有文件（Model/Mapper/Service）
    - 确认 API 存在性，不假设
    
  Phase 2: 接口定义
    - 先写 Service 接口
    - 编译验证通过后再写实现
    
  Phase 3: 渐进实现
    - 每个 public 方法后 `mvn compile`
    - 不累积编译错误
```

**实施步骤**:
1. tech-code SKILL.md 增加 Pattern Scan 强制步骤
2. 提供 `npm run code:compile-check` 快捷命令

### 4.3 自动化状态推进（优先级：P1）

**目标**: 减少手动 SPEC-STATE 维护

**方案**:
```bash
# 自动推进命令
npm run spec:plan        # PLAN -> EXEC
npm run spec:review      # EXEC -> REVIEW  
npm run spec:done        # REVIEW -> DONE
```

**实施步骤**:
1. 扩展 `update-spec-state.js` 支持自动检测当前阶段
2. 根据文件存在性自动判断阶段（有代码 → EXEC，有 VERIFICATION → REVIEW）

### 4.4 Worktree 自动管理（优先级：P1）

**目标**: worktree 不污染主仓库

**方案**:
```bash
# init-project.js 自动添加
echo ".claude/worktrees/" >> .gitignore

# commit 流程自动排除
npm run worktree:cleanup  # 合并后删除旧 worktree
```

**实施步骤**:
1. init-project.js 自动添加 .gitignore 规则
2. commit 流程自动排除 worktree 目录

### 4.5 知识沉淀飞轮优化（优先级：P2）

**目标**: feature 经验自动沉淀到 knowledge.md

**方案**:
```yaml
feature 交付后:
  - 提取 VERIFICATION.md 中的踩坑记录
  - 提取技术方案.md 中的关键决策
  - 自动追加到 docs/knowledge.md
```

**实施步骤**:
1. 新增 `npm run knowledge:promote` 命令
2. 在 tech-commit 流程末尾自动调用

---

## 5. 验证结论

### 5.1 流程有效性

| 维度 | 评分 | 说明 |
|------|------|------|
| 知识沉淀 | ✅ 有效 | knowledge.md 产出质量高 |
| 需求分析 | ✅ 有效 | PRD/技术方案覆盖关键决策 |
| 代码隔离 | ✅ 有效 | worktree 机制运行良好 |
| 审查质量 | ⚠️ 一般 | 编译错误暴露过晚 |
| 文档整洁 | ❌ 需改进 | 文档数量多、状态分散 |

### 5.2 关键发现

1. **init 阶段**: 知识扫描有效，但 brainstorming 方法论需澄清
2. **feature 阶段**: 文档产出详实，但模板过多导致凌乱
3. **code 阶段**: worktree 隔离有效，但编码前缺乏 API 验证
4. **commit 阶段**: PR 链接生成有效，但 worktree 清理缺失

### 5.3 立即可做的改进

1. **今天可做**:
   - 更新 .gitignore 排除 worktrees
   - 简化 feature 文档模板（合并 PRD+技术方案）

2. **本周可做**:
   - 重写 tech-code Phase 1 强制 Pattern Scan
   - 添加 `npm run spec:plan/done` 快捷命令

3. **本月可做**:
   - 实现 knowledge:promote 飞轮
   - 统一四个 SKILL.md 的文档格式

---

## 6. 附录

### 6.1 验证产出物清单

```
agent-service/
├── README.md                          # init 生成
├── docs/knowledge.md                  # init 生成
├── features/CSS-99999-skill-group-routing/
│   ├── PRD.md                         # feature 生成
│   ├── 技术方案.md                     # feature 生成
│   ├── 任务拆解表.md                   # feature 生成
│   ├── SPEC-STATE.md                  # feature/code 更新
│   └── VERIFICATION.md                # code 生成
└── src/...                            # code 生成
```

### 6.2 提交记录

```
commit c8951be1
Author: AI-Gen
Date: 2026-04-08

[AI-Gen] feat(skill-group): 线索分配支持技能组路由

实现线索分配任务的技能组智能路由功能：
- 新增 SkillGroupRouter 核心路由逻辑
- 新增 SkillGroupCache 两级缓存实现（本地 Guava + Redis）
- 新增 WeightedLoadBalancer 加权轮询算法
- 改造 ClueTaskJob 集成技能组路由

技术方案关键决策：
1. 路由策略：优先匹配 + 兜底降级
2. 负载均衡：加权轮询
3. 缓存一致性：最终一致（5min TTL）

Evidence: VERIFICATION.md PASS
- 单元测试 5/5 passed
- 编译验证通过
- 3 项残留风险已记录

Resolves: CSS-99999
```

### 6.3 PR 链接

```
https://git.guazi-corp.com/znkf/agent-service/-/merge_requests/new?
  merge_request[source_branch]=spec-test2&
  merge_request[target_branch]=online
```

---

## 7. 对比总结

| 问题 | 当前状态 | 优化后状态 |
|------|----------|------------|
| 文档数量 | 5-8 个文件 | 2-3 个文件 |
| 状态维护 | 手动编辑 SPEC-STATE | `npm run spec:done` 自动推进 |
| 编译错误 | 最后集中暴露 | 每文件后即时验证 |
| worktree | 可能误添加 | 自动 .gitignore 排除 |
| 知识沉淀 | 人工判断 | 自动识别 [PERSIST] 标记 |

**预计改进效果**: 整体耗时减少 30%，文档整洁度提升 50%，编译错误率降低 80%
