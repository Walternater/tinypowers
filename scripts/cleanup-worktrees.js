#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKTREES_DIR = '.claude/worktrees';

function main() {
  const root = process.cwd();
  const worktreesPath = path.join(root, WORKTREES_DIR);

  if (!fs.existsSync(worktreesPath)) {
    console.log('No worktrees directory found');
    return;
  }

  const worktrees = fs.readdirSync(worktreesPath);

  for (const wt of worktrees) {
    const wtPath = path.join(worktreesPath, wt);
    if (fs.statSync(wtPath).isDirectory()) {
      try {
        execSync(`git worktree remove "${wtPath}" --force`, { stdio: 'inherit' });
        console.log(`Removed worktree: ${wt}`);
      } catch (e) {
        console.error(`Failed to remove worktree ${wt}:`, e.message);
      }
    }
  }

  console.log('Worktree cleanup completed');
}

main();
