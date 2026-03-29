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
