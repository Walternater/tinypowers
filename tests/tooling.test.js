const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

function run(script, args = []) {
  return spawnSync('node', [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8'
  });
}

test('doctor succeeds on repository workspace', () => {
  const result = run('scripts/doctor.js', ['--project', ROOT, '--install-root', ROOT]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /tinypowers doctor/);
});

test('validate succeeds on repository workspace', () => {
  const result = run('scripts/validate.js');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /结果: 0 错误, 0 警告/);
});
