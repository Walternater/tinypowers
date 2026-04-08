# Brainstorming 知识提取集成指南

> 将 AI 代码分析集成到 tech:commit 流程中

## 快速启动

### 1. 复制脚本到项目
```bash
# 从 tinypowers 复制脚本
mkdir -p scripts
cp /Users/wcf/personal/tinypowers/scripts/extract-knowledge-brainstorm.js scripts/
chmod +x scripts/extract-knowledge-brainstorm.js

# 创建知识库目录
mkdir -p docs/auto
```

### 2. 创建主知识库文件
```bash
cat > docs/knowledge.md << 'EOF'
# 项目知识库

> 本文件包含经过验证的高价值知识
> 
> 自动提取的原始知识请查看 `docs/auto/` 目录

## 核心设计模式

## 架构决策记录

## 已知问题与解决方案

## 最佳实践

## 自动提取
<!-- 知识提取脚本会自动在此添加链接 -->

EOF
```

### 3. 配置 AI（三选一）

#### 方式 A: 使用环境变量配置 AI CLI
```bash
# 如果你有自定义 AI CLI 工具
export AI_CLI_CMD="/path/to/your/ai-cli"
```

#### 方式 B: 使用 OpenAI API
```bash
export OPENAI_API_KEY="sk-xxx"
export AI_MODEL="gpt-4"
```

#### 方式 C: 使用 Kimi / Claude 本地服务
修改脚本中的 `callAI` 函数，接入你正在使用的 AI 服务。

### 4. 测试运行
```bash
# 在项目根目录运行
node scripts/extract-knowledge-brainstorm.js
```

预期输出：
```
🧠 启动代码知识提取...
ℹ️ 分析代码变更...
ℹ️ 找到 13 个代码文件
🧠 调用 AI 分析代码...
✅ 知识已保存到: docs/auto/knowledge-2026-04-08-xxx.md

========== 知识提取摘要 ==========
✅ 设计模式: 2 个
✅ 架构决策: 1 个
✅ 最佳实践: 3 个
⚠️ 潜在风险: 1 个

总计: 7 个知识点

请检查生成的知识文件，确认有价值的知识后，
可以手动合并到 docs/knowledge.md 主知识库
```

---

## 集成到 /tech:commit

### 修改后的提交流程

```
┌─────────────────────────────────────────────┐
│  /tech:commit                               │
│                                             │
│  1. Document Sync                           │
│     └── 同步技术方案、测试报告等              │
│                                             │
│  2. Git Commit                              │
│     └── git commit -m "[AI-Gen] ..."        │
│                                             │
│  3. Knowledge Extraction ⭐ 新增             │
│     └── 分析代码变更                        │
│     └── AI 提取设计模式、架构决策            │
│     └── 生成知识报告                        │
│                                             │
│  4. Push / PR                               │
│     └── git push / 创建 PR                  │
│                                             │
│  5. SPEC-STATE → DONE                       │
│     └── 推进状态                            │
└─────────────────────────────────────────────┘
```

### 手动集成步骤

#### 步骤 1: 在 Document Sync 后执行知识提取
```bash
#!/bin/bash
# tech-commit-wrapper.sh

echo "📝 Step 1: Document Sync"
# ... 现有文档同步逻辑 ...

echo ""
echo "🧠 Step 2: Knowledge Extraction"
node scripts/extract-knowledge-brainstorm.js

# 检查生成的知识文件
if ls docs/auto/knowledge-*.md 1> /dev/null 2>&1; then
    echo ""
    echo "💡 发现新知识！建议审核后合并到 docs/knowledge.md"
    ls -la docs/auto/knowledge-*.md | tail -5
fi

echo ""
echo "📦 Step 3: Git Commit"
# ... 现有提交逻辑 ...
```

#### 步骤 2: Git Hook 自动触发（可选）
```bash
#!/bin/bash
# .git/hooks/post-commit

# 在 commit 后自动提取知识
node scripts/extract-knowledge-brainstorm.js &
```

---

## 实际使用示例

### 场景 1: 新 Feature 提交后
```bash
# 开发完成，准备提交
$ /tech:commit

📝 Step 1: Document Sync
   ✓ 技术方案.md 已更新
   ✓ 测试报告.md 已更新

🧠 Step 2: Knowledge Extraction
   ℹ️ 分析代码变更...
   ℹ️ 找到 8 个代码文件
   🧠 调用 AI 分析代码...
   ✅ 知识已保存到: docs/auto/knowledge-2026-04-08-1.md

   ========== 知识提取摘要 ==========
   ✅ 设计模式: 2 个
      - 状态机模式（订单生命周期管理）
      - 值对象模式（Money 金额封装）
   
   ✅ 架构决策: 1 个
      - 使用乐观锁替代悲观锁（减少锁竞争）
   
   ✅ 最佳实践: 3 个
      - 防御性编程（参数校验）
      - 不可变对象（Money 类）
      - 领域模型封装业务规则
   
   ⚠️ 潜在风险: 1 个
      - 并发场景下可能超卖（建议使用分布式锁）

💡 发现新知识！建议审核后合并到 docs/knowledge.md

📦 Step 3: Git Commit
   [main abc1234] [AI-Gen] feat(order): implement order state machine

🚀 Step 4: Push / PR
   https://github.com/user/repo/pull/new/feature/order-state-machine

✅ 完成！
```

### 场景 2: 审核并沉淀知识
```bash
# 查看生成的知识
$ cat docs/auto/knowledge-2026-04-08-1.md

# 将有价值的内容合并到主知识库
$ cat >> docs/knowledge.md << 'EOF'

## 2026-04-08 新增

### 设计模式：状态机管理订单生命周期
使用 Spring Statemachine 管理订单状态流转，避免 if-else 散落各处。
- 文件：OrderStateMachine.java, OrderStatus.java
- 参考：docs/auto/knowledge-2026-04-08-1.md

### 架构决策：乐观锁替代悲观锁
在高并发库存扣减场景下，使用数据库乐观锁（version 字段）替代 SELECT FOR UPDATE。
- 优点：减少锁竞争，提高并发性能
- 风险：需要处理并发冲突重试

EOF
```

---

## 配置选项

### 环境变量
| 变量 | 默认值 | 说明 |
|------|--------|------|
| `EXTRACT_KNOWLEDGE` | `1` | 设为 `0` 跳过知识提取 |
| `AI_CLI_CMD` | - | 自定义 AI CLI 命令 |
| `OPENAI_API_KEY` | - | OpenAI API 密钥 |
| `AI_MODEL` | `gpt-4` | AI 模型名称 |
| `KNOWLEDGE_OUTPUT_DIR` | `docs/auto` | 知识输出目录 |
| `MAX_FILES_TO_ANALYZE` | `10` | 最多分析文件数 |
| `MAX_CODE_LENGTH` | `3000` | 单个文件最大字符数 |
| `FEATURE_NAME` | - | Feature 名称（用于报告） |

### 使用示例
```bash
# 跳过知识提取
EXTRACT_KNOWLEDGE=0 /tech:commit

# 使用 GPT-4 Turbo
OPENAI_API_KEY=sk-xxx AI_MODEL=gpt-4-turbo-preview node scripts/extract-knowledge-brainstorm.js

# 分析特定 Feature
FEATURE_NAME="F001-order-management" node scripts/extract-knowledge-brainstorm.js
```

---

## 文件结构

### 集成后的项目结构
```
project/
├── docs/
│   ├── knowledge.md              # 人工维护的主知识库
│   ├── auto/                     # 自动生成的知识（不手动编辑）
│   │   ├── knowledge-2026-04-08-1.md
│   │   ├── knowledge-2026-04-09-2.md
│   │   └── ...
│   └── ...
├── scripts/
│   └── extract-knowledge-brainstorm.js  # 知识提取脚本
├── src/
│   └── ...
└── .git/hooks/
    └── post-commit               # 可选：自动触发（可选）
```

### 知识库内容示例

#### docs/knowledge.md（人工维护）
```markdown
# 项目知识库

## 设计模式

### 状态机模式
**场景**: 订单状态管理  
**实现**: Spring Statemachine  
**价值**: 避免状态散落在 if-else 中  
**添加时间**: 2026-04-08

### 值对象模式
**场景**: 金额计算  
**实现**: Money 类封装 BigDecimal  
**价值**: 避免精度问题  
**添加时间**: 2026-04-08

## 架构决策

### 使用乐观锁替代悲观锁
**背景**: 库存扣减高并发场景  
**决策**: 使用数据库乐观锁（version 字段）  
**理由**: 减少锁竞争，提高吞吐量  
**权衡**: 需要处理冲突重试  
**决策时间**: 2026-04-08

## 自动提取
- [2026-04-08 订单状态机实现](auto/knowledge-2026-04-08-1.md)
- [2026-04-09 支付接口优化](auto/knowledge-2026-04-09-2.md)
```

#### docs/auto/knowledge-2026-04-08-1.md（自动生成）
```markdown
# 代码知识提取报告

**生成时间**: 2026/4/8 15:30:25  
**相关 Feature**: F001-order-management

## 🎨 设计模式 (2)

### 1. 状态机模式
- **描述**: 使用状态机管理订单生命周期，避免状态散落在if-else中
- **证据**: OrderStatus, OrderStateMachine
- **价值**: 状态流转清晰，易于扩展新状态

### 2. 值对象模式
- **描述**: 使用 Money 类封装金额计算
- **证据**: Money.java
- **价值**: 避免 BigDecimal 精度问题

## 🤔 架构决策 (1)

### 1. 乐观锁替代悲观锁
- **决策**: 使用数据库乐观锁（version 字段）
- **理由**: 减少锁竞争，提高并发性能
- **权衡**: 需要处理冲突重试

## ⚠️ 潜在风险 (1)

### 1. 并发超卖风险
- **场景**: 并发扣减库存
- **风险**: 可能出现超卖
- **当前方案**: 数据库乐观锁
- **建议**: 考虑引入分布式锁作为补充

---

*本报告由 AI 自动生成，请人工审核后确认沉淀到主知识库*
```

---

## 最佳实践

### DO（推荐）
- ✅ 每次提交后检查生成的知识文件
- ✅ 将有价值的内容手动合并到主知识库
- ✅ 为主知识库添加个人经验和验证信息
- ✅ 定期清理 `docs/auto/` 中的旧文件

### DON'T（避免）
- ❌ 直接将自动生成的内容当作最终知识
- ❌ 不审核就让 AI 提取的内容进主库
- ❌ 在 `docs/auto/` 中手动编辑文件（会被覆盖）

---

## 故障排除

### 问题 1: 没有检测到代码文件
**原因**: 不在 git 仓库中，或者 src 目录结构不同  
**解决**: 
```bash
# 检查是否在 git 仓库
git status

# 手动指定源代码目录
export SOURCE_DIR="src/main/java"
node scripts/extract-knowledge-brainstorm.js
```

### 问题 2: AI 调用失败
**原因**: 未配置 AI 或网络问题  
**解决**:
```bash
# 检查环境变量
echo $OPENAI_API_KEY

# 或使用模拟模式测试脚本逻辑
# 脚本会自动回退到模拟输出
```

### 问题 3: 生成的知识质量低
**原因**: 代码样本不足或 AI 模型不合适  
**解决**:
```bash
# 增加分析文件数
export MAX_FILES_TO_ANALYZE=20

# 使用更强的模型
export AI_MODEL="gpt-4-turbo"

# 调整提示词（修改脚本中的 PROMPT_TEMPLATE）
```

---

## 进阶配置

### 自定义分析维度
编辑脚本中的 `generateBrainstormingPrompt` 函数，添加你关心的维度：

```javascript
// 添加安全分析维度
const securityPrompt = `
### 5. 安全分析 (security)
识别代码中的安全问题：
- SQL 注入风险
- XSS 漏洞
- 敏感信息泄露
- 权限控制缺陷
`;
```

### 集成到 CI/CD
```yaml
# .github/workflows/knowledge-extraction.yml
name: Knowledge Extraction
on:
  push:
    branches: [main, develop]

jobs:
  extract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 2  # 需要历史记录做 diff
      
      - name: Extract Knowledge
        run: node scripts/extract-knowledge-brainstorm.js
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Upload Knowledge
        uses: actions/upload-artifact@v3
        with:
          name: knowledge-${{ github.sha }}
          path: docs/auto/knowledge-*.md
```

---

## 总结

### 核心优势
1. **零侵入**: 不需要修改代码，不需要写注释
2. **自动化**: commit 后自动触发，无需人工干预
3. **智能化**: AI 分析代码结构，识别人可能忽略的模式
4. **可追溯**: 每个知识点都关联到具体的代码文件

### 适用场景
- ✅ 新 Feature 开发完成，总结设计决策
- ✅ 代码重构后，记录架构变化
- ✅ 故障修复后，提取故障处理经验
- ✅ 定期代码审查，发现潜在改进点

---

**文档版本**: 1.0  
**最后更新**: 2026-04-08
