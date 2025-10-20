# Config API Migration Guide

## Overview

The config API has been **completely refactored** to eliminate complexity and provide a clean, unified interface.

## What Changed

### Before (Complicated)

- 4 different functions: `defineConfig`, `defineConfigs`, `mergeConfigs`, `config`
- 4 different types: `AnyGPTConfig`, `FactoryConfig`, `ConfigWithPlugins`, `FactoryConfigWithPlugins`
- Two parallel config systems (legacy vs factory)
- Type incompatibility issues

### After (Simple)

- **2 functions**: `defineConfig`, `mergeConfigs`
- **1 type**: `Config`
- One unified config format
- No type incompatibility

## Migration Steps

### 1. Update Imports

**Before:**

```typescript
import { config, defineConfigs } from '@anygpt/config';
import type { FactoryProviderConfig } from '@anygpt/config';
```

**After:**

```typescript
import { mergeConfigs } from '@anygpt/config';
import type { ProviderConfig } from '@anygpt/config';
```

### 2. Update Type Annotations

**Before:**

```typescript
import type { FactoryProviderConfig } from '@anygpt/config';

export const myProvider: FactoryProviderConfig = {
  connector: openai({ ... })
};
```

**After:**

```typescript
import type { ProviderConfig } from '@anygpt/config';

export const myProvider: ProviderConfig = {
  connector: openai({ ... })
};
```

### 3. Update Config Files

**Before:**

```typescript
import { config, mergeConfigs } from '@anygpt/config';

export default mergeConfigs(
  config({
    providers: { ... }
  }),
  dockerMcpGateway
);
```

**After:**

```typescript
import { mergeConfigs } from '@anygpt/config';

export default mergeConfigs(
  {
    providers: { ... }
  },
  dockerMcpGateway
);
```

### 4. Remove Legacy Format

**Before (Legacy - NOT SUPPORTED):**

```typescript
{
  providers: {
    openai: {
      connector: {
        connector: '@anygpt/openai',  // ❌ String reference
        config: { apiKey: '...' }
      }
    }
  }
}
```

**After (Factory - ONLY SUPPORTED):**

```typescript
import { openai } from '@anygpt/openai';

{
  providers: {
    openai: {
      connector: openai({ apiKey: '...' }); // ✅ IConnector instance
    }
  }
}
```

## Type Mapping

| Old Type                   | New Type         | Notes                |
| -------------------------- | ---------------- | -------------------- |
| `FactoryConfig`            | `Config`         | Unified type         |
| `FactoryProviderConfig`    | `ProviderConfig` | Simplified name      |
| `ConfigWithPlugins`        | `Config`         | Merged into one      |
| `FactoryConfigWithPlugins` | `Config`         | Merged into one      |
| `AnyGPTConfig`             | ❌ Removed       | Use `Config` instead |

## Function Mapping

| Old Function           | New Function     | Notes                         |
| ---------------------- | ---------------- | ----------------------------- |
| `config()`             | `defineConfig()` | Renamed for clarity           |
| `defineConfig()`       | `defineConfig()` | Same name, new implementation |
| `defineConfigs()`      | `mergeConfigs()` | Renamed for clarity           |
| `mergeConfigs()` (old) | `mergeConfigs()` | Same name, new implementation |

## Breaking Changes

### 1. No More Legacy Format

The old string-based connector format is **completely removed**:

```typescript
// ❌ NO LONGER SUPPORTED
{
  connector: {
    connector: '@anygpt/openai',
    config: { ... }
  }
}

// ✅ ONLY THIS IS SUPPORTED
{
  connector: openai({ ... })
}
```

### 2. Config Structure Changes

Removed fields:

- `version` - No longer needed
- `settings.logging` - Simplified to flat settings

### 3. Type Exports

Old exports are marked as `@deprecated` and will be removed in the next major version:

- `FactoryConfig` → Use `Config`
- `FactoryProviderConfig` → Use `ProviderConfig`
- `config()` → Use `defineConfig()`

## Examples

### Single Config

**Before:**

```typescript
import { defineConfig } from '@anygpt/config';
import dockerMCP from '@anygpt/docker-mcp-plugin';

export default defineConfig({
  plugins: [dockerMCP()],
  mcpServers: { ... }
});
```

**After:**

```typescript
import { defineConfig } from '@anygpt/config';
import dockerMCP from '@anygpt/docker-mcp-plugin';

export default defineConfig({
  plugins: [dockerMCP()],
  mcpServers: { ... }
});
```

_(No change for single configs!)_

### Merged Configs

**Before:**

```typescript
import { defineConfigs, config } from '@anygpt/config';

export default defineConfigs([
  config({
    providers: { ... }
  }),
  dockerMcpGateway
]);
```

**After:**

```typescript
import { mergeConfigs } from '@anygpt/config';

export default mergeConfigs(
  {
    providers: { ... }
  },
  dockerMcpGateway
);
```

### Provider Definitions

**Before:**

```typescript
import { openai } from '@anygpt/openai';
import type { FactoryProviderConfig } from '@anygpt/config';

export const myProvider: FactoryProviderConfig = {
  name: 'My Provider',
  connector: openai({
    apiKey: process.env.OPENAI_API_KEY
  }),
  modelRules: [ ... ]
};
```

**After:**

```typescript
import { openai } from '@anygpt/openai';
import type { ProviderConfig } from '@anygpt/config';

export const myProvider: ProviderConfig = {
  name: 'My Provider',
  connector: openai({
    apiKey: process.env.OPENAI_API_KEY
  }),
  modelRules: [ ... ]
};
```

## Benefits

✅ **Simpler API** - 2 functions instead of 4  
✅ **No Type Confusion** - 1 type instead of 4  
✅ **Better DX** - Easier to learn and use  
✅ **Type Safety** - No more type incompatibility issues  
✅ **Cleaner Code** - Less boilerplate  
✅ **Future Proof** - Easier to maintain and extend

## Need Help?

If you encounter issues during migration:

1. Check this guide for common patterns
2. Review the [REFACTOR_PROPOSAL.md](./REFACTOR_PROPOSAL.md) for technical details
3. Look at examples in `/examples/` directory
4. Open an issue on GitHub

## Backward Compatibility

For a limited time, old exports are available but deprecated:

```typescript
// These work but are deprecated
import { config as defineConfig } from '@anygpt/config';
import type { FactoryConfig as Config } from '@anygpt/config';
```

**⚠️ Warning**: Deprecated exports will be removed in the next major version. Migrate as soon as possible!
