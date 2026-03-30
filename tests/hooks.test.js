const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

test('hook-hierarchy strict mode includes code checker', () => {
  const output = execFileSync('node', [path.join(ROOT, 'hooks/hook-hierarchy.js')], {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      TINYPOWERS_HOOK_LEVEL: 'strict'
    }
  });

  const parsed = JSON.parse(output);
  const config = parsed.config;
  const commands = JSON.stringify(config.settings.hooks.PostToolUse);
  assert.match(commands, /gsd-code-checker\.js/);
});

test('residual-check reports console.log in modified files', () => {
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

  const result = spawnSync('node', [path.join(ROOT, 'hooks/residual-check.js')], {
    cwd: tempDir,
    encoding: 'utf8',
    input: JSON.stringify({ cwd: tempDir })
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /console\.log/);
});
