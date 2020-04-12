const { MochaExecutor } = require('@btilford/md-check-exec-mocha');
const { TsCompiler } = require('@btilford/md-check-compile-typescript');
const path = require('path');
const pkg = require('../main/package.json');

const {
  mdCheck, NodeVmExecutor, ForkExecutor, WriteSourceCompiler,
} = require('@btilford/md-check');

const outputDir = 'docs/';
process.env.LEVEL = 'debug';
const now = new Date();
const ghUrl = 'https://github.com/btilford/md-check';

const schemaOrg = 'http://schema.org';


function ldJson() {
  return [
    {
      '@context': schemaOrg,
      '@type': 'WebPage',
      name: pkg.name,
      url: pkg.homepage,
      author: pkg.author,
      copyrightHolder: { '@type': 'Person', name: 'Ben Tilford' },
      copyrightYear: now.getFullYear(),
      dateModified: now.toISOString(),
      discussionUrl: pkg.bugs.url,
      description: pkg.description,
      keywords: pkg.keywords,
    },
    {
      '@context': schemaOrg,
      '@type': 'Project',
      name: pkg.name,
      founder: pkg.author,
      url: ghUrl,
      description: pkg.description,
      sameAs: pkg.repository.url,
      contactPoint: pkg.bugs,
    },
    {
      '@context': schemaOrg,
      '@type': 'SoftwareSourceCode',
      name: pkg.name,
      version: pkg.version,
      codeRepository: pkg.repository.url,
      codeSampleType: 'full',
      programmingLanguage: ['Typescript','Javacript','Markdown'],
      runtimePlatform: 'NodeJS',

      copyrightHolder: 'Ben Tilford',
      copyrightYear: now.getFullYear(),
      dateModified: now.toISOString(),
      discussionUrl: pkg.bugs.url,
      description: pkg.description,
      license: `${ghUrl}/LICENSE`,
      keywords: pkg.keywords,
      contributor: pkg.contributors ? pkg.contributors.map(user => ({ '@type': 'Person', ...user })) : [],
      maintainer: pkg.maintainers ? pkg.maintainers.map(user => ({ '@type': 'Person', ...user })) : [],
      url: ghUrl,
      inLanguage: 'en-US'
    },
  ];
}


const run = mdCheck({
  outputStyle: 'single-file',
  failOnerror: true,
  project: {
    name: pkg.name,
    version: pkg.version,
    outputDir,
    ldJson: ldJson(),
  },
  include: {
    patterns: [
      '**/*.{mdx,md}',
    ],
  },
  executors: [
    [NodeVmExecutor.supply()],
    [
      ForkExecutor.supply(
        /eval$/,
        'eval',
        {},
        '"$SOURCE"',
      ),
    ],
    [
      ForkExecutor.supply(
        /bash$/,
        'bash',
        {},
        '$COMPILED_FILE',
      ),
    ],
    [
      MochaExecutor.supply(),
    ],
  ],
  compilers: [
    WriteSourceCompiler.supply(/bash$/),
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
