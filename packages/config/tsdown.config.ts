// tsdown.config.ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  sourcemap: true,
  tsconfig: 'tsconfig.lib.json',
  skipNodeModulesBundle: true,
  // Disable DTS - tsdown has bugs with TS path mappings (see issue #523)
  // dts: {
  //   build:true,
  //   tsgo:true
  // }
});
