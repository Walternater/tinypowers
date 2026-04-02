#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(ROOT, 'configs', 'templates');

const TRACKS = {
  fast: {
    mode: 'relaxed',
    templates: [
      ['SPEC.md', 'spec-simple.md'],
      ['SPEC-STATE.md', 'spec-state.md'],
      ['PRD.md', 'prd-template.md'],
      ['技术方案.md', 'tech-design-fast.md'],
      ['任务拆解表.md', 'task-breakdown-fast.md']
    ]
  },
  standard: {
    mode: 'strict',
    templates: [
      ['SPEC.md', 'spec.md'],
      ['SPEC-STATE.md', 'spec-state.md'],
      ['PRD.md', 'prd-template.md'],
      ['技术方案.md', 'tech-design.md'],
      ['任务拆解表.md', 'task-breakdown.md']
    ]
  }
};

function parseArgs(argv) {
  const args = { root: process.cwd(), force: false, track: 'standard' };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--id') { args.id = argv[i + 1]; i += 1; continue; }
    if (arg === '--name') { args.name = argv[i + 1]; i += 1; continue; }
    if (arg === '--root') { args.root = path.resolve(argv[i + 1]); i += 1; continue; }
    if (arg === '--track') { args.track = String(argv[i + 1] || '').trim().toLowerCase(); i += 1; continue; }
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
    .replaceAll('{Feature ID}', ctx.featureId)
    .replaceAll('{date}', ctx.date)
    .replaceAll('{phase}', ctx.phase)
    .replaceAll('{track}', ctx.track)
    .replaceAll('{mode}', ctx.mode)
    .replaceAll('{{in_scope_list}}', '- ')
    .replaceAll('{{out_of_scope_list}}', '- ')
    .replaceAll('{{decision_rows}}', '| D-01 | | | 待确认 |')
    .replaceAll('{{task_rows}}', '| T-01 | | | | pending |')
    .replaceAll('{{task_count}}', '1')
    .replaceAll('{{acceptance_list}}', '- [ ] ');
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.id || !args.name) {
    fail('用法: node scripts/scaffold-feature.js --id FEAT-123 --name 功能名称 [--track simple|standard] [--root /path] [--force]');
  }

  if (!TRACKS[args.track]) {
    fail('--track 允许值: simple, standard');
  }

  const featureId = sanitizeSegment(args.id);
  const featureName = sanitizeSegment(args.name);
  const date = new Date().toISOString().slice(0, 10);
  const featureDir = path.join(args.root, 'features', `${featureId}-${featureName}`);

  fs.mkdirSync(featureDir, { recursive: true });
  fs.mkdirSync(path.join(featureDir, 'notepads'), { recursive: true });

  const trackConfig = TRACKS[args.track];
  const ctx = {
    featureId,
    featureName,
    date,
    track: args.track,
    trackLabel: args.track.charAt(0).toUpperCase() + args.track.slice(1),
    mode: trackConfig.mode,
    phase: 'PLAN'
  };

  const learningsPath = path.join(featureDir, 'notepads', 'learnings.md');
  fs.writeFileSync(learningsPath, [
    '# 【' + featureId + '】Learnings',
    '',
    '> 自动生成 | 最后更新: ' + date,
    '',
    '## 执行记录',
    ''
  ].join('\n'));

  for (const [outputName, templateName] of trackConfig.templates) {
    const dest = path.join(featureDir, outputName);
    if (fs.existsSync(dest) && !args.force) continue;
    const rendered = render(fs.readFileSync(path.join(TEMPLATE_DIR, templateName), 'utf8'), ctx);
    fs.writeFileSync(dest, rendered);
  }

  console.log('Feature 骨架已创建:');
  console.log(featureDir);
  console.log('track=' + args.track + ', mode=' + ctx.mode);
}

main();
