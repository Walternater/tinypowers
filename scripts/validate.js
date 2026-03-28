#!/usr/bin/env node
// validate.js — tinypowers Agent/Skill 定义校验器
//
// 用法: node scripts/validate.js [--fix]
//
// 校验规则：
//   1. Agent frontmatter 必须包含 name, description
//   2. Skill frontmatter 必须包含 name, description
//   3. 交叉引用的文件必须存在（agents, skills, docs, configs）
//   4. HARD-GATE 和 ANTI-RATIONALIZATION 标签必须正确闭合
//
// 退出码: 0 = 全部通过, 1 = 存在错误

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const fix = process.argv.includes('--fix');

let errors = 0;
let warnings = 0;

function error(file, line, msg) {
  errors++;
  console.log('ERROR ' + file + (line ? ':' + line : '') + ' — ' + msg);
}

function warn(file, line, msg) {
  warnings++;
  console.log('WARN  ' + file + (line ? ':' + line : '') + ' — ' + msg);
}

function ok(file, msg) {
  console.log('OK    ' + file + ' — ' + msg);
}

// --- Agent 校验 ---

function validateAgents() {
  const agentsDir = path.join(ROOT, 'agents');
  if (!fs.existsSync(agentsDir)) {
    console.log('SKIP  agents/ directory not found');
    return;
  }

  const agentFiles = findFiles(agentsDir, '.md');
  console.log('\n=== Agent 校验 (' + agentFiles.length + ' files) ===\n');

  for (const file of agentFiles) {
    const rel = path.relative(ROOT, file);
    const content = fs.readFileSync(file, 'utf8');

    // Check metadata: YAML frontmatter OR ## Metadata section
    let fm = parseFrontmatter(content);
    if (!fm) {
      fm = parseMetadataSection(content);
    }
    if (!fm) {
      error(rel, 1, '缺少元数据（需要 YAML frontmatter 或 ## Metadata 章节）');
      continue;
    }

    if (!fm.name) error(rel, 1, '元数据缺少 name 字段');
    if (!fm.description) error(rel, 1, '元数据缺少 description 字段');

    // Check tag balance
    checkTagBalance(rel, content, 'HARD-GATE');
    checkTagBalance(rel, content, 'ANTI-RATIONALIZATION');
    checkTagBalance(rel, content, 'TOOL-REQUIREMENT');

    if (fm.name && fm.description) {
      ok(rel, fm.name);
    }
  }
}

// --- Skill 校验 ---

function validateSkills() {
  const skillsDir = path.join(ROOT, 'skills');
  if (!fs.existsSync(skillsDir)) {
    console.log('SKIP  skills/ directory not found');
    return;
  }

  const skillFiles = findFiles(skillsDir, 'SKILL.md');
  console.log('\n=== Skill 校验 (' + skillFiles.length + ' files) ===\n');

  for (const file of skillFiles) {
    const rel = path.relative(ROOT, file);
    const content = fs.readFileSync(file, 'utf8');
    const dir = path.dirname(file);

    // Check frontmatter
    const fm = parseFrontmatter(content);
    if (!fm) {
      error(rel, 1, 'SKILL.md 缺少 YAML frontmatter');
      continue;
    }

    if (!fm.name) error(rel, 1, 'frontmatter 缺少 name 字段');
    if (!fm.description) error(rel, 1, 'frontmatter 缺少 description 字段');

    // Check tag balance
    checkTagBalance(rel, content, 'HARD-GATE');
    checkTagBalance(rel, content, 'ANTI-RATIONALIZATION');
    checkTagBalance(rel, content, 'TOOL-REQUIREMENT');

    // Check cross-references in skill directory
    const subFiles = findFiles(dir, '.md');
    const referencedFiles = extractReferences(content);

    for (const ref of referencedFiles) {
      const refPath = resolveReference(ref, dir, ROOT);
      if (!refPath) {
        // Skip @agents and @docs references for skill-internal checks
        if (!ref.startsWith('@')) {
          warn(rel, 0, '引用文件不存在: ' + ref);
        }
      }
    }

    // Check @agents references
    const agentRefs = content.match(/@agents\/[\w\-\/\.]+\.md/g) || [];
    for (const ref of agentRefs) {
      const agentPath = path.join(ROOT, ref.replace('@', ''));
      if (!fs.existsSync(agentPath)) {
        error(rel, 0, 'Agent 引用不存在: ' + ref + ' → ' + agentPath);
      }
    }

    // Check @configs references (skip optional ones marked with 如有/如有需要)
    const configRefs = content.match(/@configs\/[\w\-\/\.]+\.md/g) || [];
    for (const ref of configRefs) {
      const configPath = path.join(ROOT, ref.replace('@', ''));
      if (!fs.existsSync(configPath)) {
        // Check if the line contains optional markers
        const lineWithRef = content.split('\n').find(l => l.includes(ref));
        if (lineWithRef && /如有|optional|如果存在/.test(lineWithRef)) {
          warn(rel, 0, '可选 Config 引用不存在: ' + ref);
        } else {
          error(rel, 0, 'Config 引用不存在: ' + ref);
        }
      }
    }

    // Check @docs references
    const docsRefs = content.match(/@docs\/[\w\-\/\.]+\.md/g) || [];
    for (const ref of docsRefs) {
      const docsPath = path.join(ROOT, ref.replace('@', ''));
      if (!fs.existsSync(docsPath)) {
        error(rel, 0, 'Docs 引用不存在: ' + ref);
      }
    }

    if (fm.name && fm.description) {
      ok(rel, fm.name);
    }
  }
}

// --- Hook 校验 ---

function validateHooks() {
  const hooksDir = path.join(ROOT, 'hooks');
  if (!fs.existsSync(hooksDir)) {
    console.log('SKIP  hooks/ directory not found');
    return;
  }

  const hookFiles = findFiles(hooksDir, '.js');
  console.log('\n=== Hook 校验 (' + hookFiles.length + ' files) ===\n');

  for (const file of hookFiles) {
    const rel = path.relative(ROOT, file);
    const content = fs.readFileSync(file, 'utf8');

    // Check for basic structure
    if (!content.includes('process.stdin')) {
      warn(rel, 0, 'Hook 缺少 stdin 读取逻辑');
    }
    if (!content.includes('process.exit(0)')) {
      warn(rel, 0, 'Hook 缺少 process.exit(0) — 可能无法正常退出');
    }

    // Syntax check via node --check
    try {
      execFileSync('node', ['--check', file], { stdio: 'pipe', timeout: 5000 });
      ok(rel, '语法检查通过');
    } catch (e) {
      error(rel, 0, 'JS 语法错误: ' + (e.stderr ? e.stderr.toString().trim() : e.message));
    }
  }

  // Check settings.json references
  const settingsPath = path.join(ROOT, '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const hookCommands = extractHookCommands(settings);
    for (const cmd of hookCommands) {
      const hookFile = cmd.match(/\{HOOKS_DIR\}\/([^\s"]+)/);
      if (hookFile) {
        const hookPath = path.join(hooksDir, hookFile[1]);
        if (!fs.existsSync(hookPath)) {
          error('.claude/settings.json', 0, 'Hook 引用不存在: ' + hookFile[1]);
        }
      }
    }
  }
}

// --- 辅助函数 ---

function findFiles(dir, suffix) {
  let results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(findFiles(full, suffix));
      } else if (entry.name.endsWith(suffix)) {
        results.push(full);
      }
    }
  } catch (e) {
    // Directory not accessible
  }
  return results;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const fm = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const kv = line.match(/^(\w[\w_-]*):\s*(.*)/);
    if (kv) {
      fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
    }
  }
  return fm;
}

function parseMetadataSection(content) {
  // Parse ## Metadata section with **key**: value format
  const match = content.match(/## Metadata\r?\n([\s\S]*?)(?:\r?\n---|\r?\n## |\r?\n# )/);
  if (!match) return null;

  const fm = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const kv = line.match(/^\s*-\s*\*\*(\w[\w_-]*)\*\*:\s*(.*)/);
    if (kv) {
      fm[kv[1]] = kv[2].trim();
    }
  }
  return Object.keys(fm).length > 0 ? fm : null;
}

function checkTagBalance(rel, content, tag) {
  const openTag = '<' + tag + '>';
  const closeTag = '</' + tag + '>';

  const opens = countOccurrences(content, openTag);
  const closes = countOccurrences(content, closeTag);

  if (opens !== closes) {
    error(rel, 0, tag + ' 标签不匹配: ' + opens + ' 个开启, ' + closes + ' 个闭合');
  }
}

function countOccurrences(str, substr) {
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(substr, pos)) !== -1) {
    count++;
    pos += substr.length;
  }
  return count;
}

function extractReferences(content) {
  // Extract backtick-wrapped file references like `wave-execution.md`
  const refs = [];
  const regex = /`([^`]*\.md)`/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const ref = match[1];
    // Skip URLs and absolute paths
    if (ref.startsWith('http') || ref.startsWith('/')) continue;
    // Skip feature paths with placeholders
    if (ref.includes('{')) continue;
    refs.push(ref);
  }
  return refs;
}

function resolveReference(ref, baseDir, root) {
  // Try relative to skill directory
  let p = path.join(baseDir, ref);
  if (fs.existsSync(p)) return p;

  // Try relative to project root
  p = path.join(root, ref);
  if (fs.existsSync(p)) return p;

  return null;
}

function extractHookCommands(settings) {
  const commands = [];
  const hooks = settings.hooks || {};
  for (const event of Object.values(hooks)) {
    if (!Array.isArray(event)) continue;
    for (const entry of event) {
      const hookList = entry.hooks || [entry];
      for (const h of hookList) {
        if (h.command) commands.push(h.command);
      }
    }
  }
  return commands;
}

// --- 主流程 ---

console.log('tinypowers 定义校验器');
console.log('==================');
console.log('根目录: ' + ROOT);

validateAgents();
validateSkills();
validateHooks();

console.log('\n==================');
console.log('结果: ' + errors + ' 错误, ' + warnings + ' 警告');

if (errors > 0) {
  console.log('\nEXIT: FAIL');
  process.exit(1);
} else {
  console.log('\nEXIT: PASS');
  process.exit(0);
}
