#!/usr/bin/env node
// gsd-code-checker.js
// Code quality checker for strict mode
// Runs format checks and type checks on modified files
//
// This is a placeholder - extend with actual checks:
//   - Maven checkstyle: mvn checkstyle:check
//   - SpotBugs: mvn spotbugs:check
//   - Code format: mvn formatter:validate
//   - Type check: mvn compile

const fs = require('fs');
const os = require('os');
const path = require('path');

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 30000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name;
    const toolArgs = data.tool_args || {};

    // Only run on Bash tool
    if (toolName !== 'Bash') {
      process.exit(0);
    }

    const command = toolArgs.command || '';
    const cwd = toolArgs.cwd || process.cwd();

    // Skip if not a code check command
    const CODE_CHECK_PATTERNS = [
      /^mvn.*checkstyle/,
      /^mvn.*spotbugs/,
      /^mvn.*formatter:validate/,
      /^mvn.*compile/,
      /^npm.*lint/,
      /^npm.*check/
    ];

    const isCodeCheck = CODE_CHECK_PATTERNS.some(p => p.test(command));
    if (!isCodeCheck) {
      process.exit(0);
    }

    // Run the check and capture output
    const { execSync } = require('child_process');
    try {
      const output = execSync(command, {
        cwd,
        encoding: 'utf8',
        timeout: 60000
      });

      // Check passed
      process.exit(0);
    } catch (e) {
      // Check failed - inject warning
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: `🔍 代码检查失败：
命令: ${command}
退出码: ${e.status}

输出:
${e.stdout || ''}
${e.stderr || ''}

请修复上述问题后重新提交。`
        }
      };

      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }

  } catch (e) {
    process.exit(0);
  }
});
