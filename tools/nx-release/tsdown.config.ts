import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/executors/release/executor.ts'],
  format: ['cjs'],
  clean: true,
  dts: false,
  external: ['@nx/devkit', 'execa'],
  outDir: 'dist',
});
