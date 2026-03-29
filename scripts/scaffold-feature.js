#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(ROOT, 'configs', 'templates');

function parseArgs(argv) {
  const args = { root: process.cwd(), force: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--id') {
      args.id = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--name') {
      args.name = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--root') {
      args.root = path.resolve(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === '--force') {
      args.force = true;
    }
  }
  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function sanitizeSegment(value) {
  return value.trim().replace(/[\\/:\n\r\t]+/g, '-').replace(/\s+/g, '-');
}

function readTemplate(name) {
  return fs.readFileSync(path.join(TEMPLATE_DIR, name), 'utf8');
}

function render(content, context) {
  return content
    .replaceAll('{{feature_id}}', context.featureId)
    .replaceAll('{{feature_name}}', context.featureName)
    .replaceAll('{{date}}', context.date)
    .replaceAll('{Feature ID}', context.featureId)
    .replaceAll('{date}', context.date)
    .replaceAll('{phase}', 'INIT');
}

function writeFileIfMissing(filePath, content, force) {
  if (fs.existsSync(filePath) && !force) {
    return;
  }
  fs.writeFileSync(filePath, content);
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.id || !args.name) {
    fail('用法: node scripts/scaffold-feature.js --id CSS-1234 --name 用户登录 [--root /path/to/project] [--force]');
  }

  const featureId = sanitizeSegment(args.id);
  const featureName = sanitizeSegment(args.name);
  const date = new Date().toISOString().slice(0, 10);
  const featureDir = path.join(args.root, 'features', `${featureId}-${featureName}`);

  fs.mkdirSync(featureDir, { recursive: true });
  for (const dir of ['notes', 'todos', 'seeds', 'archive', 'notepads', 'commands']) {
    fs.mkdirSync(path.join(featureDir, dir), { recursive: true });
  }

  const notepadsDir = path.join(featureDir, 'notepads');
  const learningsPath = path.join(notepadsDir, 'learnings.md');
  fs.writeFileSync(learningsPath, [
    '# 【' + featureId + '】Learnings',
    '',
    '> 自动生成 | 最后更新: ' + date,
    '',
    '## 积累的智慧',
    '',
    '> 每完成一个 Wave 后，在此记录从实现中学到的可复用知识。',
    '> 格式：Instinct 条目 = 模式描述 + Confidence 评分 + 适用范围',
    '',
    '## Instinct 条目（高 Confidence）',
    '',
    '> Confidence: 0.3（低，建议验证）/ 0.5-0.7（中高）/ 0.8+（高，可推广）',
    '',
    '### 命名约定',
    '',
    '| Instinct | Confidence | 适用范围 | 发现 Wave |',
    '|----------|-----------|---------|----------|',
    '| | | | |',
    '',
    '### 代码模式',
    '',
    '| Instinct | Confidence | 适用范围 | 发现 Wave |',
    '|----------|-----------|---------|----------|',
    '| | | | |',
    '',
    '### 已知陷阱',
    '',
    '| Instinct | Confidence | 触发条件 | 解决方案 | 发现 Wave |',
    '|----------|-----------|---------|---------|----------|',
    '| | | | | |',
    '',
    '### 成功模式',
    '',
    '| Instinct | Confidence | 适用范围 | 发现 Wave |',
    '|----------|-----------|---------|----------|',
    '| | | | |',
    '',
    '## 决策记录',
    '',
    '> 本 feature 期间确认的关键决策，供后续参考。',
    '',
    '| ID | 决策内容 | 原因 | 确认时间 | 备注 |',
    '|----|---------|------|---------|------|',
    '| D-01 | | | | |',
    '',
    '## 使用说明',
    '',
    '- 新 Wave 开始前，读取本文件并注入相关 Instinct 到 Per-Task 命令文件',
    '- Confidence >= 0.8 的 Instinct 可考虑贡献回项目根目录的 `.tinypowers/instincts.md`',
    '- 项目级 instincts 存储在 `.tinypowers/instincts.md`，跨 feature 共享'
  ].join('\n'));

  const context = { featureId, featureName, date };
  const files = [
    ['CHANGESET.md', 'change-set.md'],
    ['SPEC-STATE.md', 'spec-state.md'],
    ['PRD.md', 'prd-template.md'],
    ['需求理解确认.md', 'requirements-confirmation.md'],
    ['技术方案.md', 'tech-design.md'],
    ['任务拆解表.md', 'task-breakdown.md'],
    ['评审记录.md', 'review-log.md']
  ];

  for (const [outputName, templateName] of files) {
    const rendered = render(readTemplate(templateName), context);
    writeFileIfMissing(path.join(featureDir, outputName), rendered, args.force);
  }

  console.log('Feature change set 已创建:');
  console.log(featureDir);
}

main();
