#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { root: process.cwd() };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--feature') { args.feature = argv[i + 1]; i += 1; continue; }
    if (arg === '--root') { args.root = path.resolve(argv[i + 1]); i += 1; continue; }
    if (arg === '--test-output') { args.testOutput = argv[i + 1]; i += 1; continue; }
  }
  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function featureDirFromArg(root, feature) {
  if (!feature) fail('缺少 --feature');
  const normalized = feature.replace(/\\/g, '/');
  if (normalized.startsWith('features/')) return path.resolve(root, normalized);
  if (normalized.includes('/')) return path.resolve(root, normalized);
  return path.resolve(root, 'features', normalized);
}

function read(filePath) { return fs.readFileSync(filePath, 'utf8'); }
function write(filePath, content) { fs.writeFileSync(filePath, content); }

function parseTestOutput(testOutput) {
  const totalMatch = testOutput.match(/Tests run:\s*(\d+)/);
  const failMatch = testOutput.match(/Failures:\s*(\d+)/);
  const errorMatch = testOutput.match(/Errors:\s*(\d+)/);
  const skipMatch = testOutput.match(/Skipped:\s*(\d+)/);
  const passMatch = testOutput.match(/Tests run:\s*\d+,\s*Failures:\s*\d+,\s*Errors:\s*\d+,\s*Skipped:\s*\d+/);

  return {
    total: totalMatch ? parseInt(totalMatch[1]) : 0,
    failures: failMatch ? parseInt(failMatch[1]) : 0,
    errors: errorMatch ? parseInt(errorMatch[1]) : 0,
    skipped: skipMatch ? parseInt(skipMatch[1]) : 0,
    passed: totalMatch ? parseInt(totalMatch[1]) - (failMatch ? parseInt(failMatch[1]) : 0) - (errorMatch ? parseInt(errorMatch[1]) : 0) : 0,
    success: passMatch && !failMatch && !errorMatch
  };
}

function extractAcceptanceCriteria(taskBreakdownPath) {
  if (!fs.existsSync(taskBreakdownPath)) return [];
  const content = read(taskBreakdownPath);
  const lines = content.split('\n');
  const criteria = [];
  let inTable = false;
  for (const line of lines) {
    if (line.includes('验收标准') && line.includes('|')) { inTable = true; continue; }
    if (inTable && line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3 && cells[0].match(/^T-\d+$/)) {
        criteria.push({ id: cells[0], name: cells[1], criteria: cells[4] || cells[2] });
      }
    }
    if (inTable && !line.startsWith('|')) break;
  }
  return criteria;
}

function main() {
  const args = parseArgs(process.argv);
  const featureDir = featureDirFromArg(args.root, args.feature);
  const specStatePath = path.join(featureDir, 'SPEC-STATE.md');
  const verificationPath = path.join(featureDir, 'VERIFICATION.md');
  const taskBreakdownPath = path.join(featureDir, '任务拆解表.md');

  if (!fs.existsSync(specStatePath)) fail('缺少 SPEC-STATE.md: ' + specStatePath);

  const date = new Date().toISOString().slice(0, 10);

  // Parse test output if provided
  let testResult = null;
  if (args.testOutput && fs.existsSync(args.testOutput)) {
    testResult = parseTestOutput(read(args.testOutput));
  }

  // Extract acceptance criteria from task breakdown
  const criteria = extractAcceptanceCriteria(taskBreakdownPath);

  // Generate VERIFICATION.md skeleton
  const lines = [
    `# VERIFICATION: ${path.basename(featureDir).split('-').slice(0, 2).join('-')}`,
    '',
    `> 验证时间: ${date}`,
    '',
    '## 测试执行',
    '',
    '| 指标 | 结果 |',
    '|------|------|',
  ];

  if (testResult) {
    lines.push(`| 测试总数 | ${testResult.total} |`);
    lines.push(`| 通过 | ${testResult.passed} |`);
    lines.push(`| 失败 | ${testResult.failures} |`);
    lines.push(`| 跳过 | ${testResult.skipped} |`);
    lines.push('');
    lines.push(`**结论: ${testResult.success ? '全部通过' : '存在失败，需人工确认'}**`);
  } else {
    lines.push('| 测试总数 | - |');
    lines.push('| 通过 | - |');
    lines.push('| 失败 | - |');
    lines.push('');
    lines.push('> 运行测试后补充（如: mvn test / npm test）');
  }

  lines.push('');
  lines.push('## 验收标准对照');
  lines.push('');
  lines.push('| 验收标准 | 验证方式 | 结果 |');
  lines.push('|----------|---------|------|');

  if (criteria.length > 0) {
    for (const c of criteria) {
      lines.push(`| ${c.id} ${c.name} | ${c.criteria} | PASS / FAIL |`);
    }
  } else {
    lines.push('| | | |');
  }

  lines.push('');
  lines.push('## 结论');
  lines.push('');
  lines.push('**Verdict: PASS / FAIL**');
  lines.push('');

  const content = lines.join('\n');
  write(verificationPath, content);

  console.log('VERIFICATION.md 骨架已生成:');
  console.log(verificationPath);
  if (testResult) {
    console.log(`测试结果: ${testResult.passed}/${testResult.total} 通过`);
  }
}

main();
