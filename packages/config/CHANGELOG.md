# 3.0.0 (2025-10-21)

### 🚀 Features

- refactor config API with simplified types and dual format support ([87ca8c6](https://github.com/genai-tools/anygpt/commit/87ca8c6))
- add docker-mcp-plugin with serverRules and powerful CLI commands ([f75d855](https://github.com/genai-tools/anygpt/commit/f75d855))
- **mcp-discovery:** implement server listing and config integration ([bdc86c5](https://github.com/genai-tools/anygpt/commit/bdc86c5))
- **config:** improve tag registry to support config-defined models ([bf32620](https://github.com/genai-tools/anygpt/commit/bf32620))
- ⚠️ **config:** complete configuration loader feature ([226c474](https://github.com/genai-tools/anygpt/commit/226c474))
- **config:** add custom error types for better error handling ([0e9c462](https://github.com/genai-tools/anygpt/commit/0e9c462))
- **config:** enhance model pattern resolver and add capability flags ([a40878d](https://github.com/genai-tools/anygpt/commit/a40878d))
- implement tag registry for pattern-based tag resolution ([44e8092](https://github.com/genai-tools/anygpt/commit/44e8092))
- **config:** implement model tag resolution system ([d0280b4](https://github.com/genai-tools/anygpt/commit/d0280b4))
- **config:** add model pattern resolver with priority-based rules ([2d4269b](https://github.com/genai-tools/anygpt/commit/2d4269b))
- add list-tags command and model tag discovery functionality ([6119b77](https://github.com/genai-tools/anygpt/commit/6119b77))
- **config:** add shared model resolution utilities ([04830d9](https://github.com/genai-tools/anygpt/commit/04830d9))
- **cody:** improve documentation and connection modes ([833a7e3](https://github.com/genai-tools/anygpt/commit/833a7e3))
- **config:** export loadConfig and validateConfig functions ([636ad6a](https://github.com/genai-tools/anygpt/commit/636ad6a))
- **config:** add native TypeScript config loading with jiti ([5851fb7](https://github.com/genai-tools/anygpt/commit/5851fb7))
- add OpenAI connector re-export and configure mock connector project ([7cd9836](https://github.com/genai-tools/anygpt/commit/7cd9836))

### 🩹 Fixes

- **types:** add index signatures to rule targets and update to serverRules/toolRules ([93d0393](https://github.com/genai-tools/anygpt/commit/93d0393))
- add .swcrc to resolve SWC baseUrl requirement ([487477b](https://github.com/genai-tools/anygpt/commit/487477b))
- resolve tsdown DTS generation by fixing TypeScript path mappings ([f5e5781](https://github.com/genai-tools/anygpt/commit/f5e5781))
- use npm install without package-lock to workaround private registry issue ([5920055](https://github.com/genai-tools/anygpt/commit/5920055))

### 📖 Documentation

- add WIP warning banners and config merge documentation ([ca164b9](https://github.com/genai-tools/anygpt/commit/ca164b9))
- **config:** consolidate documentation into single README ([74645b2](https://github.com/genai-tools/anygpt/commit/74645b2))
- add reasoning effort levels guide and configuration examples ([ca747ef](https://github.com/genai-tools/anygpt/commit/ca747ef))
- move testing guide from root to docs/guidelines directory ([2eb4de6](https://github.com/genai-tools/anygpt/commit/2eb4de6))

### ⚠️ Breaking Changes

- **config:** Removed Codex migration support. Users should use modern factory config pattern instead.

### 🧱 Updated Dependencies

- Updated router to 0.6.0
- Updated rules to 0.3.0
- Updated types to 2.0.0
- Updated mock to 2.0.0

### ❤️ Thank You

- Petr Plenkov

# 3.0.0-beta.1 (2025-10-20)

> **⚠️ BETA RELEASE**: This is a pre-release version with major breaking changes. Please test thoroughly before using in production. Report issues on GitHub.

### 🚀 Features

- **config:** Complete API refactor - simplified from 4 functions to 2
- **config:** Unified type system - single `Config` type instead of 4 variants
- **config:** **NEW: Single `connector` field** - accepts `IConnector | string` (union type)
- **config:** Smart connector resolution with helpful error messages
- **config:** Package size reduced by 10% (168 kB → 161 kB)
- **config:** Type-safe design prevents using both formats simultaneously

### ⚠️ BREAKING CHANGES

#### API Simplification

- **Removed:** Legacy string-based connector format (`connector.connector`)
- **Simplified:** `connector` now accepts `IConnector | string` directly (no nested object)
- **Renamed:** `FactoryConfig` → `Config`, `FactoryProviderConfig` → `ProviderConfig`
- **Renamed:** `defineConfigs()` → `mergeConfigs()` (clearer naming)
- **Changed:** `connector` is now **required** and accepts `IConnector | string`

#### Migration Required

**Old v2.x (Still Works - Deprecated):**

```typescript
{
  providers: {
    openai: {
      connector: {
        connector: '@anygpt/openai',  // ❌ Nested format
        config: { apiKey: '...' }
      }
    }
  }
}
```

Or with direct instance:

```typescript
{
  providers: {
    openai: {
      connector: openai({ apiKey: '...' }); // ✅ This still works
    }
  }
}
```

**New v3.0 (Single Field, Union Type):**

```typescript
// TypeScript: Direct IConnector instance
import { openai } from '@anygpt/openai';

{
  providers: {
    openai: {
      connector: openai({ apiKey: '...' }); // ✅ IConnector
    }
  }
}
```

```json
// JSON/YAML: Module string
{
  "providers": {
    "openai": {
      "connector": "@anygpt/openai", // ✅ string
      "config": { "apiKey": "..." }
    }
  }
}
```

**Key change:** `connector` field now accepts **both formats** via union type `IConnector | string`.

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
