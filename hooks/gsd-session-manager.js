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
    fs.unlinkSync(snapshotPath);
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

  message += '\n恢复方法：读取 features/' + (snapshot.feature_id || '?') + '/STATE.md 从断点继续。';

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
  const stateMdPath = path.join(cwd, 'features', featureId, 'STATE.md');

  if (!fs.existsSync(stateMdPath)) {
    ensureFeatureDir(cwd, featureId);
    process.exit(0);
  }

  const summary = extractSummaryFromState(fs.readFileSync(stateMdPath, 'utf8'));

  const state = {
    session_id: data.session_id,
    feature_id: featureId,
    feature_path: 'features/' + featureId,
    current_wave: detectCurrentWave(cwd, featureId),
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
  const stateMdPath = path.join(cwd, 'features', featureId, 'STATE.md');
  const summary = fs.existsSync(stateMdPath)
    ? extractSummaryFromState(fs.readFileSync(stateMdPath, 'utf8'))
    : {};

  try {
    fs.writeFileSync(snapshotPath, JSON.stringify({
      session_id: data.session_id,
      feature_id: featureId,
      feature_path: 'features/' + featureId,
      current_wave: detectCurrentWave(cwd, featureId),
      timestamp: Math.floor(Date.now() / 1000),
      hook: 'PreCompact'
    }, null, 2));
  } catch (e) {}

  writeNotepad(cwd, featureId, summary);

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreCompact",
      additionalContext: '压缩前已快照：Feature ' + featureId + ', Wave ' + detectCurrentWave(cwd, featureId) +
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
        const stateFile = path.join(featuresDir, entry.name, 'STATE.md');
        if (fs.existsSync(stateFile)) {
          const stat = fs.statSync(stateFile);
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

function detectCurrentWave(cwd, featureId) {
  try {
    const stateFile = path.join(cwd, 'features', featureId || detectCurrentFeature(cwd), 'STATE.md');
    if (fs.existsSync(stateFile)) {
      const content = fs.readFileSync(stateFile, 'utf8');
      const match = content.match(/当前 Wave:\s*(\d+)/);
      if (match) return parseInt(match[1]);
    }
  } catch (e) {}
  return 1;
}

function extractSummaryFromState(content) {
  const result = { blockers: [], decisions: [] };

  const phaseMatch = content.match(/-\s*当前阶段:\s*(.+)/);
  if (phaseMatch) result.phase = phaseMatch[1].trim();

  const waveMatch = content.match(/-\s*当前 Wave:\s*(\d+)\s*\/\s*(\d+)/);
  if (waveMatch) { result.wave = waveMatch[1]; result.total_waves = waveMatch[2]; }

  const completed = (content.match(/\[x\]/g) || []).length;
  const pending = (content.match(/\[ \]/g) || []).length;
  result.completed_tasks = completed;
  result.total_tasks = completed + pending;

  const blockerSection = content.match(/## 阻塞\s*\n([\s\S]*?)(?=\n##|\n$|$)/);
  if (blockerSection) {
    result.blockers = blockerSection[1].split('\n')
      .filter(l => l.trim() && l.trim() !== '无')
      .map(l => l.replace(/^-\s*/, '').trim()).filter(Boolean);
  }

  const lastActionMatch = content.match(/## 上次操作\s*\n([\s\S]*?)(?=\n##|\n$|$)/);
  if (lastActionMatch) {
    const lines = lastActionMatch[1].split('\n').filter(l => l.trim().startsWith('-'));
    if (lines.length > 0) result.last_action = lines[0].replace(/^-\s*/, '').trim();
  }

  const waveAltMatch = content.match(/Wave:\s*(\d+)\s*\/\s*(\d+)/);
  if (!waveMatch && waveAltMatch) { result.wave = waveAltMatch[1]; result.total_waves = waveAltMatch[2]; }

  const taskAltMatch = content.match(/任务[：:]\s*(\d+)\s*\/\s*(\d+)/);
  if (result.total_tasks === 0 && taskAltMatch) {
    result.completed_tasks = parseInt(taskAltMatch[1]);
    result.total_tasks = parseInt(taskAltMatch[2]);
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
