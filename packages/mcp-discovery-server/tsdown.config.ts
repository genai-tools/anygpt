import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  sourcemap: true,
  tsconfig: 'tsconfig.lib.json',
  skipNodeModulesBundle: true,
  // DTS disabled due to tsdown bug #523
});
