#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(ROOT, 'configs', 'templates');

function parseArgs(argv) {
  const args = { root: process.cwd(), force: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--id') { args.id = argv[i + 1]; i += 1; continue; }
    if (arg === '--name') { args.name = argv[i + 1]; i += 1; continue; }
    if (arg === '--root') { args.root = path.resolve(argv[i + 1]); i += 1; continue; }
    if (arg === '--force') { args.force = true; }
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

function render(content, ctx) {
  return content
    .replaceAll('{{feature_id}}', ctx.featureId)
    .replaceAll('{{feature_name}}', ctx.featureName)
    .replaceAll('{{date}}', ctx.date)
    .replaceAll('{Feature ID}', ctx.featureId)
    .replaceAll('{date}', ctx.date)
    .replaceAll('{phase}', 'INIT');
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

  const ctx = { featureId, featureName, date };

  const learningsPath = path.join(featureDir, 'notepads', 'learnings.md');
  fs.writeFileSync(learningsPath, [
    '# 【' + featureId + '】Learnings',
    '',
    '> 自动生成 | 最后更新: ' + date,
    '',
    '## Wave 总结',
    '',
    '## 关键决策',
    '',
    '| ID | 决策 | 原因 |',
    '|----|------|------|',
    '',
    '## 陷阱',
    '- '
  ].join('\n'));

  const templates = [
    ['CHANGESET.md', 'change-set.md'],
    ['SPEC-STATE.md', 'spec-state.md'],
    ['PRD.md', 'prd-template.md'],
    ['需求理解确认.md', 'requirements-confirmation.md'],
    ['技术方案.md', 'tech-design.md'],
    ['任务拆解表.md', 'task-breakdown.md'],
    ['评审记录.md', 'review-log.md']
  ];

  for (const [outputName, templateName] of templates) {
    const dest = path.join(featureDir, outputName);
    if (fs.existsSync(dest) && !args.force) continue;
    const rendered = render(fs.readFileSync(path.join(TEMPLATE_DIR, templateName), 'utf8'), ctx);
    fs.writeFileSync(dest, rendered);
  }

  console.log('Feature change set 已创建:');
  console.log(featureDir);
}

main();
