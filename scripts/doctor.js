#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'manifests', 'components.json');
const SETTINGS_FILE = path.join('.claude', 'settings.json');

function parseArgs(argv) {
  const result = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        result[key] = true;
      } else {
        result[key] = next;
        i += 1;
      }
    } else {
      result._.push(arg);
    }
  }
  return result;
}

function exists(p) {
  return fs.existsSync(p);
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function detectInstallRoot(args) {
  if (args['install-root']) {
    return path.resolve(args['install-root']);
  }

  if (args.global) {
    return path.join(process.env.HOME || '', '.claude', 'skills', 'tinypowers');
  }

  const projectRoot = path.resolve(args.project || process.cwd());
  const projectInstall = path.join(projectRoot, '.claude', 'skills', 'tinypowers');
  if (exists(projectInstall)) {
    return projectInstall;
  }

  return ROOT;
}

function detectProjectRoot(args, installRoot) {
  if (args.project) {
    return path.resolve(args.project);
  }

  if (installRoot === ROOT) {
    return ROOT;
  }

  const candidate = path.resolve(installRoot, '..', '..', '..');
  return candidate;
}

function checkFile(relPath, baseDir, findings, label, required = true) {
  const fullPath = path.join(baseDir, relPath);
  if (exists(fullPath)) {
    findings.pass.push(`${label}: ${relPath}`);
    return true;
  }

  const bucket = required ? findings.fail : findings.warn;
  bucket.push(`${label}: 缺少 ${relPath}`);
  return false;
}

function flattenHookCommands(settings) {
  const commands = [];
  for (const entries of Object.values(settings.hooks || {})) {
    for (const entry of entries || []) {
      for (const hook of entry.hooks || []) {
        if (hook.command) {
          commands.push(hook.command);
        }
      }
    }
  }
  return commands;
}

function summarizeComponents(installRoot, manifest, findings) {
  const installed = [];

  for (const [name, component] of Object.entries(manifest.components || {})) {
    const sources = component.sources || [];
    const complete = sources.every(source => exists(path.join(installRoot, source)));
    if (complete) {
      installed.push(name);
    } else if (component.required) {
      findings.fail.push(`组件缺失: ${name}`);
    }
  }

  findings.info.push(`已检测组件: ${installed.join(', ') || '(无)'}`);
  return installed;
}

function checkHooks(projectRoot, installRoot, findings) {
  const settingsPath = path.join(projectRoot, SETTINGS_FILE);
  if (!exists(settingsPath)) {
    findings.warn.push(`未找到 ${path.relative(projectRoot, settingsPath)}，需要手动接入 hooks`);
    return;
  }

  findings.pass.push(`已发现 hook 配置: ${path.relative(projectRoot, settingsPath)}`);

  let settings;
  try {
    settings = loadJson(settingsPath);
  } catch (error) {
    findings.fail.push(`hook 配置无法解析: ${settingsPath}`);
    return;
  }

  const commands = flattenHookCommands(settings);
  const requiredHooks = [
    'gsd-session-manager.js',
    'gsd-context-monitor.js',
    'config-protection.js',
    'residual-check.js',
    'gsd-code-checker.js'
  ];

  for (const hookName of requiredHooks) {
    if (commands.some(command => command.includes(hookName))) {
      findings.pass.push(`已接入 hook: ${hookName}`);
    } else {
      findings.warn.push(`未接入 hook: ${hookName}`);
    }
  }

  const envPath = path.join(projectRoot, '.env');
  const hookLevel = process.env.TINYPOWERS_HOOK_LEVEL || '(未设置，默认 standard)';
  findings.info.push(`当前 Hook Level: ${hookLevel}`);
  if (!process.env.TINYPOWERS_HOOK_LEVEL && exists(envPath)) {
    findings.info.push('提示: 如果你通过 shell profile 设置 Hook Level，本次 doctor 不会自动读取 .env');
  }

  const templatePath = path.join(installRoot, 'hooks-settings-template.json');
  if (exists(templatePath)) {
    findings.pass.push('已提供 hooks-settings-template.json');
  } else if (installRoot !== ROOT) {
    findings.warn.push('安装目录缺少 hooks-settings-template.json');
  } else {
    findings.info.push('仓库模式下不要求存在 hooks-settings-template.json（由 install.sh 生成）');
  }
}

function checkProjectArtifacts(projectRoot, findings, installRoot) {
  if (projectRoot === ROOT && installRoot === ROOT) {
    findings.info.push('当前运行在框架仓库自身，不要求出现 CLAUDE.md / features/');
    return;
  }

  const claudePath = path.join(projectRoot, 'CLAUDE.md');
  const guidesDir = path.join(projectRoot, 'docs', 'guides');
  const featuresDir = path.join(projectRoot, 'features');

  if (exists(claudePath)) {
    findings.pass.push('目标项目已初始化 CLAUDE.md');
  } else {
    findings.warn.push('目标项目尚未初始化 CLAUDE.md（如未执行 /tech:init 属正常）');
  }

  if (exists(guidesDir)) {
    findings.pass.push('目标项目已存在 docs/guides/');
  } else {
    findings.warn.push('目标项目尚未生成 docs/guides/');
  }

  if (exists(featuresDir)) {
    findings.pass.push('目标项目已存在 features/');
  } else {
    findings.info.push('目标项目尚未生成 features/（框架仓库本身可忽略）');
  }
}

function printSection(title, items) {
  if (items.length === 0) {
    return;
  }

  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
  for (const item of items) {
    console.log(`- ${item}`);
  }
}

function main() {
  const args = parseArgs(process.argv);
  const installRoot = detectInstallRoot(args);
  const projectRoot = detectProjectRoot(args, installRoot);
  const findings = { pass: [], warn: [], fail: [], info: [] };

  if (!exists(MANIFEST_PATH)) {
    console.error('doctor 无法启动：缺少 manifests/components.json');
    process.exit(1);
  }

  if (!exists(installRoot)) {
    console.error(`doctor 失败：安装目录不存在: ${installRoot}`);
    process.exit(1);
  }

  const manifest = loadJson(MANIFEST_PATH);
  const installedComponents = summarizeComponents(installRoot, manifest, findings);

  checkFile('skills', installRoot, findings, '核心目录');
  checkFile('agents', installRoot, findings, '核心目录');
  checkFile('hooks', installRoot, findings, '核心目录');
  checkFile('docs', installRoot, findings, '核心目录');
  if (installedComponents.includes('contexts')) {
    checkFile('contexts', installRoot, findings, '工作模式目录');
  } else {
    findings.info.push('当前安装未包含 contexts 组件');
  }
  if (installedComponents.includes('templates')) {
    checkFile('configs/templates', installRoot, findings, '模板目录');
  } else {
    findings.info.push('当前安装未包含 templates 组件');
  }

  checkHooks(projectRoot, installRoot, findings);
  checkProjectArtifacts(projectRoot, findings, installRoot);

  console.log('tinypowers doctor');
  console.log('=================');
  console.log(`安装目录: ${installRoot}`);
  console.log(`项目目录: ${projectRoot}`);

  printSection('PASS', findings.pass);
  printSection('WARN', findings.warn);
  printSection('FAIL', findings.fail);
  printSection('INFO', findings.info);

  if (findings.fail.length > 0) {
    process.exit(1);
  }
}

main();
