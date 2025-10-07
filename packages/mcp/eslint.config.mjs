import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/**/*.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/**/*.spec.ts',
            '{projectRoot}/**/vite.config.ts',
            '{projectRoot}/**/tsdown.config.ts',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    ignores: ['**/out-tsc'],
  },
];
