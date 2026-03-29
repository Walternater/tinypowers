#!/usr/bin/env node
// gsd-code-checker.js
// Strict-mode code check reminder.
//
// Purpose:
//   - Only active when TINYPOWERS_HOOK_LEVEL=strict
//   - Avoids silent drift where code changes accumulate without running
//     any verification command
//   - Recommends targeted validation commands based on modified files

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const HOOK_LEVEL = process.env.TINYPOWERS_HOOK_LEVEL || 'standard';
const VALIDATION_COMMANDS = [
  /\bmvn\b.*\b(test|verify|compile|checkstyle:check|spotbugs:check|formatter:validate)\b/i,
  /\bgradle\b.*\b(test|check|build)\b/i,
  /\bgradlew\b.*\b(test|check|build)\b/i,
  /\bnpm\b.*\b(test|lint|check|typecheck)\b/i,
  /\bpnpm\b.*\b(test|lint|check|typecheck)\b/i,
  /\byarn\b.*\b(test|lint|check|typecheck)\b/i,
  /\bpytest\b/i,
  /\bgo test\b/i
];
const REMINDER_INTERVAL = 4;

function getModifiedFiles(cwd) {
  try {
    const output = execSync(
      'git diff --name-only --diff-filter=ACMR HEAD 2>/dev/null || git diff --name-only --cached 2>/dev/null',
      { cwd, encoding: 'utf8', timeout: 5000 }
    );
    return output.split('\n').map(line => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function buildSuggestions(files) {
  const exts = new Set(files.map(file => path.extname(file).toLowerCase()));
  const suggestions = [];

  if (files.some(file => file.endsWith('.java') || file === 'pom.xml' || file.startsWith('src/main'))) {
    suggestions.push('mvn test');
  }
  if (files.some(file => file.endsWith('.js') || file.endsWith('.ts') || file === 'package.json')) {
    suggestions.push('npm test');
  }
  if (files.some(file => file.endsWith('.sql') || file.includes('db/') || file.includes('migration'))) {
    suggestions.push('检查 DDL / migration 与技术方案、测试数据是否一致');
  }

  if (suggestions.length === 0) {
    suggestions.push('运行与你当前改动匹配的最小验证命令');
  }

  return suggestions;
}

function getStatePath(sessionId) {
  const suffix = sessionId || 'default';
  return path.join(os.tmpdir(), `tinypowers-strict-check-${suffix}.json`);
}

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 10000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);

  if (HOOK_LEVEL !== 'strict') {
    process.exit(0);
  }

  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name;
    const toolArgs = data.tool_args || {};
    const cwd = data.cwd || toolArgs.cwd || process.cwd();
    const sessionId = data.session_id;
    const statePath = getStatePath(sessionId);

    if (!['Bash', 'Edit', 'Write', 'MultiEdit'].includes(toolName)) {
      process.exit(0);
    }

    const command = String(toolArgs.command || '').trim();
    if (toolName === 'Bash' && VALIDATION_COMMANDS.some(pattern => pattern.test(command))) {
      fs.writeFileSync(statePath, JSON.stringify({ sinceReminder: 0 }, null, 2));
      process.exit(0);
    }

    const modifiedFiles = getModifiedFiles(cwd);
    if (modifiedFiles.length === 0) {
      process.exit(0);
    }

    let state = { sinceReminder: 0 };
    if (fs.existsSync(statePath)) {
      try {
        state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      } catch {
        state = { sinceReminder: 0 };
      }
    }

    state.sinceReminder = Number(state.sinceReminder || 0) + 1;
    if (state.sinceReminder < REMINDER_INTERVAL) {
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
      process.exit(0);
    }

    state.sinceReminder = 0;
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

    const suggestions = buildSuggestions(modifiedFiles);
    const preview = modifiedFiles.slice(0, 5).map(file => `- ${file}`).join('\n');
    const more = modifiedFiles.length > 5 ? `\n- ... 还有 ${modifiedFiles.length - 5} 个文件` : '';
    const message = [
      'STRICT 模式提醒：当前已有代码改动，但最近还没有看到对应的验证命令。',
      '',
      '已变更文件示例：',
      preview + more,
      '',
      '建议尽快运行：',
      ...suggestions.map(item => `- ${item}`),
      '',
      '如果你刚刚已经做过等价校验，可以忽略本提醒。'
    ].join('\n');

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: message
      }
    }));
  } catch {
    process.exit(0);
  }
});
