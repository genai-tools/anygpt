// tsdown.config.ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  sourcemap: true,
  tsconfig: 'tsconfig.lib.json',
  skipNodeModulesBundle: true,
  format: 'cjs',
  clean: false, // Don't clean dist - let Nx handle caching
});
