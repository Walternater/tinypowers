const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
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
  assert.match(result.stdout, /结果: 0 错误, \d+ 警告/);
});

test('validate fails when manifest references generated artifacts', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-validate-'));

  fs.mkdirSync(path.join(fixtureRoot, 'manifests'), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, '.claude-plugin'), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, '.codex'), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, '.opencode'), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, 'docs', 'guides'), { recursive: true });

  fs.writeFileSync(
    path.join(fixtureRoot, 'manifests', 'components.json'),
    JSON.stringify({
      version: 1,
      components: {
        core: {
          required: true,
          sources: ['features/']
        }
      },
      profiles: {
        minimal: {
          components: ['core']
        }
      }
    }, null, 2)
  );
  fs.writeFileSync(path.join(fixtureRoot, '.gitignore'), '.claude/skills/tinypowers/\nhooks-settings-template.json\n');
  fs.writeFileSync(
    path.join(fixtureRoot, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: 'fixture', version: '1.0.0', description: 'fixture' }, null, 2)
  );
  fs.writeFileSync(path.join(fixtureRoot, '.codex', 'INSTALL.md'), '# fixture\n');
  fs.writeFileSync(path.join(fixtureRoot, '.opencode', 'README.md'), '# fixture\n');
  fs.writeFileSync(path.join(fixtureRoot, '.opencode', 'INSTALL.md'), '# fixture\n');
  fs.writeFileSync(path.join(fixtureRoot, 'docs', 'guides', 'runtime-matrix.md'), 'Claude Code\nCodex\nOpenCode\n');
  fs.writeFileSync(path.join(fixtureRoot, 'docs', 'guides', 'generated-vs-curated-policy.md'), '# fixture\n');

  const result = run('scripts/validate.js', ['--root', fixtureRoot]);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /manifest 不应引用目标项目生成目录/);
});
