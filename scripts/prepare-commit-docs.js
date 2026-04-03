#!/usr/bin/env node

const { parseArgs, prepareCommitDocs, fail } = require('./lib/commit-docs');

function main() {
  const args = parseArgs(process.argv);
  const date = new Date().toISOString().slice(0, 10);
  const result = prepareCommitDocs(args.root, args.feature, date);

  console.log('prepare-commit-docs 完成');
  console.log(`feature: ${result.ctx.meta.featureDirName}`);
  console.log(`track: ${result.ctx.track}`);
  console.log(`verification: ${result.ctx.verificationResult}`);
  console.log('已更新文件:');
  for (const item of result.updated) {
    console.log(`- ${item}`);
  }
}

main();
