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
- **Multiple Targets**: Automatically creates `build`, `typecheck`, `watch`, `clean`, and optionally `test` targets
- **Test Integration**: Automatically detects `vitest.config.ts` or `vite.config.ts` and creates test targets
- **Smart Caching**: Uses Nx's caching system with proper inputs and outputs
- **Dependency Management**: Automatically sets up build dependencies
- **Verbose Logging**: Supports `--verbose` flag and `NX_VERBOSE_LOGGING` environment variable

## Targets Created

For each project with a `tsdown.config.ts` file, the plugin creates:

### `build`
- **Command**: `npx tsdown`
- **Outputs**: `{projectRoot}/dist`
- **Cache**: Enabled
- **Dependencies**: Runs after upstream projects build

### `typecheck`
- **Command**: `npx tsgo --noEmit`
- **Cache**: Enabled
- **Purpose**: Type checking without emitting files (uses tsgo - TypeScript in Go for faster performance)

### `watch`
- **Command**: `npx tsdown --watch`
- **Purpose**: Development mode with automatic rebuilds

### `clean`
- **Command**: `rm -rf dist`
- **Purpose**: Remove build artifacts

### `test` (optional)
- **Command**: `npx vitest run`
- **Created**: Only if `vitest.config.ts` or `vite.config.ts` exists
- **Cache**: Enabled
- **Purpose**: Run tests with vitest

## Usage Examples

```bash
# Build a project
nx build my-package

# Type check a project
nx typecheck my-package

# Watch mode for development
nx watch my-package

# Clean build artifacts
nx clean my-package

# Run tests
nx test my-package

# Run typecheck on all projects
nx run-many -t typecheck

# Build, test, and typecheck together
nx run-many -t build test typecheck
```

## Building

The plugin must be built before NX can use it. **This happens automatically** via the `postinstall` script when you run `npm install`.

To manually rebuild the plugin:

```bash
# Build the plugin directly
cd tools/nx-tsdown && npx tsdown

# Or using nx
nx build nx-tsdown
```

**CI/CD:** The plugin is automatically built during `npm install` via the postinstall hook:

```yaml
- run: npm install  # Automatically builds nx-tsdown plugin
- run: npx nx run-many -t build test typecheck
```
