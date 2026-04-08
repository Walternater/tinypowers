#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

function readJson(p) {
  if (!fs.existsSync(p)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
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

function main() {
  const args = parseArgs(process.argv);
  const targetPath = args.target;
  const templatePath = args.template;
  const installDir = args['install-dir'];

  if (!targetPath || !templatePath || !installDir) {
    console.error('用法: node install-merge-settings.js --target <path> --template <path> --install-dir <path>');
    process.exit(1);
  }

  // 读取现有 settings.json
  const existing = readJson(targetPath);
  const backupPath = targetPath + '.backup.' + Date.now();
  
  // 备份现有文件
  if (fs.existsSync(targetPath)) {
    fs.copyFileSync(targetPath, backupPath);
  }

  // 读取模板并替换变量
  let templateContent;
  try {
    templateContent = fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    console.error(`无法读取模板: ${templatePath}`);
    process.exit(1);
  }

  // 替换 {{hooks_dir}} 为实际路径
  // 对于全局安装，hooks_dir 应该指向 .claude/skills/tinypowers/hooks
  const hooksDir = path.join(installDir, 'hooks');
  templateContent = templateContent.replace(/\{\{hooks_dir\}\}/g, hooksDir);

  let template;
  try {
    template = JSON.parse(templateContent);
  } catch (error) {
    console.error(`模板 JSON 解析失败: ${templatePath}`);
    process.exit(1);
  }

  // 合并配置
  const merged = mergeSettings(existing, template);

  // 添加 env.TINYPOWERS_DIR
  merged.env = merged.env || {};
  merged.env.TINYPOWERS_DIR = installDir;

  // 写入
  writeJson(targetPath, merged);

  console.log(`  + settings.json 已更新: ${targetPath}`);
  if (fs.existsSync(backupPath)) {
    console.log(`    备份: ${backupPath}`);
  }
}

main();
