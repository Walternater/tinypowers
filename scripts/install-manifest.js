#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'manifests', 'components.json');

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const parsed = { _: [] };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (!next || next.startsWith('--')) {
        parsed[key] = true;
      } else {
        parsed[key] = next;
        i += 1;
      }
    } else {
      parsed._.push(arg);
    }
  }

  return parsed;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function unique(items) {
  return [...new Set(items)];
}

function expandComponents(names, manifest) {
  const required = Object.entries(manifest.components || {})
    .filter(([, value]) => value.required)
    .map(([name]) => name);

  const result = new Set(required);
  const queue = [...names];

  while (queue.length > 0) {
    const name = queue.shift();
    if (!name) continue;
    const component = manifest.components?.[name];
    if (!component) {
      fail(`未知组件: ${name}`);
    }

    if (!result.has(name)) {
      result.add(name);
    }

    const requires = component.requires
      ? Array.isArray(component.requires)
        ? component.requires
        : [component.requires]
      : [];

    for (const dep of requires) {
      if (!result.has(dep)) {
        queue.push(dep);
      }
    }
  }

  return [...result];
}

function existsFile(dir, candidate) {
  return fs.existsSync(path.join(dir, candidate));
}

function existsDir(dir, candidate) {
  return fs.existsSync(path.join(dir, candidate));
}

function matchesGlob(dir, pattern) {
  if (!pattern.includes('*')) {
    return existsFile(dir, pattern);
  }

  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  const regex = new RegExp(`^${escaped}$`);

  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const relativePath = path.relative(dir, fullPath).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (regex.test(relativePath) || regex.test(entry.name)) {
        return true;
      }
    }
  }

  return false;
}

function fileContainsAny(dir, files, patterns) {
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    if (patterns.some(pattern => content.includes(pattern))) {
      return true;
    }
  }
  return false;
}

function detectComponents(targetDir, manifest) {
  const defaultComponents = manifest.defaultComponents || [];
  const detectedComponents = [];

  for (const rule of Object.values(manifest.stackDetection || {})) {
    let matched = false;

    if (rule.files && rule.files.some(file => matchesGlob(targetDir, file))) {
      matched = true;
    }

    if (!matched && rule.dirs && rule.dirs.some(dir => existsDir(targetDir, dir))) {
      matched = true;
    }

    if (
      !matched &&
      rule.files &&
      rule.contentPatterns &&
      fileContainsAny(targetDir, rule.files.filter(file => !file.includes('*')), rule.contentPatterns)
    ) {
      matched = true;
    }

    if (matched) {
      detectedComponents.push(...(rule.components || []));
    }
  }

  return expandComponents(unique([...defaultComponents, ...detectedComponents]), manifest);
}

function printList(manifest) {
  console.log('tinypowers 可安装组件');
  console.log('======================');
  console.log('');
  console.log('Profiles:');
  for (const [name, value] of Object.entries(manifest.profiles || {})) {
    console.log(`  ${name.padEnd(16)} ${value.description}`);
  }
  console.log('');
  console.log('Components:');
  for (const [name, value] of Object.entries(manifest.components || {})) {
    const suffix = value.required ? ' (必装)' : '';
    console.log(`  ${name.padEnd(16)} ${value.description}${suffix}`);
  }
}

function main() {
  const args = parseArgs(process.argv);
  const command = args._[0];
  const manifest = loadManifest();

  switch (command) {
    case 'list':
      printList(manifest);
      return;

    case 'resolve': {
      if (args.profile) {
        const profile = manifest.profiles?.[args.profile];
        if (!profile) {
          fail(`未知 profile: ${args.profile}`);
        }
        console.log(expandComponents(profile.components || [], manifest).join(','));
        return;
      }

      if (args.components) {
        const names = args.components.split(',').map(item => item.trim()).filter(Boolean);
        console.log(expandComponents(names, manifest).join(','));
        return;
      }

      const targetDir = path.resolve(args.target || process.cwd());
      console.log(detectComponents(targetDir, manifest).join(','));
      return;
    }

    case 'sources': {
      const name = args.component;
      if (!name) fail('缺少 --component');
      const component = manifest.components?.[name];
      if (!component) fail(`未知组件: ${name}`);
      console.log((component.sources || []).join('\n'));
      return;
    }

    default:
      fail('用法: node scripts/install-manifest.js <list|resolve|sources> [--profile X|--components A,B|--target DIR|--component X]');
  }
}

main();
