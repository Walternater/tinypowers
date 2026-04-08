#!/usr/bin/env node
/**
 * Knowledge Brainstorming Extractor
 * 收集代码变更并生成 AI 分析提示词，交由宿主 AI 工具（Claude Code / Codex / Cursor）分析
 * 
 * 使用方式：
 *   1. 运行此脚本生成提示词文件
 *   2. 将提示词文件内容发送给 AI（Claude/Codex/Cursor）
 *   3. 将 AI 的回复保存到 docs/ai-extracted/knowledge-{date}.md
 *   4. 运行 ai-knowledge-consolidator.js 合并到主知识库
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============ 配置 ============
const CONFIG = {
  maxFilesToAnalyze: 10,      // 最多分析的文件数
  maxCodeLengthPerFile: 3000, // 每个文件最多读取的字符数
  outputDir: 'docs/ai-extracted',     // 知识输出目录
  knowledgeMain: 'docs/knowledge.md', // 主知识库文件
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
    since = commitCount > 1 ? 'HEAD~1' : 'HEAD';
  }
  
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
  return exec(`git diff ${since} --stat`);
}

function getCommitMessages(since = 'HEAD~1') {
  return exec(`git log ${since}..HEAD --pretty=format:"%s"`);
}

// ============ 提示词生成 ============

function generateExtractionPrompt(files, codeSamples, commitMsgs, diffStats) {
  const fileList = files.slice(0, CONFIG.maxFilesToAnalyze).join('\n');
  
  const codeSections = codeSamples.map(({file, content}) => {
    return `
// ========================================
// FILE: ${file}
// ========================================
${content}
`;
  }).join('\n\n');

  return `# 代码知识提取任务

你是一位经验丰富的软件架构师，请分析以下代码变更，提取值得沉淀到知识库的内容。

## 分析维度

### 1. 设计模式识别 (patterns)
从代码中识别使用的设计模式：
- GoF 设计模式（工厂、单例、观察者、策略等）
- 领域驱动设计模式（实体、值对象、聚合、仓库等）
- 架构模式（MVC、分层、微服务等）

对每一个识别的模式，说明：
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

## 输出示例

\`\`\`yaml
patterns:
  - name: "State Pattern"
    description: "使用状态机管理订单生命周期，避免状态散落在if-else中"
    evidence: "OrderStatus枚举和OrderStateMachine类"
    value: "状态流转清晰，易于扩展新状态"
    files: ["OrderStateMachine.java"]
    
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
\`\`\`
`;
}

// ============ 结果处理 ============

function savePromptToFile(prompt, files) {
  ensureDir('.tmp');
  
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();
  const fileName = `knowledge-extraction-prompt-${date}.md`;
  const filePath = path.join('.tmp', fileName);
  
  fs.writeFileSync(filePath, prompt);
  
  return { filePath, fileName };
}

function printNextSteps(promptFile, outputDir) {
  const date = new Date().toISOString().split('T')[0];
  const outputFile = path.join(outputDir, `knowledge-${date}-${Date.now()}.md`);
  
  log('\n========== 下一步操作 ==========', 'info');
  log('', 'info');
  log('1. 打开提示词文件:', 'info');
  log(`   cat ${promptFile}`, 'info');
  log('', 'info');
  log('2. 将文件内容发送给 AI（Claude/Codex/Cursor）:', 'info');
  log('   - 复制文件全部内容', 'info');
  log('   - 粘贴到 AI 对话中', 'info');
  log('   - 让 AI 分析并返回 YAML 格式的结果', 'info');
  log('', 'info');
  log('3. 将 AI 的回复保存为知识文档:', 'info');
  log(`   # 创建目录`, 'info');
  log(`   mkdir -p ${outputDir}`, 'info');
  log(`   # 将 AI 回复保存到:`, 'info');
  log(`   # ${outputFile}`, 'info');
  log('', 'info');
  log('4. 合并到主知识库:', 'info');
  log('   node scripts/ai-knowledge-consolidator.js', 'info');
  log('', 'info');
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
    changedFiles = getChangedFiles();
    diffStats = getDiffStats();
    commitMsgs = getCommitMessages();
  }
  
  // 2. 如果没有变更文件，分析项目中的主要代码文件
  if (changedFiles.length === 0) {
    log('未检测到代码变更，分析项目主要代码文件...', 'info');
    
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
  
  // 4. 生成提示词
  log('生成 AI 分析提示词...', 'info');
  const prompt = generateExtractionPrompt(changedFiles, codeSamples, commitMsgs, diffStats);
  
  // 5. 保存提示词到文件
  const { filePath: promptFile } = savePromptToFile(prompt, changedFiles);
  log(`提示词已保存: ${promptFile}`, 'success');
  
  // 6. 输出下一步操作指引
  printNextSteps(promptFile, CONFIG.outputDir);
}

// 运行
if (require.main === module) {
  main().catch(err => {
    log(`错误: ${err.message}`, 'error');
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main, generateExtractionPrompt, savePromptToFile };
