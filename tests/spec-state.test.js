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

test('update-spec-state advances one phase and appends history', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-state-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-1234',
    '--name', '用户登录',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-1234-用户登录';
  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'REQ',
    '--note', 'PRD ready'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const specState = fs.readFileSync(path.join(projectRoot, 'features', featureName, 'SPEC-STATE.md'), 'utf8');
  assert.match(specState, /phase: REQ/);
  assert.match(specState, /\| INIT \| REQ \| PRD ready \|/);
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
  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'DESIGN'
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /禁止跳步/);
});

test('update-spec-state --mode relaxed allows skipping phases', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-relaxed-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-5678',
    '--name', '快速任务',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-5678-快速任务';
  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC',
    '--mode', 'relaxed',
    '--note', 'simple task skip'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const specState = fs.readFileSync(path.join(projectRoot, 'features', featureName, 'SPEC-STATE.md'), 'utf8');
  assert.match(specState, /phase: EXEC/);
});

test('update-spec-state reads mode from SPEC-STATE file', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-filemode-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-9999',
    '--name', '文件模式',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-9999-文件模式';
  const specPath = path.join(projectRoot, 'features', featureName, 'SPEC-STATE.md');
  let content = fs.readFileSync(specPath, 'utf8');
  content = content.replace('mode: strict', 'mode: relaxed');
  fs.writeFileSync(specPath, content);

  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'TASKS',
    '--note', 'file says relaxed'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const updated = fs.readFileSync(specPath, 'utf8');
  assert.match(updated, /phase: TASKS/);
});

test('update-spec-state no longer requires code-review artifact to enter VERIFY', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-verify-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-7777',
    '--name', '验证阶段',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-7777-验证阶段';
  const specPath = path.join(projectRoot, 'features', featureName, 'SPEC-STATE.md');
  let content = fs.readFileSync(specPath, 'utf8');
  content = content.replace('mode: strict', 'mode: relaxed');
  fs.writeFileSync(specPath, content);

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
    '--note', 'jump to review'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'VERIFY',
    '--note', 'start verify without review file'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const updated = fs.readFileSync(specPath, 'utf8');
  assert.match(updated, /phase: VERIFY/);
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
  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'TASKS',
    '--note', 'fast route ready'
  ]);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const specPath = path.join(projectRoot, 'features', featureName, 'SPEC-STATE.md');
  const updated = fs.readFileSync(specPath, 'utf8');
  assert.match(updated, /phase: TASKS/);
  assert.match(updated, /track: fast/);
  assert.match(updated, /mode: relaxed/);
  assert.match(updated, /\| PRD \| PRD\.md \| skipped \|/);
});

test('fast-track still requires sequential progression after EXEC', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-spec-fast-seq-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-1357',
    '--name', '执行后顺序',
    '--track', 'fast',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-1357-执行后顺序';
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
    '--to', 'CLOSED',
    '--note', 'skip rest'
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /进入 EXEC 后必须顺序推进|Fast Route 在 CLOSED 及之后阶段仍需顺序推进/);
});

test('fast-track entering EXEC still requires design, tasks, and note', () => {
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
  assert.match(result.stderr, /任务拆解表\.md 存在，并通过 --note|Fast Route 进入 EXEC 需要通过 --note|技术方案\.md 存在且包含锁定决策/);
});

test('entering EXEC generates STATE from standard task breakdown', () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tinypowers-state-standard-'));

  runNode([
    path.join(ROOT, 'scripts/scaffold-feature.js'),
    '--id', 'CSS-4321',
    '--name', '状态初稿',
    '--root', projectRoot
  ]);

  const featureName = 'CSS-4321-状态初稿';
  const featureDir = path.join(projectRoot, 'features', featureName);
  fs.writeFileSync(path.join(featureDir, 'PRD.md'), '# PRD\n有效内容\n');

  let result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'REQ',
    '--note', 'prd ready'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  fs.writeFileSync(path.join(featureDir, '需求理解确认.md'), '# 需求理解确认\n已确认\n');
  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'DESIGN',
    '--note', 'requirements confirmed'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  fs.writeFileSync(path.join(featureDir, '技术方案.md'), [
    '# 技术方案',
    '',
    '## 决策记录',
    '',
    '| ID | 决策内容 | 原因 | 确认状态 |',
    '|----|----------|------|----------|',
    '| D-01 | 沿用现有实现 | 保持一致 | 已确认 |'
  ].join('\n'));
  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'TASKS',
    '--note', 'design ready'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

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

  result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC',
    '--note', 'plan check passed'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const state = fs.readFileSync(path.join(featureDir, 'STATE.md'), 'utf8');
  assert.match(state, /执行路由 \| `standard`/);
  assert.match(state, /### Wave 1 PENDING/);
  assert.match(state, /T-001 补 service 过滤/);
  assert.match(state, /T-002 补测试/);
});

test('entering EXEC generates STATE from fast task breakdown', () => {
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

  const result = runNode([
    path.join(ROOT, 'scripts/update-spec-state.js'),
    '--feature', featureName,
    '--root', projectRoot,
    '--to', 'EXEC',
    '--note', 'fast route ready'
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const state = fs.readFileSync(path.join(featureDir, 'STATE.md'), 'utf8');
  assert.match(state, /执行路由 \| `fast`/);
  assert.match(state, /T-001 增加 completed 过滤/);
  assert.match(state, /T-002 增加回归测试/);
});
