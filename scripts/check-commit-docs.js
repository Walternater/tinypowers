#!/usr/bin/env node

const { parseArgs, checkCommitDocs, fail } = require('./lib/commit-docs');

function main() {
  const args = parseArgs(process.argv);
  if (!args.feature) {
    fail('缺少 --feature');
  }

  const result = checkCommitDocs(args.root, args.feature);
  if (result.failures.length > 0) {
    console.error('commit 文档校验失败:');
    for (const item of result.failures) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log('commit 文档校验通过');
  console.log(`feature: ${result.ctx.meta.featureDirName}`);
  console.log(`track: ${result.ctx.track}`);
  console.log(`verification: ${result.ctx.verificationResult}`);
}

main();
