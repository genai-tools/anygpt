# 1-1-config-loader - Design

**Spec**: [Configuration Loader](../../../../../products/anygpt/specs/README.md#configuration-loader)  
**Use Case**: [Flexible Configuration](../../../../../products/anygpt/use-cases/flexible-configuration.md)  
**Project**: anygpt-ts  
**Status**: ✅ Implemented (80% complete)  
**Last Updated**: 2025-10-10

## Overview

Configuration loader that searches multiple locations, supports multiple formats (TypeScript, JavaScript, JSON), validates configuration, and dynamically loads connectors at runtime.

**Implementation**: `packages/config/src/`  
**Package**: `@anygpt/config`

## Architecture

### Core Components (Implemented)

**loader.ts** - Configuration Loading

- ✅ `loadConfig(options?)` - Load configuration from hierarchy
- ✅ `validateConfig(config)` - Basic validation (checks providers exist)
- ✅ `findConfigFile()` - Search all locations, return first found
- ✅ `loadConfigFile(path)` - Parse file based on extension
- ✅ `loadTSConfig(path)` - TypeScript/JavaScript via jiti (Node.js 22+ native support)
- ✅ `loadJSONConfig(path)` - JSON.parse
- ✅ `resolvePath(path)` - Tilde expansion
- ✅ `mergeConfigs()` - Deep merge with defaults

**connector-loader.ts** - Dynamic Connector Loading

- ✅ `loadConnectors(router, config)` - Load all connectors in parallel
- ✅ `loadConnectorFactory(packageName)` - Dynamic import with caching
- ✅ `getConnectorConfig(config, providerId)` - Extract connector config
- ✅ `clearConnectorCache()` - Testing utility
- ✅ Connector caching for performance
- ✅ Multiple export patterns supported (default, named)

**defaults.ts** - Default Configuration

- ✅ `getDefaultConfig()` - Returns default config (OpenAI + Mock)
- ✅ Smart provider selection (OpenAI if API key, else Mock)

**setup.ts** - Convenience Utilities

- ✅ `setupRouter(options?)` - Load config + create router + register connectors
- ✅ `setupRouterFromFactory(factoryConfig)` - Factory config support
- ✅ Logger injection support
- ✅ Automatic connector registration

### Bonus Components (Not in Original Design)

**factory.ts** - Factory Config Pattern

- ✅ `config(factoryConfig)` - Type-safe factory function
- ✅ Direct connector instance support
- ✅ Model rules, reasoning config, tags

**model-pattern-resolver.ts** - Pattern-Based Model Configuration

- ✅ `resolveModelConfig()` - Apply rules to models
- ✅ Glob pattern matching
- ✅ Regex pattern matching
- ✅ Rule priority (provider > global)
- ✅ Tag assignment, reasoning config, model filtering

**model-resolver.ts** - Model Resolution

- ✅ `resolveModel()` - Resolve by tag, alias, or direct name
- ✅ `findModelByTag()` - Find models with specific tag
- ✅ `listAvailableTags()` - List all available tags

**tag-registry.ts** - Tag Registry

- ✅ `buildTagRegistry()` - Pre-compute tag mappings
- ✅ Performance optimization for tag lookups

**glob-matcher.ts** - Glob Pattern Matching

- ✅ `matchesGlobPatterns()` - Match model IDs against patterns
- ✅ Wildcard support (\*, \*\*, ?, [abc], {a,b,c})
- ✅ Negation support (!pattern)

### Data Structures

Uses types from `@anygpt/types` package:

```typescript
// From types package
interface AnyGPTConfig {
  defaults?: {
    provider?: string;
    model?: string;
  };
  providers: Record<string, ProviderConfig>;
}

interface ProviderConfig {
  connector: ConnectorConfig;
  models?: string[];
  baseURL?: string;
  apiKey?: string;
}

interface ConnectorConfig {
  // Factory function (preferred)
  factory?: ConnectorFactory;

  // Or module path (dynamic loading)
  module?: string;
  config?: Record<string, unknown>;
}
```

### Algorithms

**Configuration Search Algorithm** (Implemented):

1. If explicit path provided, use it
2. Otherwise search in order (12 locations):
   - `./.anygpt/anygpt.config.ts` (private project, git-ignored)
   - `./.anygpt/anygpt.config.js`
   - `./.anygpt/anygpt.config.json`
   - `./anygpt.config.ts` (project root, for examples)
   - `./anygpt.config.js`
   - `./anygpt.config.json`
   - `~/.anygpt/anygpt.config.ts` (user home)
   - `~/.anygpt/anygpt.config.js`
   - `~/.anygpt/anygpt.config.json`
   - `/etc/anygpt/anygpt.config.ts` (system-wide)
   - `/etc/anygpt/anygpt.config.js`
   - `/etc/anygpt/anygpt.config.json`
3. Return first found file
4. If none found, return default config (OpenAI + Mock)

**Format Detection** (Implemented):

- `.ts`, `.js`, `.mjs` → jiti with tryNative (Node.js 22+ native TS support)
- `.json` → JSON.parse
- ~~`.yaml`, `.yml`~~ → Not implemented (dropped)

**Connector Loading** (Implemented):

1. Factory config: Direct connector instance → use as-is
2. Legacy config: Module path → dynamic import
3. Try default export, then named exports ending with 'Factory'
4. Instantiate factory, validate interface (getProviderId, create)
5. Cache factory for performance
6. Register with router

## Dependencies

### Internal Dependencies

- ✅ `@anygpt/types` - Type definitions
- ✅ `@anygpt/router` - Router for connector registration

### External Dependencies

- ✅ `jiti` - TypeScript/JavaScript loading with Node.js 22+ native support
- ❌ ~~`zod`~~ - Dropped (using basic validation)
- ❌ ~~`yaml`~~ - Dropped (not needed)
- ❌ ~~`cosmiconfig`~~ - Custom search logic implemented

## Interfaces

### Public API

```typescript
// Main entry point
export async function loadConfig(
  options?: LoadConfigOptions
): Promise<LoadedConfig>;

export function validateConfig(config: unknown): config is AnyGPTConfig;

// Options
interface LoadConfigOptions {
  configPath?: string; // Explicit config file
  searchPaths?: string[]; // Custom search paths
  skipValidation?: boolean; // Skip validation (dangerous)
}

// Result
interface LoadedConfig {
  config: AnyGPTConfig;
  source: string; // Which file was loaded
  connectors: Map<string, Connector>;
}
```

### Internal APIs

```typescript
// ConfigSearcher
interface ConfigSearcher {
  findConfig(searchPaths?: string[]): Promise<string | null>;
}

// ConfigParser
interface ConfigParser {
  parse(filePath: string): Promise<unknown>;
}

// ConfigValidator
interface ConfigValidator {
  validate(config: unknown): ValidationResult;
}

// ConnectorLoader
interface ConnectorLoader {
  loadConnector(config: ConnectorConfig): Promise<Connector>;
}
```

## Error Handling

### Error Types (TODO)

- ❌ **ConfigNotFoundError**: No configuration file found (TODO)
- ❌ **ConfigParseError**: Failed to parse configuration file (TODO)
- ❌ **ConfigValidationError**: Configuration doesn't match schema (TODO)
- ❌ **ConnectorLoadError**: Failed to load connector module (TODO)

**Current**: Using generic `Error` with descriptive messages

### Error Flow (Implemented)

1. Search errors → Returns default config (no error thrown)
2. Parse errors → Generic Error with file path and reason
3. Validation errors → Generic Error with validation details
4. Connector errors → Generic Error with module name and reason

All errors include:

- ✅ Clear message
- ✅ File path (if applicable)
- ⚠️ Suggestions for fixing (partial)

**Next Step**: Implement custom error types in `errors.ts`

## Implementation Strategy

### Phase 1: Basic Loading ✅

- [x] Implement ConfigSearcher (file system search) - `loader.ts`
- [x] Implement ConfigParser (JSON, TS/JS, TOML) - `loader.ts`
- [x] Implement basic validation - `loader.ts:validateConfig()`
- [x] Return parsed config

### Phase 2: Format Support ✅

- [x] Add TypeScript config support (jiti with tryNative) - `loader.ts:loadTSConfig()`
- [x] Add format auto-detection - `loader.ts:loadConfigFile()`
- ~~Add YAML support~~ - Dropped

### Phase 3: Connector Loading ✅

- [x] Implement ConnectorLoader - `connector-loader.ts`
- [x] Support factory functions - Factory config pattern
- [x] Support dynamic module loading - Dynamic import with caching
- [x] Return loaded connectors - Via setupRouter

### Phase 4: Error Handling ⚠️

- [ ] Add custom error types - **TODO**
- [x] Add helpful error messages - Partial
- [x] Add error recovery (default config) - `defaults.ts`

## Implementation Decisions

- ✅ **Search logic**: Custom implementation (no cosmiconfig)
- ✅ **TypeScript compilation**: jiti with tryNative (Node.js 22+ native support)
- ✅ **Caching**: Connector factories cached, config not cached
- ❌ **Configuration reloading**: Not implemented (restart required)

## Remaining Work

### Critical

1. **Custom Error Types** (2-3 hours)

   - Create `errors.ts` with 4 error classes
   - Update all throw sites

2. **Test Coverage** (6-8 hours)
   - Expand `loader.test.ts`
   - Create `connector-loader.test.ts`
   - Add integration tests
   - Target: >60% coverage (currently 21%)

### Optional

- Zod validation (dropped)
- YAML support (dropped)
- Configuration reloading
- E2E tests

## References

- **Spec**: [Configuration Loader](../../../../../products/anygpt/specs/README.md#configuration-loader)
- **Use Case**: [Flexible Configuration](../../../../../products/anygpt/use-cases/flexible-configuration.md)
- **Architecture**: [../../architecture.md](../../architecture.md)
- **Types Package**: `packages/types/`
