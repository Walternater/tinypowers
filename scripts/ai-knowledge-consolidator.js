#!/usr/bin/env node
/**
 * AI Knowledge Consolidator
 * 将 AI 提取的增量知识自动合并到主知识库
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  mainKnowledge: 'docs/knowledge.md',
  autoDir: 'docs/ai-extracted',
  backupDir: '.tmp/knowledge-backup'
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

function getLatestKnowledgeFile() {
  if (!fs.existsSync(CONFIG.autoDir)) {
    return null;
  }
  
  const files = fs.readdirSync(CONFIG.autoDir)
    .filter(f => f.startsWith('knowledge-') && f.endsWith('.md'))
    .sort()
    .reverse();
  
  return files.length > 0 ? path.join(CONFIG.autoDir, files[0]) : null;
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

function generateConsolidationPrompt(mainContent, newContent) {
  return `你是一位知识管理专家，请将新提取的代码知识智能合并到主知识库中。

## 任务要求

1. **去重合并**：如果新知识已存在，跳过；如果是补充，合并；如果是更新，替换
2. **分类整理**：按设计模式、架构决策、最佳实践、已知问题分类
3. **保持格式**：使用统一的 Markdown 格式
4. **添加元数据**：为每个知识点添加来源时间

## 主知识库当前内容

${mainContent || '# 项目知识库\n\n> 本文档记录项目的设计决策、最佳实践和踩坑记录\n'}

## 新提取的知识

${newContent}

## 输出要求

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

async function consolidateKnowledge() {
  log('启动 AI 知识沉淀...', 'ai');
  
  // 1. 获取最新的知识文件
  const latestFile = getLatestKnowledgeFile();
  if (!latestFile) {
    log('没有找到生成的知识文件，跳过沉淀', 'warning');
    return;
  }
  
  log(`发现知识文件: ${path.basename(latestFile)}`);
  
  // 2. 读取内容
  const newContent = fs.readFileSync(latestFile, 'utf8');
  const mainContent = fs.existsSync(CONFIG.mainKnowledge) 
    ? fs.readFileSync(CONFIG.mainKnowledge, 'utf8')
    : '';
  
  // 3. 备份原知识库
  backupKnowledge();
  
  // 4. 生成合并提示
  const prompt = generateConsolidationPrompt(mainContent, newContent);
  
  // 5. 输出提示文件（供 AI 读取）
  ensureDir('.tmp');
  fs.writeFileSync('.tmp/knowledge-consolidation-prompt.md', prompt);
  
  log('合并提示已生成: .tmp/knowledge-consolidation-prompt.md', 'success');
  log('', 'info');
  log('🤖 请 AI 执行合并:', 'ai');
  log('   1. 读取 .tmp/knowledge-consolidation-prompt.md', 'info');
  log('   2. 分析并合并知识', 'info');
  log('   3. 输出合并后的 docs/knowledge.md', 'info');
  log('', 'info');
  log('💡 人工确认点:', 'info');
  log('   - 检查合并后的知识分类是否正确', 'info');
  log('   - 确认去重逻辑是否合理', 'info');
  log('   - 如有问题，可从备份恢复', 'info');
}

// 主函数
if (require.main === module) {
  consolidateKnowledge().catch(err => {
    log(`错误: ${err.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { consolidateKnowledge, getLatestKnowledgeFile };
