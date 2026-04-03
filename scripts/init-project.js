#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const README_MARKER_START = '<!-- tinypowers:init-readme:start -->';
const README_MARKER_END = '<!-- tinypowers:init-readme:end -->';
const KNOWLEDGE_MARKER_START = '<!-- tinypowers:init-knowledge:start -->';
const KNOWLEDGE_MARKER_END = '<!-- tinypowers:init-knowledge:end -->';

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    installRoot: ROOT,
    force: false,
    skipKnowledge: false,
    includeMysql: false,
    techStack: 'Java (Maven)',
    techStackShort: 'java',
    buildTool: 'Maven',
    buildCommand: 'mvn test',
    servicePort: '8080',
    branchPattern: 'feature/{id}-{short-desc}'
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') { args.root = path.resolve(argv[i + 1]); i += 1; continue; }
    if (arg === '--install-root') { args.installRoot = path.resolve(argv[i + 1]); i += 1; continue; }
    if (arg === '--project-name') { args.projectName = argv[i + 1]; i += 1; continue; }
    if (arg === '--author') { args.author = argv[i + 1]; i += 1; continue; }
    if (arg === '--tech-stack') { args.techStack = argv[i + 1]; i += 1; continue; }
    if (arg === '--tech-stack-short') { args.techStackShort = argv[i + 1]; i += 1; continue; }
    if (arg === '--build-tool') { args.buildTool = argv[i + 1]; i += 1; continue; }
    if (arg === '--build-command') { args.buildCommand = argv[i + 1]; i += 1; continue; }
    if (arg === '--service-port') { args.servicePort = argv[i + 1]; i += 1; continue; }
    if (arg === '--branch-pattern') { args.branchPattern = argv[i + 1]; i += 1; continue; }
    if (arg === '--include-mysql') { args.includeMysql = true; continue; }
    if (arg === '--skip-knowledge') { args.skipKnowledge = true; continue; }
    if (arg === '--force') { args.force = true; continue; }
  }

  return args;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(targetPath, content, force) {
  if (fs.existsSync(targetPath) && !force) {
    return false;
  }
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, content);
  return true;
}

function writeAlways(targetPath, content) {
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, content);
}

function copyFile(source, target, force) {
  if (!fs.existsSync(source)) {
    fail('缺少源文件: ' + source);
  }
  return writeFile(target, fs.readFileSync(source), force);
}

function copyDir(sourceDir, targetDir, force) {
  if (!fs.existsSync(sourceDir)) {
    fail('缺少源目录: ' + sourceDir);
  }
  ensureDir(targetDir);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(source, target, force);
    } else if (entry.isFile()) {
      copyFile(source, target, force);
    }
  }
}

function detectAuthor(root) {
  try {
    const author = execSync('git config user.name', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    if (author) {
      return author;
    }
  } catch {}

  return process.env.GIT_AUTHOR_NAME || process.env.USER || 'Unknown';
}

function render(content, context) {
  return content
    .replaceAll('{{date}}', context.date)
    .replaceAll('{{project_name}}', context.projectName)
    .replaceAll('{{ProjectName}}', context.projectName.replace(/(^\w|[-_]\w)/g, part => part.replace(/[-_]/g, '').toUpperCase()))
    .replaceAll('{{tech_stack}}', context.techStack)
    .replaceAll('{{tech_stack_short}}', context.techStackShort)
    .replaceAll('{{build_tool}}', context.buildTool)
    .replaceAll('{{build_command}}', context.buildCommand)
    .replaceAll('{{service_port}}', context.servicePort)
    .replaceAll('{{branch_pattern}}', context.branchPattern)
    .replaceAll('{{author}}', context.author)
    .replaceAll('{{hooks_dir}}', context.hooksDir);
}

function upsertManagedBlock(content, startMarker, endMarker, block) {
  const wrapped = `${startMarker}\n${block.trim()}\n${endMarker}`;
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start !== -1 && end !== -1 && end > start) {
    return `${content.slice(0, start)}${wrapped}${content.slice(end + endMarker.length)}`;
  }

  const base = content.trimEnd();
  return base ? `${base}\n\n${wrapped}\n` : `${wrapped}\n`;
}

function collectProjectText(projectRoot) {
  const candidates = [
    'README.md',
    'pom.xml',
    'build.gradle',
    'build.gradle.kts',
    'src/main/resources/application.yml',
    'src/main/resources/application.yaml',
    'src/main/resources/application.properties'
  ];

  return candidates
    .map(rel => {
      const full = path.join(projectRoot, rel);
      return fs.existsSync(full) ? read(full) : '';
    })
    .join('\n');
}

function detectProjectSignals(projectRoot, context) {
  const source = `${collectProjectText(projectRoot)}\n${context.techStack}\n${context.buildTool}`.toLowerCase();
  const middleware = [];
  const rpc = [];

  const addUnique = (list, value) => {
    if (!list.includes(value)) {
      list.push(value);
    }
  };

  if (source.includes('spring-boot') || source.includes('org.springframework') || context.techStack.toLowerCase().includes('java')) {
    addUnique(middleware, 'Spring Boot');
  }
  if (source.includes('mysql') || context.includeMysql) {
    addUnique(middleware, 'MySQL');
  }
  if (source.includes('redis')) {
    addUnique(middleware, 'Redis');
  }
  if (source.includes('mybatis')) {
    addUnique(middleware, 'MyBatis');
  }
  if (source.includes('kafka')) {
    addUnique(middleware, 'Kafka');
  }
  if (source.includes('rabbitmq') || source.includes('amqp')) {
    addUnique(middleware, 'RabbitMQ');
  }
  if (source.includes('rocketmq')) {
    addUnique(middleware, 'RocketMQ');
  }
  if (source.includes('nacos')) {
    addUnique(middleware, 'Nacos');
  }
  if (source.includes('dubbo')) {
    addUnique(rpc, 'Dubbo RPC');
  }
  if (source.includes('openfeign') || source.includes('feign')) {
    addUnique(rpc, 'OpenFeign / HTTP RPC');
  }
  if (source.includes('grpc')) {
    addUnique(rpc, 'gRPC');
  }

  return { middleware, rpc };
}

function generateReadmeBlock(context) {
  return [
    '## AI Workflow Bootstrap',
    '',
    `- 技术栈：${context.techStack}`,
    `- 构建工具：${context.buildTool}`,
    `- 验证命令：\`${context.buildCommand}\``,
    '- AI 工作流入口：`CLAUDE.md`、`docs/guides/development-spec.md`、`docs/guides/workflow-guide.md`',
    '- 项目级知识入口：`docs/knowledge.md`'
  ].join('\n');
}

function writeReadme(projectRoot, context, force) {
  const readmePath = path.join(projectRoot, 'README.md');
  const block = generateReadmeBlock(context);

  if (!fs.existsSync(readmePath) || force) {
    const content = [
      `# ${context.projectName}`,
      '',
      `基于 ${context.techStack} 的项目。`,
      '',
      '## 本地开发',
      '',
      `- 构建验证：\`${context.buildCommand}\``,
      '',
      `${README_MARKER_START}`,
      `${block}`,
      `${README_MARKER_END}`,
      ''
    ].join('\n');
    writeAlways(readmePath, content);
    return force && fs.existsSync(readmePath) ? 'overwritten' : 'created';
  }

  const updated = upsertManagedBlock(read(readmePath), README_MARKER_START, README_MARKER_END, block);
  writeAlways(readmePath, updated);
  return 'updated';
}

function generateKnowledgeBlock(context, signals) {
  const middlewareLines = signals.middleware.length
    ? signals.middleware.map(item => `- ${item}：当前工程已检测到，后续补充默认约定与限制`)
    : ['- 暂未从当前工程检测到明确中间件，后续接入后补充'];
  const rpcLines = signals.rpc.length
    ? signals.rpc.map(item => `- ${item}：当前工程已检测到，后续补充上下游系统与关键约束`)
    : ['- 暂未从当前工程检测到明确 RPC / 消息组件'];

  return [
    '## 初始化提炼摘要',
    '',
    '### 项目关键摘要',
    `- 项目名称：${context.projectName}`,
    `- 技术栈：${context.techStack}`,
    `- 构建工具：${context.buildTool}`,
    `- 默认验证命令：\`${context.buildCommand}\``,
    '',
    '### 中间件与基础设施',
    ...middlewareLines,
    '',
    '### RPC / 消息 / 外部系统交互',
    ...rpcLines
  ].join('\n');
}

function writeKnowledge(projectRoot, installRoot, context, force) {
  const templatePath = path.join(installRoot, 'configs', 'templates', 'knowledge.md');
  const targetPath = path.join(projectRoot, 'docs', 'knowledge.md');
  const signals = detectProjectSignals(projectRoot, context);
  const block = generateKnowledgeBlock(context, signals);
  const template = render(read(templatePath), context).trimEnd();

  if (!fs.existsSync(targetPath) || force) {
    const content = `${template}\n\n${KNOWLEDGE_MARKER_START}\n${block}\n${KNOWLEDGE_MARKER_END}\n`;
    writeAlways(targetPath, content);
    return force && fs.existsSync(targetPath) ? 'overwritten' : 'created';
  }

  const updated = upsertManagedBlock(read(targetPath), KNOWLEDGE_MARKER_START, KNOWLEDGE_MARKER_END, block);
  writeAlways(targetPath, updated);
  return 'updated';
}

function mergeUnique(target = [], incoming = []) {
  const merged = Array.isArray(target) ? [...target] : [];
  for (const item of Array.isArray(incoming) ? incoming : []) {
    const fingerprint = JSON.stringify(item);
    if (!merged.some(existing => JSON.stringify(existing) === fingerprint)) {
      merged.push(item);
    }
  }
  return merged;
}

function mergeSettings(existing, incoming) {
  const merged = { ...existing };

  merged.permissions = merged.permissions || {};
  if (incoming.permissions) {
    merged.permissions.allow = mergeUnique(merged.permissions.allow, incoming.permissions.allow);
    merged.permissions.deny = mergeUnique(merged.permissions.deny, incoming.permissions.deny);
  }

  merged.tools = { ...(incoming.tools || {}), ...(merged.tools || {}) };

  if (incoming.hooks) {
    merged.hooks = merged.hooks || {};
    for (const [eventName, entries] of Object.entries(incoming.hooks)) {
      merged.hooks[eventName] = mergeUnique(merged.hooks[eventName], entries);
    }
  }

  return merged;
}

function writeSettings(projectRoot, installRoot, context, force) {
  const templatePath = path.join(installRoot, 'configs', 'templates', 'settings.json');
  const targetPath = path.join(projectRoot, '.claude', 'settings.json');
  const incoming = JSON.parse(render(read(templatePath), context));

  ensureDir(path.dirname(targetPath));

  if (!fs.existsSync(targetPath) || force) {
    fs.writeFileSync(targetPath, JSON.stringify(incoming, null, 2) + '\n');
    return fs.existsSync(targetPath) ? (force ? 'overwritten' : 'created') : 'created';
  }

  try {
    const existing = JSON.parse(read(targetPath));
    const merged = mergeSettings(existing, incoming);
    fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2) + '\n');
    return 'merged';
  } catch {
    fs.writeFileSync(targetPath, JSON.stringify(incoming, null, 2) + '\n');
    return 'replaced-invalid';
  }
}

function verifyProject(projectRoot, includeMysql, skipKnowledge) {
  const checks = [
    ['CLAUDE.md', () => fs.existsSync(path.join(projectRoot, 'CLAUDE.md'))],
    ['README.md', () => fs.existsSync(path.join(projectRoot, 'README.md'))],
    ['CLAUDE.md 模板变量已替换', () => {
      const claudePath = path.join(projectRoot, 'CLAUDE.md');
      if (!fs.existsSync(claudePath)) return false;
      const content = read(claudePath);
      return !content.includes('{{project_name}}') && !content.includes('{{tech_stack}}');
    }],
    ['docs/guides/development-spec.md', () => fs.existsSync(path.join(projectRoot, 'docs', 'guides', 'development-spec.md'))],
    ['docs/guides/workflow-guide.md', () => fs.existsSync(path.join(projectRoot, 'docs', 'guides', 'workflow-guide.md'))],
    ['configs/rules/common/', () => fs.existsSync(path.join(projectRoot, 'configs', 'rules', 'common'))],
    ['configs/rules/java/', () => fs.existsSync(path.join(projectRoot, 'configs', 'rules', 'java'))],
    ['features/', () => fs.existsSync(path.join(projectRoot, 'features'))],
    ['.claude/settings.json', () => fs.existsSync(path.join(projectRoot, '.claude', 'settings.json'))],
    ['.claude/hooks/spec-state-guard.js', () => fs.existsSync(path.join(projectRoot, '.claude', 'hooks', 'spec-state-guard.js'))]
  ];

  if (!skipKnowledge) {
    checks.push(['docs/knowledge.md', () => fs.existsSync(path.join(projectRoot, 'docs', 'knowledge.md'))]);
    checks.push(['docs/knowledge.md 初始化摘要', () => {
      const knowledgePath = path.join(projectRoot, 'docs', 'knowledge.md');
      return fs.existsSync(knowledgePath) && read(knowledgePath).includes(KNOWLEDGE_MARKER_START);
    }]);
  }

  if (includeMysql) {
    checks.push(['configs/rules/mysql/', () => fs.existsSync(path.join(projectRoot, 'configs', 'rules', 'mysql'))]);
  }

  const failures = [];
  for (const [label, check] of checks) {
    if (!check()) {
      failures.push(label);
    }
  }
  return failures;
}

function main() {
  const args = parseArgs(process.argv);
  const projectRoot = args.root;
  const installRoot = args.installRoot;
  const projectName = args.projectName || path.basename(projectRoot);
  const author = args.author || detectAuthor(projectRoot);
  const date = new Date().toISOString().slice(0, 10);
  const hooksDir = '.claude/hooks';

  ensureDir(projectRoot);

  const context = {
    date,
    projectName,
    techStack: args.techStack,
    techStackShort: args.techStackShort,
    buildTool: args.buildTool,
    buildCommand: args.buildCommand,
    servicePort: args.servicePort,
    branchPattern: args.branchPattern,
    author,
    hooksDir,
    includeMysql: args.includeMysql
  };

  const created = [];

  const renderTemplate = (templateName, targetRel) => {
    const templatePath = path.join(installRoot, 'configs', 'templates', templateName);
    const targetPath = path.join(projectRoot, targetRel);
    const written = writeFile(targetPath, render(read(templatePath), context), args.force);
    if (written) {
      created.push(targetRel);
    }
  };

  renderTemplate('CLAUDE.md', 'CLAUDE.md');
  const readmeStatus = writeReadme(projectRoot, context, args.force);
  created.push(`README.md (${readmeStatus})`);
  const settingsStatus = writeSettings(projectRoot, installRoot, context, args.force);
  created.push(`.claude/settings.json (${settingsStatus})`);
  if (!args.skipKnowledge) {
    const knowledgeStatus = writeKnowledge(projectRoot, installRoot, context, args.force);
    created.push(`docs/knowledge.md (${knowledgeStatus})`);
  }

  for (const guide of ['development-spec.md', 'workflow-guide.md']) {
    const source = path.join(installRoot, 'docs', 'guides', guide);
    const targetRel = path.join('docs', 'guides', guide);
    if (copyFile(source, path.join(projectRoot, targetRel), args.force)) {
      created.push(targetRel);
    }
  }

  copyDir(path.join(installRoot, 'hooks'), path.join(projectRoot, '.claude', 'hooks'), args.force);
  created.push('.claude/hooks/');

  copyDir(path.join(installRoot, 'configs', 'rules', 'common'), path.join(projectRoot, 'configs', 'rules', 'common'), args.force);
  copyDir(path.join(installRoot, 'configs', 'rules', 'java'), path.join(projectRoot, 'configs', 'rules', 'java'), args.force);
  created.push('configs/rules/common/');
  created.push('configs/rules/java/');

  if (args.includeMysql) {
    copyDir(path.join(installRoot, 'configs', 'rules', 'mysql'), path.join(projectRoot, 'configs', 'rules', 'mysql'), args.force);
    created.push('configs/rules/mysql/');
  }

  ensureDir(path.join(projectRoot, 'features'));
  ensureDir(path.join(projectRoot, 'docs'));
  ensureDir(path.join(projectRoot, 'docs', 'guides'));

  console.log('init-project 完成');
  console.log('项目根目录: ' + projectRoot);
  console.log('创建/更新内容:');
  for (const item of created) {
    console.log('- ' + item);
  }

  const failures = verifyProject(projectRoot, args.includeMysql, args.skipKnowledge);
  if (failures.length > 0) {
    console.error('初始化验证失败:');
    for (const item of failures) {
      console.error('- ' + item);
    }
    process.exit(1);
  }

  console.log('初始化验证通过');
}

main();
