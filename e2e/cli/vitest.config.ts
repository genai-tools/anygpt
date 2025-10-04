import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.e2e.spec.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 60000, // E2E tests can take longer
    hookTimeout: 30000,
    watch: false, // Never run in watch mode - always run once and exit
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.d.ts',
        'helpers/',
        'fixtures/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@anygpt/mock': resolve(__dirname, '../../packages/connectors/mock/src'),
      '@anygpt/config': resolve(__dirname, '../../packages/config/src')
    }
  }
});
