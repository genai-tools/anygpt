# Config API Refactor Proposal

## Problem

Current API is **overcomplicated** with too many overlapping functions and confusing type hierarchies:

### Current Mess

```typescript
// 4 different functions!
defineConfig(config: ConfigWithPlugins): ConfigWithPlugins
defineConfigs(...configs: FactoryConfigWithPlugins[]): FactoryConfigWithPlugins
mergeConfigs(...configs: AnyGPTConfig[]): AnyGPTConfig
config(config: FactoryConfig): FactoryConfig

// 4 different config types!
AnyGPTConfig          // Legacy format (ConnectorConfig objects)
FactoryConfig         // Factory format (IConnector instances)
ConfigWithPlugins     // Legacy + plugins
FactoryConfigWithPlugins // Factory + plugins
```

**Problems:**

- ❌ Can't mix `defineConfig` output with `defineConfigs` input
- ❌ Type incompatibility between factory and legacy formats
- ❌ Confusing naming (`defineConfigs` vs `mergeConfigs`)
- ❌ Two parallel config systems that don't play well together

## Solution

**Drop legacy format entirely. Keep ONLY factory format.**

### New Clean API

```typescript
// 1. Define single config (with plugins support)
defineConfig(config: Config): Config

// 2. Merge multiple configs (same type!)
mergeConfigs(...configs: Config[] | Config[][]): Config
```

### ONE Unified Config Type

```typescript
/**
 * Unified configuration format
 * - Uses IConnector instances (factory-style)
 * - Supports plugins
 * - No legacy ConnectorConfig objects
 */
export interface Config {
  // Provider configurations (factory-style only)
  providers?: Record<string, ProviderConfig>;

  // Default settings
  defaults?: {
    provider?: string;
    model?: string;
    modelRules?: ModelRule[];
  };

  // Model aliases
  aliases?: Record<string, ModelAlias>;

  // MCP servers
  mcpServers?: MCPConfig;

  // Discovery configuration
  discovery?: DiscoveryConfig;

  // Global settings
  settings?: {
    timeout?: number;
    maxRetries?: number;
    [key: string]: unknown;
  };

  // Plugins (unplugin-style)
  plugins?: Plugin[];
}

/**
 * Provider configuration (factory-style only)
 */
export interface ProviderConfig {
  name?: string;
  connector: IConnector; // ✅ Only IConnector instances
  settings?: {
    defaultModel?: string;
    [key: string]: unknown;
  };
  models?: Record<string, ModelMetadata>;
  modelRules?: ModelRule[];
  allowedModels?: string[];
}
```

## Migration Path

### Before (Current Mess)

```typescript
// Option 1: Factory style with defineConfigs
import { defineConfigs, config } from '@anygpt/config';
import { openai } from '@anygpt/openai';

export default defineConfigs([
  config({
    providers: {
      openai: {
        connector: openai({ apiKey: '...' })
      }
    }
  }),
  dockerMcpGateway  // ❌ Type error! Different format
]);

// Option 2: Legacy style with defineConfig
import { defineConfig } from '@anygpt/config';

export default defineConfig({
  providers: {
    openai: {
      connector: {
        connector: '@anygpt/openai',  // ❌ String reference
        config: { apiKey: '...' }
      }
    }
  },
  plugins: [dockerMCP()]
});

// Option 3: Mix with mergeConfigs
import { config, mergeConfigs } from '@anygpt/config';

export default mergeConfigs(
  config({ ... }),  // ❌ Need wrapper function
  dockerMcpGateway
);
```

### After (Clean & Simple)

```typescript
// Single way to do it!
import { defineConfig, mergeConfigs } from '@anygpt/config';
import { openai } from '@anygpt/openai';
import dockerMCP from '@anygpt/docker-mcp-plugin';

// Option 1: Single config
export default defineConfig({
  providers: {
    openai: {
      name: 'OpenAI',
      connector: openai({ apiKey: process.env.OPENAI_API_KEY }),
    },
  },
  plugins: [dockerMCP()],
});

// Option 2: Merge multiple configs (same type!)
export default mergeConfigs(
  {
    providers: {
      openai: {
        connector: openai({ apiKey: '...' }),
      },
    },
  },
  dockerMcpGateway // ✅ Works! Same type
);

// Option 3: Array style
export default mergeConfigs([baseConfig, overrideConfig, dockerMcpGateway]);
```

## Implementation Steps

### 1. Rename Types (Breaking Change)

```typescript
// OLD → NEW
FactoryConfig → Config
FactoryProviderConfig → ProviderConfig
FactoryConfigWithPlugins → Config (merged into one)
ConfigWithPlugins → REMOVED (legacy)
```

### 2. Simplify Functions

```typescript
// KEEP (rename)
config() → defineConfig()  // Just a type helper

// KEEP (simplify)
defineConfig() → defineConfig()  // Works with new Config type

// KEEP (simplify)
defineConfigs() → mergeConfigs()  // Rename for clarity

// KEEP (simplify)
mergeConfigs() → REMOVED (redundant with new mergeConfigs)

// REMOVE
All legacy format support
```

### 3. Update Exports

```typescript
// packages/config/src/index.ts
export { defineConfig, mergeConfigs, resolveConfig } from './config.js';

export type {
  Config,
  ProviderConfig,
  ModelRule,
  ModelAlias,
  // ... other types
} from './types.js';
```

### 4. Update Documentation

- Update all README examples
- Add migration guide
- Update package docs

## Benefits

✅ **Simplicity**: 2 functions instead of 4  
✅ **Type Safety**: No more type incompatibility issues  
✅ **Consistency**: One config format, one way to do things  
✅ **Clarity**: Clear naming (`mergeConfigs` instead of `defineConfigs`)  
✅ **Maintainability**: Less code, less confusion  
✅ **Better DX**: Easier to learn and use

## Breaking Changes

⚠️ **This is a breaking change** requiring major version bump:

1. **Remove legacy format**: No more `ConnectorConfig` objects
2. **Rename types**: `FactoryConfig` → `Config`
3. **Rename functions**: `defineConfigs` → `mergeConfigs`
4. **Remove functions**: Old `mergeConfigs`, `config()` wrapper

## Timeline

1. **Phase 1**: Create new API in parallel (1 day)
2. **Phase 2**: Update all internal usage (1 day)
3. **Phase 3**: Update documentation (1 day)
4. **Phase 4**: Deprecate old API (mark as deprecated)
5. **Phase 5**: Remove old API in next major version

## Decision

**Should we proceed with this refactor?**

- [ ] Yes, proceed with refactor
- [ ] No, keep current API
- [ ] Discuss further modifications
