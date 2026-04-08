# 无配置知识自动提取方案

> 零配置、零 API Key、零外部依赖，利用当前 AI 会话直接分析代码

## 核心设计

```
┌─────────────────────────────────────────────────────┐
│                  当前 AI 会话                        │
│  ┌─────────────────┐    ┌────────────────────────┐  │
│  │  脚本（Node.js） │ →  │  AI 分析 & 生成文档     │  │
│  │  - 收集代码文件  │    │  - 理解代码结构         │  │
│  │  - 提取结构信息  │    │  - 识别设计模式         │  │
│  │  - 输出分析数据  │    │  - 生成知识文档         │  │
│  └─────────────────┘    └────────────────────────┘  │
│           ↑                                         │
│    无需 API Key，无需外部 AI 服务                    │
└─────────────────────────────────────────────────────┘
```

## 与传统方案的对比

| 方案 | 配置复杂度 | 成本 | 准确度 | 实时性 |
|------|-----------|------|--------|--------|
| **代码注释提取** | 低 | 无 | 低 | 实时 |
| **外部 AI API** | 高（需 API Key） | 按量付费 | 高 | 需调用 |
| **当前方案** ✅ | **无** | **无** | **高** | **实时** |

## 执行流程

### 完整流程图

```
/tech:commit
    │
    ├── 1. Document Sync
    │      └── 同步技术方案、测试报告
    │
    ├── 2. Git Commit
    │      └── git commit -m "..."
    │
    ├── 3. Knowledge Extraction ⭐
    │      │
    │      ├── 3.1 脚本收集代码
    │      │      └── node collect-code-for-analysis.js
    │      │          └── 输出: .tmp/code-analysis-input.md
    │      │
    │      └── 3.2 AI 分析并生成
    │             └── 读取代码分析数据
    │             └── 生成: docs/auto/knowledge-{date}.md
    │
    ├── 4. 提示用户审核
    │      └── "💡 已生成知识文档，请查看 docs/auto/"
    │
    ├── 5. Push / PR
    │      └── git push
    │
    └── 6. SPEC-STATE → DONE
           └── 推进状态
```

## 文件结构

```
project/
├── scripts/
│   └── collect-code-for-analysis.js    # 纯收集脚本，不调用 AI
├── docs/
│   ├── knowledge.md                    # 人工维护的主知识库
│   └── auto/                           # AI 生成的知识（自动创建）
│       └── knowledge-2026-04-08.md
└── .tmp/                               # 临时分析数据（可选查看）
    └── code-analysis-input.md
```

## 快速集成

### 步骤 1: 复制收集脚本

```bash
# 从 tinypowers 复制（只需这一个脚本！）
mkdir -p scripts
cp /Users/wcf/personal/tinypowers/scripts/collect-code-for-analysis.js scripts/
```

### 步骤 2: 更新 tech:commit Skill

修改 `/Users/wcf/.claude/skills/tech-commit/SKILL.md`，在 Git Commit 后添加：

```markdown
### 3. Knowledge Extraction（知识提取）

**触发时机**: Git Commit 成功后、Push 之前

**执行流程**:
1. 运行收集脚本：
   ```bash
   node scripts/collect-code-for-analysis.js
   ```

2. AI 读取 `.tmp/code-analysis-input.md`，分析代码并生成知识文档

3. 生成 `docs/auto/knowledge-{date}.md`

**输出示例**:
```
🧠 启动代码知识分析...
🔍 扫描项目代码...
找到 13 个代码文件
📊 分析文件结构...
✅ 分析完成！

🧠 AI 分析代码中...

========== 知识提取结果 ==========
📐 设计模式: 3 个
   - 领域模型与数据模型分离
   - 值对象模式（Money）
   - 状态枚举

🤔 架构决策: 2 个
   - 分层架构设计
   - JPA 数据访问策略

✅ 最佳实践: 4 个
   - 防御性编程
   - 依赖注入
   - DTO 分层
   - 事务边界控制

⚠️ 潜在风险: 3 个
   - 并发超卖风险 🔴
   - ID 生成冲突 🟡
   - 大事务风险 🟡

💾 知识文档已保存: docs/auto/knowledge-2026-04-08.md
```

**人工确认**:
- 生成的知识文档为建议性质，不阻塞提交流程
- 开发者审核后，将有价值的内容合并到 `docs/knowledge.md`
- 自动生成文件保留在 `docs/auto/` 作为原始记录
```

### 步骤 3: 使用！

```bash
# 开发完成，执行提交
/tech:commit

# 会自动：
# 1. 同步文档
# 2. Git Commit
# 3. 收集代码 → AI 分析 → 生成知识文档
# 4. 提示查看
# 5. Push
```

## 实现细节

### 收集脚本（collect-code-for-analysis.js）

**职责**: 纯数据收集，不做任何智能分析

**功能**:
1. 递归扫描 `src/main/java` 目录
2. 提取每个文件的：
   - 类名
   - 方法列表
   - 代码行数
   - 代码结构（package、import、关键方法签名）
3. 输出为 Markdown 格式（便于 AI 阅读）

**特点**:
- 不依赖 AI，纯本地执行
- 速度快（< 1 秒）
- 可单独运行调试

### AI 分析部分

**输入**: `.tmp/code-analysis-input.md`

**AI 任务**:
1. 阅读代码结构分析文档
2. 理解项目架构和关键设计
3. 识别设计模式、架构决策、最佳实践
4. 发现潜在风险和改进点
5. 生成结构化的知识文档

**输出**: `docs/auto/knowledge-{date}.md`

## 示例输出

### 输入（收集脚本生成）

```markdown
# 代码分析报告

**项目**: order-service
**分析文件**: 13 个
**代码行数**: 883

## 文件列表

### Order
- 文件: `domain/order/Order.java`
- 行数: 118
- 方法: pay, cancel, ship, receive

<details>
<summary>代码结构</summary>

```java
public class Order {
    private OrderStatus status;
    public void pay(Money payAmount) { ... }
    public void cancel(String reason) { ... }
}
```
</details>

### Money
- 文件: `domain/common/Money.java`
- 行数: 61
...
```

### 输出（AI 生成）

```markdown
# 代码知识提取报告

## 🎨 设计模式

### 1. 领域模型与数据模型分离
**应用场景**: 订单管理系统的领域层设计
**实现**: Order (领域) vs OrderEntity (数据)
**价值**: 领域层纯净，不依赖 JPA，易于测试

### 2. 值对象模式
**应用场景**: 金额计算
**实现**: Money 类封装 BigDecimal
**特点**: 不可变性、工厂方法、值相等
...

## 🤔 架构决策

### 1. 分层架构
**决策**: Controller → Service → Repository
**理由**: 职责清晰，与 Spring 生态集成
...

## ⚠️ 潜在风险

### 1. 并发超卖 🔴
**场景**: 库存扣减
**风险**: 高并发下可能超卖
**建议**: 使用乐观锁或分布式锁
...
```

## 优势

### 1. 零配置
```bash
# 不需要这些：
❌ export OPENAI_API_KEY="sk-xxx"
❌ export AI_MODEL="gpt-4"
❌ 配置 AI 服务端点

# 只需要：
✅ node scripts/collect-code-for-analysis.js
✅ 然后 AI 自动分析
```

### 2. 零成本
- 不调用外部付费 API
- 利用当前 AI 会话的计算能力
- 无额度限制

### 3. 高准确度
- AI 可以直接读取完整代码文件（不只是结构）
- 基于上下文理解项目整体架构
- 可以追问和澄清

### 4. 实时反馈
- 分析完成后立即显示结果
- 可以立即追问不理解的部分
- 实时调整生成内容

## 适用场景

| 场景 | 效果 |
|------|------|
| **新 Feature 完成** | 自动总结设计决策和架构变化 |
| **代码重构后** | 记录重构前后的改进点 |
| **技术方案变更** | 追踪架构演进的脉络 |
| **新人入职** | 快速生成项目知识概览 |
| **代码审查前** | 自动生成审查重点和风险提示 |

## 与其他方案对比

### vs 代码注释提取

| 维度 | 代码注释 | 当前方案 |
|------|---------|---------|
| 开发者负担 | 高（需要写注释） | 无 |
| 维护成本 | 高（注释易过时） | 低 |
| 覆盖率 | 低（依赖开发者习惯） | 高（分析所有代码） |
| 洞察力 | 低（只有显式记录） | 高（AI 发现隐含模式） |

### vs 外部 AI API

| 维度 | 外部 API | 当前方案 |
|------|---------|---------|
| 配置复杂度 | 高（API Key、模型选择） | 无 |
| 成本 | 按量付费 | 无 |
| 延迟 | 网络调用延迟 | 本地执行 + AI 分析 |
| 隐私 | 代码需上传外部 | 代码不离开本地 |

## 扩展建议

### 1. 增量分析
只分析变更的文件，而不是整个项目：

```javascript
// 在收集脚本中添加
const changedFiles = execSync('git diff HEAD~1 --name-only')
  .toString()
  .split('\n')
  .filter(f => f.endsWith('.java'));
```

### 2. 多维度报告
生成不同侧重点的报告：
- `knowledge-architecture.md` - 架构视角
- `knowledge-security.md` - 安全视角
- `knowledge-performance.md` - 性能视角

### 3. 知识库演进
将生成的知识自动合并到主知识库：

```bash
# 在确认有价值后
cat docs/auto/knowledge-2026-04-08.md >> docs/knowledge.md
```

## 故障排除

### 问题 1: 没有找到代码文件
**检查**:
```bash
# 确认 src 目录存在
ls -la src/main/java

# 手动运行收集脚本看输出
node scripts/collect-code-for-analysis.js
```

### 问题 2: 生成的知识文档为空或质量低
**原因**: 代码量太少或太简单  
**解决**: 
- 确保有完整的项目结构
- AI 可以读取更多原始代码文件补充分析

### 问题 3: 分析耗时太长
**原因**: 项目代码量过大  
**解决**:
- 调整 `maxFiles` 参数限制分析文件数
- 只分析变更的文件（增量分析）

## 总结

### 核心优势

| 优势 | 说明 |
|------|------|
| **零配置** | 无需 API Key，无需外部服务 |
| **零成本** | 不调用付费 API |
| **高智能** | AI 深度理解代码，发现隐含模式 |
| **自动化** | commit 后自动触发，无需人工干预 |
| **可追溯** | 每个知识点关联具体代码文件 |

### 一句话概括

> **脚本收集数据，AI 理解代码，自动生成知识文档**

---

**文档版本**: 1.0  
**方案设计**: 2026-04-08  
**适用框架**: tinypowers tech workflow
