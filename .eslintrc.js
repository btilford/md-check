module.exports = {
  ignorePatterns: [
    'dist',
    'node_modules',
    '.nyc_output',
    'coverage',
    'reports',
    '.md-check',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      experimentalDecorators: true,
      experimentalObjectRestSpread: true,

    },
  },
  env: {
    node: 12,
    commonjs: true,
    es2020: true,
    browser: false,
    mocha: true,
  },
  plugins: [
    'mocha',
    'md',
    'markdown',
    '@typescript-eslint',
    'optimize-regex',
    'sonarjs',
    'no-secrets',
    'security',
    'editorconfig',
    'json',
  ],
  extends: [
    'eslint:recommended',
    'plugin:json/recommended',
    'plugin:md/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:sonarjs/recommended',
    'plugin:security/recommended',
    'plugin:editorconfig/noconflict',
    'plugin:mdx/recommended',
  ],

  overrides: [
    {
      files: ['*.js', '*.md', '*.mdx'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['*.spec.ts', '*.e2e.ts'],
      rules: {
        'mdx/no-unused-expressions': 'off',
      },
    },
  ],
  rules: {
    quotes: ['warn', 'single'],

    // TYPESCRIPT
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-ignore': 'warn',
    '@typescript-eslint/no-this-alias': 'off',

    // SECURITY
    'no-secrets/no-secrets': 'error',
    'security/detect-object-injection': 'off',

    // SONAR
    'sonarjs/cognitive-complexity': 'warn',


    // OTHER
    'optimize-regex/optimize-regex': 'warn',

    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          String: {
            message: 'Use string instead',
            fixWith: 'string',
          },
          Boolean: {
            message: 'Use boolean instead',
            fixWith: 'boolean',
          },
          Number: {
            message: 'Use number instead',
            fixWith: 'number',
          },
        },
      },
    ],
  },
};
