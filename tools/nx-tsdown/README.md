# nx-tsdown

An Nx plugin that provides automatic build targets for projects using [tsdown](https://github.com/sxzz/tsdown) - a fast TypeScript bundler.

## Overview

This plugin automatically detects `tsdown.config.ts` files in your workspace and creates build targets for them. It's designed to work with tsdown, which is a fast TypeScript bundler that can be used as an alternative to other bundlers.

## Usage

1. Install tsdown in your workspace:
   ```bash
   npm install tsdown --save-dev
   ```

2. Add the plugin to your `nx.json`:
   ```json
   {
     "plugins": ["tools/nx-tsdown"]
   }
   ```

3. Create a `tsdown.config.ts` file in any project directory:
   ```typescript
   import { defineConfig } from 'tsdown'

   export default defineConfig({
     entry: 'src/index.ts',
     format: ['cjs', 'esm'],
     dts: true,
   })
   ```

4. The plugin will automatically create a `build` target for that project.

## Features

- **Automatic Discovery**: Finds all `tsdown.config.ts` files in your workspace
- **Smart Caching**: Uses Nx's caching system with proper inputs and outputs
- **Dependency Management**: Automatically sets up build dependencies
- **Verbose Logging**: Supports `--verbose` flag and `NX_VERBOSE_LOGGING` environment variable

## Configuration

The plugin looks for `tsdown.config.ts` files and creates build targets with:

- **Executor**: `nx:run-commands` running `npx tsdown`
- **Outputs**: `{projectRoot}/dist`
- **Inputs**: Source files, config files, and tsdown dependency
- **Cache**: Enabled for faster rebuilds
- **Dependencies**: Runs after upstream projects build

## Building

Run `nx build nx-tsdown` to build the plugin.
