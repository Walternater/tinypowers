const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

function runNode(script, args = [], cwd = ROOT) {
  return spawnSync('node', [path.join(ROOT, script), ...args], {
    cwd,
    encoding: 'utf8'
  });
}

function writeFeature(projectRoot, featureName, { track = 'standard' } = {}) {
  const featureDir = path.join(projectRoot, 'features', featureName);
  fs.mkdirSync(path.join(featureDir, 'notepads'), { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'SPEC-STATE.md'), [
    '---',
    'phase: REVIEW',
    `track: ${track}`,
    '---'
  ].join('\n'));
  fs.writeFileSync(path.join(featureDir, '技术方案.md'), [
    `# ${featureName} 技术方案`,
    '',
    '## 基本信息',
    '',
    '| 项目 | 内容 |',
    '|------|------|',
    '| 最后更新 | `2026-01-01` |',
    '',
    '## 锁定决策',
    '',
    '| ID | 决策内容 | 原因 | 状态 |',
    '|----|----------|------|------|',
    '| D-01 | 统一走 OpenFeign 调用上游 | 保持现有 RPC 模式一致 | 已确认 |',
    '',
    '## 上线计划',
    '',
    '- 发布前检查：同步接口文档',
    '- 灰度 / 开关策略：按租户灰度',
    ''
  ].join('\n'));
  fs.writeFileSync(path.join(featureDir, 'VERIFICATION.md'), [
    '# VERIFICATION',
    '',
    '## 结论',
    '',
    '- Result: PASS'
  ].join('\n'));
  if (track !== 'fast') {
    fs.writeFileSync(path.join(featureDir, '测试计划.md'), [
      '# 测试计划',
      '',
      '| 项目 | 内容 |',
      '|------|------|',
      '| 最后更新 | `2026-01-01` |'
    ].join('\n'));
    fs.writeFileSync(path.join(featureDir, '测试报告.md'), [
      '# 测试报告',
      '',
      '| 项目 | 内容 |',
      '|------|------|',
      '| 最后更新 | `2026-01-01` |'
    ].join('\n'));
  }
  fs.writeFileSync(path.join(featureDir, 'notepads', 'learnings.md'), [
    '- [PERSIST] OpenFeign 调用统一透传 traceId，避免链路排查断点'
  ].join('\n'));
}

test('prepare-commit-docs incrementally updates README and knowledge for current feature', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-prepare-commit-'));
  const featureName = 'CSS-1234-提交文档同步';
  fs.mkdirSync(path.join(projectRoot, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, 'README.md'), '# Existing README\n\nLegacy intro.\n');
  fs.writeFileSync(path.join(projectRoot, 'docs', 'knowledge.md'), '# 领域知识库\n\n已有知识。\n');
  writeFeature(projectRoot, featureName);

  const result = runNode('scripts/prepare-commit-docs.js', ['--root', projectRoot, '--feature', featureName]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const readme = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8');
  const knowledge = fs.readFileSync(path.join(projectRoot, 'docs', 'knowledge.md'), 'utf8');
  const design = fs.readFileSync(path.join(projectRoot, 'features', featureName, '技术方案.md'), 'utf8');

  assert.match(readme, /Legacy intro\./);
  assert.match(readme, /tinypowers:commit-readme:start/);
  assert.match(readme, /CSS-1234-提交文档同步/);
  assert.match(readme, /同步接口文档/);
  assert.match(knowledge, /已有知识。/);
  assert.match(knowledge, /tinypowers:commit-knowledge:start/);
  assert.match(knowledge, /OpenFeign 调用统一透传 traceId/);
  assert.match(knowledge, /D-01 统一走 OpenFeign 调用上游/);
  assert.match(design, /\| 最后更新 \| `20\d{2}-\d{2}-\d{2}` \|/);
});

test('check-commit-docs fails before prepare and passes after prepare', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-check-commit-'));
  const featureName = 'CSS-9999-提交校验';
  fs.mkdirSync(path.join(projectRoot, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, 'README.md'), '# README\n');
  fs.writeFileSync(path.join(projectRoot, 'docs', 'knowledge.md'), '# 领域知识库\n');
  writeFeature(projectRoot, featureName, { track: 'fast' });

  const before = runNode('scripts/check-commit-docs.js', ['--root', projectRoot, '--feature', featureName]);
  assert.equal(before.status, 1, before.stdout);
  assert.match(before.stderr || before.stdout, /README\.md 未包含当前 feature 的 commit sync 区块/);

  const prepare = runNode('scripts/prepare-commit-docs.js', ['--root', projectRoot, '--feature', featureName]);
  assert.equal(prepare.status, 0, prepare.stderr || prepare.stdout);

  const after = runNode('scripts/check-commit-docs.js', ['--root', projectRoot, '--feature', featureName]);
  assert.equal(after.status, 0, after.stderr || after.stdout);
  assert.match(after.stdout, /commit 文档校验通过/);
});
