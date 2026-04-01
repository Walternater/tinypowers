const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

test('scaffold-feature creates a change set skeleton', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-scaffold-'));

  execFileSync(
    'node',
    [
      path.join(ROOT, 'scripts/scaffold-feature.js'),
      '--id', 'CSS-1234',
      '--name', '用户登录',
      '--root', projectRoot
    ],
    { cwd: ROOT, stdio: 'ignore' }
  );

  const featureDir = path.join(projectRoot, 'features', 'CSS-1234-用户登录');
  const expectedFiles = [
    'CHANGESET.md',
    'SPEC-STATE.md',
    'PRD.md',
    '需求理解确认.md',
    '技术方案.md',
    '任务拆解表.md',
    '评审记录.md'
  ];

  for (const file of expectedFiles) {
    assert.equal(fs.existsSync(path.join(featureDir, file)), true, file);
  }

  for (const dir of ['seeds', 'archive', 'notepads']) {
    assert.equal(fs.existsSync(path.join(featureDir, dir)), true, dir);
  }

  assert.equal(fs.existsSync(path.join(featureDir, 'notepads', 'learnings.md')), true, 'notepads/learnings.md');

  const changeSet = fs.readFileSync(path.join(featureDir, 'CHANGESET.md'), 'utf8');
  assert.match(changeSet, /CSS-1234/);
  assert.match(changeSet, /用户登录/);
});
