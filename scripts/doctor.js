#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'manifests', 'components.json');
const SETTINGS_FILE = path.join('.claude', 'settings.json');

function detectGlobalInstallRoot() {
  return path.join(process.env.HOME || '', '.claude', 'skills', 'tinypowers');
}

function isRepositoryRoot(dirPath) {
  return exists(path.join(dirPath, '.git'));
}

function parseArgs(argv) {
  const result = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        result[key] = true;
      } else {
        result[key] = next;
        i += 1;
      }
    } else {
      result._.push(arg);
    }
  }
  return result;
}

function exists(p) {
  return fs.existsSync(p);
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

function runCommand(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    ...options
  });
}

function detectInstallRoot(args) {
  if (args['install-root']) {
    return path.resolve(args['install-root']);
  }

  if (args.global) {
    return detectGlobalInstallRoot();
  }

  const projectRoot = path.resolve(args.project || process.cwd());
  const projectInstall = path.join(projectRoot, '.claude', 'skills', 'tinypowers');
  if (exists(projectInstall)) {
    return projectInstall;
  }

  return ROOT;
}

function detectProjectRoot(args, installRoot) {
  if (args.project) {
    return path.resolve(args.project);
  }

  if (installRoot === ROOT && isRepositoryRoot(ROOT)) {
    return ROOT;
  }

  return path.resolve(process.cwd());
}

function classifyInstallContext(args, installRoot, projectRoot) {
  const projectInstallRoot = path.join(projectRoot, '.claude', 'skills', 'tinypowers');
  const globalInstallRoot = detectGlobalInstallRoot();

  if (installRoot === ROOT && projectRoot === ROOT && isRepositoryRoot(ROOT)) {
    return {
      mode: 'repository',
      type: 'repository-root'
    };
  }

  if (args.global || installRoot === globalInstallRoot) {
    return {
      mode: 'global',
      type: 'global-install'
    };
  }

  if (installRoot === projectInstallRoot) {
    return {
      mode: 'project-local',
      type: 'project-local-install'
    };
  }

  return {
    mode: 'explicit-install-root',
    type: 'external-install'
  };
}

function checkFile(relPath, baseDir, findings, label, required = true) {
  const fullPath = path.join(baseDir, relPath);
  if (exists(fullPath)) {
    findings.pass.push(`${label}: ${relPath}`);
    return true;
  }

  const bucket = required ? findings.fail : findings.warn;
  bucket.push(`${label}: 缺少 ${relPath}`);
  return false;
}

function flattenHookCommands(settings) {
  const commands = [];
  for (const entries of Object.values(settings.hooks || {})) {
    for (const entry of entries || []) {
      for (const hook of entry.hooks || []) {
        if (hook.command) {
          commands.push(hook.command);
        }
      }
    }
  }
  return commands;
}

function summarizeComponents(installRoot, manifest, findings) {
  const installed = [];

  for (const [name, component] of Object.entries(manifest.components || {})) {
    const sources = component.sources || [];
    const complete = sources.every(source => exists(path.join(installRoot, source)));
    if (complete) {
      installed.push(name);
    } else if (component.required) {
      findings.fail.push(`组件缺失: ${name}`);
    }
  }

  findings.info.push(`已检测组件: ${installed.join(', ') || '(无)'}`);
  return installed;
}

function checkHooks(projectRoot, installRoot, findings, installedComponents) {
  const hasTemplates = installedComponents.includes('templates');
  const settingsTemplatePath = path.join(installRoot, 'configs', 'templates', 'settings.json');
  if (hasTemplates && exists(settingsTemplatePath)) {
    findings.pass.push('已提供 configs/templates/settings.json');
  } else if (hasTemplates) {
    findings.warn.push('缺少 configs/templates/settings.json，/tech:init 无法直接生成 .claude/settings.json');
  } else {
    findings.info.push('当前安装未包含 templates 组件，不要求提供 configs/templates/settings.json');
  }

  const settingsPath = path.join(projectRoot, SETTINGS_FILE);
  if (!exists(settingsPath)) {
    findings.warn.push(`未找到 ${path.relative(projectRoot, settingsPath)}，需要手动接入 hooks`);
    return;
  }

  findings.pass.push(`已发现 hook 配置: ${path.relative(projectRoot, settingsPath)}`);

  let settings;
  try {
    settings = loadJson(settingsPath);
  } catch (error) {
    findings.fail.push(`hook 配置无法解析: ${settingsPath}`);
    return;
  }

  const commands = flattenHookCommands(settings);
  const requiredHooks = [
    'spec-state-guard.js',
    'gsd-session-manager.js',
    'gsd-context-monitor.js',
    'config-protection.js',
    'gsd-code-checker.js'
  ];

  for (const hookName of requiredHooks) {
    if (commands.some(command => command.includes(hookName))) {
      findings.pass.push(`已接入 hook: ${hookName}`);
    } else {
      findings.warn.push(`未接入 hook: ${hookName}`);
    }
  }

  const envPath = path.join(projectRoot, '.env');
  const hookLevel = process.env.TINYPOWERS_HOOK_LEVEL || '(未设置，默认 standard)';
  findings.info.push(`当前 gsd-code-checker 提醒模式: ${hookLevel}`);
  if (!process.env.TINYPOWERS_HOOK_LEVEL && exists(envPath)) {
    findings.info.push('提示: doctor 不会主动读取 .env；如需 strict 提醒，请在 shell 环境中导出 TINYPOWERS_HOOK_LEVEL');
  }

  const templatePath = path.join(installRoot, 'hooks-settings-template.json');
  if (exists(templatePath)) {
    findings.pass.push('已提供 hooks-settings-template.json');
  } else if (installRoot !== ROOT) {
    findings.warn.push('安装目录缺少 hooks-settings-template.json');
  } else {
    findings.info.push('仓库模式下不要求存在 hooks-settings-template.json（由 install.sh 生成）');
  }

}

function checkProjectArtifacts(projectRoot, findings, installRoot) {
  if (projectRoot === ROOT && installRoot === ROOT) {
    findings.info.push('当前运行在框架仓库自身，不要求出现 CLAUDE.md / features/');
    return;
  }

  const claudePath = path.join(projectRoot, 'CLAUDE.md');
  const guidesDir = path.join(projectRoot, 'docs', 'guides');
  const featuresDir = path.join(projectRoot, 'features');

  if (exists(claudePath)) {
    findings.pass.push('目标项目已初始化 CLAUDE.md');
    const claudeContent = readFile(claudePath);
    const initVersionMatch = claudeContent.match(/init_version:\s*"?([0-9.]+)"?/);
    if (initVersionMatch) {
      findings.pass.push(`CLAUDE.md init_version: ${initVersionMatch[1]}`);
    } else {
      findings.warn.push('CLAUDE.md 缺少 init_version，后续升级无法判断初始化版本');
    }
  } else {
    findings.warn.push('目标项目尚未初始化 CLAUDE.md（如未执行 /tech:init 属正常）');
  }

  if (exists(guidesDir)) {
    findings.pass.push('目标项目已存在 docs/guides/');
  } else {
    findings.warn.push('目标项目尚未生成 docs/guides/');
  }

  if (exists(featuresDir)) {
    findings.pass.push('目标项目已存在 features/');
  } else {
    findings.info.push('目标项目尚未生成 features/（框架仓库本身可忽略）');
  }
}

function detectJavaRequirement(projectRoot) {
  const pomPath = path.join(projectRoot, 'pom.xml');
  if (exists(pomPath)) {
    const content = readFile(pomPath);
    const releaseMatch = content.match(/<maven\.compiler\.release>\s*([0-9]+)\s*<\/maven\.compiler\.release>/);
    const targetMatch = content.match(/<maven\.compiler\.target>\s*([0-9]+)\s*<\/maven\.compiler\.target>/);
    const sourceMatch = content.match(/<maven\.compiler\.source>\s*([0-9]+)\s*<\/maven\.compiler\.source>/);
    const version = releaseMatch?.[1] || targetMatch?.[1] || sourceMatch?.[1] || null;
    return {
      runtime: 'maven-java',
      source: 'pom.xml',
      version
    };
  }

  for (const gradleFile of ['build.gradle.kts', 'build.gradle']) {
    const gradlePath = path.join(projectRoot, gradleFile);
    if (!exists(gradlePath)) {
      continue;
    }

    const content = readFile(gradlePath);
    const toolchainMatch = content.match(/JavaLanguageVersion\.of\(\s*([0-9]+)\s*\)/);
    const javaVersionMatch = content.match(/sourceCompatibility\s*=\s*JavaVersion\.VERSION_([0-9_]+)/);
    const stringVersionMatch = content.match(/sourceCompatibility\s*=\s*["']([0-9.]+)["']/);
    const rawVersion = toolchainMatch?.[1] || javaVersionMatch?.[1]?.replace(/_/g, '.') || stringVersionMatch?.[1] || null;
    const version = rawVersion ? String(rawVersion).split('.')[0] : null;
    return {
      runtime: 'gradle-java',
      source: gradleFile,
      version
    };
  }

  return null;
}

function probeRuntimeCommand(projectRoot, name, args, envKey) {
  const fakeOutput = process.env[envKey];
  if (fakeOutput === 'missing') {
    return { available: false, output: '' };
  }
  if (fakeOutput) {
    return { available: true, output: fakeOutput };
  }

  const result = runCommand(name, args, { cwd: projectRoot });
  return {
    available: result.status === 0,
    output: `${result.stdout || ''}${result.stderr || ''}`.trim()
  };
}

function parseJavaVersion(output) {
  if (!output) {
    return null;
  }

  const quoted = output.match(/version\s+"([0-9]+)(?:\.[^"]*)?"/i);
  if (quoted) {
    return Number(quoted[1]);
  }

  const plain = output.match(/\b([0-9]{1,2})(?:\.[0-9._-]+)?\b/);
  return plain ? Number(plain[1]) : null;
}

function pushRuntimeFinding(findings, level, message) {
  findings.runtime.push(`[${level}] ${message}`);
}

function checkProjectRuntime(projectRoot, findings) {
  const requirement = detectJavaRequirement(projectRoot);

  if (!requirement) {
    pushRuntimeFinding(findings, 'INFO', '未检测到 Java / Maven / Gradle 项目标记');
    return;
  }

  pushRuntimeFinding(findings, 'INFO', `项目运行时: ${requirement.runtime}（来源: ${requirement.source}）`);
  if (requirement.version) {
    pushRuntimeFinding(findings, 'INFO', `Java 要求: ${requirement.version}+`);
  }

  const javaProbe = probeRuntimeCommand(projectRoot, 'java', ['-version'], 'TINYPOWERS_DOCTOR_FAKE_JAVA_VERSION');
  if (!javaProbe.available) {
    pushRuntimeFinding(findings, 'WARN', '未检测到可用的 java；项目可能无法本地构建或运行');
  } else {
    const currentVersion = parseJavaVersion(javaProbe.output);
    if (requirement.version && currentVersion && currentVersion < Number(requirement.version)) {
      pushRuntimeFinding(findings, 'WARN', `当前 Java 版本 ${currentVersion} 低于项目要求 ${requirement.version}`);
    } else if (currentVersion) {
      pushRuntimeFinding(findings, 'PASS', `Java 运行时可用（当前版本 ${currentVersion}）`);
    } else {
      pushRuntimeFinding(findings, 'PASS', 'Java 运行时可用');
    }
  }

  if (requirement.runtime === 'maven-java') {
    if (exists(path.join(projectRoot, 'mvnw'))) {
      pushRuntimeFinding(findings, 'PASS', '检测到 Maven Wrapper，可优先使用 ./mvnw');
    } else {
      const mavenProbe = probeRuntimeCommand(projectRoot, 'mvn', ['-v'], 'TINYPOWERS_DOCTOR_FAKE_MVN_VERSION');
      if (mavenProbe.available) {
        pushRuntimeFinding(findings, 'PASS', 'Maven 命令可用');
      } else {
        pushRuntimeFinding(findings, 'WARN', 'pom.xml 已存在，但未检测到 mvn / mvnw');
      }
    }
  }

  if (requirement.runtime === 'gradle-java') {
    if (exists(path.join(projectRoot, 'gradlew'))) {
      pushRuntimeFinding(findings, 'PASS', '检测到 Gradle Wrapper，可优先使用 ./gradlew');
    } else {
      const gradleProbe = probeRuntimeCommand(projectRoot, 'gradle', ['-v'], 'TINYPOWERS_DOCTOR_FAKE_GRADLE_VERSION');
      if (gradleProbe.available) {
        pushRuntimeFinding(findings, 'PASS', 'Gradle 命令可用');
      } else {
        pushRuntimeFinding(findings, 'WARN', 'Gradle 构建文件已存在，但未检测到 gradle / gradlew');
      }
    }
  }
}

function printSection(title, items) {
  if (items.length === 0) {
    return;
  }

  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
  for (const item of items) {
    console.log(`- ${item}`);
  }
}

function main() {
  const args = parseArgs(process.argv);
  const installRoot = detectInstallRoot(args);
  const projectRoot = detectProjectRoot(args, installRoot);
  const installContext = classifyInstallContext(args, installRoot, projectRoot);
  const findings = { pass: [], warn: [], fail: [], info: [], runtime: [] };

  if (!exists(MANIFEST_PATH)) {
    console.error('doctor 无法启动：缺少 manifests/components.json');
    process.exit(1);
  }

  if (!exists(installRoot)) {
    console.error(`doctor 失败：安装目录不存在: ${installRoot}`);
    process.exit(1);
  }

  const manifest = loadJson(MANIFEST_PATH);
  const installedComponents = summarizeComponents(installRoot, manifest, findings);

  checkFile('skills', installRoot, findings, '核心目录');
  checkFile('agents', installRoot, findings, '核心目录');
  checkFile('hooks', installRoot, findings, '核心目录');
  if (installedComponents.includes('docs-runtime')) {
    checkFile('docs/guides', installRoot, findings, '运行时文档目录');
  } else {
    findings.info.push('当前安装未包含 docs-runtime 组件');
  }
  if (installedComponents.includes('contexts')) {
    checkFile('contexts', installRoot, findings, '工作模式目录');
  } else {
    findings.info.push('当前安装未包含 contexts 组件');
  }
  if (installedComponents.includes('templates')) {
    checkFile('configs/templates', installRoot, findings, '模板目录');
  } else {
    findings.info.push('当前安装未包含 templates 组件');
  }

  checkHooks(projectRoot, installRoot, findings, installedComponents);
  checkProjectArtifacts(projectRoot, findings, installRoot);
  checkProjectRuntime(projectRoot, findings);

  console.log('tinypowers doctor');
  console.log('=================');
  console.log(`安装目录: ${installRoot}`);
  console.log(`项目目录: ${projectRoot}`);
  console.log(`安装模式: ${installContext.mode}`);
  console.log(`安装目录类型: ${installContext.type}`);

  printSection('PASS', findings.pass);
  printSection('WARN', findings.warn);
  printSection('FAIL', findings.fail);
  printSection('RUNTIME', findings.runtime);
  printSection('INFO', findings.info);

  if (findings.fail.length > 0) {
    process.exit(1);
  }
}

main();
