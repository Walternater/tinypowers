# 知识自动提取方案

> 解决知识沉淀失效问题，让项目知识库真正"活"起来

## 1. 问题现状

```
当前问题链：
开发时遇到坑 → 心想"下次注意" → 没有记录 → 下次再踩 → 项目知识库仍然空白

理想状态：
开发时遇到坑 → AI/工具自动识别 → 沉淀到知识库 → 下次自动提醒 → 知识持续积累
```

---

## 2. 四层知识提取方案

### Layer 1: 代码注释提取（最轻量）

#### 标记规范
```java
/**
 * @pattern 分布式ID生成 - 使用雪花算法，避免数据库自增ID在分布式环境下的冲突
 * @pitfall 注意时钟回拨问题，建议配置 NTP 同步
 * @see https://example.com/snowflake-guide
 */
@Component
public class OrderIdGenerator {
    // ...
}

/**
 * @decision 不使用 @Transactional 包裹整个方法，避免大事务
 * @reason 减少锁持有时间，提升并发性能
 * @tradeoff 需要手动处理部分异常回滚
 */
public void createOrder() {
    // ...
}

// @hack 临时方案：等待库存服务提供批量接口后移除
private void callInventoryOneByOne() {
    // ...
}
```

#### 提取规则
| 标记 | 提取位置 | 沉淀内容 |
|------|---------|---------|
| `@pattern` | docs/knowledge.md > 设计模式 | 模式名称 + 描述 + 代码位置 |
| `@pitfall` | docs/knowledge.md > 已知问题 | 问题描述 + 解决方案 + 影响范围 |
| `@decision` | docs/knowledge.md > 关键决策 | 决策 + 理由 + 权衡 |
| `@hack` | docs/knowledge.md > 技术债务 | 临时方案 + 预期移除时间 |
| `@performance` | docs/knowledge.md > 性能优化 | 优化手段 + 效果数据 |

#### 实现脚本
```javascript
// scripts/extract-knowledge.js
const fs = require('fs');
const glob = require('glob');

const TAGS = {
  '@pattern': { section: '## 设计模式', format: extractPattern },
  '@pitfall': { section: '## 已知问题', format: extractPitfall },
  '@decision': { section: '## 关键决策', format: extractDecision },
  '@hack': { section: '## 技术债务', format: extractHack },
  '@performance': { section: '## 性能优化', format: extractPerformance }
};

function extractFromCode(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const comments = content.match(/\/\*\*[\s\S]*?\*\//g) || [];
  
  return comments.flatMap(comment => {
    return Object.entries(TAGS).map(([tag, config]) => {
      if (comment.includes(tag)) {
        return config.format(comment, filePath);
      }
      return null;
    }).filter(Boolean);
  });
}

// 定时或 commit 时触发
const files = glob.sync('src/**/*.java');
const knowledge = files.flatMap(extractFromCode);
updateKnowledgeMd(knowledge);
```

---

### Layer 2: 代码审查沉淀（中等重量）

#### 方案 A: PR Review 分析
```yaml
# .github/workflows/knowledge-extraction.yml
name: Extract Knowledge from PR
on:
  pull_request:
    types: [closed]
    
jobs:
  extract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Analyze PR Comments
        run: |
          # 提取 review comment 中的知识
          gh api /repos/${{ github.repo }}/pulls/${{ github.event.pull_request.number }}/comments \
            | jq '.[] | select(.body | contains("@knowledge"))' \
            > review-knowledge.json
          
      - name: Update Knowledge Base
        run: node scripts/merge-review-knowledge.js
```

#### Review Comment 标记
```
Reviewer: 这里应该用乐观锁而不是悲观锁，减少锁竞争
          @knowledge 并发控制 - 优先使用乐观锁（version 字段），适合读多写少场景

Reviewer: 注意 N+1 查询问题
          @knowledge 性能陷阱 - 避免在循环中查询数据库，使用 JOIN 或批量查询
```

#### 方案 B: 本地 commit 时提取
```javascript
// .claude/hooks/pre-commit-knowledge.js
const { execSync } = require('child_process');

// 获取最近一次 commit 的 message 和 diff
const diff = execSync('git diff HEAD~1 --name-only').toString();
const messages = execSync('git log -1 --pretty=%B').toString();

// 提取 @learn 标记
const learns = messages.match(/@learn[\s\S]*?(?=\n\n|\n@|$)/g) || [];

// 写入 learnings.md
if (learns.length > 0) {
  appendToLearnings(learns, diff);
}
```

---

### Layer 3: 运行时异常分析（动态提取）

#### 异常模式识别
```java
// 自定义注解
@ExceptionPattern(
    name = "分布式锁超时",
    description = "获取分布式锁等待超时，可能是锁粒度太大或并发过高",
    solution = "1. 缩小锁粒度 2. 增加锁超时时间 3. 使用分段锁",
    severity = Severity.MEDIUM
)
public class LockTimeoutException extends RuntimeException {
    // ...
}
```

#### 日志分析脚本
```python
# scripts/analyze-logs.py
import re
from collections import Counter

def extract_exceptions(log_file):
    pattern = r'(\w+Exception):\s*(.+?)(?=\n\w|\Z)'
    
    with open(log_file) as f:
        content = f.read()
    
    exceptions = re.findall(pattern, content, re.DOTALL)
    
    # 统计高频异常
    counter = Counter([e[0] for e in exceptions])
    
    # 生成知识条目
    knowledge = []
    for exc_type, count in counter.most_common(5):
        if count > 10:  # 阈值
            knowledge.append({
                'type': 'runtime_issue',
                'exception': exc_type,
                'frequency': count,
                'context': extract_context(exceptions, exc_type)
            })
    
    return knowledge
```

---

### Layer 4: AI 主动识别（最智能）

#### Commit 时 AI 分析
```javascript
// scripts/ai-knowledge-extract.js
const { callAI } = require('./lib/ai');

async function analyzeDiff(diff) {
  const prompt = `
分析以下代码变更，提取值得沉淀的知识：
1. 使用了什么设计模式？
2. 解决了什么常见问题？
3. 有什么潜在的坑需要注意？
4. 性能方面有什么考虑？

代码变更：
${diff}

请以 JSON 格式返回：
{
  "patterns": [{"name": "", "description": ""}],
  "pitfalls": [{"scenario": "", "solution": ""}],
  "decisions": [{"choice": "", "reason": ""}]
}
`;
  
  const result = await callAI(prompt);
  return JSON.parse(result);
}

// Git hook 触发
const diff = getStagedDiff();
const knowledge = await analyzeDiff(diff);
if (knowledge.patterns.length > 0) {
  suggestUpdateKnowledge(knowledge);
}
```

#### AI 定期代码扫描
```yaml
# 每周扫描一次，识别代码中的模式和最佳实践
schedule:
  - cron: "0 0 * * 0"  # 每周日

jobs:
  scan-codebase:
    steps:
      - name: Scan for patterns
        run: |
          node scripts/ai-scan-patterns.js \
            --src ./src \
            --output ./docs/auto-knowledge.md
```

---

## 3. 知识库组织方案

### 推荐结构
```
docs/
├── knowledge.md              # 人工维护的核心知识（高价值）
├── auto/
│   ├── patterns.md          # 自动提取的设计模式
│   ├── pitfalls.md          # 自动提取的踩坑记录
│   ├── decisions.md         # 自动提取的关键决策
│   └── tech-debt.md         # 自动提取的技术债务
└── stats/
    └── knowledge-metrics.md  # 知识库统计
```

### knowledge.md 示例
```markdown
# 项目知识库

> 本文件包含经过人工验证的高价值知识
> 自动生成内容请查看 auto/ 目录

## 核心设计模式

### 1. 领域模型封装金额计算
**场景**: 订单金额计算
**方案**: 使用 Money 值对象，内部用 BigDecimal 存储，避免浮点精度问题
**代码位置**: `domain/common/Money.java`
**验证状态**: ✅ 已在生产环境运行 6 个月
**添加时间**: 2026-04-08

## 已知问题

### 1. 订单ID生成在高并发下可能重复
**症状**: 压力测试时发现订单ID冲突
**原因**: 雪花算法未配置 workerId
**解决方案**: 启动时从配置中心获取 workerId
**状态**: ✅ 已修复
**参考**: #PR-123

## 关键决策

### 1. 不使用分布式事务
**决策**: 订单创建和库存扣减采用最终一致性，而非 Seata AT
**理由**: 
- 减少框架依赖
- 性能更好
- 通过补偿机制保证一致性
**权衡**: 需要实现补偿逻辑，复杂度增加
**决策时间**: 2026-04-08
**决策者**: 架构组

---

*自动生成内容：*
- [设计模式完整列表](./auto/patterns.md)
- [踩坑记录](./auto/pitfalls.md)
- [技术债务清单](./auto/tech-debt.md)
```

---

## 4. 触发机制设计

### 触发时机
| 时机 | 触发方式 | 提取层次 | 配置 |
|------|---------|---------|------|
| Commit | Git hook | Layer 1 + 2 | 必选 |
| PR Merge | GitHub Action | Layer 2 | 可选 |
| 每日构建 | CI Pipeline | Layer 3 | 可选 |
| 每周扫描 | Cron Job | Layer 4 | 可选 |
| 手动触发 | CLI 命令 | All | 调试 |

### Git Hook 集成
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 提取代码知识..."

# 提取 @pattern/@pitfall 注释
node scripts/extract-code-tags.js

# 分析 commit message 中的 @learn
node scripts/extract-commit-knowledge.js

# 建议添加到知识库
if [ -f .knowledge-suggestions.md ]; then
    echo "💡 发现可沉淀的知识："
    cat .knowledge-suggestions.md
    echo ""
    echo "是否添加到知识库？ (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        node scripts/apply-knowledge-suggestions.js
    fi
fi
```

---

## 5. 知识质量保障

### 去重机制
```javascript
function deduplicateKnowledge(newItems, existingItems) {
  return newItems.filter(newItem => {
    // 语义相似度检查
    const similar = existingItems.some(existing => {
      const similarity = calculateSimilarity(
        newItem.description, 
        existing.description
      );
      return similarity > 0.85; // 阈值
    });
    return !similar;
  });
}
```

### 人工审核流程
```
自动提取 → 临时文件 → 人工审核 → 确认沉淀 → 写入知识库
    ↑___________________________________________|
               (放弃/修改后重新提交)
```

### 知识价值评估
```yaml
# 知识条目元数据
- content: "使用雪花算法生成订单ID"
  source: "code-comment"
  author: "ai-extract"
  created: "2026-04-08"
  validated: false          # 是否人工验证
  references: 3             # 被引用次数
  last_accessed: "2026-04-15"  # 最后访问时间
  
# 定期清理低价值知识
cleanup_policy:
  - condition: "validated == false && created < 30 days ago"
    action: "prompt_review"
  - condition: "references == 0 && last_accessed < 90 days ago"
    action: "archive"
```

---

## 6. 实施路线图

### Phase 1: 基础提取（1周）
- [ ] 实现代码注释提取脚本（@pattern/@pitfall/@decision）
- [ ] 配置 pre-commit hook
- [ ] 创建知识库目录结构

### Phase 2: 智能提取（2周）
- [ ] 集成 AI 分析代码 diff
- [ ] 实现异常日志分析
- [ ] 添加去重和相似度检查

### Phase 3: 生态集成（1周）
- [ ] GitHub Action 自动提取
- [ ] IDE 插件（查看知识提示）
- [ ] 知识库搜索功能

### Phase 4: 持续优化（长期）
- [ ] 知识价值分析
- [ ] 自动推荐相关知识
- [ ] 知识库健康度报告

---

## 7. 预期效果

| 指标 | 当前 | 目标 | 测量方式 |
|------|------|------|---------|
| 知识条目数 | < 10 | > 100/项目 | 统计 knowledge.md + auto/ |
| 知识更新频率 | 几乎不更新 | 每周 3-5 条 | 查看 git log |
| 重复踩坑次数 | 高频 | 降低 70% | 开发者反馈 |
| 新人上手时间 | 2 周 | 3 天 | 新成员调研 |
| 知识库访问量 | 几乎不访问 | 每周 10+ 次 | 埋点统计 |

---

## 附录：快速启动脚本

```bash
#!/bin/bash
# setup-knowledge-extraction.sh

echo "🚀 设置知识自动提取..."

# 1. 创建目录
mkdir -p docs/auto docs/stats

# 2. 创建脚本
mkdir -p scripts

cat > scripts/extract-knowledge.js << 'SCRIPT'
// [脚本内容见上文]
SCRIPT

# 3. 配置 git hook
cat > .git/hooks/pre-commit << 'HOOK'
#!/bin/bash
node scripts/extract-knowledge.js
HOOK
chmod +x .git/hooks/pre-commit

# 4. 创建知识库模板
if [ ! -f docs/knowledge.md ]; then
  cat > docs/knowledge.md << 'TEMPLATE'
# 项目知识库

> 自动生成内容请查看 auto/ 目录

## 核心设计模式

## 已知问题

## 关键决策
TEMPLATE
fi

echo "✅ 设置完成！"
echo ""
echo "使用方法："
echo "  1. 在代码中添加 @pattern/@pitfall/@decision 注释"
echo "  2. git commit 时自动提取"
echo "  3. 查看 docs/knowledge.md 和 docs/auto/"
```

---

*方案设计时间: 2026-04-08*
*适用框架: tinypowers tech workflow*
