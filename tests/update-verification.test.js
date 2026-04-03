const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

function runNode(args, cwd = ROOT) {
  return spawnSync('node', args, {
    cwd,
    encoding: 'utf8'
  });
}

function createFeatureDir(projectRoot, featureName = 'CSS-1234-验证合并') {
  const featureDir = path.join(projectRoot, 'features', featureName);
  fs.mkdirSync(featureDir, { recursive: true });
  return featureDir;
}

function writeComplianceReport(reportPath, {
  decisionVerdict = 'PASS',
  securityVerdict = 'PASS',
  overallVerdict = 'PASS',
  residualRisk = '无',
  decisionBlock = '- None',
  securityBlock = '- None',
  decisionWarning = '- None',
  securityWarning = '- None'
} = {}) {
  fs.writeFileSync(reportPath, [
    '# Compliance Review',
    '',
    '## Review Metadata',
    '',
    '- Review Type: compliance',
    '- Feature: CSS-1234',
    '- Reviewed At: 2026-04-03 17:00',
    '',
    '## Decision Compliance',
    '',
    '### BLOCK',
    decisionBlock,
    '',
    '### WARNING',
    decisionWarning,
    '',
    '### SUGGESTION',
    '- None',
    '',
    '### PASS NOTES',
    '- ✅ 已确认决策保持一致',
    '',
    `**Decision Verdict: ${decisionVerdict}**`,
    '',
    '## Security Findings',
    '',
    '### BLOCK',
    securityBlock,
    '',
    '### WARNING',
    securityWarning,
    '',
    '### SUGGESTION',
    '- None',
    '',
    '### PASS NOTES',
    '- ✅ 未发现新增安全问题',
    '',
    `**Security Verdict: ${securityVerdict}**`,
    '',
    '## Overall Verdict',
    '',
    `- Overall Verdict: ${overallVerdict}`,
    `- Residual Risk: ${residualRisk}`
  ].join('\n'));
}

function writeCodeReviewReport(reportPath, {
  overallVerdict = 'PASS',
  residualRisk = '无',
  block = '- None',
  warning = '- None',
  suggestion = '- None'
} = {}) {
  fs.writeFileSync(reportPath, [
    '# Code Review',
    '',
    '## Review Metadata',
    '',
    '- Review Type: code',
    '- Feature: CSS-1234',
    '- Reviewed At: 2026-04-03 17:10',
    '',
    '## Findings',
    '',
    '### BLOCK',
    block,
    '',
    '### WARNING',
    warning,
    '',
    '### SUGGESTION',
    suggestion,
    '',
    '### PASS NOTES',
    '- ✅ 未发现新的资源风险',
    '',
    '## Overall Verdict',
    '',
    `- Overall Verdict: ${overallVerdict}`,
    `- Residual Risk: ${residualRisk}`
  ].join('\n'));
}

test('update-verification creates VERIFICATION.md when missing', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-verification-create-'));
  const featureName = 'CSS-1234-验证合并';
  const featureDir = createFeatureDir(projectRoot, featureName);
  const complianceReport = path.join(projectRoot, 'compliance.md');
  writeComplianceReport(complianceReport);

  const result = runNode([
    path.join(ROOT, 'scripts/update-verification.js'),
    '--root', projectRoot,
    '--feature', featureName,
    '--compliance-report', complianceReport
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const verification = fs.readFileSync(path.join(featureDir, 'VERIFICATION.md'), 'utf8');
  assert.match(verification, /^# VERIFICATION/m);
  assert.match(verification, /## 决策合规性/);
  assert.match(verification, /## 已知问题 \/ 残留风险/);
  assert.match(verification, /## 结论/);
  assert.match(verification, /- Result: PASS/);
});

test('update-verification merges a compliance review into a dedicated section', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-verification-compliance-'));
  const featureName = 'CSS-1234-验证合并';
  createFeatureDir(projectRoot, featureName);
  const complianceReport = path.join(projectRoot, 'compliance.md');
  writeComplianceReport(complianceReport, {
    overallVerdict: 'CONDITIONAL',
    residualRisk: '返回字段比方案多，需要在提交前确认',
    decisionWarning: '| 1 | 返回字段比方案多 `debug` | src/api.js:18 | 删除或补方案 |'
  });

  const result = runNode([
    path.join(ROOT, 'scripts/update-verification.js'),
    '--root', projectRoot,
    '--feature', featureName,
    '--compliance-report', complianceReport
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const verification = fs.readFileSync(path.join(projectRoot, 'features', featureName, 'VERIFICATION.md'), 'utf8');
  assert.match(verification, /## 决策合规性/);
  assert.match(verification, /返回字段比方案多 `debug`/);
  assert.match(verification, /- Verdict: CONDITIONAL/);
});

test('update-verification merges a code review into a dedicated section', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-verification-code-'));
  const featureName = 'CSS-1234-验证合并';
  createFeatureDir(projectRoot, featureName);
  const codeReviewReport = path.join(projectRoot, 'code-review.md');
  writeCodeReviewReport(codeReviewReport, {
    overallVerdict: 'CONDITIONAL',
    residualRisk: 'service 职责过多，建议提交前拆分',
    warning: '| 1 | service 同时负责参数清洗与仓储拼装 | src/task/service.js:42 | 职责过多 | 拆出 helper |'
  });

  const result = runNode([
    path.join(ROOT, 'scripts/update-verification.js'),
    '--root', projectRoot,
    '--feature', featureName,
    '--code-review-report', codeReviewReport
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const verification = fs.readFileSync(path.join(projectRoot, 'features', featureName, 'VERIFICATION.md'), 'utf8');
  assert.match(verification, /## 代码审查/);
  assert.match(verification, /service 同时负责参数清洗与仓储拼装/);
  assert.match(verification, /- Verdict: CONDITIONAL/);
});

test('update-verification downgrades final result when BLOCK or FAIL findings exist', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-verification-fail-'));
  const featureName = 'CSS-1234-验证合并';
  createFeatureDir(projectRoot, featureName);
  const complianceReport = path.join(projectRoot, 'compliance.md');
  const codeReviewReport = path.join(projectRoot, 'code-review.md');

  writeComplianceReport(complianceReport, {
    decisionVerdict: 'FAIL',
    overallVerdict: 'FAIL',
    residualRisk: '实现偏离已确认设计，必须修复',
    decisionBlock: '| 1 | 技术方案要求只读查询 | 当前实现增加写接口 | src/api/order.js:22 |'
  });
  writeCodeReviewReport(codeReviewReport, {
    overallVerdict: 'PASS',
    residualRisk: '无'
  });

  const result = runNode([
    path.join(ROOT, 'scripts/update-verification.js'),
    '--root', projectRoot,
    '--feature', featureName,
    '--compliance-report', complianceReport,
    '--code-review-report', codeReviewReport
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const verification = fs.readFileSync(path.join(projectRoot, 'features', featureName, 'VERIFICATION.md'), 'utf8');
  assert.match(verification, /- Result: FAIL/);
  assert.match(verification, /\[compliance\] 实现偏离已确认设计，必须修复/);
});

test('update-verification preserves existing non-review verification sections', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-verification-preserve-'));
  const featureName = 'CSS-1234-验证合并';
  const featureDir = createFeatureDir(projectRoot, featureName);
  const complianceReport = path.join(projectRoot, 'compliance.md');
  writeComplianceReport(complianceReport);

  fs.writeFileSync(path.join(featureDir, 'VERIFICATION.md'), [
    '# VERIFICATION',
    '',
    '## 测试执行',
    '',
    '- ran: npm test',
    '- note: should survive',
    '',
    '## 手工验证',
    '',
    '- checked: list page'
  ].join('\n'));

  const result = runNode([
    path.join(ROOT, 'scripts/update-verification.js'),
    '--root', projectRoot,
    '--feature', featureName,
    '--compliance-report', complianceReport
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const verification = fs.readFileSync(path.join(featureDir, 'VERIFICATION.md'), 'utf8');
  assert.match(verification, /## 测试执行/);
  assert.match(verification, /should survive/);
  assert.match(verification, /## 手工验证/);
  assert.match(verification, /checked: list page/);
});

test('update-verification keeps last report section when it is at end of file', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-verification-last-section-'));
  const featureName = 'CSS-1234-验证合并';
  createFeatureDir(projectRoot, featureName);
  const codeReviewReport = path.join(projectRoot, 'code-review.md');

  fs.writeFileSync(codeReviewReport, [
    '# Code Review',
    '',
    '## Review Metadata',
    '',
    '- Review Type: code',
    '- Feature: CSS-1234',
    '- Reviewed At: 2026-04-03 17:10',
    '',
    '## Findings',
    '',
    '### BLOCK',
    '- None',
    '',
    '### WARNING',
    '- None',
    '',
    '### SUGGESTION',
    '| 1 | 最后一节建议 | src/task/service.js:42 | 可后续优化 |',
    '',
    '### PASS NOTES',
    '- ✅ 未发现新的资源风险',
    '',
    '## Overall Verdict',
    '',
    '- Overall Verdict: PASS',
    '- Residual Risk: 无'
  ].join('\n'));

  const result = runNode([
    path.join(ROOT, 'scripts/update-verification.js'),
    '--root', projectRoot,
    '--feature', featureName,
    '--code-review-report', codeReviewReport
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const verification = fs.readFileSync(path.join(projectRoot, 'features', featureName, 'VERIFICATION.md'), 'utf8');
  assert.match(verification, /最后一节建议/);
  assert.match(verification, /- Verdict: PASS/);
});
