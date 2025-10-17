import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'discovery-mcp-e2e',
    globals: true,
    environment: 'node',
    include: ['**/*.e2e.test.ts'],
    testTimeout: 30000, // 30 seconds for E2E tests
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['**/*.e2e.test.ts']
    }
  }
});
