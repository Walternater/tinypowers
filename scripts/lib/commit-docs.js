const fs = require('fs');
const path = require('path');

const README_START = '<!-- tinypowers:commit-readme:start -->';
const README_END = '<!-- tinypowers:commit-readme:end -->';
const KNOWLEDGE_START = '<!-- tinypowers:commit-knowledge:start -->';
const KNOWLEDGE_END = '<!-- tinypowers:commit-knowledge:end -->';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { root: process.cwd() };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') {
      args.root = path.resolve(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === '--feature') {
      args.feature = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function featureDirFromArg(root, feature) {
  if (!feature) {
    fail('缺少 --feature');
  }

  const normalized = feature.replace(/\\/g, '/');
  if (normalized.startsWith('features/')) {
    return path.resolve(root, normalized);
  }
  if (normalized.includes('/')) {
    return path.resolve(root, normalized);
  }
  return path.resolve(root, 'features', normalized);
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content);
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function upsertManagedBlock(content, startMarker, endMarker, block) {
  const wrapped = `${startMarker}\n${block.trim()}\n${endMarker}`;
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start !== -1 && end !== -1 && end > start) {
    const suffix = content.slice(end + endMarker.length).replace(/^\n*/, '\n');
    return `${content.slice(0, start)}${wrapped}${suffix}`;
  }

  const base = content.trimEnd();
  return base ? `${base}\n\n${wrapped}\n` : `${wrapped}\n`;
}

function extractSection(content, heading) {
  const lines = content.split('\n');
  const target = `## ${heading}`.trim();
  const start = lines.findIndex(line => line.trim() === target);

  if (start === -1) {
    return '';
  }

  const section = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      break;
    }
    section.push(lines[i]);
  }

  return section.join('\n').trim();
}

function extractBulletLines(section) {
  return section
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^[-*]\s+/.test(line))
    .map(line => line.replace(/^[-*]\s+/, '').trim())
    .filter(line => line && !/[：:]$/.test(line));
}

function extractTableRows(section) {
  const rows = section
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('|'))
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
    .filter(cells => cells.length > 1);

  return rows.filter(cells => {
    const joined = cells.join('');
    if (!joined || /^-+$/.test(joined.replace(/\|/g, ''))) {
      return false;
    }
    if (cells.every(cell => !cell || /^-+$/.test(cell))) {
      return false;
    }
    if (/^ID$/i.test(cells[0]) || /^任务$/i.test(cells[0]) || /^验收标准$/i.test(cells[0])) {
      return false;
    }
    return true;
  });
}

function parseVerificationResult(content) {
  const match = content.match(/- Result:\s*([A-Z]+|通过|失败)/);
  return match ? match[1] : 'UNKNOWN';
}

function parseTrack(content) {
  const match = content.match(/track:\s*(standard|medium|fast)/);
  return match ? match[1] : 'standard';
}

function parseLastUpdated(content, date) {
  return content.replace(/(\|\s*最后更新\s*\|\s*)([^|]*)(\|)/, `$1\`${date}\` $3`);
}

function parseFeatureMeta(featureDir) {
  const base = path.basename(featureDir);
  const firstDash = base.indexOf('-');
  if (firstDash === -1) {
    return { featureId: base, featureName: base, featureDirName: base };
  }
  return {
    featureId: base.slice(0, firstDash),
    featureName: base.slice(firstDash + 1),
    featureDirName: base
  };
}

function parsePersistedLearnings(content) {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.includes('[PERSIST]'))
    .map(line => line.replace(/^[-*]\s*/, '').trim());
}

function collectFeatureContext(root, featureDir) {
  const specStatePath = path.join(featureDir, 'SPEC-STATE.md');
  const designPath = path.join(featureDir, '技术方案.md');
  const verificationPath = path.join(featureDir, 'VERIFICATION.md');
  const testPlanPath = path.join(featureDir, '测试计划.md');
  const testReportPath = path.join(featureDir, '测试报告.md');
  const learningsPath = path.join(featureDir, 'notepads', 'learnings.md');

  const specState = exists(specStatePath) ? read(specStatePath) : '';
  const design = exists(designPath) ? read(designPath) : '';
  const verification = exists(verificationPath) ? read(verificationPath) : '';
  const testPlan = exists(testPlanPath) ? read(testPlanPath) : '';
  const testReport = exists(testReportPath) ? read(testReportPath) : '';
  const learnings = exists(learningsPath) ? read(learningsPath) : '';

  const deploymentPlan = extractBulletLines(extractSection(design, '上线计划')).slice(0, 4);
  const decisionSection = extractSection(design, '决策记录') || extractSection(design, '锁定决策');
  const decisions = extractTableRows(decisionSection)
    .map(cells => `${cells[0]} ${cells[1]}`.trim())
    .filter(Boolean)
    .slice(0, 4);

  return {
    root,
    featureDir,
    meta: parseFeatureMeta(featureDir),
    track: parseTrack(specState),
    verificationResult: verification ? parseVerificationResult(verification) : 'UNKNOWN',
    deploymentPlan,
    decisions,
    persistedLearnings: parsePersistedLearnings(learnings).slice(0, 5),
    paths: {
      specStatePath,
      designPath,
      verificationPath,
      testPlanPath,
      testReportPath,
      readmePath: path.join(root, 'README.md'),
      knowledgePath: path.join(root, 'docs', 'knowledge.md')
    }
  };
}

function buildReadmeBlock(ctx) {
  const deploymentLines = ctx.deploymentPlan.length
    ? ctx.deploymentPlan.map(item => `- ${item}`)
    : ['- 无额外上线动作记录'];

  return [
    '## Current Feature Sync',
    '',
    `- Feature: \`${ctx.meta.featureDirName}\``,
    `- Track: \`${ctx.track}\``,
    `- Verification: \`${ctx.verificationResult}\``,
    '',
    '### Deployment Notes',
    ...deploymentLines
  ].join('\n');
}

function buildKnowledgeBlock(ctx) {
  const decisionLines = ctx.decisions.length
    ? ctx.decisions.map(item => `- ${item}`)
    : ['- 暂无已抽取的锁定决策'];
  const deploymentLines = ctx.deploymentPlan.length
    ? ctx.deploymentPlan.map(item => `- ${item}`)
    : ['- 暂无额外上线约束'];
  const learningLines = ctx.persistedLearnings.length
    ? ctx.persistedLearnings.map(item => `- ${item}`)
    : ['- 暂无 `[PERSIST]` learnings'];

  return [
    `## Feature Increment: ${ctx.meta.featureDirName}`,
    '',
    `- Verification: \`${ctx.verificationResult}\``,
    '',
    '### 锁定决策摘录',
    ...decisionLines,
    '',
    '### 上线与运行约束',
    ...deploymentLines,
    '',
    '### 持久化 Learnings',
    ...learningLines
  ].join('\n');
}

function refreshFeatureDocs(ctx, date) {
  const updated = [];
  for (const filePath of [ctx.paths.designPath, ctx.paths.testPlanPath, ctx.paths.testReportPath]) {
    if (!exists(filePath)) {
      continue;
    }
    const original = read(filePath);
    const next = parseLastUpdated(original, date);
    if (next !== original) {
      write(filePath, next);
      updated.push(path.relative(ctx.root, filePath));
    }
  }
  return updated;
}

function prepareCommitDocs(root, feature, date) {
  const featureDir = featureDirFromArg(root, feature);
  if (!exists(featureDir)) {
    fail(`feature 不存在: ${featureDir}`);
  }

  const ctx = collectFeatureContext(root, featureDir);
  const updated = refreshFeatureDocs(ctx, date);

  const readmePath = ctx.paths.readmePath;
  const readmeBase = exists(readmePath) ? read(readmePath) : '# Project\n';
  const readmeNext = upsertManagedBlock(readmeBase, README_START, README_END, buildReadmeBlock(ctx));
  if (readmeNext !== readmeBase) {
    write(readmePath, readmeNext);
    updated.push(path.relative(root, readmePath));
  }

  const knowledgePath = ctx.paths.knowledgePath;
  ensureDir(path.dirname(knowledgePath));
  const knowledgeBase = exists(knowledgePath) ? read(knowledgePath) : '# 领域知识库\n';
  const knowledgeNext = upsertManagedBlock(knowledgeBase, KNOWLEDGE_START, KNOWLEDGE_END, buildKnowledgeBlock(ctx));
  if (knowledgeNext !== knowledgeBase) {
    write(knowledgePath, knowledgeNext);
    updated.push(path.relative(root, knowledgePath));
  }

  return { ctx, updated };
}

function checkCommitDocs(root, feature) {
  const featureDir = featureDirFromArg(root, feature);
  if (!exists(featureDir)) {
    fail(`feature 不存在: ${featureDir}`);
  }

  const ctx = collectFeatureContext(root, featureDir);
  const failures = [];

  if (!exists(ctx.paths.designPath)) {
    failures.push('缺少 技术方案.md');
  }
  if (!exists(ctx.paths.verificationPath)) {
    failures.push('缺少 VERIFICATION.md');
  }
  if (!exists(ctx.paths.readmePath)) {
    failures.push('缺少 README.md');
  } else {
    const readme = read(ctx.paths.readmePath);
    if (!readme.includes(README_START) || !readme.includes(ctx.meta.featureDirName)) {
      failures.push('README.md 未包含当前 feature 的 commit sync 区块');
    }
  }
  if (!exists(ctx.paths.knowledgePath)) {
    failures.push('缺少 docs/knowledge.md');
  } else {
    const knowledge = read(ctx.paths.knowledgePath);
    if (!knowledge.includes(KNOWLEDGE_START) || !knowledge.includes(ctx.meta.featureDirName)) {
      failures.push('docs/knowledge.md 未包含当前 feature 的增量沉淀区块');
    }
  }

  if (ctx.track !== 'fast') {
    if (!exists(ctx.paths.testPlanPath)) {
      failures.push('medium / standard 路径缺少 测试计划.md');
    }
    if (!exists(ctx.paths.testReportPath)) {
      failures.push('medium / standard 路径缺少 测试报告.md');
    }
  }

  return { ctx, failures };
}

module.exports = {
  README_START,
  README_END,
  KNOWLEDGE_START,
  KNOWLEDGE_END,
  parseArgs,
  featureDirFromArg,
  prepareCommitDocs,
  checkCommitDocs,
  fail
};
