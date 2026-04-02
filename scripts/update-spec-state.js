#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PHASES = ['PLAN', 'EXEC', 'REVIEW', 'DONE'];
const PHASE_ALIASES = {
  INIT: 'PLAN',
  REQ: 'PLAN',
  DESIGN: 'PLAN',
  TASKS: 'PLAN',
  PLAN: 'PLAN',
  EXEC: 'EXEC',
  REVIEW: 'REVIEW',
  VERIFY: 'REVIEW',
  CLOSED: 'DONE',
  DONE: 'DONE'
};
const ARTIFACTS = [
  { label: 'PRD', file: 'PRD.md' },
  { label: '技术方案', file: '技术方案.md' },
  { label: '任务拆解表', file: '任务拆解表.md' },
  { label: '生命周期状态', file: 'SPEC-STATE.md', special: 'spec-state' },
  { label: 'STATE', file: 'STATE.md', special: 'state' },
  { label: '验证报告', file: 'VERIFICATION.md' }
];
const TRACKS = ['standard', 'medium', 'fast'];

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
      if (mode !== 'strict' && mode !== 'relaxed') {
        fail('--mode 允许值: strict, relaxed');
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

function canonicalPhase(phase) {
  return PHASE_ALIASES[String(phase || '').trim().toUpperCase()] || null;
}

function getCurrentPhase(content) {
  const match = content.match(/phase:\s*(INIT|REQ|DESIGN|TASKS|PLAN|EXEC|REVIEW|VERIFY|CLOSED|DONE)/);
  if (!match) {
    fail('SPEC-STATE.md 中缺少合法的 phase');
  }
  return canonicalPhase(match[1]);
}

function getCurrentMode(content) {
  const match = content.match(/mode:\s*(strict|relaxed)/);
  return match ? match[1] : 'strict';
}

function getCurrentTrack(content) {
  const match = content.match(/track:\s*(standard|medium|fast)/);
  return match ? match[1] : 'standard';
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content);
}

function parseMarkdownTableRows(content) {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('|') && line.endsWith('|'))
    .map(line => line.slice(1, -1).split('|').map(cell => cell.trim()));
}

function normalizeTask(task) {
  return task.replace(/\(P\)/g, '').trim();
}

function extractTaskRows(taskBreakdown) {
  const rows = parseMarkdownTableRows(taskBreakdown);
  const tasks = [];

  for (const cells of rows) {
    if (cells.length < 2) {
      continue;
    }

    const id = cells[0];
    if (!/^T-\d+/i.test(id)) {
      continue;
    }

    if (cells.length >= 6 && /^Task$/i.test(cells[1])) {
      tasks.push({
        id,
        name: cells[2] || '未命名任务',
        acceptance: cells[5] || '',
        files: cells[6] || ''
      });
      continue;
    }

    tasks.push({
      id,
      name: cells[1] || '未命名任务',
      acceptance: cells[3] || '',
      files: cells[4] || ''
    });
  }

  return tasks;
}

function extractSuggestedWaves(taskBreakdown, tasks) {
  const rows = parseMarkdownTableRows(taskBreakdown);
  const waves = [];

  for (const cells of rows) {
    if (cells.length < 2) {
      continue;
    }

    const first = cells[0];
    if (!/^\d+$/.test(first) && !/^Wave\s*\d+$/i.test(first)) {
      continue;
    }

    const waveNumber = /^\d+$/.test(first)
      ? first
      : (first.match(/\d+/) || ['1'])[0];
    const includedTasks = (cells[1] || '')
      .split(',')
      .map(normalizeTask)
      .filter(Boolean)
      .filter(item => /^T-\d+/i.test(item));

    if (includedTasks.length === 0) {
      continue;
    }

    waves.push({
      number: waveNumber,
      tasks: includedTasks
    });
  }

  if (waves.length > 0) {
    return waves;
  }

  if (tasks.length === 0) {
    return [];
  }

  return [{
    number: '1',
    tasks: tasks.map(task => task.id)
  }];
}

function buildStateContent(context, track, taskBreakdown) {
  const tasks = extractTaskRows(taskBreakdown);
  const waves = extractSuggestedWaves(taskBreakdown, tasks);
  const lines = [
    '# STATE: ' + context.featureId,
    '',
    '> 最后更新: ' + context.date + ' | 当前阶段: EXEC | 执行路由: ' + track,
    '',
    '## 执行概览',
    '',
    '| 项目 | 内容 |',
    '|------|------|',
    '| Feature | `' + context.featureId + '` |',
    '| 目录 | `' + context.featureName + '` |',
    '| 执行路由 | `' + track + '` |',
    '| 当前 Wave | `1 / ' + (waves.length || 1) + '` |',
    '',
    '## 进度'
  ];

  if (waves.length === 0) {
    lines.push('', '### Wave 1 PENDING', '', '- [ ] 待根据 `任务拆解表.md` 填充');
  } else {
    for (const wave of waves) {
      lines.push('', '### Wave ' + wave.number + ' PENDING', '');
      for (const taskId of wave.tasks) {
        const task = tasks.find(item => item.id === taskId);
        if (!task) {
          lines.push('- [ ] ' + taskId);
          continue;
        }

        const details = [];
        if (task.files) {
          details.push('files: ' + task.files);
        }
        if (task.acceptance) {
          details.push('验收: ' + task.acceptance);
        }
        const suffix = details.length > 0 ? ' (' + details.join(' | ') + ')' : '';
        lines.push('- [ ] ' + task.id + ' ' + task.name + suffix);
      }
    }
  }

  lines.push(
    '',
    '## 决策',
    '',
    '| ID | 内容 | 日期 |',
    '|----|------|------|',
    '| D-01 | 进入执行阶段，STATE 初稿已根据任务拆解表生成 | ' + context.date + ' |',
    '',
    '## 阻塞 / 偏差',
    '',
    '- 无',
    '',
    '## 下一步',
    '',
    '- 完成当前 Wave 的首个任务',
    '- 执行过程中持续更新进度与阻塞'
  );

  return lines.join('\n') + '\n';
}

function ensureStateFile(featureDir, context) {
  const statePath = path.join(featureDir, 'STATE.md');
  if (fs.existsSync(statePath)) {
    return;
  }

  const taskBreakdownPath = path.join(featureDir, '任务拆解表.md');
  const specStatePath = path.join(featureDir, 'SPEC-STATE.md');
  const taskBreakdown = fs.existsSync(taskBreakdownPath) ? read(taskBreakdownPath) : '';
  const track = fs.existsSync(specStatePath) ? getCurrentTrack(read(specStatePath)) : 'standard';

  if (taskBreakdown.trim().length > 0) {
    write(statePath, buildStateContent(context, track, taskBreakdown));
    return;
  }

  // state.md template removed — STATE.md now generated from task breakdown only
}

function validatePrerequisites(featureDir, targetPhase, note, force, track) {
  if (force) {
    return;
  }

  const checks = {
    PLAN() {
      const prdPath = path.join(featureDir, 'PRD.md');
      return fs.existsSync(prdPath) && read(prdPath).trim().length > 0
        ? null
        : 'PLAN 阶段需要 PRD.md 存在且非空';
    },
    EXEC() {
      const prdPath = path.join(featureDir, 'PRD.md');
      const taskPath = path.join(featureDir, '任务拆解表.md');
      const designPath = path.join(featureDir, '技术方案.md');
      if (!fs.existsSync(prdPath) || read(prdPath).trim().length === 0) {
        return '进入 EXEC 需要 PRD.md 存在且非空';
      }
      if (!fs.existsSync(taskPath) || read(taskPath).trim().length === 0) {
        return '进入 EXEC 需要 任务拆解表.md 存在且非空';
      }
      if (!fs.existsSync(designPath)) {
        return '进入 EXEC 需要 技术方案.md 存在';
      }
      const designContent = read(designPath);
      if (!/(已锁定决策|决策记录|锁定决策)/.test(designContent)) {
        return '进入 EXEC 需要 技术方案.md 包含锁定决策';
      }
      // 内容实质门禁：PRD 含有实质性验收标准（非空白、非纯模板占位）
      const prdContent = read(prdPath);
      const hasAcceptanceCriteria = /(AC-\d+[：:]\s*\S|WHEN\s+\S[^`\n]+SHALL\s+\S|IF\s+\S[^`\n]+SHALL\s+\S|系统\s*SHALL\s+\S)/.test(prdContent);
      if (!hasAcceptanceCriteria) {
        return '进入 EXEC 需要 PRD.md 包含至少 1 条验收标准（AC-N: 内容 或 EARS 格式）';
      }
      const hasConfirmedDecision = /\|\s*已确认\s*\|/.test(designContent);
      if (!hasConfirmedDecision) {
        return '进入 EXEC 需要 技术方案.md 中至少 1 条决策状态为「已确认」（表格单元格中只写「已确认」，不含「/」）';
      }
      return null;
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

function ensureTransitionAllowed(currentPhase, targetPhase, track, mode, force) {
  if (force) {
    return;
  }

  const currentIndex = phaseIndex(currentPhase);
  const targetIndex = phaseIndex(targetPhase);
  const isSequential = targetIndex === currentIndex + 1;

  if (mode === 'strict') {
    if (!isSequential) {
      fail(`禁止跳步: ${currentPhase} -> ${targetPhase}。如需强制推进，添加 --force 或 --mode relaxed`);
    }
    return;
  }

  if (track !== 'fast') {
    return;
  }

  const execIndex = phaseIndex('EXEC');
  if (currentIndex < execIndex && targetIndex > execIndex && !isSequential) {
    fail(`Fast Route 只允许从 PLAN 进入 EXEC，不能直接跳到 ${targetPhase}`);
  }
  if (currentIndex >= execIndex && !isSequential) {
    fail(`进入 EXEC 后必须顺序推进: ${currentPhase} -> ${targetPhase} 不允许跳步`);
  }
}

function updatePhaseBlock(content, targetPhase, date) {
  let result = content
    .replace(/^> 最后更新: .*?\| 当前阶段: .*$/m, `> 最后更新: ${date} | 当前阶段: ${targetPhase}`)
    .replace(/phase:\s*(INIT|REQ|DESIGN|TASKS|PLAN|EXEC|REVIEW|VERIFY|CLOSED|DONE)/, `phase: ${targetPhase}`)
    .replace(/updated:\s*[^\n]+/, `updated: ${date}`);

  // 离开 PLAN 阶段时，移除 plan_step 字段（该字段仅在 PLAN 阶段有意义）
  if (targetPhase !== 'PLAN') {
    result = result.replace(/\nplan_step:[^\n]*(?:\n>[^\n]*)*/g, '');
  }

  return result;
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

  let insertIndex = historyHeaderIndex + 1;
  // Skip blank lines between header and table
  while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
    insertIndex += 1;
  }
  // Skip all table rows (column header + separator + data)
  while (insertIndex < lines.length) {
    const trimmed = lines[insertIndex].trim();
    if (!trimmed.startsWith('|')) {
      break;
    }
    insertIndex += 1;
  }

  lines.splice(insertIndex, 0, row);
  return lines.join('\n');
}

function artifactStatus(featureDir, artifact, currentPhase, track) {
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

function rewriteArtifactTable(content, featureDir, currentPhase, track) {
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
    ...ARTIFACTS.map(artifact => `| ${artifact.label} | ${artifact.file} | ${artifactStatus(featureDir, artifact, currentPhase, track)} |`)
  ];

  lines.splice(startIndex, endIndex - startIndex, ...table);
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv);
  const targetPhase = canonicalPhase(args.to);
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
  const currentTrack = getCurrentTrack(content);
  const fileMode = getCurrentMode(content);
  const currentIndex = phaseIndex(currentPhase);
  const targetIndex = phaseIndex(targetPhase);

  const effectiveMode = args.mode !== 'strict' || fileMode === 'relaxed'
    ? 'relaxed'
    : args.mode;

  if (!TRACKS.includes(currentTrack)) {
    fail('SPEC-STATE.md 中缺少合法的 track');
  }

  if (targetIndex === -1) {
    fail('目标 phase 非法: ' + targetPhase);
  }

  if (targetIndex === currentIndex) {
    console.log('SPEC-STATE 已经是目标阶段: ' + targetPhase);
    return;
  }

  ensureTransitionAllowed(currentPhase, targetPhase, currentTrack, effectiveMode, args.force);
  validatePrerequisites(featureDir, targetPhase, args.note, args.force, currentTrack);

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
  next = rewriteArtifactTable(next, featureDir, targetPhase, currentTrack);
  write(specStatePath, next);

  console.log(`SPEC-STATE 已更新: ${currentPhase} -> ${targetPhase}`);
  console.log(specStatePath);
}

main();
