# 代码驱动的知识自动提取方案

> 不依赖注释，通过代码结构、变更模式、AI 分析自动提取知识

## 核心原则

```
❌ 不要这样：
   开发者写注释 → 容易忘、容易过时、负担重

✅ 应该这样：
   代码本身就表达了知识 → AI/工具分析提取 → 自动沉淀
```

---

## 方案一：Brainstorming 代码分析（推荐）

### 触发时机
```
Feature 完成 / 代码提交前 → 调用 Brainstorming Skill → 分析代码 → 提取知识
```

### 实现方式

#### 1. 创建 Code Knowledge Brainstorming Skill
```markdown
---
name: code-knowledge-extractor
description: 分析代码库，提取设计模式、架构决策和最佳实践
trigger: post-feature-completion
---

# 代码知识提取器

## 输入
- 当前 feature 的所有代码文件
- Git diff（变更内容）
- 相关测试文件

## 分析维度

### 维度 1: 设计模式识别
分析代码结构，识别使用的模式：
- 创建型：工厂、建造者、单例
- 结构型：适配器、装饰器、代理
- 行为型：策略、模板方法、状态机

### 维度 2: 架构决策推断
从代码反推架构决策：
- 分层方式（Controller-Service-Repository?）
- 事务边界（@Transactional 位置）
- 异常处理策略
- 依赖方向（领域层是否依赖基础设施？）

### 维度 3: 最佳实践识别
识别代码中的良好实践：
- 防御性编程（null 检查、参数校验）
- 不可变对象使用
- 并发处理（锁、线程安全）
- 性能优化（缓存、批量操作）

### 维度 4: 潜在问题标记
识别需要关注的地方：
- 重复代码
- 过长的方法/类
- 紧耦合
- 测试覆盖不足

## 输出格式
```yaml
patterns:
  - name: "订单状态模式"
    type: "State Pattern"
    files: ["OrderState.java", "OrderStateMachine.java"]
    description: "使用状态机管理订单生命周期"
    value: "避免状态散落在各处，集中管理状态转换"
    
decisions:
  - topic: "金额计算"
    choice: "使用 Money 值对象封装 BigDecimal"
    context: "订单、支付、退款都涉及金额计算"
    consequence: "避免精度问题，统一计算逻辑"
    
practices:
  - name: "防御性编程"
    example: "OrderService.createOrder 中进行参数校验"
    benefit: "在边界处捕获错误，防止脏数据"
    
pitfalls:
  - scenario: "库存扣减"
    risk: "并发场景下可能超卖"
    current_solution: "数据库乐观锁"
    recommendation: "考虑分布式锁作为补充"
```
```

#### 2. 集成到 tech:commit 流程
```javascript
// scripts/extract-knowledge-brainstorming.js
const { execSync } = require('child_process');
const fs = require('fs');

function getFeatureCode(featureDir) {
  // 获取 feature 相关的所有代码
  const diff = execSync('git diff HEAD~5 --name-only -- "*.java"').toString();
  return diff.trim().split('\n').filter(f => f.startsWith('src/'));
}

function generateBrainstormingPrompt(files) {
  const codeSamples = files.slice(0, 10).map(file => {
    return `\n// ${file}\n${fs.readFileSync(file, 'utf8').slice(0, 2000)}`;
  }).join('\n\n');

  return `
你是一位经验丰富的架构师，请分析以下代码，提取值得沉淀的知识。

## 分析要求

1. **设计模式识别**：代码使用了什么设计模式？解决了什么问题？
2. **架构决策推断**：从代码结构能看出什么架构决策？
3. **最佳实践**：代码中有哪些值得推广的写法？
4. **潜在风险**：有什么需要注意的问题？

## 代码内容
${codeSamples}

## 输出格式（YAML）
\`\`\`yaml
patterns:
  - name: ""
    description: ""
    files: []
    
decisions:
  - topic: ""
    choice: ""
    reason: ""
    
practices:
  - name: ""
    description: ""
    example: ""
    
pitfalls:
  - scenario: ""
    risk: ""
    solution: ""
\`\`\`
`;
}

// 调用 AI 分析
async function analyzeWithAI(prompt) {
  // 使用现有的 AI 接口
  const result = await callAI(prompt);
  return parseYAML(result);
}

// 主流程
async function main() {
  const files = getFeatureCode();
  const prompt = generateBrainstormingPrompt(files);
  const knowledge = await analyzeWithAI(prompt);
  
  // 写入知识库
  await appendToKnowledgeBase(knowledge);
  
  // 生成摘要报告
  console.log('💡 发现的知识：');
  knowledge.patterns.forEach(p => console.log(`  - 模式: ${p.name}`));
  knowledge.decisions.forEach(d => console.log(`  - 决策: ${d.topic}`));
}
```

---

## 方案二：Commit Diff 模式分析

### 核心思想
通过分析代码变更的**模式**，识别开发者的设计意图

```javascript
// scripts/analyze-commit-patterns.js
const { execSync } = require('child_process');

function analyzeCommitPatterns() {
  // 获取最近 N 个 commit 的 diff
  const commits = getRecentCommits(10);
  
  const patterns = {
    // 模式 1: 新增异常类 → 识别错误处理策略
    exceptionHandling: analyzeExceptionChanges(commits),
    
    // 模式 2: 新增接口/抽象类 → 识别扩展点设计
    extensionPoints: analyzeAbstractions(commits),
    
    // 模式 3: 批量修改调用点 → 识别重构模式
    refactorings: analyzeRefactoringPatterns(commits),
    
    // 模式 4: 测试文件变化 → 识别测试策略
    testingStrategy: analyzeTestChanges(commits)
  };
  
  return patterns;
}

function analyzeExceptionChanges(commits) {
  const exceptions = commits.flatMap(commit => {
    return commit.files
      .filter(f => f.endsWith('Exception.java'))
      .map(f => ({
        name: extractClassName(f),
        purpose: inferExceptionPurpose(f, commit.diff),
        handledIn: findHandlers(f, commits)
      }));
  });
  
  return {
    type: 'exception_strategy',
    knowledge: {
      title: '异常处理策略',
      content: `项目使用 ${exceptions.length} 个自定义异常，主要处理领域错误`,
      exceptions: exceptions.map(e => e.name)
    }
  };
}

function analyzeAbstractions(commits) {
  // 识别新增的接口、抽象类
  // 推断扩展点设计
}

function analyzeRefactoringPatterns(commits) {
  // 识别提取方法、移动方法、重命名等模式
  // 提炼重构最佳实践
}
```

---

## 方案三：代码结构静态分析

### 使用 AST 分析代码结构
```javascript
// scripts/static-code-analysis.js
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function analyzeJavaCode(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  
  // 使用 Java parser（如 java-parser）
  const ast = parseJava(code);
  
  const findings = {
    // 分析 1: 类职责
    classResponsibilities: analyzeClassResponsibility(ast),
    
    // 分析 2: 依赖关系
    dependencies: analyzeDependencies(ast),
    
    // 分析 3: 复杂度
    complexity: calculateComplexity(ast),
    
    // 分析 4: 设计模式迹象
    patternSigns: detectPatternSignatures(ast)
  };
  
  return findings;
}

function detectPatternSignatures(ast) {
  const patterns = [];
  
  // 策略模式特征：接口/抽象类 + 多个实现 + Context 使用
  const hasStrategyPattern = checkStrategyPattern(ast);
  if (hasStrategyPattern) {
    patterns.push({
      name: 'Strategy Pattern',
      evidence: hasStrategyPattern.evidence,
      files: hasStrategyPattern.files
    });
  }
  
  // 工厂模式特征：静态创建方法 + 返回接口类型
  const hasFactoryPattern = checkFactoryPattern(ast);
  if (hasFactoryPattern) {
    patterns.push({
      name: 'Factory Pattern',
      evidence: hasFactoryPattern.evidence
    });
  }
  
  // 建造者模式特征：链式调用 + build() 方法
  const hasBuilderPattern = checkBuilderPattern(ast);
  if (hasBuilderPattern) {
    patterns.push({
      name: 'Builder Pattern',
      evidence: hasBuilderPattern.evidence
    });
  }
  
  return patterns;
}
```

---

## 方案四：测试反向推导

### 从测试代码提取使用模式
```javascript
// scripts/extract-from-tests.js

function analyzeTests(testFiles) {
  const knowledge = {
    // 1. 识别边界情况
    edgeCases: extractEdgeCases(testFiles),
    
    // 2. 识别常见错误
    commonErrors: extractErrorScenarios(testFiles),
    
    // 3. 识别使用模式
    usagePatterns: extractUsagePatterns(testFiles)
  };
  
  return knowledge;
}

function extractEdgeCases(testFiles) {
  // 分析测试用例中的边界值
  // 如：quantity = 0, quantity = MAX, null, empty
  
  return {
    title: '边界情况处理',
    items: [
      {
        scenario: '订单商品数量为 0',
        testFile: 'OrderServiceTest.java',
        testMethod: 'shouldRejectEmptyOrder',
        handling: '抛出 IllegalArgumentException'
      }
    ]
  };
}

function extractErrorScenarios(testFiles) {
  // 从测试的 @Test(expected = XxxException.class) 提取
  // 识别系统如何处理各种错误
}
```

---

## 方案五：Debug/故障复盘提取

### 结合 systematic-debugging skill
```markdown
当使用 /gsd-debug 或排查问题时：

1. 记录问题现象
2. 记录排查过程  
3. 记录根因
4. 记录解决方案
5. **自动提取为知识条目**
```

```javascript
// scripts/extract-from-debug.js

function extractFromDebugSession(debugLog) {
  const knowledge = {
    problem: extractProblem(debugLog),
    symptoms: extractSymptoms(debugLog),
    rootCause: extractRootCause(debugLog),
    solution: extractSolution(debugLog),
    prevention: generatePreventionAdvice(debugLog)
  };
  
  return {
    title: knowledge.problem,
    category: 'troubleshooting',
    content: `
## 问题
${knowledge.problem}

## 现象
${knowledge.symptoms}

## 根因
${knowledge.rootCause}

## 解决
${knowledge.solution}

## 预防
${knowledge.prevention}
    `.trim()
  };
}
```

---

## 方案六：PR Review 智能分析

### 自动分析 Review 评论
```javascript
// scripts/analyze-pr-reviews.js

async function analyzePRReviews(prNumber) {
  const reviews = await fetchPRReviews(prNumber);
  
  const knowledge = {
    // 1. 提取 reviewer 建议
    suggestions: reviews
      .filter(r => r.type === 'suggestion')
      .map(r => ({
        topic: r.file,
        advice: r.body,
        reason: extractReason(r.body)
      })),
    
    // 2. 提取常见批评
    commonIssues: aggregateIssues(reviews),
    
    // 3. 提取设计讨论
    designDecisions: extractDesignDiscussions(reviews)
  };
  
  return knowledge;
}

function extractDesignDiscussions(reviews) {
  // 识别评论中的设计讨论
  // 如："为什么不用 XXX 模式？"、"这里可以优化为..."
  
  return reviews
    .filter(r => /为什么不|建议|可以考虑|更好的方式/i.test(r.body))
    .map(r => ({
      context: r.file,
      discussion: r.body,
      decision: extractDecision(r.body),
      participants: [r.author]
    }));
}
```

---

## 推荐实施组合

### 最小可行方案（MVP）
```
┌─────────────────────────────────────────┐
│  Step 1: Commit Diff + AI Brainstorming │
│  - 实现成本：低                          │
│  - 效果：中                               │
│  - 触发：每次 commit                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Step 2: Feature 完成总结               │
│  - 实现成本：低                          │
│  - 效果：高                               │
│  - 触发：/tech:commit 时                 │
└─────────────────────────────────────────┘
```

### 完整方案
```
Layer 1: Commit Diff Analysis（实时）
    ↓
Layer 2: Brainstorming Code Review（Feature 完成）
    ↓
Layer 3: Static Analysis（定期扫描）
    ↓
Layer 4: Debug Session Extraction（故障后）
    ↓
Layer 5: PR Review Analysis（Merge 后）
```

---

## 快速启动：Brainstorming 集成示例

### 1. 创建知识提取脚本
```javascript
// scripts/knowledge-brainstorm.js
const { execSync } = require('child_diff');
const fs = require('fs');

const PROMPT_TEMPLATE = `
作为架构师，请分析以下代码变更，提取知识：

【变更文件】
{{files}}

【代码样本】
{{code}}

请识别：
1. 使用了什么设计模式？为什么适合？
2. 做了什么架构决策？权衡是什么？
3. 有什么最佳实践值得推广？
4. 有什么潜在风险需要注意？

以 YAML 格式返回，便于程序化解析。
`;

async function main() {
  // 获取变更文件
  const files = execSync('git diff --name-only HEAD~1')
    .toString()
    .split('\n')
    .filter(f => f.endsWith('.java'));
  
  // 读取代码样本
  const codeSamples = files.slice(0, 5).map(f => {
    try {
      const content = fs.readFileSync(f, 'utf8');
      return { file: f, content: content.slice(0, 3000) };
    } catch {
      return null;
    }
  }).filter(Boolean);
  
  // 生成 prompt
  const prompt = PROMPT_TEMPLATE
    .replace('{{files}}', files.join('\n'))
    .replace('{{code}}', JSON.stringify(codeSamples, null, 2));
  
  // 调用 AI
  console.log('🧠 正在分析代码...');
  const result = await callAI(prompt);
  
  // 解析并保存
  const knowledge = parseYAML(extractYAML(result));
  saveKnowledge(knowledge);
  
  // 输出摘要
  console.log('\n💡 提取的知识：');
  knowledge.patterns?.forEach(p => console.log(`  📐 模式: ${p.name}`));
  knowledge.decisions?.forEach(d => console.log(`  🤔 决策: ${d.topic}`));
  knowledge.pitfalls?.forEach(p => console.log(`  ⚠️  注意: ${p.scenario}`));
}

function saveKnowledge(knowledge) {
  const date = new Date().toISOString().split('T')[0];
  const file = `docs/auto/knowledge-${date}.md`;
  
  let content = `# 知识提取 - ${date}\n\n`;
  
  if (knowledge.patterns?.length) {
    content += '## 设计模式\n\n';
    knowledge.patterns.forEach(p => {
      content += `### ${p.name}\n${p.description}\n\n`;
    });
  }
  
  if (knowledge.decisions?.length) {
    content += '## 架构决策\n\n';
    knowledge.decisions.forEach(d => {
      content += `### ${d.topic}\n- 决策: ${d.choice}\n- 理由: ${d.reason}\n\n`;
    });
  }
  
  fs.writeFileSync(file, content);
  console.log(`\n✅ 知识已保存到: ${file}`);
}

main().catch(console.error);
```

### 2. 集成到 tech:commit
```javascript
// 在 /tech:commit 流程中添加
async function techCommit() {
  // ... 现有流程 ...
  
  // 新增：知识提取
  console.log('🔍 提取代码知识...');
  execSync('node scripts/knowledge-brainstorm.js', { stdio: 'inherit' });
  
  // 提示用户审核
  console.log('\n📚 请检查生成的知识文件，确认后提交');
  
  // ... 后续提交流程 ...
}
```

### 3. 使用方式
```bash
# 方式 1: 手动触发
node scripts/knowledge-brainstorm.js

# 方式 2: commit 时自动触发
git commit -m "feat: xxx"
# → 自动分析 diff 并提取知识

# 方式 3: feature 完成时
/tech:commit
# → 作为提交流程的一部分自动执行
```

---

## 效果对比

| 方案 | 侵入性 | 准确度 | 维护成本 | 推荐度 |
|------|--------|--------|----------|--------|
| 代码注释 | 高 | 中 | 高 | ⭐⭐ |
| **Brainstorming 分析** | **无** | **高** | **低** | **⭐⭐⭐⭐⭐** |
| Diff 模式分析 | 无 | 中 | 低 | ⭐⭐⭐⭐ |
| 静态 AST 分析 | 无 | 高 | 中 | ⭐⭐⭐⭐ |
| 测试反向推导 | 无 | 中 | 低 | ⭐⭐⭐ |
| Debug 复盘 | 无 | 极高 | 低 | ⭐⭐⭐⭐⭐ |

---

*方案设计时间: 2026-04-08*
*核心思路: 让代码自己说话，AI 负责理解和提取*
