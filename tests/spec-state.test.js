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

function writeStandardPlanArtifacts(featureDir) {
  fs.writeFileSync(path.join(featureDir, 'PRD.md'), '# PRD\n有效内容\n\n## 验收标准\n\n- AC-1：WHEN 用户查询任务 THEN 系统 SHALL 返回已完成任务\n');
  fs.writeFileSync(path.join(featureDir, '技术方案.md'), [
    '# 技术方案',
    '',
    '## 决策记录',
    '',
    '| ID | 决策内容 | 原因 | 确认状态 |',
    '|----|----------|------|----------|',
    '| D-01 | 沿用现有实现 | 保持一致 | 已确认 |'
  ].join('\n'));
  fs.writeFileSync(path.join(featureDir, '任务拆解表.md'), [
    '# 任务拆解表',
    '',
    '## Story / Task 明细',
    '',
    '| 编号 | 层级 | 名称 | 类型 | 依赖 | 验收标准 | 涉及文件/模块 | 备注 | 并行 (P) |',
    '|------|------|------|------|------|----------|---------------|------|-----------|',
    '| T-001 | Task | 补 service 过滤 | 后端 | | 返回已完成任务 | TaskService.java | | |',
    '| T-002 | Task | 补测试 | 测试 | T-001 | 测试通过 | TaskServiceTest.java | | |',
    '',
    '## Wave 建议',
    '',
    '| Wave | 包含任务 | 前置条件 | 完成标准 |',
    '|------|----------|----------|----------|',
    '| 1 | T-001, T-002 | — | 两个任务完成 |'
  ].join('\n'));
}

function writeStandardReviewArtifacts(featureDir) {
  fs.writeFileSync(path.join(featureDir, '测试计划.md'), [
    '# 测试计划',
    '',
    '## 测试项',
    '',
    '| 编号 | 场景 | 类型 | 预期结果 |',
    '|------|------|------|----------|',
    '| TP-01 | 已完成任务过滤 | 单元测试 | 返回已完成任务 |'
  ].join('\n'));
  fs.writeFileSync(path.join(featureDir, '测试报告.md'), [
    '# 测试报告',
    '',
    '## 执行结果',
    '',
    '| 编号 | 场景 | 结果 |',
    '|------|------|------|',
    '| TP-01 | 已完成任务过滤 | 通过 |',
    '',
    '## 结论',
    '',
    '- 结论：通过'
  ].join('\n'));
}

function writeFastPlanArtifacts(featureDir) {
  fs.writeFileSync(path.join(featureDir, 'PRD.md'), '# PRD\n快速需求说明\n\n## 验收标准\n\n- AC-1：系统 SHALL 返回已完成任务列表\n');
  fs.writeFileSync(path.join(featureDir, '技术方案.md'), [
    '# 技术方案',
    '',
    '## 锁定决策',
    '',
    '| ID | 决策内容 | 原因 | 状态 |',
    '|----|----------|------|------|',
    '| D-01 | 只改 service 层 | 低风险 | 已确认 |'
  ].join('\n'));
  fs.writeFileSync(path.join(featureDir, '任务拆解表.md'), [
    '# 任务拆解表',
    '',
    '## Fast Route 任务清单',
    '',
    '| 编号 | 任务 | 类型 | 验收标准 | 涉及文件/模块 | 并行 |',
    '|------|------|------|----------|---------------|------|',
    '| T-001 | 增加 completed 过滤 | 实现 | 返回已完成任务 | TaskService.java | |',
    '| T-002 | 增加回归测试 | 测试 | 测试通过 | TaskServiceTest.java | |'
  ].join('\n'));
}

function writeVerification(featureDir, result = 'PASS') {
  fs.writeFileSync(path.join(featureDir, 'VERIFICATION.md'), [
    '# VERIFICATION',
    '',
    '## 结论',
    '',
    `- Result: ${result}`
  ].join('\n'));
}

function readSpecState(featureDir) {
  return fs.readFileSync(path.join(featureDir, 'SPEC-STATE.md'), 'utf8');
}

test('update-spec-state advances one phase and appends history', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-state-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-1234',
    '--name', '用户登录',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-1234-用户登录';
  const featureDir = path.join(projectRoot, 'features', featureName);
  writeStandardPlanArtifacts(featureDir);

  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC',
    '--note', 'plan ready'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const specState = readSpecState(featureDir);
  assert.match(specState, /phase: EXEC/);
  assert.match(specState, /\| PLAN \| EXEC \| plan ready \|/);
  assert.match(specState, /\| PRD \| PRD\.md \| filled \|/);
  assert.match(specState, /\| 技术方案 \| 技术方案\.md \| filled \|/);
  assert.match(specState, /\| 任务拆解表 \| 任务拆解表\.md \| filled \|/);
});

test('scaffolded artifacts are not treated as filled or done', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-scaffolded-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-1000',
    '--name', '模板态检查',
    '--root', projectRoot
  ]);

  const featureDir = path.join(projectRoot, 'features', 'CSS-1000-模板态检查');
  const specState = readSpecState(featureDir);

  assert.match(specState, /\| PRD \| PRD\.md \| scaffolded \|/);
  assert.match(specState, /\| 技术方案 \| 技术方案\.md \| scaffolded \|/);
  assert.match(specState, /\| 任务拆解表 \| 任务拆解表\.md \| scaffolded \|/);
  assert.match(specState, /\| 验证报告 \| VERIFICATION\.md \| pending \|/);
  assert.doesNotMatch(specState, /\|\s(?:PRD|技术方案|任务拆解表)\s\|\s.*\|\s(?:done|filled)\s\|/);
});

test('update-spec-state prevents skipping phases without force', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-skip-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-1234',
    '--name', '用户登录',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-1234-用户登录';
  const featureDir = path.join(projectRoot, 'features', featureName);
  writeStandardPlanArtifacts(featureDir);
  writeStandardReviewArtifacts(featureDir);
  writeVerification(featureDir);

  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'DONE',
    '--note', 'skip review'
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /禁止跳步/);
});

test('update-spec-state --force allows skipping phases', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-relaxed-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-5678',
    '--name', '快速任务',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-5678-快速任务';
  const featureDir = path.join(projectRoot, 'features', featureName);
  writeStandardPlanArtifacts(featureDir);
  writeStandardReviewArtifacts(featureDir);
  writeVerification(featureDir);

  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'DONE',
    '--force',
    '--note', 'force jump'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const specState = fs.readFileSync(path.join(featureDir, 'SPEC-STATE.md'), 'utf8');
  assert.match(specState, /phase: DONE/);
});

test('update-spec-state requires verification evidence before REVIEW and DONE', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-done-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-7777',
    '--name', '验证阶段',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-7777-验证阶段';
  const featureDir = path.join(projectRoot, 'features', featureName);
  writeStandardPlanArtifacts(featureDir);

  let result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC',
    '--note', 'prepare state'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'REVIEW',
    '--note', 'review done'
  ]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /测试计划|测试报告|VERIFICATION\.md/);

  writeStandardReviewArtifacts(featureDir);
  writeVerification(featureDir);
  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'REVIEW',
    '--note', 'review done'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(readSpecState(featureDir), /\| 验证报告 \| VERIFICATION\.md \| verified \|/);

  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'DONE',
    '--note', 'commit done'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('update-spec-state blocks DONE when VERIFICATION result is FAIL', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-done-fail-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-8888',
    '--name', '失败验证',
    '--track', 'fast',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-8888-失败验证';
  const featureDir = path.join(projectRoot, 'features', featureName);
  writeFastPlanArtifacts(featureDir);
  fs.writeFileSync(path.join(featureDir, 'VERIFICATION.md'), [
    '# VERIFICATION',
    '',
    '## 决策合规性',
    '',
    '- Verdict: PASS',
    '- Highest Severity: NONE',
    '- Residual Risk: 无',
    '',
    '## 已知问题 / 残留风险',
    '',
    '- [compliance] must fix',
    '',
    '## 结论',
    '',
    '- Result: FAIL'
  ].join('\n'));

  let result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC',
    '--note', 'prepare state'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'REVIEW',
    '--note', 'review done'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'DONE',
    '--note', 'commit done'
  ]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /PASS\/通过/);
});

test('fast-track REVIEW only requires VERIFICATION.md', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-fast-review-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-3333',
    '--name', '快速验证',
    '--track', 'fast',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-3333-快速验证';
  const featureDir = path.join(projectRoot, 'features', featureName);
  writeFastPlanArtifacts(featureDir);

  let result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC',
    '--note', 'fast route execute'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'REVIEW',
    '--note', 'missing verification'
  ]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /VERIFICATION\.md/);

  writeVerification(featureDir);
  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'REVIEW',
    '--note', 'fast route verified'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('update-spec-state rejects feature paths outside features root', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-path-guard-'));
  const outsideDir = path.join(projectRoot, 'outside');

  fs.mkdirSync(outsideDir, { recursive: true });
  fs.writeFileSync(path.join(outsideDir, 'SPEC-STATE.md'), 'phase: PLAN\ntrack: standard\n');

  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', '../outside',
    '--root', projectRoot,
    '--to', 'EXEC'
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /非法 --feature/);
});

test('fast-track scaffold keeps relaxed mode and track after phase update', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-fast-track-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-2468',
    '--name', '快速过滤',
    '--track', 'fast',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-2468-快速过滤';
  const featureDir = path.join(projectRoot, 'features', featureName);
  writeFastPlanArtifacts(featureDir);

  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC',
    '--note', 'fast route ready'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const specPath = path.join(featureDir, 'SPEC-STATE.md');
  const updated = fs.readFileSync(specPath, 'utf8');
  assert.match(updated, /phase: EXEC/);
  assert.match(updated, /track: fast/);
  assert.doesNotMatch(updated, /mode:/);
});

test('fast-track still requires sequential progression without force', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-fast-seq-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-2222',
    '--name', '执行后顺序',
    '--track', 'fast',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-2222-执行后顺序';
  const featureDir = path.join(projectRoot, 'features', featureName);
  writeFastPlanArtifacts(featureDir);
  writeVerification(featureDir);

  let result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC',
    '--note', 'fast route execute'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'DONE',
    '--note', 'skip review'
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /禁止跳步/);
});

test('fast-track entering EXEC still requires design, tasks, and acceptance criteria', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-fast-exec-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-9753',
    '--name', '执行门禁',
    '--track', 'fast',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-9753-执行门禁';
  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC'
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /PRD\.md 存在且非空|任务拆解表\.md 存在|锁定决策|验收标准|已确认/);
});

test('entering EXEC no longer auto-generates STATE.md', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-state-no-auto-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-4321',
    '--name', '状态初稿',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-4321-状态初稿';
  const featureDir = path.join(projectRoot, 'features', featureName);
  writeStandardPlanArtifacts(featureDir);

  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC',
    '--note', 'plan check passed'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  // STATE.md is no longer auto-generated; it's optional for complex execution
  assert.equal(fs.existsSync(path.join(featureDir, 'STATE.md')), false, 'STATE.md should not be auto-generated');
});

test('entering EXEC skips STATE for lightweight fast task breakdown', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-state-fast-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-8642',
    '--name', '快速状态',
    '--track', 'fast',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-8642-快速状态';
  const featureDir = path.join(projectRoot, 'features', featureName);
  writeFastPlanArtifacts(featureDir);

  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC',
    '--note', 'fast route ready'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  assert.equal(fs.existsSync(path.join(featureDir, 'STATE.md')), false);
});
