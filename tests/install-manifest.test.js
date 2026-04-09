const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

function runNode(script, args = [], options = {}) {
  return execFileSync('node', [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    ...options
  });
}

test('install-manifest list prints profiles and components', () => {
  const output = runNode('scripts/install-manifest.js', ['list']);
  assert.match(output, /Profiles:/);
  assert.match(output, /core/);
  assert.match(output, /java-fullstack/);
});

test('install-manifest resolve profile expands dependencies', () => {
  const output = runNode('scripts/install-manifest.js', ['resolve', '--profile', 'java-fullstack']).trim();
  assert.equal(
    output,
    'core,docs-runtime,rules-common,rules-java,rules-mysql,templates,contexts'
  );
});

test('install-manifest resolve default target uses slim runtime component set', () => {
  const output = runNode('scripts/install-manifest.js', ['resolve', '--target', ROOT]).trim();
  assert.equal(
    output,
    'core,docs-runtime,rules-common,templates,contexts'
  );
  assert.doesNotMatch(output, /repo-maintenance|docs-archive|tests/);
});

test('install-manifest keeps repo-maintenance opt-in', () => {
  const output = runNode('scripts/install-manifest.js', ['resolve', '--components', 'rules-java']).trim();
  assert.equal(
    output,
    'core,rules-common,rules-java'
  );
  assert.doesNotMatch(output, /docs-runtime|repo-maintenance|tests/);
});
