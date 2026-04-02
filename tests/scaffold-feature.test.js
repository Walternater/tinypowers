const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

test('scaffold-feature creates a planning skeleton', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-scaffold-'));

  execFileSync(
    'node',
    [
      path.join(ROOT, 'scripts/scaffold-feature.js'),
      '--id', 'CSS-1234',
      '--name', '用户登录',
      '--root', projectRoot
    ],
    { cwd: ROOT, stdio: 'ignore' }
  );

  const featureDir = path.join(projectRoot, 'features', 'CSS-1234-用户登录');
  const expectedFiles = [
    'SPEC-STATE.md',
    'PRD.md',
    '技术方案.md',
    '任务拆解表.md'
  ];

  for (const file of expectedFiles) {
    assert.equal(fs.existsSync(path.join(featureDir, file)), true, file);
  }

  assert.equal(fs.existsSync(path.join(featureDir, 'notepads')), true, 'notepads');
  assert.equal(fs.existsSync(path.join(featureDir, 'notepads', 'learnings.md')), true, 'notepads/learnings.md');

  const specState = fs.readFileSync(path.join(featureDir, 'SPEC-STATE.md'), 'utf8');
  assert.match(specState, /phase: PLAN/);
  assert.match(specState, /track: standard/);
  assert.match(specState, /mode: strict/);
});

test('scaffold-feature supports fast track with lightweight artifacts', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-scaffold-fast-'));

  execFileSync(
    'node',
    [
      path.join(ROOT, 'scripts/scaffold-feature.js'),
      '--id', 'CSS-5678',
      '--name', '快速筛选',
      '--track', 'fast',
      '--root', projectRoot
    ],
    { cwd: ROOT, stdio: 'ignore' }
  );

  const featureDir = path.join(projectRoot, 'features', 'CSS-5678-快速筛选');
  const expectedFiles = [
    'SPEC-STATE.md',
    'PRD.md',
    '技术方案.md',
    '任务拆解表.md'
  ];

  for (const file of expectedFiles) {
    assert.equal(fs.existsSync(path.join(featureDir, file)), true, file);
  }

  for (const file of ['CHANGESET.md', '需求理解确认.md', '评审记录.md']) {
    assert.equal(fs.existsSync(path.join(featureDir, file)), false, file);
  }

  const specState = fs.readFileSync(path.join(featureDir, 'SPEC-STATE.md'), 'utf8');
  assert.match(specState, /phase: PLAN/);
  assert.match(specState, /track: fast/);
  assert.match(specState, /mode: relaxed/);

  const techDesign = fs.readFileSync(path.join(featureDir, '技术方案.md'), 'utf8');
  assert.match(techDesign, /Fast Route 适用性/);
});

test('scaffold-feature supports medium track with seeded drafting fields', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-scaffold-medium-'));

  execFileSync(
    'node',
    [
      path.join(ROOT, 'scripts/scaffold-feature.js'),
      '--id', 'CSS-9012',
      '--name', '中档需求',
      '--track', 'medium',
      '--brief', '给任务列表增加中等复杂筛选能力',
      '--in-scope', '新增接口;补齐测试',
      '--tasks', '扩展查询;补齐测试;整理验证',
      '--root', projectRoot
    ],
    { cwd: ROOT, stdio: 'ignore' }
  );

  const featureDir = path.join(projectRoot, 'features', 'CSS-9012-中档需求');
  const specState = fs.readFileSync(path.join(featureDir, 'SPEC-STATE.md'), 'utf8');
  const prd = fs.readFileSync(path.join(featureDir, 'PRD.md'), 'utf8');
  const taskBreakdown = fs.readFileSync(path.join(featureDir, '任务拆解表.md'), 'utf8');

  assert.match(specState, /track: medium/);
  assert.match(specState, /mode: strict/);
  assert.match(prd, /给任务列表增加中等复杂筛选能力/);
  assert.match(taskBreakdown, /T-001/);
  assert.match(taskBreakdown, /扩展查询/);
});
