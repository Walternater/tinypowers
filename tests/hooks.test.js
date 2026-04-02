const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

test('gsd-code-checker Stop detects console.log in modified files', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-residual-'));

  execFileSync('git', ['init'], { cwd: tempDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(tempDir, 'demo.js'), 'export const value = 1;\n');
  execFileSync('git', ['add', 'demo.js'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync(
    'git',
    ['-c', 'user.name=Tinypowers', '-c', 'user.email=tinypowers@example.com', 'commit', '-m', 'init'],
    { cwd: tempDir, stdio: 'ignore' }
  );

  fs.writeFileSync(path.join(tempDir, 'demo.js'), 'console.log("debug");\n');

  const result = spawnSync('node', [path.join(ROOT, 'hooks/gsd-code-checker.js'), 'Stop'], {
    cwd: tempDir,
    encoding: 'utf8',
    input: JSON.stringify({ cwd: tempDir })
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /console\.log/);
});

test('spec-state-guard matches gitflow feature branches to feature directories', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-guard-'));

  execFileSync('git', ['init'], { cwd: tempDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(tempDir, 'README.md'), 'demo\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync(
    'git',
    ['-c', 'user.name=Tinypowers', '-c', 'user.email=tinypowers@example.com', 'commit', '-m', 'init'],
    { cwd: tempDir, stdio: 'ignore' }
  );
  execFileSync('git', ['checkout', '-b', 'feature/CSS-1234/login'], { cwd: tempDir, stdio: 'ignore' });

  const guardedFeatureDir = path.join(tempDir, 'features', 'CSS-1234-login');
  const latestFeatureDir = path.join(tempDir, 'features', 'CSS-9999-other');
  fs.mkdirSync(guardedFeatureDir, { recursive: true });
  fs.mkdirSync(latestFeatureDir, { recursive: true });
  fs.writeFileSync(path.join(guardedFeatureDir, 'SPEC-STATE.md'), 'phase: PLAN\n');
  fs.writeFileSync(path.join(latestFeatureDir, 'SPEC-STATE.md'), 'phase: EXEC\n');

  const older = new Date('2026-04-01T00:00:00Z');
  const newer = new Date('2026-04-01T00:10:00Z');
  fs.utimesSync(path.join(guardedFeatureDir, 'SPEC-STATE.md'), older, older);
  fs.utimesSync(path.join(latestFeatureDir, 'SPEC-STATE.md'), newer, newer);

  const result = spawnSync('node', [path.join(ROOT, 'hooks/spec-state-guard.js')], {
    cwd: tempDir,
    encoding: 'utf8',
    input: JSON.stringify({
      cwd: tempDir,
      tool_name: 'Edit',
      tool_args: { file_path: 'src/app.js' }
    })
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /SPEC-STATE 门禁拦截/);
  assert.match(result.stdout, /CSS-1234-login/);
});

test('spec-state-guard allows tinypowers lifecycle scripts before EXEC', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-allow-'));

  execFileSync('git', ['init'], { cwd: tempDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(tempDir, 'README.md'), 'demo\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync(
    'git',
    ['-c', 'user.name=Tinypowers', '-c', 'user.email=tinypowers@example.com', 'commit', '-m', 'init'],
    { cwd: tempDir, stdio: 'ignore' }
  );
  execFileSync('git', ['checkout', '-b', 'feature/CSS-1234/login'], { cwd: tempDir, stdio: 'ignore' });

  const guardedFeatureDir = path.join(tempDir, 'features', 'CSS-1234-login');
  fs.mkdirSync(guardedFeatureDir, { recursive: true });
  fs.writeFileSync(path.join(guardedFeatureDir, 'SPEC-STATE.md'), 'phase: PLAN\n');

  const result = spawnSync('node', [path.join(ROOT, 'hooks/spec-state-guard.js')], {
    cwd: tempDir,
    encoding: 'utf8',
    input: JSON.stringify({
      cwd: tempDir,
      tool_name: 'Bash',
      tool_args: { command: 'node .claude/skills/tinypowers/scripts/update-spec-state.js --feature features/CSS-1234-login --to EXEC --note "plan check passed"' }
    })
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), '');
});

test('gsd-session-manager matches gitflow feature branches to feature directories', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-session-guard-'));
  const sessionId = 'gitflow-match';

  execFileSync('git', ['init'], { cwd: tempDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(tempDir, 'README.md'), 'demo\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync(
    'git',
    ['-c', 'user.name=Tinypowers', '-c', 'user.email=tinypowers@example.com', 'commit', '-m', 'init'],
    { cwd: tempDir, stdio: 'ignore' }
  );
  execFileSync('git', ['checkout', '-b', 'feature/CSS-1234/login'], { cwd: tempDir, stdio: 'ignore' });

  const guardedFeatureDir = path.join(tempDir, 'features', 'CSS-1234-login');
  const latestFeatureDir = path.join(tempDir, 'features', 'CSS-9999-other');
  fs.mkdirSync(guardedFeatureDir, { recursive: true });
  fs.mkdirSync(latestFeatureDir, { recursive: true });
  fs.writeFileSync(
    path.join(guardedFeatureDir, 'STATE.md'),
    '- 当前阶段: EXEC\n- 当前 Wave: 2 / 4\n## 阻塞\n无\n## 上次操作\n- 实现登录接口\n'
  );
  fs.writeFileSync(
    path.join(latestFeatureDir, 'STATE.md'),
    '- 当前阶段: EXEC\n- 当前 Wave: 3 / 5\n## 阻塞\n无\n## 上次操作\n- 其他任务\n'
  );

  const older = new Date('2026-04-01T00:00:00Z');
  const newer = new Date('2026-04-01T00:10:00Z');
  fs.utimesSync(path.join(guardedFeatureDir, 'STATE.md'), older, older);
  fs.utimesSync(path.join(latestFeatureDir, 'STATE.md'), newer, newer);

  const snapshotPath = path.join(os.tmpdir(), `tinypowers-session-${sessionId}.json`);
  try { fs.unlinkSync(snapshotPath); } catch {}

  const result = spawnSync('node', [path.join(ROOT, 'hooks/gsd-session-manager.js'), 'Stop'], {
    cwd: tempDir,
    encoding: 'utf8',
    input: JSON.stringify({
      session_id: sessionId,
      workspace: { cwd: tempDir }
    })
  });

  assert.equal(result.status, 0);
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  assert.equal(snapshot.feature_id, 'CSS-1234-login');
  assert.equal(snapshot.feature_path, 'features/CSS-1234-login');
});
