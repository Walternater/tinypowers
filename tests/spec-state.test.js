const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

function runNode(args, cwd = ROOT) {
  return spawnSync('node', args, {
    cwd,
    encoding: 'utf8'
  });
}

test('update-spec-state advances one phase and appends history', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-state-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-1234',
    '--name', '用户登录',
    '--root', projectRoot
  ]);

  // Create 任务拆解表.md so EXEC prerequisite passes
  const featureName = 'CSS-1234-用户登录';
  const featureDir = path.join(projectRoot, 'features', featureName);
  fs.writeFileSync(path.join(featureDir, '任务拆解表.md'), '# 任务拆解表\n\n## Epic 1\n\n- Task 1\n');

  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC',
    '--note', 'tasks ready'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const specState = fs.readFileSync(path.join(featureDir, 'SPEC-STATE.md'), 'utf8');
  assert.match(specState, /phase: EXEC/);
  assert.match(specState, /\| PLAN \| EXEC \| tasks ready \|/);
});

test('update-spec-state prevents skipping phases without force', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-skip-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-1234',
    '--name', '用户登录',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-1234-用户登录';
  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'REVIEW'
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /禁止跳步/);
});

test('update-spec-state --mode relaxed allows skipping phases', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-relaxed-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-5678',
    '--name', '快速任务',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-5678-快速任务';
  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC',
    '--mode', 'relaxed',
    '--note', 'simple task skip'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const specState = fs.readFileSync(path.join(projectRoot, 'features', featureName, 'SPEC-STATE.md'), 'utf8');
  assert.match(specState, /phase: EXEC/);
});

test('update-spec-state reads mode from SPEC-STATE file', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-filemode-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-9999',
    '--name', '文件模式',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-9999-文件模式';
  const featureDir = path.join(projectRoot, 'features', featureName);
  const specPath = path.join(featureDir, 'SPEC-STATE.md');
  let content = fs.readFileSync(specPath, 'utf8');
  content = content.replace('mode: strict', 'mode: relaxed');
  fs.writeFileSync(specPath, content);

  // Create STATE.md so REVIEW prerequisite passes
  fs.writeFileSync(path.join(featureDir, 'STATE.md'), '# STATE\n');

  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'REVIEW',
    '--note', 'file says relaxed'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const updated = fs.readFileSync(specPath, 'utf8');
  assert.match(updated, /phase: REVIEW/);
});

test('update-spec-state DONE requires VERIFICATION with PASS', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-done-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-7777',
    '--name', '验证阶段',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-7777-验证阶段';
  const featureDir = path.join(projectRoot, 'features', featureName);
  const specPath = path.join(featureDir, 'SPEC-STATE.md');
  let content = fs.readFileSync(specPath, 'utf8');
  content = content.replace('mode: strict', 'mode: relaxed');
  fs.writeFileSync(specPath, content);

  // Create STATE.md so REVIEW prerequisite passes
  fs.writeFileSync(path.join(featureDir, 'STATE.md'), '# STATE\n');

  // Advance to REVIEW first
  let result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'REVIEW',
    '--note', 'jump to review'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  // Reset mode to strict so DONE prerequisite check is enforced
  content = fs.readFileSync(specPath, 'utf8');
  content = content.replace('mode: relaxed', 'mode: strict');
  fs.writeFileSync(specPath, content);

  // Without VERIFICATION.md, DONE should fail
  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'DONE',
    '--note', 'try done without verification'
  ]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /VERIFICATION/);

  // With VERIFICATION.md containing PASS, DONE should succeed
  fs.writeFileSync(path.join(featureDir, 'VERIFICATION.md'), '# Verification\n\nConclusion: PASS\n');
  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'DONE',
    '--note', 'done with verification'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const updated = fs.readFileSync(specPath, 'utf8');
  assert.match(updated, /phase: DONE/);
});
