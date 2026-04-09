const fs = require('fs');
const path = require('path');

const ARTIFACTS = [
  { label: 'PRD', file: 'PRD.md' },
  { label: '技术方案', file: '技术方案.md' },
  { label: '任务拆解表', file: '任务拆解表.md' },
  { label: '生命周期状态', file: 'SPEC-STATE.md', special: 'spec-state' },
  { label: 'STATE（复杂执行可选）', file: 'STATE.md', special: 'state' },
  { label: '验证报告', file: 'VERIFICATION.md' }
];

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function hasAcceptanceCriteria(content) {
  return content.split('\n').some(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('>')) {
      return false;
    }
    return /(AC-\d+[：:]\s*\S|WHEN\s+\S[^`\n]+SHALL\s+\S|IF\s+\S[^`\n]+SHALL\s+\S|系统\s*SHALL\s+\S)/.test(trimmed);
  });
}

function hasConfirmedDecision(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (!line.trim().startsWith('|')) {
      continue;
    }

    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (!/^D-\d+$/i.test(cells[0] || '')) {
      continue;
    }

    const decision = cells[1] || '';
    const reason = cells[2] || '';
    const status = cells[3] || '';
    if (decision && reason && status === '已确认') {
      return true;
    }
  }

  return false;
}

function hasFilledTaskRows(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (!line.trim().startsWith('|')) {
      continue;
    }

    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (!/^T-\d+$/i.test(cells[0] || '')) {
      continue;
    }

    const taskName = cells[1] || '';
    const meaningfulDetail = cells.slice(2).some(cell => {
      if (!cell || cell === '—') {
        return false;
      }
      return cell !== '后端/前端/DB/测试' && cell !== '实现 / 测试 / 文档';
    });

    if (taskName && meaningfulDetail) {
      return true;
    }
  }

  return false;
}

function extractVerificationResult(content) {
  const match = content.match(/-\s*(?:Result|结论)\s*[：:]\s*(PASS|FAIL|通过|失败)\b/m);
  if (!match) {
    return null;
  }

  const value = match[1];
  if (value === '通过') {
    return 'PASS';
  }
  if (value === '失败') {
    return 'FAIL';
  }
  return value;
}

function hasVerificationConclusion(content) {
  return extractVerificationResult(content) !== null;
}

function artifactStatus(featureDir, artifact) {
  if (artifact.special === 'spec-state') {
    return 'active';
  }
  if (artifact.special === 'state') {
    return fs.existsSync(path.join(featureDir, artifact.file)) ? 'scaffolded' : 'optional';
  }

  const filePath = path.join(featureDir, artifact.file);
  if (!fs.existsSync(filePath)) {
    return 'pending';
  }

  const content = readIfExists(filePath);
  switch (artifact.file) {
    case 'PRD.md':
      return hasAcceptanceCriteria(content) ? 'filled' : 'scaffolded';
    case '技术方案.md':
      return hasConfirmedDecision(content) ? 'filled' : 'scaffolded';
    case '任务拆解表.md':
      return hasFilledTaskRows(content) ? 'filled' : 'scaffolded';
    case 'VERIFICATION.md':
      return hasVerificationConclusion(content) ? 'verified' : 'scaffolded';
    default:
      return content.trim().length > 0 ? 'filled' : 'scaffolded';
  }
}

function rewriteArtifactTable(content, featureDir) {
  const header = '| 产物 | 路径 | 状态 |';
  const lines = content.split('\n');
  const startIndex = lines.findIndex(line => line.trim() === header);
  if (startIndex === -1) {
    return content;
  }

  let endIndex = startIndex + 2;
  while (endIndex < lines.length && lines[endIndex].startsWith('|')) {
    endIndex += 1;
  }

  const table = [
    header,
    '|------|------|------|',
    ...ARTIFACTS.map(artifact => `| ${artifact.label} | ${artifact.file} | ${artifactStatus(featureDir, artifact)} |`)
  ];

  lines.splice(startIndex, endIndex - startIndex, ...table);
  return lines.join('\n');
}

module.exports = {
  ARTIFACTS,
  artifactStatus,
  hasAcceptanceCriteria,
  hasConfirmedDecision,
  hasFilledTaskRows,
  extractVerificationResult,
  hasVerificationConclusion,
  rewriteArtifactTable
};
