#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

function parseArgs(argv) {
  const args = argv.slice(2);
  const parsed = { passthrough: [] };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--project') {
      parsed.project = path.resolve(args[i + 1]);
      i += 1;
      continue;
    }
    if (arg === '--global') {
      parsed.global = true;
      continue;
    }
    if (arg === '--profile') {
      parsed.profile = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--components') {
      parsed.components = args[i + 1];
      i += 1;
      continue;
    }
    parsed.passthrough.push(arg);
  }
  return parsed;
}

function canonicalPath(target) {
  try {
    return fs.realpathSync.native(target);
  } catch {
    return path.resolve(target);
  }
}

function loadInstalledComponents(rootDir) {
  const manifestPath = path.join(rootDir, 'manifests', 'components.json');
  if (!fs.existsSync(manifestPath)) {
    return [];
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const installed = [];

  for (const [name, component] of Object.entries(manifest.components || {})) {
    const complete = (component.sources || []).every(source => fs.existsSync(path.join(rootDir, source)));
    if (complete) {
      installed.push(name);
    }
  }

  return installed;
}

function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(__dirname, '..');
  const installScript = path.join(root, 'install.sh');
  const doctorScript = path.join(root, 'scripts', 'doctor.js');
  const projectRoot = args.project || process.cwd();
  const installTarget = args.global
    ? path.join(process.env.HOME || '', '.claude', 'skills', 'tinypowers')
    : path.join(projectRoot, '.claude', 'skills', 'tinypowers');
  const requiresStaging = canonicalPath(installTarget) === canonicalPath(root);
  const stagedTarget = requiresStaging
    ? fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-repair-'))
    : installTarget;

  const installArgs = [];
  const installedComponents = loadInstalledComponents(root);

  if (args.profile) {
    installArgs.push(args.profile);
  } else if (args.components) {
    installArgs.push('--components', args.components);
  } else if (installedComponents.length > 0) {
    installArgs.push('--components', installedComponents.join(','));
  }
  if (args.global && !requiresStaging) {
    installArgs.push('--global');
  } else {
    installArgs.push('--target', stagedTarget);
  }
  installArgs.push('--force');

  const installResult = spawnSync('bash', [installScript, ...installArgs], {
    cwd: root,
    stdio: 'inherit'
  });

  if (installResult.status !== 0) {
    process.exit(installResult.status || 1);
  }

  if (requiresStaging) {
    fs.mkdirSync(installTarget, { recursive: true });
    fs.cpSync(stagedTarget, installTarget, { recursive: true, force: true });
  }

  const doctorArgs = ['--project', projectRoot];
  if (args.global) {
    doctorArgs.push('--global');
  } else {
    doctorArgs.push('--install-root', installTarget);
  }

  const doctorResult = spawnSync('node', [doctorScript, ...doctorArgs], {
    cwd: root,
    stdio: 'inherit'
  });

  process.exit(doctorResult.status || 0);
}

main();
