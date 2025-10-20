# 3.0.0-beta.1 (2025-10-20)

> **⚠️ BETA RELEASE**: This is a pre-release version with major breaking changes. Please test thoroughly before using in production. Report issues on GitHub.

### 🚀 Features

- **config:** Complete API refactor - simplified from 4 functions to 2
- **config:** Unified type system - single `Config` type instead of 4 variants
- **config:** Dual format support - both TypeScript (direct instances) and JSON/YAML (module references)
- **config:** Smart connector resolution with helpful error messages
- **config:** Package size reduced by 10% (168 kB → 161 kB)

### ⚠️ BREAKING CHANGES

#### API Simplification

- **Removed:** Legacy string-based connector format (`connector.connector`)
- **Renamed:** `FactoryConfig` → `Config`, `FactoryProviderConfig` → `ProviderConfig`
- **Renamed:** `defineConfigs()` → `mergeConfigs()` (clearer naming)
- **Deprecated:** `config()` → use `defineConfig()` instead

#### Migration Required

**Old (No Longer Works):**

```typescript
{
  providers: {
    openai: {
      connector: {
        connector: '@anygpt/openai',  // ❌ Removed
        config: { apiKey: '...' }
      }
    }
  }
}
```

**New (Two Options):**

1. **TypeScript/JavaScript configs** (Direct instance):

```typescript
import { openai } from '@anygpt/openai';

{
  providers: {
    openai: {
      connector: openai({ apiKey: '...' }); // ✅ Direct instance
    }
  }
}
```

2. **JSON/YAML configs** (Module reference):

```json
{
  "providers": {
    "openai": {
      "module": "@anygpt/openai",
      "config": { "apiKey": "..." }
    }
  }
}
```

#### What Was Removed

- `connector-loader.ts` - Replaced with cleaner `connector-resolver.ts`
- `factory.ts` - Types moved to unified `types.ts`
- `plugins/define-config.ts` - Moved to `config.ts`
- `plugins/plugin-manager.ts` - Unused code removed

#### Deprecated (Still Work, But Warned)

- `FactoryConfig` type → Use `Config`
- `FactoryProviderConfig` type → Use `ProviderConfig`
- `config()` function → Use `defineConfig()`
- `setupRouterFromFactory()` → Use `setupRouter()`

### 📖 Documentation

- **Added:** `DUAL_FORMAT.md` - Complete guide for both config formats
- **Moved:** Refactoring docs to `docs/projects/anygpt-ts/refactoring/` (not in npm package)

### 🎯 Benefits

- **50% fewer functions** - Easier to learn and use
- **75% fewer types** - No more type incompatibility errors
- **10% smaller package** - Faster installs
- **Better errors** - Clear, actionable error messages
- **Dual format** - Works with both TypeScript and JSON/YAML configs

# 2.0.0 (2025-10-14)

### 🚀 Features

- **config:** improve tag registry to support config-defined models ([6c1ca9e](https://github.com/genai-tools/anygpt/commit/6c1ca9e))
- ⚠️ **config:** complete configuration loader feature ([a48515c](https://github.com/genai-tools/anygpt/commit/a48515c))
- **config:** add custom error types for better error handling ([fcf0271](https://github.com/genai-tools/anygpt/commit/fcf0271))
- **config:** enhance model pattern resolver and add capability flags ([c11ba09](https://github.com/genai-tools/anygpt/commit/c11ba09))
- implement tag registry for pattern-based tag resolution ([fd6c489](https://github.com/genai-tools/anygpt/commit/fd6c489))

### 📖 Documentation

- **config:** consolidate documentation into single README ([877dc9d](https://github.com/genai-tools/anygpt/commit/877dc9d))

### ⚠️ Breaking Changes

- **config:** Removed Codex migration support. Users should use modern factory config pattern instead.

### 🧱 Updated Dependencies

- Updated router to 0.5.0
- Updated types to 1.2.0
- Updated mock to 1.0.2

### ❤️ Thank You

- Petr Plenkov

## 1.1.0 (2025-10-09)

### 🚀 Features

- **config:** implement model tag resolution system ([8e21d0b](https://github.com/genai-tools/anygpt/commit/8e21d0b))
- **config:** add model pattern resolver with priority-based rules ([ec1bc6a](https://github.com/genai-tools/anygpt/commit/ec1bc6a))

### 📖 Documentation

- add reasoning effort levels guide and configuration examples ([d82a360](https://github.com/genai-tools/anygpt/commit/d82a360))

### 🧱 Updated Dependencies

- Updated router to 0.4.0
- Updated types to 1.1.0

### ❤️ Thank You

- Petr Plenkov

## 0.6.1 (2025-10-09)

### 🧱 Updated Dependencies

- Updated router to 0.3.1
- Updated types to 0.2.1

# 1.0.0 (2025-10-09)

### 🧱 Updated Dependencies

- Updated types to 1.0.0

## 0.6.0 (2025-10-08)

### 🚀 Features

- add list-tags command and model tag discovery functionality ([8c46b8f](https://github.com/genai-tools/anygpt/commit/8c46b8f))

### ❤️ Thank You

- Petr Plenkov

## 0.5.1 (2025-10-08)

### 🧱 Updated Dependencies

- Updated types to 0.2.0

## 0.5.0 (2025-10-07)

### 🚀 Features

- **config:** add shared model resolution utilities ([0cdcea1](https://github.com/genai-tools/anygpt/commit/0cdcea1))

### ❤️ Thank You

- Petr Plenkov

## 0.4.0 (2025-10-07)

### 🚀 Features

- **cody:** improve documentation and connection modes ([0fb3871](https://github.com/genai-tools/anygpt/commit/0fb3871))

### ❤️ Thank You

- Petr Plenkov

## 0.3.2 (2025-10-06)

### 🧱 Updated Dependencies

- Updated router to 0.3.0

## 0.3.1 (2025-10-06)

### 🧱 Updated Dependencies

- Updated router to 0.2.3
- Updated types to 0.1.4

## 0.3.1-0 (2025-10-06)

### 🚀 Features

- **config:** export loadConfig and validateConfig functions ([6eae95f](https://github.com/genai-tools/anygpt/commit/6eae95f))

### 🧱 Updated Dependencies

- Updated router to 0.2.3-0
- Updated types to 0.1.4-0

### ❤️ Thank You

- Petr Plenkov

## 0.3.0 (2025-10-05)

### 🚀 Features

- **config:** add native TypeScript config loading with jiti ([29ba119](https://github.com/genai-tools/anygpt/commit/29ba119))

### ❤️ Thank You

- Petr Plenkov

## 0.2.2 (2025-10-04)

### 🧱 Updated Dependencies

- Updated router to 0.2.2
- Updated types to 0.1.3
