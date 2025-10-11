# Nx Caching Improvements

## Overview

This document describes the improvements made to the Nx caching configuration to ensure reliable builds and proper cache invalidation.

## Problem

During development, we encountered a caching issue where Nx was serving stale build outputs even when source files had changed. This led to confusing behavior where code changes weren't reflected in the running application.

## Root Causes

### 1. Missing Dependency Inputs

The `nx-tsdown` plugin only tracked project-local source files:

```typescript
// Before
inputs: [
  `{projectRoot}/src/**/*.ts`,
  `{projectRoot}/tsconfig.lib.json`,
  `{projectRoot}/tsdown.config.ts`,
  `{projectRoot}/package.json`,
  { externalDependencies: ['tsdown'] },
]
```

**Problem**: When a dependency's source files changed (e.g., `@anygpt/types`), packages that depend on it (e.g., `@anygpt/router`, `@anygpt/cli`) didn't know their cache was invalid.

### 2. Generic Output Specification

The outputs were only specified as a directory:

```typescript
// Before
outputs: [`{projectRoot}/dist`]
```

**Problem**: Nx couldn't track individual output files, making cache invalidation less precise.

## Solutions

### 1. Include Dependency Sources in Inputs

Added `^production` to the inputs array:

```typescript
// After
inputs: [
  `{projectRoot}/src/**/*.ts`,
  `{projectRoot}/tsconfig.lib.json`,
  `{projectRoot}/tsdown.config.ts`,
  `{projectRoot}/package.json`,
  `^production`, // ← Includes all dependency source files
  { externalDependencies: ['tsdown'] },
]
```

**How it works**:
- `^production` is a named input reference that means "include the production files from all dependencies"
- The `production` named input is defined in `nx.json` and excludes test files, config files, etc.
- This ensures that when any dependency's source changes, all dependent packages have their cache invalidated

**Example flow**:
1. Developer changes `packages/types/src/chat.ts`
2. Nx detects the change affects the `types` package
3. Nx checks which packages depend on `types` (e.g., `router`, `cli`, `config`)
4. Nx invalidates the cache for all dependent packages
5. Next build rebuilds all affected packages

### 2. Explicit Output File Patterns

Specified individual output file types:

```typescript
// After
outputs: [
  `{projectRoot}/dist`,           // Directory (for compatibility)
  `{projectRoot}/dist/**/*.js`,   // JavaScript files
  `{projectRoot}/dist/**/*.d.ts`, // TypeScript declarations
  `{projectRoot}/dist/**/*.map`,  // Source maps
]
```

**Benefits**:
- **Better cache granularity**: Nx can track which specific files changed
- **Partial build detection**: If only some outputs are missing, Nx knows the cache is invalid
- **Debugging**: Easier to see what files are expected vs. actually produced
- **Future-proof**: If tsdown starts producing additional file types, we can add them

## Implementation

**File**: `tools/nx-tsdown/src/plugin.ts`

The changes are in the `createNodesV2` function that generates build targets for all packages with `tsdown.config.ts` files.

## Verification

### Test 1: Dependency Change Invalidation

```bash
# 1. Build everything
nx run-many -t build --all

# 2. Change a type in packages/types/src/chat.ts
echo "// test change" >> packages/types/src/chat.ts

# 3. Build a dependent package
nx run cli:build

# Expected: cli rebuilds because types changed
# Before fix: cli used cached output (stale)
# After fix: cli rebuilds correctly
```

### Test 2: Output Tracking

```bash
# 1. Build a package
nx run config:build

# 2. Delete a single output file
rm packages/config/dist/index.d.ts

# 3. Try to use the cache
nx run config:build

# Expected: Rebuilds because output is incomplete
# Nx detects the missing file and invalidates cache
```

### Test 3: No Unnecessary Rebuilds

```bash
# 1. Build everything
nx run-many -t build --all

# 2. Build again without changes
nx run-many -t build --all

# Expected: All tasks use cache (no rebuilds)
# Verify: Look for "[local cache]" in output
```

## Nx Named Inputs Reference

From `nx.json`:

```json
{
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/.eslintrc.json",
      "!{projectRoot}/eslint.config.mjs",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/src/test-setup.[jt]s"
    ]
  }
}
```

- **`default`**: All files in the project + shared globals
- **`production`**: Default minus test files and config files
- **`^production`**: Production files from all dependencies (transitive)

## Best Practices

### When to Use `^production` vs `^default`

- **Use `^production`**: For build tasks that consume compiled outputs from dependencies
- **Use `^default`**: For tasks that need to know about all changes (including tests)

### Output Patterns

Always specify outputs as specifically as possible:

```typescript
// ✅ Good - Specific patterns
outputs: [
  `{projectRoot}/dist`,
  `{projectRoot}/dist/**/*.js`,
  `{projectRoot}/dist/**/*.d.ts`,
]

// ⚠️ Okay - Directory only (less precise)
outputs: [`{projectRoot}/dist`]

// ❌ Bad - Missing outputs
outputs: []
```

### Input Patterns

Include all files that affect the build:

```typescript
// ✅ Good - Comprehensive
inputs: [
  `{projectRoot}/src/**/*.ts`,
  `{projectRoot}/tsconfig.lib.json`,
  `{projectRoot}/package.json`,
  `^production`,
  { externalDependencies: ['tsdown'] },
]

// ❌ Bad - Missing dependencies
inputs: [
  `{projectRoot}/src/**/*.ts`,
]
```

## Troubleshooting

### Cache Not Invalidating

**Symptom**: Code changes don't appear in built output

**Solution**:
```bash
# Clear cache and rebuild
nx reset
nx run-many -t build --all --skip-nx-cache
```

**Root cause check**:
1. Are dependency sources included in inputs? (`^production`)
2. Are all source files matched by input patterns?
3. Are external dependencies declared?

### Unnecessary Rebuilds

**Symptom**: Packages rebuild even when nothing changed

**Solution**:
1. Check if test files are excluded from `production` input
2. Verify output patterns match actual build outputs
3. Check for dynamic file generation (timestamps, etc.)

### Partial Build Failures

**Symptom**: Build succeeds but some output files are missing

**Solution**:
1. Add specific output patterns for all expected files
2. Check tsdown configuration for output settings
3. Verify build script doesn't fail silently

## Related Documentation

- [Nx Caching Documentation](https://nx.dev/concepts/how-caching-works)
- [Nx Inputs and Outputs](https://nx.dev/recipes/running-tasks/configure-inputs)
- [Token Limits Architecture](../product/token-limits-architecture.md) - Context for why we discovered this issue

## Changelog

- **2025-01-10**: Added `^production` to inputs for dependency tracking
- **2025-01-10**: Improved outputs specification with explicit file patterns
