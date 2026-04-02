#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    installRoot: ROOT,
    force: false,
    skipKnowledge: false,
    includeMysql: false,
    techStack: 'Java (Maven)',
    techStackShort: 'java',
    buildTool: 'Maven',
    buildCommand: 'mvn test',
    servicePort: '8080',
    branchPattern: 'feature/{id}-{short-desc}'
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') { args.root = path.resolve(argv[i + 1]); i += 1; continue; }
    if (arg === '--install-root') { args.installRoot = path.resolve(argv[i + 1]); i += 1; continue; }
    if (arg === '--project-name') { args.projectName = argv[i + 1]; i += 1; continue; }
    if (arg === '--author') { args.author = argv[i + 1]; i += 1; continue; }
    if (arg === '--tech-stack') { args.techStack = argv[i + 1]; i += 1; continue; }
    if (arg === '--tech-stack-short') { args.techStackShort = argv[i + 1]; i += 1; continue; }
    if (arg === '--build-tool') { args.buildTool = argv[i + 1]; i += 1; continue; }
    if (arg === '--build-command') { args.buildCommand = argv[i + 1]; i += 1; continue; }
    if (arg === '--service-port') { args.servicePort = argv[i + 1]; i += 1; continue; }
    if (arg === '--branch-pattern') { args.branchPattern = argv[i + 1]; i += 1; continue; }
    if (arg === '--include-mysql') { args.includeMysql = true; continue; }
    if (arg === '--skip-knowledge') { args.skipKnowledge = true; continue; }
    if (arg === '--force') { args.force = true; continue; }
  }

  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(targetPath, content, force) {
  if (fs.existsSync(targetPath) && !force) {
    return false;
  }
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, content);
  return true;
}

function copyFile(source, target, force) {
  if (!fs.existsSync(source)) {
    fail('缺少源文件: ' + source);
  }
  return writeFile(target, fs.readFileSync(source), force);
}

function copyDir(sourceDir, targetDir, force) {
  if (!fs.existsSync(sourceDir)) {
    fail('缺少源目录: ' + sourceDir);
  }
  ensureDir(targetDir);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(source, target, force);
    } else if (entry.isFile()) {
      copyFile(source, target, force);
    }
  }
}

function detectAuthor(root) {
  try {
    const author = execSync('git config user.name', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    if (author) {
      return author;
    }
  } catch {}

  return process.env.GIT_AUTHOR_NAME || process.env.USER || 'Unknown';
}

function render(content, context) {
  return content
    .replaceAll('{{date}}', context.date)
    .replaceAll('{{project_name}}', context.projectName)
    .replaceAll('{{ProjectName}}', context.projectName.replace(/(^\w|[-_]\w)/g, part => part.replace(/[-_]/g, '').toUpperCase()))
    .replaceAll('{{tech_stack}}', context.techStack)
    .replaceAll('{{tech_stack_short}}', context.techStackShort)
    .replaceAll('{{build_tool}}', context.buildTool)
    .replaceAll('{{build_command}}', context.buildCommand)
    .replaceAll('{{service_port}}', context.servicePort)
    .replaceAll('{{branch_pattern}}', context.branchPattern)
    .replaceAll('{{author}}', context.author)
    .replaceAll('{{hooks_dir}}', context.hooksDir);
}

function mergeUnique(target = [], incoming = []) {
  const merged = Array.isArray(target) ? [...target] : [];
  for (const item of Array.isArray(incoming) ? incoming : []) {
    const fingerprint = JSON.stringify(item);
    if (!merged.some(existing => JSON.stringify(existing) === fingerprint)) {
      merged.push(item);
    }
  }
  return merged;
}

function mergeSettings(existing, incoming) {
  const merged = { ...existing };

  merged.permissions = merged.permissions || {};
  if (incoming.permissions) {
    merged.permissions.allow = mergeUnique(merged.permissions.allow, incoming.permissions.allow);
    merged.permissions.deny = mergeUnique(merged.permissions.deny, incoming.permissions.deny);
  }

  merged.tools = { ...(incoming.tools || {}), ...(merged.tools || {}) };

  if (incoming.hooks) {
    merged.hooks = merged.hooks || {};
    for (const [eventName, entries] of Object.entries(incoming.hooks)) {
      merged.hooks[eventName] = mergeUnique(merged.hooks[eventName], entries);
    }
  }

  return merged;
}

function writeSettings(projectRoot, installRoot, context, force) {
  const templatePath = path.join(installRoot, 'configs', 'templates', 'settings.json');
  const targetPath = path.join(projectRoot, '.claude', 'settings.json');
  const incoming = JSON.parse(render(read(templatePath), context));

  ensureDir(path.dirname(targetPath));

  if (!fs.existsSync(targetPath) || force) {
    fs.writeFileSync(targetPath, JSON.stringify(incoming, null, 2) + '\n');
    return fs.existsSync(targetPath) ? (force ? 'overwritten' : 'created') : 'created';
  }

  try {
    const existing = JSON.parse(read(targetPath));
    const merged = mergeSettings(existing, incoming);
    fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2) + '\n');
    return 'merged';
  } catch {
    fs.writeFileSync(targetPath, JSON.stringify(incoming, null, 2) + '\n');
    return 'replaced-invalid';
  }
}

function verifyProject(projectRoot, includeMysql, skipKnowledge) {
  const checks = [
    ['CLAUDE.md', () => fs.existsSync(path.join(projectRoot, 'CLAUDE.md'))],
    ['CLAUDE.md 模板变量已替换', () => {
      const claudePath = path.join(projectRoot, 'CLAUDE.md');
      if (!fs.existsSync(claudePath)) return false;
      const content = read(claudePath);
      return !content.includes('{{project_name}}') && !content.includes('{{tech_stack}}');
    }],
    ['docs/guides/development-spec.md', () => fs.existsSync(path.join(projectRoot, 'docs', 'guides', 'development-spec.md'))],
    ['docs/guides/workflow-guide.md', () => fs.existsSync(path.join(projectRoot, 'docs', 'guides', 'workflow-guide.md'))],
    ['configs/rules/common/', () => fs.existsSync(path.join(projectRoot, 'configs', 'rules', 'common'))],
    ['configs/rules/java/', () => fs.existsSync(path.join(projectRoot, 'configs', 'rules', 'java'))],
    ['features/', () => fs.existsSync(path.join(projectRoot, 'features'))],
    ['.claude/settings.json', () => fs.existsSync(path.join(projectRoot, '.claude', 'settings.json'))],
    ['.claude/hooks/spec-state-guard.js', () => fs.existsSync(path.join(projectRoot, '.claude', 'hooks', 'spec-state-guard.js'))]
  ];

  if (!skipKnowledge) {
    checks.push(['docs/knowledge.md', () => fs.existsSync(path.join(projectRoot, 'docs', 'knowledge.md'))]);
  }

  if (includeMysql) {
    checks.push(['configs/rules/mysql/', () => fs.existsSync(path.join(projectRoot, 'configs', 'rules', 'mysql'))]);
  }

  const failures = [];
  for (const [label, check] of checks) {
    if (!check()) {
      failures.push(label);
    }
  }
  return failures;
}

function main() {
  const args = parseArgs(process.argv);
  const projectRoot = args.root;
  const installRoot = args.installRoot;
  const projectName = args.projectName || path.basename(projectRoot);
  const author = args.author || detectAuthor(projectRoot);
  const date = new Date().toISOString().slice(0, 10);
  const hooksDir = '.claude/hooks';

  ensureDir(projectRoot);

  const context = {
    date,
    projectName,
    techStack: args.techStack,
    techStackShort: args.techStackShort,
    buildTool: args.buildTool,
    buildCommand: args.buildCommand,
    servicePort: args.servicePort,
    branchPattern: args.branchPattern,
    author,
    hooksDir
  };

  const created = [];
  const ensuredDirs = [];

  const ensureProjectDir = relativePath => {
    ensureDir(path.join(projectRoot, relativePath));
    ensuredDirs.push(relativePath.endsWith('/') ? relativePath : relativePath + '/');
  };

  const renderTemplate = (templateName, targetRel) => {
    const templatePath = path.join(installRoot, 'configs', 'templates', templateName);
    const targetPath = path.join(projectRoot, targetRel);
    const written = writeFile(targetPath, render(read(templatePath), context), args.force);
    if (written) {
      created.push(targetRel);
    }
  };

  renderTemplate('CLAUDE.md', 'CLAUDE.md');
  const settingsStatus = writeSettings(projectRoot, installRoot, context, args.force);
  created.push(`.claude/settings.json (${settingsStatus})`);
  if (!args.skipKnowledge) {
    renderTemplate('knowledge.md', 'docs/knowledge.md');
  }

  for (const guide of ['development-spec.md', 'workflow-guide.md']) {
    const source = path.join(installRoot, 'docs', 'guides', guide);
    const targetRel = path.join('docs', 'guides', guide);
    if (copyFile(source, path.join(projectRoot, targetRel), args.force)) {
      created.push(targetRel);
    }
  }

  copyDir(path.join(installRoot, 'hooks'), path.join(projectRoot, '.claude', 'hooks'), args.force);
  created.push('.claude/hooks/');

  copyDir(path.join(installRoot, 'configs', 'rules', 'common'), path.join(projectRoot, 'configs', 'rules', 'common'), args.force);
  copyDir(path.join(installRoot, 'configs', 'rules', 'java'), path.join(projectRoot, 'configs', 'rules', 'java'), args.force);
  created.push('configs/rules/common/');
  created.push('configs/rules/java/');

  if (args.includeMysql) {
    copyDir(path.join(installRoot, 'configs', 'rules', 'mysql'), path.join(projectRoot, 'configs', 'rules', 'mysql'), args.force);
    created.push('configs/rules/mysql/');
  }

  ensureProjectDir('features');
  ensureProjectDir('docs');
  ensureProjectDir(path.join('docs', 'guides'));

  console.log('init-project 完成');
  console.log('项目根目录: ' + projectRoot);
  console.log('创建/更新内容:');
  for (const item of [...new Set([...ensuredDirs, ...created])]) {
    console.log('- ' + item);
  }

  const failures = verifyProject(projectRoot, args.includeMysql, args.skipKnowledge);
  if (failures.length > 0) {
    console.error('初始化验证失败:');
    for (const item of failures) {
      console.error('- ' + item);
    }
    process.exit(1);
  }

  console.log('初始化验证通过');
  console.log('建议验证命令: node "' + path.join(installRoot, 'scripts', 'doctor.js') + '" --project "' + projectRoot + '"');
}

main();
