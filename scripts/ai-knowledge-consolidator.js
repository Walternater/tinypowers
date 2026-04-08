#!/usr/bin/env node
/**
 * AI Knowledge Consolidator
 * 生成知识合并提示词，交由宿主 AI 工具（Claude Code / Codex / Cursor）执行合并
 * 
 * 使用方式：
 *   1. 运行此脚本生成合并提示词
 *   2. 将提示词发送给 AI（Claude/Codex/Cursor）
 *   3. AI 返回合并后的完整知识库内容
 *   4. 将结果保存到 docs/knowledge.md
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  mainKnowledge: 'docs/knowledge.md',
  extractedDir: 'docs/ai-extracted',
  backupDir: '.tinypowers/knowledge-backup'
};

function log(message, type = 'info') {
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌', ai: '🤖' };
  console.log(`${icons[type] || '•'} ${message}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getLatestExtractedFile() {
  if (!fs.existsSync(CONFIG.extractedDir)) {
    return null;
  }
  
  const files = fs.readdirSync(CONFIG.extractedDir)
    .filter(f => f.startsWith('knowledge-') && f.endsWith('.md'))
    .sort()
    .reverse();
  
  return files.length > 0 ? path.join(CONFIG.extractedDir, files[0]) : null;
}

function backupKnowledge() {
  if (!fs.existsSync(CONFIG.mainKnowledge)) {
    return;
  }
  
  ensureDir(CONFIG.backupDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(CONFIG.backupDir, `knowledge-backup-${timestamp}.md`);
  
  fs.copyFileSync(CONFIG.mainKnowledge, backupPath);
  log(`已备份原知识库: ${backupPath}`, 'info');
}

function generateConsolidationPrompt(mainContent, extractedContent) {
  return `# 知识库合并任务

你是一位知识管理专家，请将新提取的代码知识智能合并到主知识库中。

## 任务要求

1. **去重合并**: 
   - 如果新知识已存在（相似度 > 80%），跳过
   - 如果是补充，合并到现有条目
   - 如果是更新，替换旧内容

2. **分类整理**: 
   - 设计模式
   - 架构决策
   - 最佳实践
   - 已知问题与风险

3. **保持格式**: 
   - 使用统一的 Markdown 格式
   - 为每个知识点添加来源时间和文件

4. **输出完整知识库**: 
   - 包含主知识库的现有内容
   - 加上新提取的知识
   - 按分类组织

## 主知识库当前内容

${mainContent || '# 项目知识库\n\n> 本文档记录项目的设计决策、最佳实践和踩坑记录\n'}

## 新提取的知识

${extractedContent}

## 输出格式

请输出合并后的完整知识库内容，格式如下：

\`\`\`markdown
# 项目知识库

> 本文档记录项目的设计决策、最佳实践和踩坑记录
> 自动生成于 {date}，最后更新于 {date}

## 设计模式

### 1. [模式名称]
**来源**: {文件路径}  
**添加时间**: {date}  
**描述**: ...  
**代码示例**: ...  
**价值**: ...

## 架构决策

### 1. [决策主题]
**决策时间**: {date}  
**决策**: ...  
**理由**: ...  
**权衡**: ...

## 最佳实践

### 1. [实践名称]
**添加时间**: {date}  
**描述**: ...  
**好处**: ...

## 已知问题

### 1. [问题描述]
**发现时间**: {date}  
**问题**: ...  
**解决方案**: ...

## 更新历史
- {date}: 自动合并 {N} 条知识点
\`\`\`

注意：
1. 保持主知识库中已有的有价值内容
2. 将新知识智能插入到合适的位置
3. 按分类排序，新内容放在各类别的末尾
4. 如果新知识已存在（相似度>80%），跳过
`;
}

function savePromptToFile(prompt) {
  ensureDir('.tmp');
  const fileName = 'knowledge-consolidation-prompt.md';
  const filePath = path.join('.tmp', fileName);
  
  fs.writeFileSync(filePath, prompt);
  
  return { filePath, fileName };
}

function printNextSteps(promptFile, mainKnowledge) {
  log('\n========== 下一步操作 ==========', 'info');
  log('', 'info');
  log('1. 打开合并提示词文件:', 'info');
  log(`   cat ${promptFile}`, 'info');
  log('', 'info');
  log('2. 将文件内容发送给 AI（Claude/Codex/Cursor）:', 'info');
  log('   - 复制文件全部内容', 'info');
  log('   - 粘贴到 AI 对话中', 'info');
  log('   - 让 AI 执行合并并返回完整知识库', 'info');
  log('', 'info');
  log(`3. 将 AI 的回复保存到: ${mainKnowledge}`, 'info');
  log('', 'info');
  log('4. 如需恢复，备份位置:', 'info');
  log(`   ls ${CONFIG.backupDir}/`, 'info');
  log('', 'info');
}

async function consolidateKnowledge() {
  log('启动知识库合并...', 'ai');
  
  // 1. 获取最新的知识提取文件
  const extractedFile = getLatestExtractedFile();
  if (!extractedFile) {
    log(`没有找到提取的知识文件，跳过合并`, 'warning');
    log(`请确保已运行 extract-knowledge-brainstorm.js 并保存 AI 分析结果到 ${CONFIG.extractedDir}/`, 'info');
    return;
  }
  
  log(`发现知识文件: ${path.basename(extractedFile)}`);
  
  // 2. 读取内容
  const extractedContent = fs.readFileSync(extractedFile, 'utf8');
  const mainContent = fs.existsSync(CONFIG.mainKnowledge) 
    ? fs.readFileSync(CONFIG.mainKnowledge, 'utf8')
    : '';
  
  // 3. 备份原知识库
  backupKnowledge();
  
  // 4. 生成合并提示词
  const prompt = generateConsolidationPrompt(mainContent, extractedContent);
  
  // 5. 保存提示词到文件
  const { filePath: promptFile } = savePromptToFile(prompt);
  log(`合并提示词已生成: ${promptFile}`, 'success');
  
  // 6. 输出下一步操作
  printNextSteps(promptFile, CONFIG.mainKnowledge);
}

// 运行
if (require.main === module) {
  consolidateKnowledge().catch(err => {
    log(`错误: ${err.message}`, 'error');
    console.error(err);
    process.exit(1);
  });
}

module.exports = { consolidateKnowledge, getLatestExtractedFile, backupKnowledge };
