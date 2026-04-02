#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { root: process.cwd(), status: 'PASS' };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') { args.root = path.resolve(argv[i + 1]); i += 1; continue; }
    if (arg === '--feature') { args.feature = argv[i + 1]; i += 1; continue; }
    if (arg === '--command') { args.command = argv[i + 1]; i += 1; continue; }
    if (arg === '--summary') { args.summary = argv[i + 1]; i += 1; continue; }
    if (arg === '--scope') { args.scope = argv[i + 1]; i += 1; continue; }
    if (arg === '--risks') { args.risks = argv[i + 1]; i += 1; continue; }
    if (arg === '--status') { args.status = String(argv[i + 1] || 'PASS').toUpperCase(); i += 1; continue; }
    if (arg === '--force') { args.force = true; }
  }
  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function splitItems(value) {
  return String(value || '')
    .split(';')
    .map(item => item.trim())
    .filter(Boolean);
}

function featureDir(root, feature) {
  if (!feature) {
    fail('缺少 --feature');
  }
  const normalized = feature.replace(/\\/g, '/');
  if (normalized.startsWith('features/')) {
    return path.resolve(root, normalized);
  }
  return path.resolve(root, 'features', normalized);
}

function detectTestSummary(projectRoot) {
  const reportsDir = path.join(projectRoot, 'target', 'surefire-reports');
  if (!fs.existsSync(reportsDir)) {
    return null;
  }

  const reportFiles = fs.readdirSync(reportsDir)
    .filter(file => file.endsWith('.txt'))
    .map(file => path.join(reportsDir, file));

  for (const file of reportFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const match = content.match(/Tests run:\s*\d+,\s*Failures:\s*\d+,\s*Errors:\s*\d+,\s*Skipped:\s*\d+/);
    if (match) {
      return match[0];
    }
  }

  return null;
}

function bulletLines(items, fallback) {
  if (items.length === 0) {
    return '- ' + fallback;
  }
  return items.map(item => '- ' + item).join('\n');
}

function main() {
  const args = parseArgs(process.argv);
  const targetDir = featureDir(args.root, args.feature);
  const verificationPath = path.join(targetDir, 'VERIFICATION.md');

  if (fs.existsSync(verificationPath) && !args.force) {
    fail('VERIFICATION.md 已存在，如需覆盖请添加 --force');
  }

  const featureName = path.basename(targetDir);
  const date = new Date().toISOString().slice(0, 10);
  const scopeItems = splitItems(args.scope);
  const riskItems = splitItems(args.risks);
  const detectedSummary = detectTestSummary(args.root);
  const command = args.command || 'mvn test';
  const summary = args.summary || detectedSummary || '待补测试结果摘要';

  const content = [
    '# VERIFICATION: ' + featureName.split('-').slice(0, 2).join('-'),
    '',
    '结论：' + args.status,
    '',
    '## 验证范围',
    '',
    bulletLines(scopeItems, '待补本次验证范围'),
    '',
    '## 执行记录',
    '',
    '| 项目 | 结果 |',
    '|------|------|',
    '| 测试命令 | `' + command + '` |',
    '| 执行时间 | `' + date + '` |',
    '| 结果 | `' + summary + '` |',
    '',
    '## 关键验证点',
    '',
    bulletLines(scopeItems, '待补关键验证点'),
    '',
    '## 风险与残留',
    '',
    bulletLines(riskItems, '待补风险与残留')
  ].join('\n') + '\n';

  fs.writeFileSync(verificationPath, content);
  console.log('VERIFICATION.md 已生成: ' + verificationPath);
}

main();
