#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    installRoot: ROOT,
    force: false
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') { args.root = path.resolve(argv[i + 1]); i += 1; continue; }
    if (arg === '--install-root') { args.installRoot = path.resolve(argv[i + 1]); i += 1; continue; }
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

function copyFile(source, target, force) {
  if (!fs.existsSync(source)) {
    fail('缺少源文件: ' + source);
  }
  if (fs.existsSync(target) && !force) {
    return false;
  }
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, fs.readFileSync(source));
  return true;
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

function verifyProject(projectRoot) {
  const checks = [
    ['configs/rules/common/', () => fs.existsSync(path.join(projectRoot, 'configs', 'rules', 'common'))],
    ['docs/guides/', () => fs.existsSync(path.join(projectRoot, 'docs', 'guides'))],
    ['.claude/hooks/', () => fs.existsSync(path.join(projectRoot, '.claude', 'hooks'))]
  ];

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

  ensureDir(projectRoot);

  copyDir(path.join(installRoot, 'configs', 'rules'), path.join(projectRoot, 'configs', 'rules'), args.force);
  copyDir(path.join(installRoot, 'docs', 'guides'), path.join(projectRoot, 'docs', 'guides'), args.force);
  copyDir(path.join(installRoot, 'hooks'), path.join(projectRoot, '.claude', 'hooks'), args.force);

  console.log('init-project 完成');
  console.log('项目根目录: ' + projectRoot);

  const failures = verifyProject(projectRoot);
  if (failures.length > 0) {
    console.error('初始化验证失败:');
    for (const item of failures) {
      console.error('- ' + item);
    }
    process.exit(1);
  }

  console.log('初始化验证通过');
}

main();
