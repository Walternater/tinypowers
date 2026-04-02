#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(ROOT, 'configs', 'templates');
const ARTIFACTS = [
  { label: 'PRD', file: 'PRD.md' },
  { label: '技术方案', file: '技术方案.md' },
  { label: '任务拆解表', file: '任务拆解表.md' },
  { label: '生命周期状态', file: 'SPEC-STATE.md', status: 'active' },
  { label: 'STATE（复杂执行可选）', file: 'STATE.md', status: 'optional' },
  { label: '验证报告', file: 'VERIFICATION.md' }
];
const TRACKS = {
  standard: {
    templates: [
      ['SPEC-STATE.md', 'spec-state.md'],
      ['PRD.md', 'prd-template.md'],
      ['技术方案.md', 'tech-design.md'],
      ['任务拆解表.md', 'task-breakdown.md']
    ]
  },
  medium: {
    templates: [
      ['SPEC-STATE.md', 'spec-state.md'],
      ['PRD.md', 'prd-template.md'],
      ['技术方案.md', 'tech-design-medium.md'],
      ['任务拆解表.md', 'task-breakdown-medium.md']
    ]
  },
  fast: {
    templates: [
      ['SPEC-STATE.md', 'spec-state.md'],
      ['PRD.md', 'prd-template.md'],
      ['技术方案.md', 'tech-design-fast.md'],
      ['任务拆解表.md', 'task-breakdown-fast.md']
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
    .replaceAll('{{feature_id}}', ctx.featureId)
    .replaceAll('{{feature_name}}', ctx.featureName)
    .replaceAll('{{date}}', ctx.date)
    .replaceAll('{{track}}', ctx.track)
    .replaceAll('{{track_label}}', ctx.trackLabel)
    .replaceAll('{Feature ID}', ctx.featureId)
    .replaceAll('{date}', ctx.date)
    .replaceAll('{phase}', 'PLAN');
}

function artifactStatus(featureDir, artifact, track) {
  if (artifact.status) {
    return artifact.status;
  }
  return fs.existsSync(path.join(featureDir, artifact.file)) ? 'done' : 'pending';
}

function syncSpecStateArtifacts(specStatePath, featureDir, track) {
  if (!fs.existsSync(specStatePath)) {
    return;
  }

  const header = '| 产物 | 路径 | 状态 |';
  const lines = fs.readFileSync(specStatePath, 'utf8').split('\n');
  const startIndex = lines.findIndex(line => line.trim() === header);
  if (startIndex === -1) {
    return;
  }

  let endIndex = startIndex + 2;
  while (endIndex < lines.length && lines[endIndex].startsWith('|')) {
    endIndex += 1;
  }

  const table = [
    header,
    '|------|------|------|',
    ...ARTIFACTS.map(artifact => `| ${artifact.label} | ${artifact.file} | ${artifactStatus(featureDir, artifact, track)} |`)
  ];

  lines.splice(startIndex, endIndex - startIndex, ...table);
  fs.writeFileSync(specStatePath, lines.join('\n'));
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.id || !args.name) {
    fail('用法: node scripts/scaffold-feature.js --id CSS-1234 --name 用户登录 [--track fast|medium|standard] [--root /path/to/project] [--force]');
  }

  if (!TRACKS[args.track]) {
    fail('--track 允许值: standard, medium, fast');
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
    trackLabel: { standard: 'Standard', medium: 'Medium', fast: 'Fast' }[args.track] || 'Standard'
  };

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

  for (const [outputName, templateName] of trackConfig.templates) {
    const dest = path.join(featureDir, outputName);
    if (fs.existsSync(dest) && !args.force) continue;
    const rendered = render(fs.readFileSync(path.join(TEMPLATE_DIR, templateName), 'utf8'), ctx);
    fs.writeFileSync(dest, rendered);
  }

  syncSpecStateArtifacts(path.join(featureDir, 'SPEC-STATE.md'), featureDir, args.track);

  console.log('Feature 规划骨架已创建:');
  console.log(featureDir);
  console.log('track=' + args.track);
}

main();
