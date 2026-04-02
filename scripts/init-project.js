#!/usr/bin/env node
// init-project.js
// 一键完成 tech:init Step 4 的落地操作：
//   - 规则文件复制
//   - 模板变量替换
//   - hooks 安装
//   - settings.json 生成/merge
//   - 目录创建
//
// 用法:
//   node scripts/init-project.js \
//     --root /path/to/target-project \
//     --stack java --tool maven \
//     --strategy create

const fs = require('fs');
const path = require('path');

const TINYPOWERS_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    stack: 'java',
    tool: 'maven',
    strategy: 'create',
    servicePort: '8080',
    branchPattern: 'feature/{id}-{short-desc}'
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') { args.root = path.resolve(argv[i + 1]); i += 1; continue; }
    if (arg === '--stack') { args.stack = argv[i + 1]; i += 1; continue; }
    if (arg === '--tool') { args.tool = argv[i + 1]; i += 1; continue; }
    if (arg === '--strategy') { args.strategy = argv[i + 1]; i += 1; continue; }
    if (arg === '--port') { args.servicePort = argv[i + 1]; i += 1; continue; }
    if (arg === '--build-command') { args.buildCommand = argv[i + 1]; i += 1; continue; }
    if (arg === '--project-name') { args.projectName = argv[i + 1]; i += 1; continue; }
  }
  if (!args.buildCommand) {
    args.buildCommand = args.tool === 'gradle' ? './gradlew check' : 'mvn test';
  }
  if (!args.projectName) {
    args.projectName = path.basename(args.root);
  }
  return args;
}

function fail(message) {
  console.error('ERROR: ' + message);
  process.exit(1);
}

function log(message) {
  console.log('  ' + message);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function renderTemplate(content, vars) {
  return content
    .replaceAll('{{project_name}}', vars.projectName)
    .replaceAll('{{ProjectName}}', vars.projectName.charAt(0).toUpperCase() + vars.projectName.slice(1))
    .replaceAll('{{tech_stack}}', vars.techStack)
    .replaceAll('{{tech_stack_short}}', vars.stack)
    .replaceAll('{{build_tool}}', vars.tool)
    .replaceAll('{{build_command}}', vars.buildCommand)
    .replaceAll('{{service_port}}', vars.servicePort)
    .replaceAll('{{branch_pattern}}', vars.branchPattern)
    .replaceAll('{{author}}', vars.author)
    .replaceAll('{{date}}', vars.date);
}

function getGitUser() {
  try {
    const { execSync } = require('child_process');
    return execSync('git config user.name', { encoding: 'utf8' }).trim() || 'Developer';
  } catch (e) {
    return 'Developer';
  }
}

// --- Steps ---

function copyRules(args) {
  log('复制规则文件...');
  const rulesSrc = path.join(TINYPOWERS_ROOT, 'configs', 'rules');
  const rulesDest = path.join(args.root, 'configs', 'rules');

  const ruleSets = ['common'];
  if (args.stack === 'java') {
    ruleSets.push('java');
  }

  for (const ruleSet of ruleSets) {
    const srcDir = path.join(rulesSrc, ruleSet);
    const destDir = path.join(rulesDest, ruleSet);
    if (fs.existsSync(srcDir)) {
      copyDir(srcDir, destDir);
      log('  configs/rules/' + ruleSet + '/');
    }
  }
}

function copyGuides(args) {
  log('复制指南文档...');
  const guidesSrc = path.join(TINYPOWERS_ROOT, 'docs', 'guides');
  const guidesDest = path.join(args.root, 'docs', 'guides');

  if (!fs.existsSync(guidesSrc)) {
    log('  (tinypowers docs/guides/ 不存在，跳过)');
    return;
  }

  copyDir(guidesSrc, guidesDest);
  log('  docs/guides/');
}

function renderClaudeMd(args) {
  log('生成 CLAUDE.md...');
  const templatePath = path.join(TINYPOWERS_ROOT, 'configs', 'templates', 'CLAUDE.md');
  const destPath = path.join(args.root, 'CLAUDE.md');

  if (fs.existsSync(destPath) && args.strategy === 'update') {
    log('  CLAUDE.md 已存在 (update 策略，保留)');
    return;
  }

  const vars = {
    projectName: args.projectName,
    techStack: 'Java (' + args.tool.charAt(0).toUpperCase() + args.tool.slice(1) + ')',
    stack: args.stack,
    tool: args.tool.charAt(0).toUpperCase() + args.tool.slice(1),
    buildCommand: args.buildCommand,
    servicePort: args.servicePort,
    branchPattern: args.branchPattern,
    author: getGitUser(),
    date: new Date().toISOString().slice(0, 10)
  };

  const rendered = renderTemplate(fs.readFileSync(templatePath, 'utf8'), vars);
  fs.writeFileSync(destPath, rendered);
  log('  CLAUDE.md (init_version: 5.0)');
}

function renderKnowledgeMd(args) {
  log('生成 docs/knowledge.md...');
  const templatePath = path.join(TINYPOWERS_ROOT, 'configs', 'templates', 'knowledge.md');
  const destPath = path.join(args.root, 'docs', 'knowledge.md');

  if (fs.existsSync(destPath)) {
    log('  docs/knowledge.md 已存在，保留');
    return;
  }

  const content = fs.existsSync(templatePath)
    ? fs.readFileSync(templatePath, 'utf8')
    : '# 领域知识库\n\n## 组件用法\n\n## 平台约束\n\n## 踩坑记录\n';
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content);
}

function installHooks(args) {
  log('安装 hooks...');
  const hooksSrc = path.join(TINYPOWERS_ROOT, 'hooks');
  const hooksDest = path.join(args.root, '.claude', 'hooks');

  const hookFiles = [
    'spec-state-guard.js',
    'gsd-context-monitor.js',
    'config-protection.js',
    'gsd-code-checker.js',
    'gsd-session-manager.js'
  ];

  fs.mkdirSync(hooksDest, { recursive: true });
  for (const hookFile of hookFiles) {
    const src = path.join(hooksSrc, hookFile);
    const dest = path.join(hooksDest, hookFile);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      log('  .claude/hooks/' + hookFile);
    }
  }
}

function generateSettings(args) {
  log('生成 .claude/settings.json...');
  const templatePath = path.join(TINYPOWERS_ROOT, 'configs', 'templates', 'settings.json');
  const destPath = path.join(args.root, '.claude', 'settings.json');

  if (!fs.existsSync(templatePath)) {
    log('  settings.json 模板不存在，跳过');
    return;
  }

  const templateContent = fs.readFileSync(templatePath, 'utf8')
    .replaceAll('{{hooks_dir}}', '.claude/hooks');

  if (fs.existsSync(destPath)) {
    // Merge strategy
    try {
      const existing = JSON.parse(fs.readFileSync(destPath, 'utf8'));
      const incoming = JSON.parse(templateContent);

      // Merge permissions.allow
      if (incoming.permissions && incoming.permissions.allow) {
        existing.permissions = existing.permissions || { allow: [], deny: [] };
        for (const rule of incoming.permissions.allow) {
          if (!existing.permissions.allow.includes(rule)) {
            existing.permissions.allow.push(rule);
          }
        }
      }

      // Merge permissions.deny
      if (incoming.permissions && incoming.permissions.deny) {
        existing.permissions = existing.permissions || { allow: [], deny: [] };
        for (const rule of incoming.permissions.deny) {
          if (!existing.permissions.deny.includes(rule)) {
            existing.permissions.deny.push(rule);
          }
        }
      }

      // Merge hooks
      if (incoming.hooks) {
        existing.hooks = existing.hooks || {};
        for (const [event, entries] of Object.entries(incoming.hooks)) {
          if (!existing.hooks[event]) {
            existing.hooks[event] = entries;
          } else {
            for (const entry of entries) {
              const exists = existing.hooks[event].some(e =>
                JSON.stringify(e.matcher) === JSON.stringify(entry.matcher)
              );
              if (!exists) {
                existing.hooks[event].push(entry);
              }
            }
          }
        }
      }

      fs.writeFileSync(destPath, JSON.stringify(existing, null, 2) + '\n');
      log('  .claude/settings.json (merged)');
    } catch (e) {
      fs.writeFileSync(destPath, templateContent);
      log('  .claude/settings.json (overwrite, parse failed)');
    }
  } else {
    fs.writeFileSync(destPath, templateContent);
    log('  .claude/settings.json (created)');
  }
}

function createDirectories(args) {
  log('创建目录...');
  const dirs = ['features', 'docs', 'docs/guides', 'configs/rules'];
  for (const dir of dirs) {
    const fullPath = path.join(args.root, dir);
    fs.mkdirSync(fullPath, { recursive: true });
    log('  ' + dir + '/');
  }
}

function verify(args) {
  log('验证...');
  const checks = [
    { name: 'CLAUDE.md', test: () => fs.existsSync(path.join(args.root, 'CLAUDE.md')) },
    { name: 'CLAUDE.md 含 init_version', test: () => {
      const content = fs.readFileSync(path.join(args.root, 'CLAUDE.md'), 'utf8');
      return content.includes('init_version') && !content.includes('{{project_name}}');
    }},
    { name: 'docs/guides/', test: () => fs.existsSync(path.join(args.root, 'docs', 'guides')) },
    { name: 'docs/guides/workflow-guide.md', test: () => fs.existsSync(path.join(args.root, 'docs', 'guides', 'workflow-guide.md')) },
    { name: 'docs/guides/development-spec.md', test: () => fs.existsSync(path.join(args.root, 'docs', 'guides', 'development-spec.md')) },
    { name: 'docs/knowledge.md', test: () => fs.existsSync(path.join(args.root, 'docs', 'knowledge.md')) },
    { name: 'configs/rules/', test: () => fs.existsSync(path.join(args.root, 'configs', 'rules')) },
    { name: 'features/', test: () => fs.existsSync(path.join(args.root, 'features')) },
    { name: '.claude/settings.json', test: () => fs.existsSync(path.join(args.root, '.claude', 'settings.json')) },
    { name: '.claude/hooks/spec-state-guard.js', test: () => fs.existsSync(path.join(args.root, '.claude', 'hooks', 'spec-state-guard.js')) }
  ];

  let allPassed = true;
  for (const check of checks) {
    const passed = check.test();
    log((passed ? 'PASS' : 'FAIL') + ': ' + check.name);
    if (!passed) allPassed = false;
  }
  return allPassed;
}

function main() {
  const args = parseArgs(process.argv);

  if (!fs.existsSync(args.root)) {
    fail('目标目录不存在: ' + args.root);
  }

  const validStrategies = ['create', 'update', 'overwrite'];
  if (!validStrategies.includes(args.strategy)) {
    fail('--strategy 允许值: ' + validStrategies.join(', '));
  }

  console.log('=== tech:init 落地 ===');
  console.log('目标: ' + args.root);
  console.log('技术栈: Java (' + args.tool + ')');
  console.log('策略: ' + args.strategy);
  console.log('');

  createDirectories(args);
  copyRules(args);
  copyGuides(args);
  renderClaudeMd(args);
  renderKnowledgeMd(args);
  installHooks(args);
  generateSettings(args);

  console.log('');
  console.log('--- 验证 ---');
  const passed = verify(args);

  console.log('');
  if (passed) {
    console.log('=== 初始化完成 ===');
    console.log('');
    console.log('下一步: /tech:feature');
  } else {
    console.log('=== 初始化完成（有验证项未通过） ===');
    console.log('请检查上方 FAIL 项并手动修复。');
    process.exit(1);
  }
}

main();
