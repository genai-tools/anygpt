import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@anygpt/docker-mcp-plugin': resolve(__dirname, '../../packages/plugins/docker-mcp/src'),
      '@anygpt/types': resolve(__dirname, '../../packages/types/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000, // E2E tests may take longer
  },
});
