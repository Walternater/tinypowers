#!/usr/bin/env node

/**
 * check-version.js
 * 
 * 检查本地安装的 tinypowers 版本与远端最新版本的一致性
 * 
 * 用法：
 *   node check-version.js [--install-root DIR] [--remote URL]
 * 
 * 输出格式（JSON）：
 *   {
 *     "local": "v1.2.3",
 *     "remote": "v1.5.0",
 *     "behind": true,
 *     "commitsBehind": 5,
 *     "upToDate": false,
 *     "error": null
 *   }
 * 
 * 如果版本一致或本地更新：
 *   {
 *     "local": "v1.5.0",
 *     "remote": "v1.5.0",
 *     "behind": false,
 *     "commitsBehind": 0,
 *     "upToDate": true,
 *     "error": null
 *   }
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function exists(p) {
  return fs.existsSync(p);
}

function runCommand(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    ...options
  });
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

function detectGlobalInstallRoot() {
  return path.join(process.env.HOME || '', '.claude', 'skills', 'tinypowers');
}

function getLocalVersion(installRoot) {
  // 优先使用 git describe
  const gitDir = path.join(installRoot, '.git');
  if (!exists(gitDir)) {
    return null;
  }

  const result = runCommand('git', ['describe', '--tags', '--abbrev=0'], {
    cwd: installRoot,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  });

  if (result.status === 0 && result.stdout.trim()) {
    return result.stdout.trim();
  }

  // 回退：尝试 git rev-parse
  const revResult = runCommand('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: installRoot,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  });

  if (revResult.status === 0 && revResult.stdout.trim()) {
    return revResult.stdout.trim();
  }

  return null;
}

function getRemoteVersion(installRoot) {
  // 获取远端最新的 tag
  const gitDir = path.join(installRoot, '.git');
  if (!exists(gitDir)) {
    return null;
  }

  // 获取配置的远端（默认 origin）
  const remoteResult = runCommand('git', ['remote', 'get-url', 'origin'], {
    cwd: installRoot,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  });

  if (remoteResult.status !== 0) {
    return null;
  }

  const remoteUrl = remoteResult.stdout.trim();
  
  // 对于 GitHub 仓库，获取最新 tag
  let gitUrl = remoteUrl;
  if (gitUrl.startsWith('git@')) {
    gitUrl = gitUrl.replace(':', '/').replace('git@', 'https://');
  }
  
  // 使用 git ls-remote 获取所有 tag，然后排序
  const lsResult = runCommand('git', ['ls-remote', '--tags', '--sort=-version:refname', 'origin'], {
    cwd: installRoot,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  });

  if (lsResult.status !== 0) {
    return null;
  }

  const lines = lsResult.stdout.trim().split('\n');
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const ref = parts[1];
      // 匹配 refs/tags/v1.2.3 或 refs/tags/v1.2.3^{}
      const match = ref.match(/^refs\/tags\/(v?\d+\.\d+\.\d+)/);
      if (match) {
        const tag = match[1];
        if (!tag.endsWith('^{}')) {
          return tag.startsWith('v') ? tag : `v${tag}`;
        }
      }
    }
  }

  return null;
}

function getCommitsBehind(installRoot) {
  const result = runCommand('git', ['rev-list', '--count', '--left-right', '@{upstream}...HEAD'], {
    cwd: installRoot,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  });

  if (result.status === 0 && result.stdout.trim()) {
    const counts = result.stdout.trim().split(/\s+/);
    return parseInt(counts[0] || '0', 10);
  }
  return 0;
}

function compareVersions(v1, v2) {
  // 移除 v 前缀
  const normalize = v => v.replace(/^v/, '');
  
  const parts1 = normalize(v1).split('.').map(Number);
  const parts2 = normalize(v2).split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

function main() {
  const args = parseArgs(process.argv);
  
  // 确定 install root
  let installRoot;
  if (args['install-root']) {
    installRoot = path.resolve(args['install-root']);
  } else if (args.global) {
    installRoot = detectGlobalInstallRoot();
  } else {
    installRoot = ROOT;
  }

  // 检查是否是 git 仓库
  if (!exists(path.join(installRoot, '.git'))) {
    console.log(JSON.stringify({
      local: null,
      remote: null,
      behind: false,
      commitsBehind: 0,
      upToDate: true,
      error: 'NOT_A_GIT_REPO'
    }, null, 2));
    return;
  }

  const localVersion = getLocalVersion(installRoot);
  const remoteVersion = getRemoteVersion(installRoot);

  if (!localVersion) {
    console.log(JSON.stringify({
      local: null,
      remote: remoteVersion,
      behind: false,
      commitsBehind: 0,
      upToDate: false,
      error: 'LOCAL_VERSION_NOT_FOUND'
    }, null, 2));
    return;
  }

  if (!remoteVersion) {
    console.log(JSON.stringify({
      local: localVersion,
      remote: null,
      behind: false,
      commitsBehind: 0,
      upToDate: true,
      error: 'REMOTE_VERSION_NOT_FOUND'
    }, null, 2));
    return;
  }

  const comparison = compareVersions(localVersion, remoteVersion);
  const behind = comparison < 0;
  const commitsBehind = behind ? getCommitsBehind(installRoot) : 0;

  console.log(JSON.stringify({
    local: localVersion,
    remote: remoteVersion,
    behind,
    commitsBehind,
    upToDate: !behind && comparison === 0,
    error: null
  }, null, 2));
}

main();
