#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { root: process.cwd(), status: 'done' };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') { args.root = path.resolve(argv[i + 1]); i += 1; continue; }
    if (arg === '--feature') { args.feature = argv[i + 1]; i += 1; continue; }
    if (arg === '--task') { args.task = argv[i + 1]; i += 1; continue; }
    if (arg === '--wave') { args.wave = argv[i + 1]; i += 1; continue; }
    if (arg === '--status') { args.status = String(argv[i + 1] || 'done').toLowerCase(); i += 1; continue; }
    if (arg === '--blocker') { args.blocker = argv[i + 1] || ''; i += 1; continue; }
    if (arg === '--clear-blockers') { args.clearBlockers = true; continue; }
    if (arg === '--next-step') { args.nextStep = argv[i + 1] || ''; i += 1; continue; }
  }
  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function featureDir(root, feature) {
  if (!feature) {
    fail('缺少 --feature');
  }
  const normalized = feature.replace(/\\/g, '/');
  if (normalized.startsWith('features/')) {
    return path.resolve(root, normalized);
  }
  return path.resolve(root, 'features', normalized);
}

function replaceTaskLine(line, status, taskId) {
  if (!line.includes(taskId + ' ')) {
    return line;
  }
  return line.replace(/^- \[[ x]\]/, status === 'done' ? '- [x]' : '- [ ]');
}

function main() {
  const args = parseArgs(process.argv);
  const statePath = path.join(featureDir(args.root, args.feature), 'STATE.md');
  if (!fs.existsSync(statePath)) {
    fail('缺少 STATE.md: ' + statePath);
  }

  const lines = fs.readFileSync(statePath, 'utf8').split('\n');
  const today = new Date().toISOString().slice(0, 10);
  const summaryIndex = lines.findIndex(line => line.startsWith('> 最后更新: '));
  if (summaryIndex !== -1) {
    lines[summaryIndex] = lines[summaryIndex].replace(/最后更新:\s*\d{4}-\d{2}-\d{2}/, '最后更新: ' + today);
  }

  if (args.task) {
    for (let i = 0; i < lines.length; i += 1) {
      lines[i] = replaceTaskLine(lines[i], args.status, args.task);
    }
  }

  if (args.wave) {
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].trim() === '### Wave ' + args.wave + ' PENDING' && args.status === 'done') {
        lines[i] = '### Wave ' + args.wave + ' DONE';
      } else if (lines[i].trim() === '### Wave ' + args.wave + ' DONE' && args.status !== 'done') {
        lines[i] = '### Wave ' + args.wave + ' PENDING';
      }
    }
  }

  const blockersIndex = lines.findIndex(line => line.trim() === '## 阻塞 / 偏差');
  if (blockersIndex !== -1) {
    if (args.clearBlockers) {
      let endIndex = blockersIndex + 2;
      while (endIndex < lines.length && !/^##\s+/.test(lines[endIndex])) {
        endIndex += 1;
      }
      lines.splice(blockersIndex + 2, endIndex - (blockersIndex + 2), '- 无', '');
    } else if (args.blocker) {
      const targetIndex = blockersIndex + 2;
      if (lines[targetIndex] && lines[targetIndex].trim() === '- 无') {
        lines[targetIndex] = '- ' + args.blocker;
      } else {
        lines.splice(targetIndex, 0, '- ' + args.blocker);
      }
    }
  }

  const nextStepIndex = lines.findIndex(line => line.trim() === '## 下一步');
  if (nextStepIndex !== -1 && args.nextStep) {
    const insertIndex = nextStepIndex + 2;
    lines.splice(insertIndex, 0, '- ' + args.nextStep);
  }

  fs.writeFileSync(statePath, lines.join('\n'));
  console.log('STATE.md 已更新: ' + statePath);
}

main();
