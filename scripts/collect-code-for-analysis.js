#!/usr/bin/env node
/**
 * Code Collection Script
 * 收集代码信息供 AI 分析，不直接调用 AI API
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  maxFiles: 15,
  maxLinesPerFile: 100,
  outputFile: '.tmp/code-analysis-input.json',
  mode: process.env.ANALYSIS_MODE || 'incremental' // 'incremental' | 'full'
};

function findJavaFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('test') && !item.includes('target')) {
      findJavaFiles(fullPath, files);
    } else if (item.endsWith('.java') && !item.includes('Test')) {
      files.push(fullPath);
    }
  }
  return files;
}

function getChangedJavaFiles(sinceRef = 'HEAD~1') {
  try {
    const { execSync } = require('child_process');
    const output = execSync(`git diff ${sinceRef} --name-only --diff-filter=ACM`, { encoding: 'utf8' });
    return output
      .split('\n')
      .filter(f => f.trim() && f.endsWith('.java') && !f.includes('Test'));
  } catch (e) {
    return [];
  }
}

function getFileSummary(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // 提取类名
  const classMatch = content.match(/class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : path.basename(filePath, '.java');
  
  // 提取关键方法（public 方法）
  const methods = [];
  const methodRegex = /public\s+\w+\s+(\w+)\s*\(/g;
  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    methods.push(match[1]);
    if (methods.length >= 5) break;
  }
  
  // 提取代码结构（前 N 行）
  const structure = lines
    .filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('package ') ||
             trimmed.startsWith('import ') ||
             trimmed.startsWith('public class') ||
             trimmed.startsWith('@') ||
             trimmed.startsWith('private') ||
             trimmed.startsWith('public');
    })
    .slice(0, CONFIG.maxLinesPerFile)
    .join('\n');
  
  return {
    file: filePath,
    className,
    methods: methods.slice(0, 5),
    lineCount: lines.length,
    structure
  };
}

function analyzeProject() {
  const isIncremental = CONFIG.mode === 'incremental';
  
  if (isIncremental) {
    console.log('🔍 增量分析：检测代码变更...\n');
  } else {
    console.log('🔍 全量分析：扫描项目代码...\n');
  }
  
  let javaFiles = [];
  let analysisType = '';
  
  if (isIncremental) {
    // 增量模式：只分析变更的文件
    javaFiles = getChangedJavaFiles();
    analysisType = '变更文件';
    
    // 如果没有变更，尝试分析最近 1 个 commit
    if (javaFiles.length === 0) {
      console.log('⚠️ 未检测到未提交的变更，分析最近 1 个 commit...');
      javaFiles = getChangedJavaFiles('HEAD~1');
    }
    
    // 如果还是没有，回退到全量分析
    if (javaFiles.length === 0) {
      console.log('⚠️ 无法获取变更记录，切换到全量分析模式');
      javaFiles = findJavaFiles('src/main/java');
      analysisType = '全量文件';
    }
  } else {
    // 全量模式：分析所有文件
    javaFiles = findJavaFiles('src/main/java');
    analysisType = '全量文件';
  }
  
  console.log(`找到 ${javaFiles.length} 个${analysisType}`);
  
  // 分析每个文件
  const files = javaFiles
    .slice(0, CONFIG.maxFiles)
    .map(getFileSummary)
    .filter(Boolean);
  
  // 统计信息
  const stats = {
    analysisMode: isIncremental ? 'incremental' : 'full',
    totalFiles: javaFiles.length,
    analyzedFiles: files.length,
    totalLines: files.reduce((sum, f) => sum + f.lineCount, 0),
    fileTypes: {}
  };
  
  files.forEach(f => {
    const type = f.className.replace(/[A-Z][a-z]+$/, '*');
    stats.fileTypes[type] = (stats.fileTypes[type] || 0) + 1;
  });
  
  const result = {
    project: path.basename(process.cwd()),
    timestamp: new Date().toISOString(),
    stats,
    files
  };
  
  // 输出为 JSON（供 AI 读取）
  ensureDir('.tmp');
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(result, null, 2));
  
  // 同时输出可读的 Markdown
  const markdown = generateMarkdown(result);
  fs.writeFileSync('.tmp/code-analysis-input.md', markdown);
  
  console.log(`\n✅ 分析完成！`);
  console.log(`📊 统计: ${stats.totalLines} 行代码, ${stats.analyzedFiles} 个文件`);
  console.log(`📁 输出: ${CONFIG.outputFile}`);
  console.log(`📝 可读版本: .tmp/code-analysis-input.md`);
  
  return result;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateMarkdown(data) {
  let md = `# 代码分析报告\n\n`;
  md += `**项目**: ${data.project}\n`;
  md += `**时间**: ${data.timestamp}\n\n`;
  
  md += `## 统计\n\n`;
  md += `- 文件总数: ${data.stats.totalFiles}\n`;
  md += `- 分析文件: ${data.stats.analyzedFiles}\n`;
  md += `- 代码行数: ${data.stats.totalLines}\n\n`;
  
  md += `## 文件列表\n\n`;
  data.files.forEach(f => {
    md += `### ${f.className}\n\n`;
    md += `- 文件: \`${f.file}\`\n`;
    md += `- 行数: ${f.lineCount}\n`;
    md += `- 方法: ${f.methods.join(', ') || '无'}\n\n`;
    md += `<details>\n<summary>代码结构</summary>\n\n`;
    md += '```java\n';
    md += f.structure;
    md += '\n```\n\n';
    md += '</details>\n\n';
  });
  
  return md;
}

// 主函数
if (require.main === module) {
  analyzeProject();
}

module.exports = { analyzeProject, findJavaFiles };
