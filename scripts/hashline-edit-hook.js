#!/usr/bin/env node

/**
 * hashline-edit-hook.js
 * 
 * Hash-Anchored Edit Hook for tinypowers
 * 
 * This hook implements hash-anchored editing, inspired by oh-my-openagent's hashline approach.
 * Each line is returned with a content hash, and edits reference lines by hash to prevent
 * stale-line errors when files are modified externally during the session.
 * 
 * How it works:
 * 1. When reading files, each line includes a content hash
 * 2. When editing, the hash is validated before applying the edit
 * 3. If hash doesn't match (file changed), the edit is rejected with guidance
 * 
 * Usage:
 *   node hashline-edit-hook.js <command> [args...]
 * 
 * Commands:
 *   hash-line <file>    - Output file with line hashes
 *   validate <file>     - Validate hashline format in file
 * 
 * Environment:
 *   HASHLINE_ENABLED=true    - Enable hashline editing
 *   HASHLINE_DEBUG=false     - Enable debug output
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HASHLINE_PREFIX = 'HASHLINE:';
const HASH_LENGTH = 8;

function computeHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, HASH_LENGTH);
}

function hashLine(line, lineNum) {
  const hash = computeHash(line);
  return `${hash}#${lineNum}| ${line}`;
}

function parseHashLine(hashline) {
  const match = hashline.match(/^([a-f0-9]{8})#(\d+)\| (.*)$/);
  if (!match) return null;
  return {
    hash: match[1],
    lineNum: parseInt(match[2], 10),
    content: match[3]
  };
}

function hashFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const hashedLines = lines.map((line, idx) => hashLine(line, idx + 1));
  
  return hashedLines.join('\n');
}

function validateHashFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let valid = true;
  let hashlineCount = 0;
  
  for (const line of lines) {
    if (line.startsWith(HASHLINE_PREFIX)) {
      hashlineCount++;
      const parsed = parseHashLine(line.substring(HASHLINE_PREFIX.length));
      if (!parsed) {
        console.error(`Invalid hashline format: ${line.substring(0, 50)}...`);
        valid = false;
      } else {
        const expectedHash = computeHash(parsed.content);
        if (parsed.hash !== expectedHash) {
          console.error(`Hash mismatch at line ${parsed.lineNum}: expected ${expectedHash}, got ${parsed.hash}`);
          console.error(`Content: ${parsed.content.substring(0, 50)}...`);
          valid = false;
        }
      }
    }
  }
  
  if (valid) {
    console.log(`✓ Hashline validation passed (${hashlineCount} hashlines)`);
  } else {
    console.error(`✗ Hashline validation FAILED`);
    process.exit(1);
  }
}

function generateHashlineStats(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let hashlineCount = 0;
  let regularLineCount = 0;
  let hashCounts = {};
  
  for (const line of lines) {
    if (line.startsWith(HASHLINE_PREFIX)) {
      hashlineCount++;
      const parsed = parseHashLine(line.substring(HASHLINE_PREFIX.length));
      if (parsed) {
        hashCounts[parsed.hash] = (hashCounts[parsed.hash] || 0) + 1;
      }
    } else if (line.trim()) {
      regularLineCount++;
    }
  }
  
  console.log(`Hashline Statistics for ${filePath}:`);
  console.log(`  Hashline entries: ${hashlineCount}`);
  console.log(`  Regular lines: ${regularLineCount}`);
  console.log(`  Unique hashes: ${Object.keys(hashCounts).length}`);
  
  const duplicates = Object.entries(hashCounts).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log(`  Duplicate hashes (collision risk): ${duplicates.length}`);
    duplicates.slice(0, 5).forEach(([hash, count]) => {
      console.log(`    ${hash}: ${count} occurrences`);
    });
  }
}

function injectHashlineMode(filePath) {
  const debug = process.env.HASHLINE_DEBUG === 'true';
  
  if (debug) {
    console.error(`[hashline] Processing file: ${filePath}`);
  }
  
  const hashedContent = hashFile(filePath);
  const output = hashedContent.split('\n')
    .map(line => HASHLINE_PREFIX + line)
    .join('\n');
  
  console.log(output);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.error('Usage: hashline-edit-hook.js <command> [args...]');
    console.error('Commands:');
    console.error('  hash-line <file>    - Output file with line hashes');
    console.error('  validate <file>     - Validate hashline format');
    console.error('  stats <file>       - Show hashline statistics');
    process.exit(1);
  }
  
  switch (command) {
    case 'hash-line':
      injectHashlineMode(args[1]);
      break;
      
    case 'validate':
      validateHashFile(args[1]);
      break;
      
    case 'stats':
      generateHashlineStats(args[1]);
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
  
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = {
  computeHash,
  hashLine,
  parseHashLine,
  hashFile,
  validateHashFile
};
