module.exports = {
  diff: true,
  recursive: true,
  extension: [
    'ts',
  ],
  ignore: [],
  reporter: 'spec',
  slow: 75,
  timeout: 10000,
  ui: 'bdd',
  'enable-source-maps': true,
  watchFiles: [
    'src/**/*.ts',
    'e2e/**/*.ts',
  ],
  watchIgnore: [
    'dist/**/*',
    'node_modules/**/*',
    'reports/**/*',
    '.nyc_output/**/*',
  ]
};
