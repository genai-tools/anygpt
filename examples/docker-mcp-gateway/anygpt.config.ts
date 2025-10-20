import { defineConfig } from '@anygpt/config';
import dockerMCP from '@anygpt/docker-mcp-plugin';

export default defineConfig({
  plugins: [
    dockerMCP({
      serverRules: [
        {
          when: { name: 'sequentialthinking' },
          set: { enabled: false },
        },
        {
          when: { name: 'github-official' },
          set: { prefix: 'github:' },
        },
        {
          when: { name: 'filesystem' },
          set: { prefix: 'fs:' },
        },
      ],
    }),
  ],
});
