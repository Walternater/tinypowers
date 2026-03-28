#!/usr/bin/env node
// gsd-session-manager.js
// Session lifecycle management: Stop / PreCompact / SessionStart
//
// Stop hook: Saves current feature progress to snapshot based on features/{id}/STATE.md
// PreCompact hook: Snapshots critical context before compaction
// SessionStart hook: Reads snapshot and restores work现场
//
// How it works:
// 1. SessionStart reads /tmp/tinypowers-session-{session_id}.json if exists
// 2. If a snapshot exists for an incomplete session, offer to resume
// 3. Stop hook saves current progress before Claude Code exits
// 4. PreCompact hook creates a snapshot before /compact

const fs = require('fs');
const os = require('os');
const path = require('path');

// Hook types
const HOOK_TYPE = process.argv[2] || 'SessionStart'; // Stop, PreCompact, SessionStart

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

    const tmpDir = os.tmpdir();
    const snapshotPath = path.join(tmpDir, `tinypowers-session-${sessionId}.json`);

    if (HOOK_TYPE === 'SessionStart') {
      handleSessionStart(data, snapshotPath, cwd);
    } else if (HOOK_TYPE === 'Stop') {
      handleStop(data, snapshotPath, cwd);
    } else if (HOOK_TYPE === 'PreCompact') {
      handlePreCompact(data, snapshotPath, cwd);
    }

  } catch (e) {
    // Silent fail
    process.exit(0);
  }
});

function handleSessionStart(data, snapshotPath, cwd) {
  // Check for incomplete session
  if (!fs.existsSync(snapshotPath)) {
    process.exit(0);
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const now = Math.floor(Date.now() / 1000);

  // Ignore stale snapshots (> 24 hours old)
  if (snapshot.timestamp && (now - snapshot.timestamp) > 86400) {
    fs.unlinkSync(snapshotPath);
    process.exit(0);
  }

  // Check if feature directory still exists
  if (snapshot.feature_path && !fs.existsSync(path.join(cwd, snapshot.feature_path))) {
    fs.unlinkSync(snapshotPath);
    process.exit(0);
  }

  // Build enhanced resume message with summary
  let message;

  if (snapshot.summary && snapshot.summary.phase !== 'unknown') {
    const s = snapshot.summary;
    const progressPct = s.total_tasks > 0
      ? Math.round((s.completed_tasks / s.total_tasks) * 100)
      : 0;
    const bar = buildProgressBar(progressPct);

    message = '检测到上次会话未完成：\n' +
      'Feature: ' + (snapshot.feature_id || '未知') + '\n' +
      '阶段: ' + (s.phase || '未知') + '\n' +
      '进度: ' + bar + ' ' + s.completed_tasks + '/' + s.total_tasks + ' Tasks\n' +
      'Wave: ' + (s.wave || '?') + ' / ' + (s.total_waves || '?') + '\n' +
      '最后操作: ' + (s.last_action || '无') + '\n' +
      '最后更新: ' + new Date(snapshot.timestamp * 1000).toLocaleString() + '\n';

    if (s.blockers && s.blockers.length > 0) {
      message += '阻塞: ' + s.blockers.join(', ') + '\n';
    }

    message += '\n恢复方法：读取 features/' + (snapshot.feature_id || '?') + '/STATE.md 从断点继续。\n' +
      '输入"恢复"继续，或"新建"重新开始。';
  } else {
    // Fallback to basic info if no summary
    message = '检测到上次会话未完成：\n' +
      '- Feature: ' + (snapshot.feature_id || '未知') + '\n' +
      '- Wave: ' + (snapshot.current_wave || '?') + ' / ' + (snapshot.total_waves || '?') + '\n' +
      '- 最后更新: ' + new Date(snapshot.timestamp * 1000).toLocaleString() + '\n' +
      '\n恢复方法：读取 features/' + (snapshot.feature_id || '?') + '/STATE.md 从断点继续。\n' +
      '输入"恢复"继续，或"新建"重新开始。';
  }

  const output = {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: message
    }
  };

  process.stdout.write(JSON.stringify(output));
}

function handleStop(data, snapshotPath, cwd) {
  // Look for active feature session
  const featuresDir = path.join(cwd, 'features');

  if (!fs.existsSync(featuresDir)) {
    process.exit(0);
  }

  // Find most recently modified feature directory
  let latestFeature = null;
  let latestMtime = 0;

  const entries = fs.readdirSync(featuresDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const featurePath = path.join(featuresDir, entry.name);
      const stateFile = path.join(featurePath, 'STATE.md');

      if (fs.existsSync(stateFile)) {
        const stat = fs.statSync(stateFile);
        if (stat.mtimeMs > latestMtime) {
          latestMtime = stat.mtimeMs;
          latestFeature = {
            id: entry.name,
            path: featurePath,
            stateFile: stateFile
          };
        }
      }
    }
  }

  const featureId = latestFeature?.id || detectCurrentFeature(cwd);
  const stateMdPath = path.join(cwd, 'features', featureId, 'STATE.md');
  const stateMdContent = fs.existsSync(stateMdPath)
    ? fs.readFileSync(stateMdPath, 'utf8')
    : null;

  // Extract summary from STATE.md if available
  const summary = stateMdContent ? extractSummaryFromState(stateMdContent) : {};

  // Idempotent snapshot: read existing and merge (overwrite summary, keep metadata)
  let existing = {};
  if (fs.existsSync(snapshotPath)) {
    try { existing = JSON.parse(fs.readFileSync(snapshotPath, 'utf8')); } catch (e) {}
  }

  // Build snapshot — summary fields are always overwritten (idempotent)
  const state = {
    session_id: data.session_id,
    feature_id: featureId,
    feature_path: 'features/' + featureId,
    current_wave: detectCurrentWave(cwd),
    timestamp: Math.floor(Date.now() / 1000),
    // Idempotent summary section (overwritten each Stop)
    summary: {
      phase: summary.phase || 'unknown',
      wave: summary.wave || '?',
      total_waves: summary.total_waves || '?',
      completed_tasks: summary.completed_tasks || 0,
      total_tasks: summary.total_tasks || 0,
      blockers: summary.blockers || [],
      decisions: summary.decisions || [],
      last_action: summary.last_action || ''
    },
    // Read existing STATE.md metadata if exists
    ...(latestFeature && fs.existsSync(latestFeature.stateFile)
      ? parseSessionFile(fs.readFileSync(latestFeature.stateFile, 'utf8'))
      : {})
  };

  fs.writeFileSync(snapshotPath, JSON.stringify(state, null, 2));
}

function handlePreCompact(data, snapshotPath, cwd) {
  // Create snapshot before compaction
  const state = {
    session_id: data.session_id,
    feature_id: detectCurrentFeature(cwd),
    feature_path: 'features/' + detectCurrentFeature(cwd),
    current_wave: detectCurrentWave(cwd),
    timestamp: Math.floor(Date.now() / 1000),
    hook: 'PreCompact'
  };

  fs.writeFileSync(snapshotPath, JSON.stringify(state, null, 2));

  const output = {
    hookSpecificOutput: {
      hookEventName: "PreCompact",
      additionalContext: `📸 上下文压缩前已快照：
- Feature: ${state.feature_id}
- Wave: ${state.current_wave}
- 时间: ${new Date().toLocaleString()}

压缩后将自动恢复现场。`
    }
  };

  process.stdout.write(JSON.stringify(output));
}

function detectCurrentFeature(cwd) {
  // Try to detect from git branch
  try {
    const branch = execSync('git branch --show-current', cwd).trim();
    if (branch && branch.startsWith('feature/')) {
      return branch.replace('feature/', '');
    }
  } catch (e) {}
  return 'unknown';
}

function detectCurrentWave(cwd) {
  // Try to detect from STATE.md
  try {
    const sessionFile = path.join(cwd, 'features', detectCurrentFeature(cwd), 'STATE.md');
    if (fs.existsSync(sessionFile)) {
      const match = fs.readFileSync(sessionFile, 'utf8').match(/当前 Wave:\s*(\d+)/);
      if (match) return parseInt(match[1]);
    }
  } catch (e) {}
  return 1;
}

function parseSessionFile(content) {
  const result = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      result[key] = value;
    }
  }
  return result;
}

function execSync(cmd, cwd) {
  const { execSync } = require('child_process');
  return execSync(cmd, { cwd, encoding: 'utf8', timeout: 5000 });
}

// --- 幂等摘要辅助函数 ---

function extractSummaryFromState(content) {
  const result = { blockers: [], decisions: [] };

  // Extract current phase from ## 位置 section (list item, not title line)
  // Match "- 当前阶段: ..." list items specifically
  const phaseMatch = content.match(/-\s*当前阶段:\s*(.+)/);
  if (phaseMatch) result.phase = phaseMatch[1].trim();

  // Extract wave info from list items
  const waveMatch = content.match(/-\s*当前 Wave:\s*(\d+)\s*\/\s*(\d+)/);
  if (waveMatch) {
    result.wave = waveMatch[1];
    result.total_waves = waveMatch[2];
  }

  // Count completed and total tasks
  const completed = (content.match(/\[x\]/g) || []).length;
  const pending = (content.match(/\[ \]/g) || []).length;
  result.completed_tasks = completed;
  result.total_tasks = completed + pending;

  // Extract blockers
  const blockerSection = content.match(/## 阻塞\s*\n([\s\S]*?)(?=\n##|\n$|$)/);
  if (blockerSection) {
    const lines = blockerSection[1].split('\n').filter(l => l.trim() && l.trim() !== '无');
    result.blockers = lines.map(l => l.replace(/^-\s*/, '').trim()).filter(Boolean);
  }

  // Extract last action
  const lastActionMatch = content.match(/## 上次操作\s*\n([\s\S]*?)(?=\n##|\n$|$)/);
  if (lastActionMatch) {
    const lines = lastActionMatch[1].split('\n').filter(l => l.trim().startsWith('-'));
    if (lines.length > 0) {
      result.last_action = lines[0].replace(/^-\s*/, '').trim();
    }
  }

  // Extract decision IDs
  const decisionMatches = content.match(/\| D-\d+ \|/g) || [];
  result.decisions = decisionMatches.map(d => d.replace(/\|/g, '').trim());

  return result;
}

function buildProgressBar(pct) {
  const filled = Math.round(pct / 10);
  return '[' + '#'.repeat(filled) + '.'.repeat(10 - filled) + '] ' + pct + '%';
}
