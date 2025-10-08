// tsdown.config.ts
import { defineConfig } from 'tsdown';
import { cpSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  sourcemap: true,
  tsconfig: 'tsconfig.lib.json',
  skipNodeModulesBundle: true,
  dts: true,
  onSuccess: async () => {
    // Copy docs directory to dist
    cpSync(
      join(process.cwd(), 'docs'),
      join(process.cwd(), 'dist', 'docs'),
      { recursive: true }
    );
    console.log('✓ Copied docs directory to dist');
  }
});