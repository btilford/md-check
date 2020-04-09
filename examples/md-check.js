const { TsCompiler } = require('@btilford/md-check-compile-typescript');


const { mdCheck, ForkExecutor, WriteSourceCompiler } = require('@btilford/md-check');


const run = mdCheck({
  outputStyle: 'per-file',
  failOnerror: true,
  project: {
    outputDir: '../docs/_examples',
  },
  include: {
    patterns: [
      '**/*.mdx',
    ],
  },
  executors: [
    [ForkExecutor.supply(/node$/, 'node')],
    [ForkExecutor.supply(/bash$/, 'bash')],
    [ForkExecutor.supply(/sh|shell/, 'sh')],
  ],
  compilers: [
    WriteSourceCompiler.supply(/^javascript|bash|sh/),
    TsCompiler.supply({ tsConfig: 'tsconfig.json' }),
  ],
});

run().then(() => {
  console.log('Finished running');
}).catch(err => {
  console.error('Error running!', err);
});
