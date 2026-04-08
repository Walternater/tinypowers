# 知识自动提取 - 完整工作流

> **Init 初始化基础设施，Commit 做增量更新**

## 架构概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           项目生命周期                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐              ┌──────────────┐                        │
│  │   tech:init  │              │  tech:commit │                        │
│  │   (初始化)    │              │   (增量更新)  │                        │
│  └──────┬───────┘              └──────┬───────┘                        │
│         │                              │                                │
│         ▼                              ▼                                │
│  ┌─────────────────┐          ┌─────────────────┐                      │
│  │ 1. 复制收集脚本  │          │ 1. Git Commit    │                      │
│  │    scripts/     │          │                  │                      │
│  │                 │          │ 2. 增量知识提取   │ ◄── 只分析变更文件    │
│  │ 2. 创建目录结构  │          │    - 检测变更    │                      │
│  │    docs/auto/   │          │    - AI 分析     │                      │
│  │                 │          │    - 生成文档    │                      │
│  │ 3. 生成知识模板  │          │                  │                      │
│  │    knowledge.md │          │ 3. Push / PR     │                      │
│  └────────┬────────┘          └────────┬────────┘                      │
│           │                            │                                │
│           │                    ┌───────▼────────┐                      │
│           │                    │  人工审核沉淀   │                      │
│           │                    │                │                      │
│           │                    │ docs/auto/    │ ──► docs/knowledge.md  │
│           │                    │ 临时知识      │     (主知识库)         │
│           │                    │                │                      │
│           └────────────────────┤ 有价值的合并  │                      │
│                                │ 不准确的删除  │                      │
│                                └────────────────┘                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 职责分工

### tech:init - 初始化阶段

**时机**: 项目首次使用 tinypowers，或重新初始化

**职责**:
| 任务 | 输出 |
|------|------|
| 复制知识收集脚本 | `scripts/collect-code-for-analysis.js` |
| 创建知识目录 | `docs/auto/` |
| 生成知识库模板 | `docs/knowledge.md`（含使用说明）|
| 创建使用指南 | `docs/guides/knowledge-extraction-guide.md` |

**特点**:
- 只执行一次（项目初始化时）
- 不实际分析代码
- 准备基础设施

### tech:commit - 增量更新阶段

**时机**: 每次 Feature 完成，代码提交时

**职责**:
| 任务 | 说明 |
|------|------|
| 检测代码变更 | `git diff HEAD~1` 获取变更文件 |
| 收集变更信息 | 提取变更文件的结构和方法 |
| AI 增量分析 | 只分析本次变更的代码 |
| 生成增量知识 | `docs/auto/knowledge-{date}.md` |

**特点**:
- 每次 commit 自动执行
- 只分析变更的文件（增量）
- 快速聚焦本次改动

## 完整使用流程

### 阶段 1: 项目初始化

```bash
# 进入项目目录
cd my-project

# 执行初始化
/tech:init
```

**输出**:
```
✅ init-project 完成
项目根目录: /path/to/my-project
创建/更新内容:
- CLAUDE.md (created)
- docs/knowledge.md (created)        ← 知识库模板
- docs/auto/ (created)               ← 自动提取目录
- scripts/collect-code-for-analysis.js (created)  ← 收集脚本
- ...
初始化验证通过
```

### 阶段 2: 日常开发

```bash
# 开发 Feature
git add .

# 提交（会自动触发增量知识提取）
/tech:commit
```

**执行流程**:
```
📝 Step 1: Document Sync
   ✓ 技术方案.md
   ✓ 测试报告.md

📦 Step 2: Git Commit
   [main abc1234] [AI-Gen] feat(order): add state machine

🧠 Step 3: 增量 Knowledge Extraction
   🔍 分析 2 个变更文件
      - domain/order/OrderStatus.java (新增)
      - domain/order/Order.java (修改)
   
   🧠 AI 分析变更代码...
   
   📊 提取结果:
      ✅ 设计模式: 1 个 (状态机模式)
      ✅ 架构决策: 1 个 (状态与行为封装)
      ⚠️  潜在风险: 1 个 (并发状态竞争)
   
   💾 生成: docs/auto/knowledge-2026-04-08.md

🚀 Step 4: Push / PR
   https://github.com/user/repo/pull/new/feature/order-state-machine

✅ 完成！

💡 提示:
   请查看 docs/auto/knowledge-2026-04-08.md
   有价值的内容可以合并到 docs/knowledge.md
```

### 阶段 3: 知识沉淀

```bash
# 查看生成的知识
cat docs/auto/knowledge-2026-04-08.md
```

**内容示例**:
```markdown
# 增量代码知识提取报告

**生成时间**: 2026/04/08 15:30  
**分析文件**: 2 个变更文件  
**变更类型**: 新增 80 行，修改 25 行

---

## 🎨 本次引入的设计模式

### 状态机模式（新增）
**文件**: `domain/order/OrderStatus.java` (新增)
**描述**: 使用枚举定义订单状态（CREATED, PAID, SHIPPED, COMPLETED）
**价值**: 状态流转清晰，避免散落在 if-else 中
**建议**: 后续可引入 Spring Statemachine 实现完整状态机

---

## 🤔 本次体现的架构决策

### 状态与行为封装
**文件**: `domain/order/Order.java` (修改)
**决策**: 将状态校验逻辑封装在领域对象中
**代码体现**:
```java
public void pay(Money payAmount) {
    if (status != OrderStatus.CREATED) {
        throw new IllegalStateException("订单状态不正确");
    }
    // ...
}
```
**价值**: 领域对象自包含业务规则，保证状态一致性

---

## ⚠️ 本次引入的潜在风险

### 并发状态竞争
**文件**: `domain/order/Order.java`
**风险**: 多线程环境下，状态检查和状态修改之间可能有竞争条件
**建议**: 考虑添加乐观锁或分布式锁
```

**人工处理**:
```bash
# 1. 有价值的内容合并到主知识库
cat >> docs/knowledge.md << 'EOF'

## 2026-04-08 新增

### 设计模式：状态机
使用枚举管理订单状态，后续可演进为完整状态机。
参考: docs/auto/knowledge-2026-04-08.md

### 架构决策：状态封装
将状态校验封装在领域对象中，保证业务规则内聚。
参考: Order.java pay() 方法
EOF

# 2. 删除临时文档（可选）
rm docs/auto/knowledge-2026-04-08.md
```

## 文件结构演变

### 初始化后
```
my-project/
├── scripts/
│   └── collect-code-for-analysis.js  # 收集脚本
├── docs/
│   ├── knowledge.md                  # 知识库模板
│   ├── auto/                         # 空目录
│   └── guides/
│       └── knowledge-extraction-guide.md
└── ...
```

### 第一次 commit 后
```
my-project/
├── docs/
│   ├── knowledge.md                  # 模板（待填充）
│   ├── auto/
│   │   └── knowledge-2026-04-08.md   # 第一次提取的知识
│   └── ...
└── ...
```

### 多次 commit 后
```
my-project/
├── docs/
│   ├── knowledge.md                  # 人工维护的精华
│   │   ├── 设计模式（合并后的）
│   │   ├── 架构决策（合并后的）
│   │   └── ...
│   ├── auto/                         # 原始提取记录
│   │   ├── knowledge-2026-04-08.md
│   │   ├── knowledge-2026-04-09.md
│   │   ├── knowledge-2026-04-10.md
│   │   └── ...
│   └── ...
└── ...
```

## 配置选项

### 环境变量

| 变量 | 默认值 | 说明 | 适用场景 |
|------|--------|------|---------|
| `EXTRACT_KNOWLEDGE` | `1` | 设为 `0` 跳过知识提取 | Commit 时临时跳过 |
| `ANALYSIS_MODE` | `incremental` | `incremental` / `full` | Init 后全量分析 |

### 使用示例

```bash
# Init 后做一次全量分析
ANALYSIS_MODE=full node scripts/collect-code-for-analysis.js

# Commit 时跳过知识提取
EXTRACT_KNOWLEDGE=0 /tech:commit

# 分析最近 3 个 commit 的变更
ANALYSIS_REF=HEAD~3 node scripts/collect-code-for-analysis.js
```

## 最佳实践

### DO（推荐）
- ✅ 每次 commit 后查看生成的知识文档
- ✅ 将有价值的内容及时合并到主知识库
- ✅ 定期清理 docs/auto/ 中的过期文档
- ✅ 在主知识库中添加个人经验和验证信息

### DON'T（避免）
- ❌ 让 docs/auto/ 堆积太多未处理的文档
- ❌ 直接修改 docs/auto/ 中的文件（会被覆盖）
- ❌ 忽略 AI 提示的潜在风险
- ❌ 一次性合并所有自动生成的内容（需要筛选）

## 常见问题

### Q1: 为什么区分 init 和 commit？

**A**: 
- **Init** 只做一次性设置，准备基础设施
- **Commit** 做增量分析，避免重复扫描未变更的代码
- 这样设计更高效，也符合开发者的工作节奏

### Q2: 可以只做 init 不做 commit 的知识提取吗？

**A**: 可以。设置 `EXTRACT_KNOWLEDGE=0` 即可跳过：
```bash
EXTRACT_KNOWLEDGE=0 /tech:commit
```

### Q3: 可以手动触发全量分析吗？

**A**: 可以。适合项目总结或知识库初始化：
```bash
ANALYSIS_MODE=full node scripts/collect-code-for-analysis.js
```

### Q4: 生成的知识文档太多怎么办？

**A**: 
1. 定期审核并合并有价值的内容到 docs/knowledge.md
2. 删除不准确或已过时的 docs/auto/ 文档
3. 只保留最近 10-20 次的提取记录

### Q5: 如何确保知识提取不阻塞提交流程？

**A**: 知识提取设计为非阻塞：
- 失败不影响 commit 和 push
- 可以在后台执行
- 开发者可以选择稍后查看

---

**总结**: Init 负责准备舞台，Commit 负责每次演出。开发者只需要关注有价值的内容筛选和沉淀。
