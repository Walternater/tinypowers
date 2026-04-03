#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
      continue;
    }
    if (arg === '--compliance-report') {
      args.complianceReport = path.resolve(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === '--code-review-report') {
      args.codeReviewReport = path.resolve(argv[i + 1]);
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractNamedSection(content, heading) {
  const pattern = new RegExp(`^## ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=^## |\\Z)`, 'm');
  const match = content.match(pattern);
  return match ? match[1].trim() : '';
}

function extractReportSection(content, heading, nextHeading) {
  const pattern = new RegExp(
    `${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=${escapeRegExp(nextHeading)}|\\Z)`,
    'm'
  );
  const match = content.match(pattern);
  return match ? match[1].trim() : '';
}

function extractTopLevelSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) {
        current.body = current.body.join('\n').trim();
        sections.push(current);
      }
      current = {
        heading: line.slice(3).trim(),
        body: []
      };
      continue;
    }

    if (current) {
      current.body.push(line);
    }
  }

  if (current) {
    current.body = current.body.join('\n').trim();
    sections.push(current);
  }

  return sections;
}

function extractSeverityBlocks(content, severity) {
  const regex = new RegExp(`^### ${severity}\\n([\\s\\S]*?)(?=^### |^## |\\Z)`, 'gm');
  return [...content.matchAll(regex)].map(match => match[1].trim());
}

function blockHasFindings(block) {
  if (!block) {
    return false;
  }

  const lines = block
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line === '- None') {
      continue;
    }
    if (/^\|\s*-+\s*\|/.test(line) || /^\|\s*#\s*\|/.test(line)) {
      continue;
    }
    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
      if (/^\d+$/.test(cells[0] || '')) {
        return true;
      }
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return true;
    }
    return true;
  }

  return false;
}

function highestSeverity(content) {
  if (extractSeverityBlocks(content, 'BLOCK').some(blockHasFindings)) {
    return 'BLOCK';
  }
  if (extractSeverityBlocks(content, 'WARNING').some(blockHasFindings)) {
    return 'WARNING';
  }
  if (extractSeverityBlocks(content, 'SUGGESTION').some(blockHasFindings)) {
    return 'SUGGESTION';
  }
  return 'NONE';
}

function parseOverallVerdict(content) {
  const explicit = content.match(/- Overall Verdict:\s*(PASS|CONDITIONAL|FAIL)\b/);
  if (explicit) {
    return explicit[1];
  }

  const bold = content.match(/\*\*Overall Verdict:\s*(PASS|CONDITIONAL|FAIL)\b.*\*\*/);
  if (bold) {
    return bold[1];
  }

  return 'PASS';
}

function parseResidualRisk(content) {
  const match = content.match(/Residual Risk:\s*(.+)/);
  return match ? match[1].trim() : '无';
}

function parseStoredSection(content) {
  if (!content) {
    return null;
  }

  const verdict = (content.match(/- Verdict:\s*(PASS|CONDITIONAL|FAIL)\b/) || [])[1] || 'PASS';
  const severity = (content.match(/- Highest Severity:\s*(BLOCK|WARNING|SUGGESTION|NONE)\b/) || [])[1] || 'NONE';
  const residualRisk = (content.match(/- Residual Risk:\s*(.+)/) || [])[1] || '无';

  return {
    content,
    verdict,
    severity,
    residualRisk: residualRisk.trim()
  };
}

function buildComplianceSection(reportContent) {
  const decision = extractReportSection(reportContent, '## Decision Compliance', '## Security Findings') || '- None';
  const security = extractReportSection(reportContent, '## Security Findings', '## Overall Verdict') || '- None';
  const verdict = parseOverallVerdict(reportContent);
  const severity = highestSeverity(reportContent);
  const residualRisk = parseResidualRisk(reportContent);

  return {
    verdict,
    severity,
    residualRisk,
    content: [
      `- Verdict: ${verdict}`,
      `- Highest Severity: ${severity}`,
      `- Residual Risk: ${residualRisk}`,
      '',
      '### 决策符合性详情',
      decision,
      '',
      '### 安全审查详情',
      security
    ].join('\n')
  };
}

function buildCodeReviewSection(reportContent) {
  const findings = extractReportSection(reportContent, '## Findings', '## Overall Verdict') || '- None';
  const verdict = parseOverallVerdict(reportContent);
  const severity = highestSeverity(reportContent);
  const residualRisk = parseResidualRisk(reportContent);

  return {
    verdict,
    severity,
    residualRisk,
    content: [
      `- Verdict: ${verdict}`,
      `- Highest Severity: ${severity}`,
      `- Residual Risk: ${residualRisk}`,
      '',
      '### 审查详情',
      findings
    ].join('\n')
  };
}

function finalVerdict(sections) {
  if (sections.some(section => section.verdict === 'FAIL' || section.severity === 'BLOCK')) {
    return 'FAIL';
  }
  if (sections.some(section => section.verdict === 'CONDITIONAL' || section.severity === 'WARNING')) {
    return 'CONDITIONAL';
  }
  return 'PASS';
}

function renderKnownIssues(sectionMap) {
  const risks = [];
  if (sectionMap.compliance && sectionMap.compliance.residualRisk !== '无') {
    risks.push(`[compliance] ${sectionMap.compliance.residualRisk}`);
  }
  if (sectionMap.codeReview && sectionMap.codeReview.residualRisk !== '无') {
    risks.push(`[code-review] ${sectionMap.codeReview.residualRisk}`);
  }
  if (risks.length === 0) {
    return '- 无';
  }
  return risks.map(risk => `- ${risk}`).join('\n');
}

function renderSection(title, section) {
  if (!section) {
    return `## ${title}\n\n- Status: pending`;
  }

  return `## ${title}\n\n${section.content.trim()}`;
}

function renderRawSection(section) {
  return `## ${section.heading}\n\n${section.body.trim()}`;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.complianceReport && !args.codeReviewReport) {
    fail('至少需要提供 --compliance-report 或 --code-review-report');
  }

  const featureDir = featureDirFromArg(args.root, args.feature);
  if (!fs.existsSync(featureDir)) {
    fail('feature 目录不存在: ' + featureDir);
  }

  if (args.complianceReport && !fs.existsSync(args.complianceReport)) {
    fail('compliance report 不存在: ' + args.complianceReport);
  }
  if (args.codeReviewReport && !fs.existsSync(args.codeReviewReport)) {
    fail('code review report 不存在: ' + args.codeReviewReport);
  }

  const verificationPath = path.join(featureDir, 'VERIFICATION.md');
  const existing = fs.existsSync(verificationPath) ? read(verificationPath) : '';
  const managedHeadings = new Set(['决策合规性', '代码审查', '已知问题 / 残留风险', '结论']);
  const preservedSections = extractTopLevelSections(existing)
    .filter(section => !managedHeadings.has(section.heading));

  const sectionMap = {
    compliance: parseStoredSection(extractNamedSection(existing, '决策合规性')),
    codeReview: parseStoredSection(extractNamedSection(existing, '代码审查'))
  };

  if (args.complianceReport) {
    sectionMap.compliance = buildComplianceSection(read(args.complianceReport));
  }
  if (args.codeReviewReport) {
    sectionMap.codeReview = buildCodeReviewSection(read(args.codeReviewReport));
  }

  const sections = [sectionMap.compliance, sectionMap.codeReview].filter(Boolean);
  const result = finalVerdict(sections);
  const outputParts = [
    '# VERIFICATION',
    '',
    renderSection('决策合规性', sectionMap.compliance),
    '',
    renderSection('代码审查', sectionMap.codeReview)
  ];

  for (const section of preservedSections) {
    outputParts.push('', renderRawSection(section));
  }

  outputParts.push(
    '',
    '## 已知问题 / 残留风险',
    '',
    renderKnownIssues(sectionMap),
    '',
    '## 结论',
    '',
    `- Result: ${result}`
  );

  const output = outputParts.join('\n');

  fs.writeFileSync(verificationPath, output + '\n');

  console.log('VERIFICATION 已更新');
  console.log(verificationPath);
  console.log('result=' + result);
}

main();
