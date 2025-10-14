import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      'packages/config/examples/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*\\.(config|eslint\\.config)\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
    rules: {
      // Enforce that dependencies in package.json are actually used
      '@nx/dependency-checks': [
        'error',
        {
          // Exclude config files and test files from dependency checks
          // (they use devDependencies which shouldn't be flagged)
          ignoredFiles: [
            '{projectRoot}/**/*.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/**/*.{spec,test}.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/**/test/**/*',
            '{projectRoot}/**/tests/**/*',
            '{projectRoot}/**/__tests__/**/*',
          ],
        },
      ],
    },
  },
];
