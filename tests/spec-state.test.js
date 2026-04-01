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

  const featureName = 'CSS-1234-用户登录';
  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'REQ',
    '--note', 'PRD ready'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const specState = fs.readFileSync(path.join(projectRoot, 'features', featureName, 'SPEC-STATE.md'), 'utf8');
  assert.match(specState, /phase: REQ/);
  assert.match(specState, /\| INIT \| REQ \| PRD ready \|/);
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
    '--to', 'DESIGN'
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
  const specPath = path.join(projectRoot, 'features', featureName, 'SPEC-STATE.md');
  let content = fs.readFileSync(specPath, 'utf8');
  content = content.replace('mode: strict', 'mode: relaxed');
  fs.writeFileSync(specPath, content);

  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'TASKS',
    '--note', 'file says relaxed'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const updated = fs.readFileSync(specPath, 'utf8');
  assert.match(updated, /phase: TASKS/);
});

test('update-spec-state no longer requires code-review artifact to enter VERIFY', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-verify-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-7777',
    '--name', '验证阶段',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-7777-验证阶段';
  const specPath = path.join(projectRoot, 'features', featureName, 'SPEC-STATE.md');
  let content = fs.readFileSync(specPath, 'utf8');
  content = content.replace('mode: strict', 'mode: relaxed');
  fs.writeFileSync(specPath, content);

  let result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'REVIEW',
    '--note', 'jump to review'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'VERIFY',
    '--note', 'start verify without review file'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const updated = fs.readFileSync(specPath, 'utf8');
  assert.match(updated, /phase: VERIFY/);
});
