#!/usr/bin/env node
// gsd-session-manager.js
// Session lifecycle management: Stop / PreCompact / SessionStart
//
// Stop hook: Saves current feature progress to features/{id}/SESSION.md
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

  // Inject resume information
  const message = `📋 检测到上次会话未完成：
- Feature: ${snapshot.feature_id || '未知'}
- Wave: ${snapshot.current_wave || '?'} / ${snapshot.total_waves || '?'}
- 最后更新: ${new Date(snapshot.timestamp * 1000).toLocaleString()}

输入"恢复"继续，或"新建"重新开始。`;

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
      const stateFile = path.join(featurePath, 'SESSION.md');

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

  // Save current progress
  const state = {
    session_id: data.session_id,
    feature_id: latestFeature?.id || detectCurrentFeature(cwd),
    feature_path: latestFeature?.path ? `features/${latestFeature.id}` : null,
    current_wave: detectCurrentWave(cwd),
    timestamp: Math.floor(Date.now() / 1000),
    // Read existing SESSION.md if exists
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
  // Try to detect from SESSION.md
  try {
    const sessionFile = path.join(cwd, 'features', detectCurrentFeature(cwd), 'SESSION.md');
    if (fs.existsSync(sessionFile)) {
      const match = fs.readFileSync(sessionFile, 'utf8').match(/current_wave:\s*(\d+)/);
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
