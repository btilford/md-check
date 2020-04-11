const { TsCompiler } = require('@btilford/md-check-compile-typescript');
const path = require('path');
const fs = require('fs').promises;
const {
  mdCheck, NodeVmExecutor, ForkExecutor, WriteSourceCompiler,
} = require('@btilford/md-check');

const outputDir = 'docs/';
process.env.LEVEL = 'debug';
const run = mdCheck({
  outputStyle: 'single-file',
  failOnerror: true,
  project: {
    name: 'examples',
    outputDir,

  },
  include: {
    patterns: [
      '**/*.{mdx,md}',
    ],
  },
  executors: [
    [NodeVmExecutor.supply()],
    [ForkExecutor.supply(/bash$/, 'bash')],
    [ForkExecutor.supply(/sh|shell/, 'sh')],
  ],
  compilers: [
    WriteSourceCompiler.supply(/^javascript|bash|sh/),
    TsCompiler.supply({ tsConfig: 'tsconfig.json' }),
  ],
});

run().then(async results => {
  console.log('Finished generating partials');

  const basePath = path.resolve(path.join(__dirname, outputDir));

  // const nav = fs.readFile(path.join(basePath, 'index.html'));
  //

}).catch(err => {
  console.error('Error running!', err);
});
