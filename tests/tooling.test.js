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
  assert.match(result.stdout, /安装模式: repository/);
});

test('doctor reports explicit install-root mode without project-local false alarm', () => {
  const installRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-doctor-install-root-'));
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-doctor-project-'));

  fs.cpSync(path.join(ROOT, 'skills'), path.join(installRoot, 'skills'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'agents'), path.join(installRoot, 'agents'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'hooks'), path.join(installRoot, 'hooks'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'contexts'), path.join(installRoot, 'contexts'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'configs'), path.join(installRoot, 'configs'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'docs'), path.join(installRoot, 'docs'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'manifests'), path.join(installRoot, 'manifests'), { recursive: true });
  fs.cpSync(path.join(ROOT, '.claude-plugin'), path.join(installRoot, '.claude-plugin'), { recursive: true });
  fs.cpSync(path.join(ROOT, '.codex'), path.join(installRoot, '.codex'), { recursive: true });

  for (const file of ['package.json', 'install.sh', 'README.md']) {
    fs.copyFileSync(path.join(ROOT, file), path.join(installRoot, file));
  }
  fs.mkdirSync(path.join(installRoot, 'scripts'), { recursive: true });
  for (const file of ['doctor.js', 'init-project.js', 'install-manifest.js', 'repair.js', 'scaffold-feature.js', 'update-spec-state.js', 'update-verification.js', 'validate.js']) {
    fs.copyFileSync(path.join(ROOT, 'scripts', file), path.join(installRoot, 'scripts', file));
  }
  fs.mkdirSync(path.join(installRoot, 'scripts', 'lib'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'scripts', 'lib', 'artifact-state.js'), path.join(installRoot, 'scripts', 'lib', 'artifact-state.js'));

  const result = spawnSync('node', [
    path.join(installRoot, 'scripts', 'doctor.js'),
    '--project', projectRoot,
    '--install-root', installRoot
  ], {
    cwd: ROOT,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /安装模式: explicit-install-root/);
  assert.match(result.stdout, /安装目录类型: external-install/);
  assert.doesNotMatch(result.stdout, /安装目录不存在/);
});

test('doctor reports global mode when using --global', () => {
  const homeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-doctor-home-'));
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-doctor-global-project-'));
  const installRoot = path.join(homeRoot, '.claude', 'skills', 'tinypowers');

  fs.mkdirSync(path.dirname(installRoot), { recursive: true });
  fs.cpSync(ROOT, installRoot, {
    recursive: true,
    filter: (source) => {
      const rel = path.relative(ROOT, source);
      return !rel.startsWith('.git');
    }
  });

  const result = spawnSync('node', [
    path.join(installRoot, 'scripts', 'doctor.js'),
    '--project', projectRoot,
    '--global'
  ], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, HOME: homeRoot }
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /安装模式: global/);
  assert.match(result.stdout, /安装目录类型: global-install/);
});

test('doctor defaults to current project directory for global installs without --project', () => {
  const homeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-doctor-home-cwd-'));
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-doctor-cwd-project-'));
  const installRoot = path.join(homeRoot, '.claude', 'skills', 'tinypowers');

  fs.mkdirSync(path.dirname(installRoot), { recursive: true });
  fs.cpSync(ROOT, installRoot, {
    recursive: true,
    filter: (source) => {
      const rel = path.relative(ROOT, source);
      return !rel.startsWith('.git');
    }
  });
  fs.writeFileSync(path.join(projectRoot, 'pom.xml'), `
    <project>
      <properties>
        <maven.compiler.release>17</maven.compiler.release>
      </properties>
    </project>
  `.trim());

  const result = spawnSync('node', [
    path.join(installRoot, 'scripts', 'doctor.js'),
    '--global'
  ], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: homeRoot,
      TINYPOWERS_DOCTOR_FAKE_JAVA_VERSION: 'openjdk version "21.0.2" 2024-01-16',
      TINYPOWERS_DOCTOR_FAKE_MVN_VERSION: 'Apache Maven 3.9.6'
    }
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const resolvedProjectRoot = fs.realpathSync(projectRoot);
  assert.match(result.stdout, new RegExp(`项目目录: ${resolvedProjectRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  assert.match(result.stdout, /项目运行时: maven-java/);
  assert.match(result.stdout, /Java 要求: 17\+/);
});

test('doctor surfaces runtime diagnostics for maven projects', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-doctor-runtime-'));
  fs.writeFileSync(path.join(projectRoot, 'pom.xml'), `
    <project>
      <properties>
        <maven.compiler.release>17</maven.compiler.release>
      </properties>
    </project>
  `.trim());

  const result = spawnSync('node', [
    path.join(ROOT, 'scripts', 'doctor.js'),
    '--project', projectRoot,
    '--install-root', ROOT
  ], {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      TINYPOWERS_DOCTOR_FAKE_JAVA_VERSION: 'openjdk version "21.0.2" 2024-01-16',
      TINYPOWERS_DOCTOR_FAKE_MVN_VERSION: 'Apache Maven 3.9.6'
    }
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /RUNTIME/);
  assert.match(result.stdout, /项目运行时: maven-java/);
  assert.match(result.stdout, /Java 要求: 17\+/);
  assert.match(result.stdout, /Java 运行时可用（当前版本 21）/);
  assert.match(result.stdout, /Maven 命令可用/);
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
  assert.equal(fs.existsSync(path.join(projectRoot, 'README.md')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, '.claude', 'settings.json')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, '.claude', 'hooks', 'spec-state-guard.js')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, 'docs', 'guides', 'workflow-guide.md')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, 'configs', 'rules', 'java', 'java-coding-style.md')), true);
  assert.equal(fs.existsSync(path.join(projectRoot, 'configs', 'rules', 'mysql')), true);
  const readme = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8');
  const knowledge = fs.readFileSync(path.join(projectRoot, 'docs', 'knowledge.md'), 'utf8');
  assert.match(readme, /AI Workflow Bootstrap/);
  assert.match(readme, /mvn test/);
  assert.match(knowledge, /初始化提炼摘要/);
  assert.match(knowledge, /技术栈：Java \(Maven\)/);
  assert.match(knowledge, /MySQL/);
  assert.match(result.stdout, /初始化验证通过/);
});

test('init-project updates existing README and knowledge bootstrap without clobbering content', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-init-readme-'));
  fs.writeFileSync(path.join(projectRoot, 'README.md'), '# Existing Project\n\nLegacy details.\n');
  fs.mkdirSync(path.join(projectRoot, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, 'docs', 'knowledge.md'), '# 领域知识库\n\n已有内容。\n');

  const result = run('scripts/init-project.js', [
    '--root', projectRoot,
    '--project-name', 'existing-service'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const readme = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8');
  const knowledge = fs.readFileSync(path.join(projectRoot, 'docs', 'knowledge.md'), 'utf8');
  assert.match(readme, /Legacy details\./);
  assert.match(readme, /tinypowers:init-readme:start/);
  assert.match(knowledge, /已有内容。/);
  assert.match(knowledge, /tinypowers:init-knowledge:start/);
  assert.match(knowledge, /项目名称：existing-service/);
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
