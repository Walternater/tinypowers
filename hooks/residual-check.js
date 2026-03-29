#!/usr/bin/env node
// residual-check.js
// Stop hook: 检查响应后是否有残留调试代码
//
// 检测项：
//   - System.out.println / System.err.println (Java)
//   - console.log (JS/TS，仅 warning)
//   - @SuppressWarnings("all") (Java)
//   - TODO / FIXME 注释（仅提示，不阻塞）

const fs = require('fs');
const path = require('path');

const JAVA_DEBUG_PATTERNS = [
  { pattern: /System\.out\.print/, label: 'System.out.print', level: 'BLOCK' },
  { pattern: /System\.err\.print/, label: 'System.err.print', level: 'BLOCK' },
  { pattern: /@SuppressWarnings\("all"\)/, label: '@SuppressWarnings("all")', level: 'WARNING' },
];

const JS_DEBUG_PATTERNS = [
  { pattern: /console\.log\(/, label: 'console.log', level: 'WARNING' },
];

const TODO_PATTERNS = [
  { pattern: /\/\/\s*TODO|<!--\s*TODO/, label: 'TODO 注释', level: 'INFO' },
  { pattern: /\/\/\s*FIXME|<!--\s*FIXME/, label: 'FIXME 注释', level: 'INFO' },
];

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 5000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const cwd = data.cwd || process.cwd();

    // Only check Java and JS files that were recently modified
    const { execSync } = require('child_process');

    let modifiedFiles = [];
    try {
      const gitOutput = execSync(
        'git diff --name-only --diff-filter=ACMR HEAD 2>/dev/null || git diff --name-only --cached 2>/dev/null',
        { cwd, encoding: 'utf8', timeout: 5000 }
      );
      modifiedFiles = gitOutput.split('\n').filter(f => f.trim());
    } catch (e) {
      // Not a git repo or no changes
      process.exit(0);
    }

    if (modifiedFiles.length === 0) {
      process.exit(0);
    }

    const issues = [];

    for (const file of modifiedFiles) {
      const fullPath = path.join(cwd, file);
      if (!fs.existsSync(fullPath)) continue;

      const ext = path.extname(file);
      let patterns = [];

      if (ext === '.java') {
        patterns = [...JAVA_DEBUG_PATTERNS, ...TODO_PATTERNS];
      } else if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
        patterns = [...JS_DEBUG_PATTERNS, ...TODO_PATTERNS];
      } else {
        continue;
      }

      let content;
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch (e) {
        continue;
      }

      const lines = content.split('\n');
      for (const { pattern, label, level } of patterns) {
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i])) {
            issues.push({ level, label, file, line: i + 1 });
            break; // One hit per pattern per file is enough
          }
        }
      }
    }

    if (issues.length === 0) {
      process.exit(0);
    }

    // Build message
    const blocks = issues.filter(i => i.level === 'BLOCK');
    const warns = issues.filter(i => i.level === 'WARNING');
    const infos = issues.filter(i => i.level === 'INFO');

    let msg = '残留代码检查结果：\n';

    if (blocks.length > 0) {
      msg += '\nBLOCK（必须修复）：\n';
      for (const b of blocks) {
        msg += `  - ${b.label} in ${b.file}:${b.line}\n`;
      }
    }
    if (warns.length > 0) {
      msg += '\nWARNING（建议清理）：\n';
      for (const w of warns) {
        msg += `  - ${w.label} in ${w.file}:${w.line}\n`;
      }
    }
    if (infos.length > 0) {
      msg += '\nINFO（留意）：\n';
      for (const info of infos) {
        msg += `  - ${info.label} in ${info.file}:${info.line}\n`;
      }
    }

    msg += '\n如果是调试临时代码，请清理后再提交。';

    const output = {
      hookSpecificOutput: {
        hookEventName: 'Stop',
        additionalContext: msg
      }
    };

    process.stdout.write(JSON.stringify(output));
  } catch (e) {
    process.exit(0);
  }
});
