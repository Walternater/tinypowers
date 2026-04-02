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
  assert.match(result.stdout, /结果: 0 错误, 0 警告/);
});

test('validate fails when manifest references generated artifacts', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-validate-'));

  fs.mkdirSync(path.join(fixtureRoot, 'manifests'), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, '.claude-plugin'), { recursive: true });
  fs.mkdirSync(path.join(fixtureRoot, '.codex'), { recursive: true });
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
  fs.writeFileSync(path.join(fixtureRoot, 'docs', 'guides', 'runtime-matrix.md'), 'Claude Code\nCodex\n');
  fs.writeFileSync(path.join(fixtureRoot, 'docs', 'guides', 'generated-vs-curated-policy.md'), '# fixture\n');

  const result = run('scripts/validate.js', ['--root', fixtureRoot]);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /manifest 不应引用目标项目生成目录/);
});

test('init-project creates core runtime files', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-init-project-'));

  const result = run('scripts/init-project.js', [
    '--root', projectRoot,
    '--project-name', 'demo-service',
    '--include-mysql'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(projectRoot, 'CLAUDE.md')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, '.claude', 'settings.json')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, '.claude', 'hooks', 'spec-state-guard.js')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, 'docs', 'guides', 'workflow-guide.md')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, 'configs', 'rules', 'java', 'java-coding-style.md')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, 'configs', 'rules', 'mysql')), true);
  assert.match(result.stdout, /初始化验证通过/);
  assert.match(result.stdout, /features\//);
  assert.match(result.stdout, /docs\/guides\//);
  assert.match(result.stdout, /建议验证命令: node .*doctor\.js/);
});

test('init-project merges existing settings.json', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-init-merge-'));
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');

  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify({
    permissions: {
      allow: ['Bash(echo *)'],
      deny: ['Bash(wget *)']
    },
    tools: {
      maxTurns: 99
    },
    hooks: {
      Stop: [
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: 'node ".claude/hooks/custom-stop.js"',
              timeout: 5
            }
          ]
        }
      ]
    }
  }, null, 2));

  const result = run('scripts/init-project.js', [
    '--root', projectRoot,
    '--project-name', 'demo-service'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  assert.equal(settings.permissions.allow.includes('Bash(echo *)'), true);
  assert.equal(settings.permissions.allow.includes('Bash(git *)'), true);
  assert.equal(settings.permissions.deny.includes('Bash(wget *)'), true);
  assert.equal(settings.permissions.deny.includes('Bash(curl *)'), true);
  assert.equal(settings.tools.maxTurns, 99);
  assert.ok(Array.isArray(settings.hooks.Stop));
  assert.equal(settings.hooks.Stop.some(entry => JSON.stringify(entry).includes('custom-stop.js')), true);
  assert.equal(settings.hooks.Stop.some(entry => JSON.stringify(entry).includes('gsd-session-manager.js')), true);
  assert.match(result.stdout, /\.claude\/settings\.json \(merged\)/);
});

test('doctor resolves canonical project paths consistently', () => {
  const requestedRoot = path.join('/tmp', 'tinypowers-doctor-canonical-' + Date.now());
  fs.rmSync(requestedRoot, { recursive: true, force: true });
  fs.mkdirSync(requestedRoot, { recursive: true });

  const initResult = run('scripts/init-project.js', [
    '--root', requestedRoot,
    '--project-name', 'canonical-demo'
  ]);
  assert.equal(initResult.status, 0, initResult.stderr || initResult.stdout);

  const realRoot = fs.realpathSync(requestedRoot);
  const aliasResult = run('scripts/doctor.js', ['--project', requestedRoot, '--install-root', ROOT]);
  const realResult = run('scripts/doctor.js', ['--project', realRoot, '--install-root', ROOT]);

  assert.equal(aliasResult.status, 0, aliasResult.stderr || aliasResult.stdout);
  assert.equal(realResult.status, 0, realResult.stderr || realResult.stdout);
  assert.match(aliasResult.stdout, new RegExp(realRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('generate-verification writes a minimal report from latest test summary', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-verification-'));
  const featureDir = path.join(projectRoot, 'features', 'CSS-1111-验证');
  const reportsDir = path.join(projectRoot, 'target', 'surefire-reports');

  fs.mkdirSync(featureDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, 'sample.txt'), 'Tests run: 6, Failures: 0, Errors: 0, Skipped: 0\n');

  const result = run('scripts/generate-verification.js', [
    '--root', projectRoot,
    '--feature', 'CSS-1111-验证',
    '--command', 'mvn test',
    '--scope', '接口回归;汇总校验',
    '--risks', '暂未覆盖并发场景'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const verification = fs.readFileSync(path.join(featureDir, 'VERIFICATION.md'), 'utf8');
  assert.match(verification, /结论：PASS/);
  assert.match(verification, /mvn test/);
  assert.match(verification, /Tests run: 6, Failures: 0, Errors: 0, Skipped: 0/);
  assert.match(verification, /接口回归/);
});

test('update-state marks tasks done and appends next step', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-state-update-'));

  const scaffoldResult = spawnSync('node', [
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-2222',
    '--name', '状态更新',
    '--root', projectRoot
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(scaffoldResult.status, 0, scaffoldResult.stderr || scaffoldResult.stdout);

  const featureDir = path.join(projectRoot, 'features', 'CSS-2222-状态更新');
  fs.writeFileSync(path.join(featureDir, 'PRD.md'), '# PRD\n有效内容\n');
  fs.writeFileSync(path.join(featureDir, '技术方案.md'), '# 技术方案\n\n## 决策记录\n\n| ID | 决策内容 | 原因 | 确认状态 |\n|----|----------|------|----------|\n| D-01 | 保持现状 | 简单 | 已确认 |\n');
  fs.writeFileSync(path.join(featureDir, '任务拆解表.md'), '# 任务拆解表\n\n## Story / Task 明细\n\n| 编号 | 层级 | 名称 | 类型 | 依赖 | 验收标准 | 涉及文件/模块 | 备注 | 并行 (P) |\n|------|------|------|------|------|----------|---------------|------|-----------|\n| T-001 | Task | 更新 state | 后端 | | 测试通过 | State.md | | |\n');

  const execResult = spawnSync('node', [
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', 'CSS-2222-状态更新',
    '--root', projectRoot,
    '--to', 'EXEC',
    '--note', 'ready'
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(execResult.status, 0, execResult.stderr || execResult.stdout);

  const result = run('scripts/update-state.js', [
    '--root', projectRoot,
    '--feature', 'CSS-2222-状态更新',
    '--task', 'T-001',
    '--status', 'done',
    '--next-step', '生成 VERIFICATION.md'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const state = fs.readFileSync(path.join(featureDir, 'STATE.md'), 'utf8');
  assert.match(state, /- \[x\] T-001/);
  assert.match(state, /生成 VERIFICATION\.md/);
});
