#!/usr/bin/env node
// hook-hierarchy.js
// Hook level controller - reads TINYPOWERS_HOOK_LEVEL and returns
// the appropriate hooks.json configuration
//
// Levels:
//   minimal  - only security intercepts (beforeToolUse)
//   standard - security + context monitoring (default)
//   strict   - security + context monitoring + code format + type checks
//
// Disabled hooks:
//   TINYPOWERS_DISABLED_HOOKS=context-monitor,code-checker,residual-check
//   Comma-separated list of hook IDs to disable regardless of level

const fs = require('fs');
const path = require('path');

const HOOK_LEVEL = process.env.TINYPOWERS_HOOK_LEVEL || 'standard';
const DISABLED_HOOKS = new Set(
  (process.env.TINYPOWERS_DISABLED_HOOKS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
);

function isHookDisabled(hookId) {
  return DISABLED_HOOKS.has(hookId);
}

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

// Apply disabled hooks filter to settings
const baseConfig = HOOK_CONFIGS[HOOK_LEVEL] || HOOK_CONFIGS.standard;
const config = JSON.parse(JSON.stringify(baseConfig)); // deep clone

// Filter out disabled PostToolUse hooks by id
if (config.settings?.hooks?.PostToolUse) {
  const idMap = {
    'gsd-context-monitor.js': 'context-monitor',
    'gsd-code-checker.js': 'code-checker'
  };
  config.settings.hooks.PostToolUse = config.settings.hooks.PostToolUse.filter(hook => {
    const cmd = hook.hooks?.[0]?.command || '';
    for (const [file, id] of Object.entries(idMap)) {
      if (cmd.includes(file) && isHookDisabled(id)) {
        return false;
      }
    }
    return true;
  });
}

const disabledList = DISABLED_HOOKS.size > 0 ? [...DISABLED_HOOKS].join(', ') : 'none';
const logLine = `Hook level: ${HOOK_LEVEL} - ${config.description} | Disabled: ${disabledList}`;

const output = {
  hookSpecificOutput: {
    hookEventName: 'HookConfig',
    additionalContext: logLine
  },
  config: config
};

process.stdout.write(JSON.stringify(output));
