#!/usr/bin/env node
// spec-state-guard.js
// PreToolUse hook: enforces SPEC-STATE phase gates
//
// When an active feature has phase < EXEC, blocks:
//   - Edit/Write/MultiEdit on ANY code file in the project
//   - Bash commands that compile/run code
//
// Detection: any features/*/SPEC-STATE.md that exists and phase != CLOSED
// Priority: git branch match > most recently modified SPEC-STATE.md
// Whitelist: .md/.yaml/.json files always allowed; npm test/lint/validate always allowed

const fs = require('fs');
const path = require('path');

const CODE_EXTENSIONS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.java', '.py', '.go', '.rs',
  '.rb', '.php', '.c', '.cpp', '.h', '.hpp', '.cs', '.swift',
  '.kt', '.scala', '.sh', '.sql', '.vue', '.svelte', '.astro',
  '.css', '.scss', '.less', '.sass', '.html', '.htm', '.svg'
]);

const PLANNING_EXTENSIONS = new Set(['.md', '.yaml', '.yml', '.json']);

const PHASES = ['INIT', 'REQ', 'DESIGN', 'TASKS', 'EXEC', 'REVIEW', 'VERIFY', 'CLOSED'];

const CODE_EDIT_ALLOWED_FROM = PHASES.indexOf('EXEC');

const CODE_BASH_PATTERNS = [
  { pattern: /\bnode\s+\S+\.(js|ts|mjs)\b/, label: 'node 脚本执行' },
  { pattern: /\bpython\d?\s+\S+\.py\b/, label: 'python 脚本执行' },
  { pattern: /\bgo\s+(run|build|test)\s+/, label: 'go 编译/运行' },
  { pattern: /\bjavac\s+/, label: 'javac 编译' },
  { pattern: /\bjava\s+/, label: 'java 运行' },
  { pattern: /\b(npm|pnpm|yarn)\s+(run|exec)\s+(?!validate\b|test\b|lint\b|typecheck\b|doctor\b|check\b|ci\b)\S+/, label: 'npm/pnpm/yarn 脚本执行' },
  { pattern: /\bnpx\s+/, label: 'npx 执行' },
  { pattern: /\b(npm|pnpm|yarn)\s+(run\s+)?dev\b/, label: 'dev server 启动' },
  { pattern: /\b(npm|pnpm|yarn)\s+(run\s+)?build\b/, label: '项目构建' },
  { pattern: /\b(npm|pnpm|yarn)\s+(run\s+)?start\b/, label: '项目启动' },
  { pattern: /\bmvn\s+(compile|package|install|spring-boot:run)\b/, label: 'maven 编译/运行' },
  { pattern: /\bgradlew?\s+(compile|build|bootRun)\b/, label: 'gradle 编译/运行' },
  { pattern: /\bcargo\s+(build|run)\b/, label: 'cargo 编译/运行' },
  { pattern: /\brustc\s+/, label: 'rustc 编译' },
  { pattern: /\bdotnet\s+(build|run)\b/, label: 'dotnet 编译/运行' },
  { pattern: /\bbun\s+(run|build)\s+/, label: 'bun 运行/构建' },
];

const ALLOWED_BASH_PATTERNS = [
  /\b(node|bun)\s+\S*(scaffold-feature|update-spec-state|doctor|validate|install-manifest|repair)\.js\b/,
  /\b(npm|pnpm|yarn)\s+(run\s+)?(validate|doctor|check|lint|test|typecheck|ci)\b/
];

function findActiveFeature(cwd) {
  const featuresDir = path.join(cwd, 'features');
  if (!fs.existsSync(featuresDir)) {
    return null;
  }

  const featureDirs = fs.readdirSync(featuresDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  let branchFeature = null;
  try {
    const { execSync } = require('child_process');
    const branch = execSync('git branch --show-current', {
      cwd, encoding: 'utf8', timeout: 5000
    }).trim();
    if (branch) {
      const matchedFeature = matchFeatureFromBranch(branch, featureDirs);
      if (matchedFeature && fs.existsSync(path.join(featuresDir, matchedFeature, 'SPEC-STATE.md'))) {
        branchFeature = matchedFeature;
      }
    }
  } catch (e) {}

  let latestFeature = null;
  let latestMtime = 0;
  try {
    for (const entry of fs.readdirSync(featuresDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const specState = path.join(featuresDir, entry.name, 'SPEC-STATE.md');
        if (fs.existsSync(specState)) {
          const content = fs.readFileSync(specState, 'utf8');
          const phase = extractPhase(content);
          if (phase === 'CLOSED') continue;

          const stat = fs.statSync(specState);
          if (stat.mtimeMs > latestMtime) {
            latestMtime = stat.mtimeMs;
            latestFeature = entry.name;
          }
        }
      }
    }
  } catch (e) {}

  return branchFeature || latestFeature;
}

function matchFeatureFromBranch(branch, featureDirs) {
  if (!branch.startsWith('feature/')) {
    return null;
  }

  const raw = branch.replace('feature/', '');
  const normalized = raw.replace(/\//g, '-');
  const idPrefix = raw.split('/')[0];

  if (featureDirs.includes(raw)) {
    return raw;
  }
  if (featureDirs.includes(normalized)) {
    return normalized;
  }

  const prefixMatches = featureDirs.filter(name => name === idPrefix || name.startsWith(idPrefix + '-'));
  if (prefixMatches.length === 1) {
    return prefixMatches[0];
  }

  return null;
}

function extractPhase(content) {
  const match = content.match(/phase:\s*(INIT|REQ|DESIGN|TASKS|EXEC|REVIEW|VERIFY|CLOSED)/);
  return match ? match[1] : null;
}

function isCodeFile(relPath) {
  return CODE_EXTENSIONS.has(path.extname(relPath));
}

function isPlanningFile(relPath) {
  return PLANNING_EXTENSIONS.has(path.extname(relPath));
}

function isCodeBashCommand(command) {
  const trimmed = command.trim();
  for (const { pattern, label } of CODE_BASH_PATTERNS) {
    if (pattern.test(trimmed)) {
      return label;
    }
  }
  return null;
}

function isAllowedBashCommand(command) {
  const trimmed = command.trim();
  return ALLOWED_BASH_PATTERNS.some(pattern => pattern.test(trimmed));
}

function block(msg) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: msg
    }
  }));
  process.exit(0);
}

function buildBlockMessage(activeFeature, phaseLabel, detail) {
  return 'SPEC-STATE 门禁拦截：当前阶段为 ' + phaseLabel +
    '，不允许执行代码操作。\n\n' +
    detail + '\n\n' +
    'Feature: ' + activeFeature + '\n' +
    '阶段推进：INIT → REQ → DESIGN → TASKS → EXEC（此时才允许写代码）\n\n' +
    '当前允许：编辑 .md/.yaml/.json 规划文档\n\n' +
    '如需强制推进：\n' +
    '  node scripts/update-spec-state.js --feature ' + activeFeature +
    ' --to EXEC --force\n\n' +
    '如果是误拦截，请说明原因后继续。';
}

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 5000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name;
    const toolArgs = data.tool_args || {};
    const cwd = data.cwd || process.cwd();

    const activeFeature = findActiveFeature(cwd);
    if (!activeFeature) {
      process.exit(0);
    }

    const specStatePath = path.join(cwd, 'features', activeFeature, 'SPEC-STATE.md');
    if (!fs.existsSync(specStatePath)) {
      process.exit(0);
    }

    const phase = extractPhase(fs.readFileSync(specStatePath, 'utf8'));
    if (!phase) {
      process.exit(0);
    }

    const phaseIndex = PHASES.indexOf(phase);
    if (phaseIndex === -1 || phaseIndex >= CODE_EDIT_ALLOWED_FROM) {
      process.exit(0);
    }

    const phaseLabels = { 0: 'INIT', 1: 'REQ', 2: 'DESIGN', 3: 'TASKS' };
    const phaseLabel = phaseLabels[phaseIndex] || phase;

    if (toolName === 'Bash') {
      const command = String(toolArgs.command || '');
      if (isAllowedBashCommand(command)) {
        process.exit(0);
      }
      const codeLabel = isCodeBashCommand(command);
      if (!codeLabel) {
        process.exit(0);
      }

      block(buildBlockMessage(activeFeature, phaseLabel,
        '被拦截命令：' + codeLabel + '\n命令内容：' + command.slice(0, 120)));
    }

    if (toolName !== 'Edit' && toolName !== 'Write' && toolName !== 'MultiEdit') {
      process.exit(0);
    }

    const filePath = toolArgs.file_path || toolArgs.path || '';
    if (!filePath) {
      process.exit(0);
    }

    if (isPlanningFile(filePath) && !isCodeFile(filePath)) {
      process.exit(0);
    }

    if (!isCodeFile(filePath)) {
      process.exit(0);
    }

    block(buildBlockMessage(activeFeature, phaseLabel,
      '被拦截文件：' + filePath));
  } catch (e) {
    process.exit(0);
  }
});
