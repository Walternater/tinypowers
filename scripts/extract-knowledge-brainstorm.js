#!/usr/bin/env node
/**
 * Knowledge Brainstorming Extractor
 * 通过AI分析代码变更，自动提取设计模式、架构决策和最佳实践
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============ 配置 ============
const CONFIG = {
  maxFilesToAnalyze: 10,      // 最多分析的文件数
  maxCodeLengthPerFile: 3000, // 每个文件最多读取的字符数
  outputDir: 'docs/auto',     // 知识输出目录
  knowledgeMain: 'docs/knowledge.md', // 主知识库文件
  aiModel: process.env.AI_MODEL || 'default',
};

// ============ 工具函数 ============

function log(message, type = 'info') {
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌', brainstorm: '🧠' };
  console.log(`${icons[type] || '•'} ${message}`);
}

function exec(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', ...options });
  } catch (e) {
    return '';
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readFileSafe(filePath, maxLength = CONFIG.maxCodeLengthPerFile) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.slice(0, maxLength);
  } catch (e) {
    return null;
  }
}

// ============ Git 相关 ============

function getChangedFiles(since = null) {
  // 自动检测合适的范围
  if (!since) {
    const commitCount = parseInt(exec('git rev-list --count HEAD') || '0');
    // 分析最近 1 个 commit 的变更（已提交的代码）
    since = commitCount > 1 ? 'HEAD~1' : 'HEAD';
  }
  
  // 如果是 HEAD~1 或 HEAD~N 格式，分析已提交的变更
  let output;
  if (since.startsWith('HEAD')) {
    output = exec(`git diff ${since} HEAD --name-only --diff-filter=ACM`);
  } else {
    output = exec(`git diff ${since} --name-only --diff-filter=ACM`);
  }
  
  const files = output
    .split('\n')
    .filter(f => f.trim() && !f.includes('node_modules'))
    .filter(f => f.match(/\.(java|kt|py|js|ts|go|rs)$/));
  
  return files;
}

function getDiffStats(since = 'HEAD~1') {
  const stats = exec(`git diff ${since} --stat`);
  return stats;
}

function getCommitMessages(since = 'HEAD~1') {
  return exec(`git log ${since}..HEAD --pretty=format:"%s"`);
}

// ============ AI 调用 ============

async function callAI(prompt) {
  // 检查可用的 AI 调用方式
  
  // 方式 1: 通过环境变量配置的 AI CLI
  if (process.env.AI_CLI_CMD) {
    const tempFile = `/tmp/ai-prompt-${Date.now()}.txt`;
    fs.writeFileSync(tempFile, prompt);
    const result = exec(`${process.env.AI_CLI_CMD} < ${tempFile}`);
    fs.unlinkSync(tempFile);
    return result;
  }
  
  // 方式 2: 通过 OpenAI API
  if (process.env.OPENAI_API_KEY) {
    return await callOpenAI(prompt);
  }
  
  // 方式 3: 模拟输出（测试用）
  log('未配置 AI 调用方式，使用模拟输出', 'warning');
  return generateMockResponse();
}

async function callOpenAI(prompt) {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });
    
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    };
    
    const req = https.request(options, (res) => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(result);
          resolve(json.choices[0].message.content);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function generateMockResponse() {
  return `
patterns:
  - name: "State Pattern"
    description: "使用状态机管理订单生命周期，避免状态散落在if-else中"
    evidence: "OrderStatus, OrderStateMachine"
    value: "状态流转清晰，易于扩展新状态"
    
decisions:
  - topic: "金额计算精度"
    choice: "使用Money值对象封装BigDecimal"
    reason: "避免浮点数精度问题，统一金额计算逻辑"
    tradeoff: "需要额外的对象创建开销"
    
practices:
  - name: "防御性编程"
    description: "在方法入口进行参数校验"
    example: "OrderService.createOrder中进行null和空值检查"
    benefit: "提前捕获错误，防止脏数据进入系统"
    
pitfalls:
  - scenario: "并发扣减库存"
    risk: "可能出现超卖"
    current_solution: "数据库乐观锁(version字段)"
    recommendation: "考虑引入分布式锁作为补充"
`;
}

// ============ Prompt 生成 ============

function generateBrainstormingPrompt(files, codeSamples, commitMsgs, diffStats) {
  const fileList = files.slice(0, CONFIG.maxFilesToAnalyze).join('\n');
  
  const codeSections = codeSamples.map(({file, content}) => {
    return `
// ========================================
// FILE: ${file}
// ========================================
${content}
`;
  }).join('\n\n');

  return `你是一位经验丰富的软件架构师，精通领域驱动设计、设计模式和代码质量。

请分析以下代码变更，提取值得沉淀到知识库的内容。

## 分析维度

### 1. 设计模式识别 (patterns)
识别代码中使用的经典设计模式：
- 创建型：工厂、建造者、单例
- 结构型：适配器、装饰器、代理、组合
- 行为型：策略、模板方法、观察者、状态机

对每一个识别出的模式，说明：
- 模式名称
- 具体应用场景
- 带来的价值（解决了什么问题）
- 相关文件

### 2. 架构决策推断 (decisions)
从代码结构反推架构层面的决策：
- 分层/模块化方式
- 数据访问策略（ORM/原生SQL/混合）
- 事务边界设计
- 异常处理策略
- 依赖管理（领域层是否纯净？）

对每一个决策，说明：
- 决策主题
- 具体选择
- 决策理由
- 权衡取舍

### 3. 最佳实践发现 (practices)
识别代码中的良好实践：
- 防御性编程（参数校验、空值处理）
- 不可变对象使用
- 并发安全处理
- 性能优化手段
- 测试策略

对每一个实践，说明：
- 实践名称
- 具体描述
- 代码示例位置
- 带来的好处

### 4. 潜在风险提示 (pitfalls)
识别需要注意的潜在问题：
- 并发安全风险
- 性能瓶颈
- 维护性隐患
- 设计债

对每一个风险，说明：
- 场景描述
- 风险点
- 当前解决方案（如有）
- 改进建议

## 输入数据

### 变更统计
\`\`\`
${diffStats}
\`\`\`

### Commit 信息
\`\`\`
${commitMsgs}
\`\`\`

### 变更文件列表
\`\`\`
${fileList}
\`\`\`

### 代码样本（前${CONFIG.maxFilesToAnalyze}个文件）
${codeSections}

## 输出格式

请以 YAML 格式返回，便于程序化解析：

\`\`\`yaml
patterns:
  - name: ""
    description: ""
    evidence: ""
    value: ""
    files: []
    
decisions:
  - topic: ""
    choice: ""
    reason: ""
    tradeoff: ""
    
practices:
  - name: ""
    description: ""
    example: ""
    benefit: ""
    
pitfalls:
  - scenario: ""
    risk: ""
    current_solution: ""
    recommendation: ""
\`\`\`

注意：
1. 只输出 YAML 内容，不要有其他解释性文字
2. 如果某个维度没有内容，可以省略该维度
3. 描述要具体，避免空泛的陈述
4. 代码位置要准确到文件名（不需要行号）
`;
}

// ============ 结果解析 ============

function parseYAML(content) {
  // 简单的 YAML 解析（适用于本脚本的特定格式）
  const result = { patterns: [], decisions: [], practices: [], pitfalls: [] };
  
  // 提取 YAML 块
  const yamlMatch = content.match(/```yaml\n([\s\S]*?)\n```/);
  if (!yamlMatch) {
    // 尝试直接解析
    return parseYAMLSimple(content);
  }
  
  return parseYAMLSimple(yamlMatch[1]);
}

function parseYAMLSimple(yaml) {
  const result = { patterns: [], decisions: [], practices: [], pitfalls: [] };
  
  const sections = {
    patterns: /patterns:\s*([\s\S]*?)(?=\n\w|$)/,
    decisions: /decisions:\s*([\s\S]*?)(?=\n\w|$)/,
    practices: /practices:\s*([\s\S]*?)(?=\n\w|$)/,
    pitfalls: /pitfalls:\s*([\s\S]*?)(?=\n\w|$)/,
  };
  
  Object.entries(sections).forEach(([key, regex]) => {
    const match = yaml.match(regex);
    if (match) {
      result[key] = parseListItems(match[1]);
    }
  });
  
  return result;
}

function parseListItems(content) {
  const items = [];
  const lines = content.split('\n');
  let current = null;
  
  for (const line of lines) {
    if (line.match(/^\s+-\s+name:|^\s+-\s+topic:|^\s+-\s+scenario:/)) {
      if (current) items.push(current);
      current = {};
    }
    
    if (current) {
      const match = line.match(/^\s+(\w+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        current[key] = value.trim();
      }
    }
  }
  
  if (current) items.push(current);
  return items;
}

// ============ 知识保存 ============

function saveKnowledge(knowledge, featureInfo = {}) {
  ensureDir(CONFIG.outputDir);
  
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();
  const fileName = `knowledge-${date}-${timestamp}.md`;
  const filePath = path.join(CONFIG.outputDir, fileName);
  
  let content = `# 代码知识提取报告\n\n`;
  content += `**生成时间**: ${new Date().toLocaleString()}\n\n`;
  
  if (featureInfo.name) {
    content += `**相关 Feature**: ${featureInfo.name}\n\n`;
  }
  
  // Patterns
  if (knowledge.patterns?.length) {
    content += `## 🎨 设计模式 (${knowledge.patterns.length})\n\n`;
    knowledge.patterns.forEach((p, i) => {
      content += `### ${i + 1}. ${p.name}\n\n`;
      content += `- **描述**: ${p.description}\n`;
      if (p.evidence) content += `- **证据**: ${p.evidence}\n`;
      if (p.value) content += `- **价值**: ${p.value}\n`;
      if (p.files?.length) content += `- **相关文件**: ${p.files.join(', ')}\n`;
      content += '\n';
    });
  }
  
  // Decisions
  if (knowledge.decisions?.length) {
    content += `## 🤔 架构决策 (${knowledge.decisions.length})\n\n`;
    knowledge.decisions.forEach((d, i) => {
      content += `### ${i + 1}. ${d.topic}\n\n`;
      content += `- **决策**: ${d.choice}\n`;
      if (d.reason) content += `- **理由**: ${d.reason}\n`;
      if (d.tradeoff) content += `- **权衡**: ${d.tradeoff}\n`;
      content += '\n';
    });
  }
  
  // Practices
  if (knowledge.practices?.length) {
    content += `## ✅ 最佳实践 (${knowledge.practices.length})\n\n`;
    knowledge.practices.forEach((p, i) => {
      content += `### ${i + 1}. ${p.name}\n\n`;
      content += `${p.description}\n\n`;
      if (p.example) content += `- **示例**: ${p.example}\n`;
      if (p.benefit) content += `- **好处**: ${p.benefit}\n`;
      content += '\n';
    });
  }
  
  // Pitfalls
  if (knowledge.pitfalls?.length) {
    content += `## ⚠️ 潜在风险 (${knowledge.pitfalls.length})\n\n`;
    knowledge.pitfalls.forEach((p, i) => {
      content += `### ${i + 1}. ${p.scenario}\n\n`;
      content += `- **风险**: ${p.risk}\n`;
      if (p.current_solution) content += `- **当前方案**: ${p.current_solution}\n`;
      if (p.recommendation) content += `- **建议**: ${p.recommendation}\n`;
      content += '\n';
    });
  }
  
  // 如果没有提取到任何知识
  if (!knowledge.patterns?.length && 
      !knowledge.decisions?.length && 
      !knowledge.practices?.length && 
      !knowledge.pitfalls?.length) {
    content += `*本次代码变更未识别出显著的知识点*\n`;
  }
  
  content += `\n---\n\n`;
  content += `*本报告由 AI 自动生成，请人工审核后确认沉淀到主知识库*\n`;
  
  fs.writeFileSync(filePath, content);
  
  return filePath;
}

function updateMainKnowledge(knowledge, extractedFile) {
  if (!fs.existsSync(CONFIG.knowledgeMain)) {
    return;
  }
  
  let mainContent = fs.readFileSync(CONFIG.knowledgeMain, 'utf8');
  
  // 添加引用
  const today = new Date().toISOString().split('T')[0];
  const newEntry = `\n- [${today} 自动提取](${extractedFile.replace('docs/', '')})`;
  
  // 在 "## 自动提取" 部分添加
  if (mainContent.includes('## 自动提取')) {
    mainContent = mainContent.replace(
      /(## 自动提取\n\n)/,
      `$1${newEntry}\n`
    );
  } else {
    mainContent += `\n\n## 自动提取\n\n${newEntry}\n`;
  }
  
  fs.writeFileSync(CONFIG.knowledgeMain, mainContent);
}

// ============ 主流程 ============

async function main() {
  log('启动代码知识提取...', 'brainstorm');
  
  let changedFiles = [];
  let codeSamples = [];
  let diffStats = '';
  let commitMsgs = '';
  
  // 1. 检查是否在 git 仓库
  if (fs.existsSync('.git')) {
    // 尝试获取变更文件
    changedFiles = getChangedFiles();
    diffStats = getDiffStats();
    commitMsgs = getCommitMessages();
  }
  
  // 2. 如果没有变更文件，分析项目中的主要代码文件
  if (changedFiles.length === 0) {
    log('未检测到代码变更，分析项目主要代码文件...', 'info');
    
    // 递归查找 src 目录下的 Java 文件
    const findJavaFiles = (dir) => {
      const files = [];
      if (!fs.existsSync(dir)) return files;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('test')) {
          files.push(...findJavaFiles(fullPath));
        } else if (item.endsWith('.java') && !item.includes('Test')) {
          files.push(fullPath);
        }
      }
      return files;
    };
    
    changedFiles = findJavaFiles('src/main/java');
    diffStats = `项目主要代码文件：${changedFiles.length} 个`;
    commitMsgs = '代码库结构分析';
    
    log(`找到 ${changedFiles.length} 个代码文件`);
  } else {
    log(`检测到 ${changedFiles.length} 个代码文件变更`);
  }
  
  if (changedFiles.length === 0) {
    log('未找到代码文件，跳过知识提取', 'warning');
    return;
  }
  
  // 3. 读取代码样本
  codeSamples = changedFiles
    .slice(0, CONFIG.maxFilesToAnalyze)
    .map(file => {
      const content = readFileSafe(file);
      return content ? { file, content } : null;
    })
    .filter(Boolean);
  
  log(`读取了 ${codeSamples.length} 个文件的内容`);
  
  // 5. 生成 Prompt
  log('生成分析提示...', 'info');
  const prompt = generateBrainstormingPrompt(changedFiles, codeSamples, commitMsgs, diffStats);
  
  // 6. 调用 AI
  log('调用 AI 分析代码（可能需要几秒到几十秒）...', 'brainstorm');
  const aiResponse = await callAI(prompt);
  
  // 7. 解析结果
  log('解析分析结果...', 'info');
  const knowledge = parseYAML(aiResponse);
  
  // 8. 保存知识
  const featureInfo = {
    name: process.env.FEATURE_NAME || '',
  };
  
  const savedFile = saveKnowledge(knowledge, featureInfo);
  log(`知识已保存到: ${savedFile}`, 'success');
  
  // 9. 更新主知识库索引
  if (fs.existsSync(CONFIG.knowledgeMain)) {
    updateMainKnowledge(knowledge, savedFile);
  }
  
  // 10. 输出摘要
  log('\n========== 知识提取摘要 ==========', 'info');
  
  const counts = {
    patterns: knowledge.patterns?.length || 0,
    decisions: knowledge.decisions?.length || 0,
    practices: knowledge.practices?.length || 0,
    pitfalls: knowledge.pitfalls?.length || 0,
  };
  
  if (counts.patterns) log(`设计模式: ${counts.patterns} 个`, 'success');
  if (counts.decisions) log(`架构决策: ${counts.decisions} 个`, 'success');
  if (counts.practices) log(`最佳实践: ${counts.practices} 个`, 'success');
  if (counts.pitfalls) log(`潜在风险: ${counts.pitfalls} 个`, 'warning');
  
  const total = counts.patterns + counts.decisions + counts.practices + counts.pitfalls;
  
  if (total === 0) {
    log('本次变更未识别出显著的知识点', 'warning');
  } else {
    log(`\n总计: ${total} 个知识点`, 'success');
    log('\n请检查生成的知识文件，确认有价值的知识后，', 'info');
    log('可以手动合并到 docs/knowledge.md 主知识库', 'info');
  }
  
  // 设置输出变量（供调用方使用）
  if (process.env.GITHUB_ACTIONS) {
    console.log(`::set-output name=knowledge_file::${savedFile}`);
    console.log(`::set-output name=knowledge_count::${total}`);
  }
}

// 运行
if (require.main === module) {
  main().catch(err => {
    log(`错误: ${err.message}`, 'error');
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main, callAI, parseYAML, saveKnowledge };
