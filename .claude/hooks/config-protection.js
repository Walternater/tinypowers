#!/usr/bin/env node
// config-protection.js
// Prevents agents from weakening lint/formatter/config files
// instead of fixing the actual code
//
// This hook intercepts Edit/Write operations on config files and warns the agent
// to fix the code, not weaken the config.

const fs = require('fs');
const path = require('path');

// Protected config files (relative to project root)
const PROTECTED_PATTERNS = [
  // Linter configs
  /\.eslintrc\.?/i,
  /\.eslintignore$/i,
  /prettier\.config\./i,
  /prettier\.ignore$/i,
  /biome\.json$/i,
  /biome\.js$/i,
  /\.stylelintrc/i,
  // Formatter configs
  /\.editorconfig$/i,
  // TypeScript configs
  /tsconfig.*\.json$/i,
  // Java configs
  /checkstyle.*\.xml$/i,
  /spotbugs.*\.xml$/i,
  /pom\.xml$/i,
  // Maven wrapper
  /mvnw$/i,
  /gradlew$/i,
  // CI configs
  /\.github\/workflows\//i,
  /Jenkinsfile/i,
  // Security configs
  /\.gitignore$/i,
  /dependabot\.yml$/i,
  // Hooks
  /hooks\//i,
  /\.claude\//i,
  /\.husky\//i
];

// Directories to protect
const PROTECTED_DIRS = [
  /hooks\//,
  /\.claude\//,
  /\.github\//,
  /\.husky\//,
];

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

    // Only check Edit and Write operations
    if (toolName !== 'Edit' && toolName !== 'Write' && toolName !== 'MultiEdit') {
      process.exit(0);
    }

    // Get the file path being modified
    const filePath = toolArgs.file_path || toolArgs.path || '';
    if (!filePath) {
      process.exit(0);
    }

    // Normalize path
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Check against protected patterns
    const isProtected = PROTECTED_PATTERNS.some(pattern =>
      pattern.test(normalizedPath)
    );

    const isInProtectedDir = PROTECTED_DIRS.some(dir =>
      dir.test(normalizedPath)
    );

    if (isProtected || isInProtectedDir) {
      const fileName = path.basename(normalizedPath);
      const msg = '🔒 配置文件保护：检测到正在修改 "' + fileName + '"\n\n'
        + '这是受保护的配置文件。请通过以下方式修复问题，而不是修改配置：\n\n'
        + '1. 修复代码以符合现有 lint 规则\n'
        + '2. 如果规则确实不合理，请先与用户确认后再修改\n'
        + '3. 不要为了让代码通过检查而降低检查标准\n\n'
        + '如果你的修改是有意的，请输入"ALLOW_CONFIG_EDIT"继续。';

      const output = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: msg
        }
      };

      process.stdout.write(JSON.stringify(output));
    }

  } catch (e) {
    // Silent fail
    process.exit(0);
  }
});
