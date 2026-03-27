#!/usr/bin/env node
// hook-hierarchy.js
// Hook level controller - reads TINYPOWERS_HOOK_LEVEL and returns
// the appropriate hooks.json configuration
//
// Levels:
//   minimal  - only security intercepts (beforeToolUse)
//   standard - security + context monitoring (default)
//   strict   - security + context monitoring + code format + type checks

const fs = require('fs');
const path = require('path');

const HOOK_LEVEL = process.env.TINYPOWERS_HOOK_LEVEL || 'standard';

const HOOK_CONFIGS = {
  minimal: {
    description: '安全拦截',
    hooks: [
      {
        trigger: 'beforeToolUse',
        action: 'check-permissions',
        conditions: [
          'Tool=Bash',
          'Command matches deny patterns'
        ],
        error: '此命令被禁止执行'
      },
      {
        trigger: 'beforeToolUse',
        action: 'check-file-access',
        conditions: [
          'Tool=Read',
          'File matches deny patterns'
        ],
        error: '此文件禁止读取'
      }
    ]
  },

  standard: {
    description: '安全 + 上下文监控',
    hooks: [
      {
        trigger: 'beforeToolUse',
        action: 'check-permissions',
        conditions: [
          'Tool=Bash',
          'Command matches deny patterns'
        ],
        error: '此命令被禁止执行'
      },
      {
        trigger: 'beforeToolUse',
        action: 'check-file-access',
        conditions: [
          'Tool=Read',
          'File matches deny patterns'
        ],
        error: '此文件禁止读取'
      }
    ],
    settings: {
      hooks: {
        PostToolUse: [{
          matcher: 'Bash|Edit|Write|MultiEdit|Agent|Task',
          hooks: [{
            type: 'command',
            command: 'node \"{HOOKS_DIR}/gsd-context-monitor.js\"',
            timeout: 10
          }]
        }]
      }
    }
  },

  strict: {
    description: '安全 + 上下文监控 + 代码检查',
    hooks: [
      {
        trigger: 'beforeToolUse',
        action: 'check-permissions',
        conditions: [
          'Tool=Bash',
          'Command matches deny patterns'
        ],
        error: '此命令被禁止执行'
      },
      {
        trigger: 'beforeToolUse',
        action: 'check-file-access',
        conditions: [
          'Tool=Read',
          'File matches deny patterns'
        ],
        error: '此文件禁止读取'
      }
    ],
    settings: {
      hooks: {
        PostToolUse: [
          {
            matcher: 'Bash|Edit|Write|MultiEdit|Agent|Task',
            hooks: [{
              type: 'command',
              command: 'node \"{HOOKS_DIR}/gsd-context-monitor.js\"',
              timeout: 10
            }]
          },
          {
            matcher: 'Bash',
            hooks: [{
              type: 'command',
              command: 'node \"{HOOKS_DIR}/gsd-code-checker.js\"',
              timeout: 30
            }]
          }
        ]
      }
    }
  }
};

const config = HOOK_CONFIGS[HOOK_LEVEL] || HOOK_CONFIGS.standard;

console.log(`Hook level: ${HOOK_LEVEL} - ${config.description}`);

// Output the appropriate configuration
process.stdout.write(JSON.stringify(config, null, 2));
