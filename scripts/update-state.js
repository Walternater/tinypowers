#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { root: process.cwd() };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--feature') { args.feature = argv[i + 1]; i += 1; continue; }
    if (arg === '--task') { args.task = argv[i + 1]; i += 1; continue; }
    if (arg === '--wave') { args.wave = argv[i + 1]; i += 1; continue; }
    if (arg === '--done') { args.done = true; continue; }
    if (arg === '--block') { args.block = argv[i + 1]; i += 1; continue; }
    if (arg === '--root') { args.root = path.resolve(argv[i + 1]); i += 1; continue; }
  }
  return args;
}

function fail(message) { console.error(message); process.exit(1); }

function featureDirFromArg(root, feature) {
  if (!feature) fail('缺少 --feature');
  const normalized = feature.replace(/\\/g, '/');
  if (normalized.startsWith('features/')) return path.resolve(root, normalized);
  if (normalized.includes('/')) return path.resolve(root, normalized);
  return path.resolve(root, 'features', normalized);
}

function read(filePath) { return fs.readFileSync(filePath, 'utf8'); }
function write(filePath, content) { fs.writeFileSync(filePath, content); }

function main() {
  const args = parseArgs(process.argv);
  const featureDir = featureDirFromArg(args.root, args.feature);
  const statePath = path.join(featureDir, 'STATE.md');

  if (!fs.existsSync(statePath)) {
    // Auto-generate from task breakdown
    const taskPath = path.join(featureDir, '任务拆解表.md');
    if (!fs.existsSync(taskPath)) fail('STATE.md 不存在且无 任务拆解表.md 可参考');
    generateFromTaskBreakdown(featureDir, statePath, taskPath);
    return;
  }

  let content = read(statePath);
  const date = new Date().toISOString().slice(0, 10);

  if (args.task && args.done) {
    content = content.replace(
      new RegExp(`(\\|\\s*\\d+\\s*\\|\\s*${args.task}\\s*\\|)\\s*pending`, 'g'),
      `$1 completed`
    );
    content = content.replace(
      new RegExp(`(- \\[ \\] ${args.task})`, 'g'),
      `- [x] ${args.task}`
    );
    console.log(`任务 ${args.task} 已标记为 completed`);
  }

  if (args.wave) {
    content = content.replace(
      /current_wave:\s*\d+/,
      `current_wave: ${args.wave}`
    );
    console.log(`Wave 已更新为 ${args.wave}`);
  }

  if (args.block) {
    content = content.replace(
      /## 阻塞项\n\n无。/,
      `## 阻塞项\n\n- ${args.block}`
    );
    console.log(`阻塞项已记录: ${args.block}`);
  }

  content = content.replace(
    /> 最后更新: .*?\| 当前阶段: .*$/,
    `> 最后更新: ${date} | 当前阶段: EXEC`
  );
  content = content.replace(
    /updated:\s*[^\n]+/,
    `updated: ${date}`
  );

  write(statePath, content);
  console.log('STATE.md 已更新: ' + statePath);
}

function generateFromTaskBreakdown(featureDir, statePath, taskPath) {
  const content = read(taskPath);
  const lines = content.split('\n');
  const tasks = [];
  let inTable = false;

  for (const line of lines) {
    if (line.includes('任务明细') || line.includes('Task 明细') || line.includes('Story / Task 明细')) {
      inTable = true; continue;
    }
    if (inTable && line.startsWith('|') && line.includes('T-')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells[0] && cells[0].match(/^T-\d+$/)) {
        tasks.push({ id: cells[0], name: cells[1] || '' });
      }
    }
    if (inTable && !line.startsWith('|') && line.trim()) break;
  }

  const featureId = path.basename(featureDir).split('-').slice(0, 2).join('-');
  const date = new Date().toISOString().slice(0, 10);

  const stateLines = [
    `# STATE: ${featureId}`,
    '',
    `> 最后更新: ${date} | 当前阶段: EXEC`,
    '',
    '## 执行状态',
    '',
    '```yaml',
    'phase: EXEC',
    'current_wave: 1',
    `updated: ${date}`,
    '```',
    '',
    '## Wave 进度',
    '',
    '| Wave | 任务 | 状态 |',
    '|------|------|------|',
  ];

  for (const task of tasks) {
    stateLines.push(`| - | ${task.id} ${task.name} | pending |`);
  }

  stateLines.push('');
  stateLines.push('## 偏差记录');
  stateLines.push('');
  stateLines.push('无。');
  stateLines.push('');
  stateLines.push('## 阻塞项');
  stateLines.push('');
  stateLines.push('无。');
  stateLines.push('');

  write(statePath, stateLines.join('\n'));
  console.log('STATE.md 已从任务拆解表自动生成:');
  console.log(statePath);
}

main();
