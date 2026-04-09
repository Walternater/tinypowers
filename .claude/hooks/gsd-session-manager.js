#!/usr/bin/env node
// gsd-session-manager.js
// Session lifecycle: Stop / PreCompact / SessionStart

const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK_TYPE = process.argv[2] || 'SessionStart';

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 5000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id || 'default';
    const cwd = data.workspace?.cwd || process.cwd();
    const snapshotPath = path.join(os.tmpdir(), `tinypowers-session-${sessionId}.json`);

    if (HOOK_TYPE === 'SessionStart') handleSessionStart(snapshotPath, cwd);
    else if (HOOK_TYPE === 'Stop') handleStop(data, snapshotPath, cwd);
    else if (HOOK_TYPE === 'PreCompact') handlePreCompact(data, snapshotPath, cwd);
  } catch (e) {
    process.exit(0);
  }
});

function handleSessionStart(snapshotPath, cwd) {
  if (!fs.existsSync(snapshotPath)) process.exit(0);

  let snapshot;
  try {
    snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  } catch (e) {
    fs.unlinkSync(snapshotPath);
    process.exit(0);
  }

  const now = Math.floor(Date.now() / 1000);
  if (snapshot.timestamp && (now - snapshot.timestamp) > 86400) {
    fs.unlinkSync(snapshotPath);
    process.exit(0);
  }
  if (snapshot.feature_path && !fs.existsSync(path.join(cwd, snapshot.feature_path))) {
    try {
      fs.unlinkSync(snapshotPath);
    } catch (e) {
      // Ignore deletion failure
    }
    process.exit(0);
  }

  const s = snapshot.summary || {};
  const progressPct = s.total_tasks > 0 ? Math.round((s.completed_tasks / s.total_tasks) * 100) : 0;
  let message = '检测到上次会话未完成：\n' +
    'Feature: ' + (snapshot.feature_id || '未知') + '\n' +
    '阶段: ' + (s.phase || '未知') + '\n' +
    '进度: ' + progressBar(progressPct) + ' ' + (s.completed_tasks || 0) + '/' + (s.total_tasks || 0) + '\n' +
    'Wave: ' + (s.wave || '?') + '/' + (s.total_waves || '?') + '\n' +
    '最后: ' + (s.last_action || '无') + '\n';

  if (s.blockers && s.blockers.length > 0) {
    message += '阻塞: ' + s.blockers.join(', ') + '\n';
  }

  message += '\n恢复方法：读取 features/' + (snapshot.feature_id || '?') + '/SPEC-STATE.md 从断点继续。';

  const notepadPath = path.join(cwd, '.tinypowers', 'notepad.md');
  if (fs.existsSync(notepadPath)) {
    message += '\n\n---\n.tinypowers/notepad.md 已存在，读取可获取压缩前状态。';
  }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: message }
  }));
}

function handleStop(data, snapshotPath, cwd) {
  const featuresDir = path.join(cwd, 'features');
  if (!fs.existsSync(featuresDir)) process.exit(0);

  const featureId = detectCurrentFeature(cwd, featuresDir);
  const specStatePath = path.join(cwd, 'features', featureId, 'SPEC-STATE.md');

  if (!fs.existsSync(specStatePath)) {
    ensureFeatureDir(cwd, featureId);
    process.exit(0);
  }

  const summary = extractSummaryFromSpecState(fs.readFileSync(specStatePath, 'utf8'), cwd, featureId);

  const state = {
    session_id: data.session_id,
    feature_id: featureId,
    feature_path: 'features/' + featureId,
    current_wave: summary.wave || 1,
    timestamp: Math.floor(Date.now() / 1000),
    summary: {
      phase: summary.phase || 'unknown',
      wave: summary.wave || '?',
      total_waves: summary.total_waves || '?',
      completed_tasks: summary.completed_tasks || 0,
      total_tasks: summary.total_tasks || 0,
      blockers: summary.blockers || [],
      last_action: summary.last_action || ''
    }
  };

  try {
    fs.writeFileSync(snapshotPath, JSON.stringify(state, null, 2));
  } catch (e) {}

  writeNotepad(cwd, featureId, summary);
}

function writeNotepad(cwd, featureId, summary) {
  const lines = [
    '# Session Recovery', '',
    'Feature: ' + featureId,
    'Phase: ' + (summary.phase || 'unknown'),
    'Wave: ' + (summary.wave || '?') + '/' + (summary.total_waves || '?'),
    'Tasks: ' + (summary.completed_tasks || 0) + '/' + (summary.total_tasks || 0),
    'Updated: ' + new Date().toLocaleString(), ''
  ];
  if (summary.blockers && summary.blockers.length > 0) {
    lines.push('Blockers:');
    for (const b of summary.blockers) lines.push('- ' + b);
    lines.push('');
  }
  if (summary.last_action) lines.push('Next: ' + summary.last_action);

  const notepadPath = path.join(cwd, '.tinypowers', 'notepad.md');
  try {
    fs.mkdirSync(path.dirname(notepadPath), { recursive: true });
    fs.writeFileSync(notepadPath, lines.join('\n') + '\n');
  } catch (e) {}
}

function handlePreCompact(data, snapshotPath, cwd) {
  const featuresDir = path.join(cwd, 'features');
  const featureId = detectCurrentFeature(cwd, featuresDir);
  const specStatePath = path.join(cwd, 'features', featureId, 'SPEC-STATE.md');
  const summary = fs.existsSync(specStatePath)
    ? extractSummaryFromSpecState(fs.readFileSync(specStatePath, 'utf8'), cwd, featureId)
    : {};

  try {
    fs.writeFileSync(snapshotPath, JSON.stringify({
      session_id: data.session_id,
      feature_id: featureId,
      feature_path: 'features/' + featureId,
      current_wave: summary.wave || 1,
      timestamp: Math.floor(Date.now() / 1000),
      hook: 'PreCompact'
    }, null, 2));
  } catch (e) {}

  writeNotepad(cwd, featureId, summary);

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreCompact",
      additionalContext: '压缩前已快照：Feature ' + featureId + ', Wave ' + (summary.wave || '?') +
        '\n.tinypowers/notepad.md 已更新。'
    }
  }));
}

function detectCurrentFeature(cwd, featuresDir) {
  try {
    const { execSync } = require('child_process');
    const branch = execSync('git branch --show-current', { cwd, encoding: 'utf8', timeout: 5000 }).trim();
    if (branch && branch.startsWith('feature/')) {
      const featureDirs = featuresDir && fs.existsSync(featuresDir)
        ? fs.readdirSync(featuresDir, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name)
        : [];
      const matched = matchFeatureFromBranch(branch, featureDirs);
      if (matched) return matched;

      return branch.replace('feature/', '').replace(/\//g, '-');
    }
  } catch (e) {}

  if (featuresDir && fs.existsSync(featuresDir)) {
    let latestFeature = null;
    let latestMtime = 0;
    for (const entry of fs.readdirSync(featuresDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const specState = path.join(featuresDir, entry.name, 'SPEC-STATE.md');
        if (fs.existsSync(specState)) {
          const content = fs.readFileSync(specState, 'utf8');
          const phase = extractPhase(content);
          if (phase === 'DONE') continue;

          const stat = fs.statSync(specState);
          if (stat.mtimeMs > latestMtime) {
            latestMtime = stat.mtimeMs;
            latestFeature = entry.name;
          }
        }
      }
    }
    if (latestFeature) return latestFeature;
  }

  return 'unknown';
}

function matchFeatureFromBranch(branch, featureDirs) {
  if (!branch.startsWith('feature/')) return null;

  const raw = branch.replace('feature/', '');
  const normalized = raw.replace(/\//g, '-');
  const idPrefix = raw.split('/')[0];

  if (featureDirs.includes(raw)) return raw;
  if (featureDirs.includes(normalized)) return normalized;

  const prefixMatches = featureDirs.filter(name => name === idPrefix || name.startsWith(idPrefix + '-'));
  if (prefixMatches.length === 1) return prefixMatches[0];

  return null;
}

function extractPhase(content) {
  const match = content.match(/phase:\s*(INIT|REQ|DESIGN|TASKS|PLAN|EXEC|REVIEW|VERIFY|CLOSED|DONE)/);
  if (!match) return null;
  const aliases = {
    INIT: 'PLAN', REQ: 'PLAN', DESIGN: 'PLAN', TASKS: 'PLAN', PLAN: 'PLAN',
    EXEC: 'EXEC', REVIEW: 'REVIEW', VERIFY: 'REVIEW', CLOSED: 'DONE', DONE: 'DONE'
  };
  return aliases[match[1]] || null;
}

function extractSummaryFromSpecState(content, cwd, featureId) {
  const result = { blockers: [], decisions: [] };

  const phase = extractPhase(content);
  if (phase) result.phase = phase;

  const waveMatch = content.match(/current_wave:\s*(\d+)\s*\/\s*(\d+)/);
  if (waveMatch) { result.wave = waveMatch[1]; result.total_waves = waveMatch[2]; }

  const taskBreakdownPath = path.join(cwd, 'features', featureId, '任务拆解表.md');
  if (fs.existsSync(taskBreakdownPath)) {
    const taskContent = fs.readFileSync(taskBreakdownPath, 'utf8');
    const completed = (taskContent.match(/\[x\]/g) || []).length;
    const pending = (taskContent.match(/\[ \]/g) || []).length;
    result.completed_tasks = completed;
    result.total_tasks = completed + pending;
  }

  const blockersMatch = content.match(/blockers:\s*(.+)/);
  if (blockersMatch && blockersMatch[1].trim() !== '无') {
    result.blockers = blockersMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  }

  return result;
}

function ensureFeatureDir(cwd, featureId) {
  const dir = path.join(cwd, 'features', featureId);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {}
}

function progressBar(pct) {
  const filled = Math.round(pct / 10);
  return '[' + '#'.repeat(filled) + '.'.repeat(10 - filled) + '] ' + pct + '%';
}
