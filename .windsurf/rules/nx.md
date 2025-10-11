# Nx Rules

## Execution
- ✅ Always `npx nx` (never global)
- ✅ `npx nx build`, `npx nx run-many -t build`, `npx nx affected -t test`

## Custom Plugins
- **Required**: `nx-tsdown`, `nx-vitest`, `nx-tsgo`, `@nx/eslint/plugin`
- ✅ Plugins infer targets automatically from config files
- ✅ Configured centrally in `nx.json` plugins array

## Package Configuration
- ❌ **No npm scripts** in package.json
- ✅ Use Nx targets: `npx nx build my-package`
- ✅ Let plugins create targets automatically

## Target Configuration
- ✅ Define in `nx.json` `targetDefaults` (central)
- ❌ No `project.json` unless unique requirements
- ✅ Dependencies: `"dependsOn": ["^build"]` (build deps first)

## Incremental Builds
- ✅ **Dependencies build automatically** via `^build` in targetDefaults
- ❌ **Never manually build dependencies** - Nx handles it
- ✅ Just run target on final package: `npx nx build my-package`
- ✅ Nx builds dependency tree automatically with caching

```bash
# ❌ Bad - Unnecessary manual dependency builds
npx nx build @anygpt/config
npx nx build @anygpt/cli

# ✅ Good - Nx builds dependencies automatically
npx nx build @anygpt/cli  # Builds @anygpt/config first if needed
```

## ESLint
- ✅ Include `@nx/eslint-plugin` configs
- ✅ Enable `@nx/enforce-module-boundaries` rule
- ✅ Flat config format (ESLint 9+)

```javascript
import nx from '@nx/eslint-plugin';
export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  { files: ['**/*.ts'], rules: { '@nx/enforce-module-boundaries': 'error' } }
];
```

## Release
- ✅ Use custom `./tools/nx-release:release` executor
- ❌ Never standard `nx release`
- ✅ Independent versioning, conventional commits, AI changelogs

## Task Execution
```bash
npx nx build @anygpt/cli              # Single (deps auto-built)
npx nx run-many -t build test lint    # Multiple
npx nx affected -t test               # Affected only
npx nx graph --json                   # Graph as JSON
```

## Caching
- ✅ Local + Nx Cloud distributed caching
- ✅ Cached builds skip execution entirely
- ✅ `npx nx reset` to clear cache
- ✅ Use `affected` in CI for efficiency

## Checklist
- [ ] Using `npx nx` (not global)
- [ ] No npm scripts in packages
- [ ] No manual dependency builds (Nx does it)
- [ ] Plugins in nx.json, no project.json
- [ ] ESLint with Nx rules
- [ ] Custom nx-release executor
- [ ] targetDefaults for shared config
