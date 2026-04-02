#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PHASES = ['PLAN', 'EXEC', 'REVIEW', 'DONE'];
const ARTIFACTS = [
  { label: 'PRD', file: 'PRD.md' },
  { label: '技术方案', file: '技术方案.md' },
  { label: '任务拆解表', file: '任务拆解表.md' },
  { label: '生命周期状态', file: 'SPEC-STATE.md', special: 'spec-state' },
  { label: 'STATE', file: 'STATE.md', special: 'state' },
  { label: '测试报告', file: '测试报告.md' },
  { label: '验证报告', file: 'VERIFICATION.md' }
];

function parseArgs(argv) {
  const args = { root: process.cwd(), force: false, mode: 'strict' };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--feature') {
      args.feature = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--to') {
      args.to = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--note') {
      args.note = argv[i + 1];
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
    if (arg === '--mode') {
      const mode = argv[i + 1];
      if (mode !== 'strict' && mode !== 'relaxed' && mode !== 'fast') {
        fail('--mode 允许值: strict, relaxed, fast');
      }
      args.mode = mode;
      i += 1;
    }
  }
  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function featureDirFromArg(root, feature) {
  if (!feature) {
    fail('缺少 --feature');
  }

  const normalized = feature.replace(/\\/g, '/');
  if (normalized.startsWith('features/')) {
    return path.resolve(root, normalized);
  }
  if (normalized.includes('/')) {
    return path.resolve(root, normalized);
  }
  return path.resolve(root, 'features', normalized);
}

function phaseIndex(phase) {
  return PHASES.indexOf(phase);
}

function getCurrentPhase(content) {
  const match = content.match(/phase:\s*(PLAN|EXEC|REVIEW|DONE)/);
  if (!match) {
    fail('SPEC-STATE.md 中缺少合法的 phase');
  }
  return match[1];
}

function getCurrentMode(content) {
  const match = content.match(/mode:\s*(strict|relaxed|fast)/);
  return match ? match[1] : 'strict';
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content);
}

function ensureStateFile(featureDir, context) {
  const statePath = path.join(featureDir, 'STATE.md');
  if (fs.existsSync(statePath)) {
    return;
  }

  const templatePath = path.join(ROOT, 'configs', 'templates', 'state.md');
  if (!fs.existsSync(templatePath)) {
    return;
  }

  const rendered = read(templatePath)
    .replaceAll('{{feature_id}}', context.featureId)
    .replaceAll('{{feature_name}}', context.featureName)
    .replaceAll('{{date}}', context.date);
  write(statePath, rendered);
}

function validatePrerequisites(featureDir, targetPhase, note, force) {
  if (force) {
    return;
  }

  const checks = {
    EXEC() {
      const filePath = path.join(featureDir, '任务拆解表.md');
      return fs.existsSync(filePath) && read(filePath).trim().length > 0
        ? null
        : '进入 EXEC 需要 任务拆解表.md 存在且非空';
    },
    REVIEW() {
      const filePath = path.join(featureDir, 'STATE.md');
      return fs.existsSync(filePath)
        ? null
        : '进入 REVIEW 需要 STATE.md 已存在';
    },
    DONE() {
      const filePath = path.join(featureDir, 'VERIFICATION.md');
      return fs.existsSync(filePath) && /(PASS|通过)/.test(read(filePath))
        ? null
        : '进入 DONE 需要 VERIFICATION.md 存在且结论为 PASS/通过';
    }
  };

  const checker = checks[targetPhase];
  if (!checker) {
    return;
  }

  const error = checker();
  if (error) {
    fail(error);
  }
}

function updatePhaseBlock(content, targetPhase, date) {
  return content
    .replace(/^> 最后更新: .*?\| 当前阶段: .*$/m, `> 最后更新: ${date} | 当前阶段: ${targetPhase}`)
    .replace(/phase:\s*(PLAN|EXEC|REVIEW|DONE)/, `phase: ${targetPhase}`)
    .replace(/updated:\s*[^\n]+/, `updated: ${date}`);
}

function appendHistoryRow(content, currentPhase, targetPhase, date, note) {
  const row = `| ${date} | ${currentPhase} | ${targetPhase} | ${note || '阶段推进'} |`;
  const lines = content.split('\n');
  const historyHeaderIndex = lines.findIndex(line => line.trim() === '## 阶段历史');
  if (historyHeaderIndex === -1) {
    return content.endsWith('\n')
      ? `${content}${row}\n`
      : `${content}\n${row}\n`;
  }

  // Find the table header (|------|-----|-----|------|) and insert after it
  let insertIndex = historyHeaderIndex + 1;
  // Skip the column header row (| 时间 | 从 | 到 | 备注 |)
  if (insertIndex < lines.length && lines[insertIndex].trim().startsWith('|')) {
    insertIndex += 1;
  }
  // Skip the separator row (|------|-----|-----|------|)
  if (insertIndex < lines.length && lines[insertIndex].trim().startsWith('|-')) {
    insertIndex += 1;
  }

  lines.splice(insertIndex, 0, row);
  return lines.join('\n');
}

function artifactStatus(featureDir, artifact, currentPhase) {
  if (artifact.special === 'spec-state') {
    return 'active';
  }
  if (artifact.special === 'state') {
    return phaseIndex(currentPhase) >= phaseIndex('EXEC') && fs.existsSync(path.join(featureDir, artifact.file))
      ? 'active'
      : 'pending';
  }
  return fs.existsSync(path.join(featureDir, artifact.file)) ? 'done' : 'pending';
}

function rewriteArtifactTable(content, featureDir, currentPhase) {
  const header = '| 产物 | 路径 | 状态 |';
  const start = content.indexOf(header);
  if (start === -1) {
    return content;
  }

  const lines = content.split('\n');
  const startIndex = lines.findIndex(line => line.trim() === header);
  if (startIndex === -1) {
    return content;
  }

  let endIndex = startIndex + 2;
  while (endIndex < lines.length && lines[endIndex].startsWith('|')) {
    endIndex += 1;
  }

  const table = [
    header,
    '|------|------|------|',
    ...ARTIFACTS.map(artifact => `| ${artifact.label} | ${artifact.file} | ${artifactStatus(featureDir, artifact, currentPhase)} |`)
  ];

  lines.splice(startIndex, endIndex - startIndex, ...table);
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv);
  const targetPhase = String(args.to || '').trim().toUpperCase();
  if (!PHASES.includes(targetPhase)) {
    fail('缺少合法的 --to，允许值: ' + PHASES.join(', '));
  }

  const featureDir = featureDirFromArg(args.root, args.feature);
  const specStatePath = path.join(featureDir, 'SPEC-STATE.md');
  if (!fs.existsSync(specStatePath)) {
    fail('缺少 SPEC-STATE.md: ' + specStatePath);
  }

  const featureName = path.basename(featureDir);
  const content = read(specStatePath);
  const currentPhase = getCurrentPhase(content);
  const fileMode = getCurrentMode(content);
  const currentIndex = phaseIndex(currentPhase);
  const targetIndex = phaseIndex(targetPhase);

  const effectiveMode = args.mode !== 'strict' || fileMode === 'relaxed' || fileMode === 'fast'
    ? args.mode !== 'strict' ? args.mode : fileMode
    : args.mode;

  if (targetIndex === -1) {
    fail('目标 phase 非法: ' + targetPhase);
  }

  if (targetIndex === currentIndex) {
    console.log('SPEC-STATE 已经是目标阶段: ' + targetPhase);
    return;
  }

  const isStrict = effectiveMode === 'strict';

  if (isStrict && !args.force && targetIndex !== currentIndex + 1) {
    fail(`禁止跳步: ${currentPhase} -> ${targetPhase}。如需强制推进，添加 --force 或 --mode relaxed`);
  }

  if (isStrict) {
    validatePrerequisites(featureDir, targetPhase, args.note, args.force);
  }

  const date = new Date().toISOString().slice(0, 10);
  const context = {
    featureId: featureName.split('-').slice(0, 2).join('-'),
    featureName,
    date
  };

  if (targetPhase === 'EXEC') {
    ensureStateFile(featureDir, context);
  }

  let next = updatePhaseBlock(content, targetPhase, date);
  next = appendHistoryRow(next, currentPhase, targetPhase, date, args.note || '阶段推进');
  next = rewriteArtifactTable(next, featureDir, targetPhase);
  write(specStatePath, next);

  console.log(`SPEC-STATE 已更新: ${currentPhase} -> ${targetPhase}`);
  console.log(specStatePath);
}

main();
