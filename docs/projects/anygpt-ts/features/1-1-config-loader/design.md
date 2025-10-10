# 1-1-config-loader - Design

**Spec**: [Configuration Loader](../../../../../products/anygpt/specs/README.md#configuration-loader)  
**Use Case**: [Flexible Configuration](../../../../../products/anygpt/use-cases/flexible-configuration.md)  
**Project**: anygpt-ts  
**Status**: 🔄 Design Phase

## Overview

Configuration loader that searches multiple locations, supports multiple formats (TypeScript, JSON, YAML), validates configuration, and dynamically loads connectors at runtime.

## Architecture

### Components

**ConfigLoader**
- **Responsibility**: Main entry point for loading configuration
- **Public API**:
  - `loadConfig(options?)` - Load configuration from hierarchy
  - `validateConfig(config)` - Validate configuration schema
- **Internal**: Orchestrates search, parse, validate, load connectors

**ConfigSearcher**
- **Responsibility**: Search for configuration files in hierarchy
- **Public API**:
  - `findConfig(searchPaths?)` - Search all locations, return first found
- **Internal**: File system operations, path resolution

**ConfigParser**
- **Responsibility**: Parse different configuration formats
- **Public API**:
  - `parse(filePath)` - Auto-detect format and parse
- **Internal**: Format-specific parsers (TS via import, JSON, YAML)

**ConfigValidator**
- **Responsibility**: Validate configuration against schema
- **Public API**:
  - `validate(config)` - Validate, return errors if invalid
- **Internal**: Zod schema validation

**ConnectorLoader**
- **Responsibility**: Dynamically load connector modules
- **Public API**:
  - `loadConnector(connectorConfig)` - Load and instantiate connector
- **Internal**: Dynamic import, factory function execution

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

**Configuration Search Algorithm**:
1. If explicit path provided, use it
2. Otherwise search in order:
   - `./.anygpt/anygpt.config.ts` (private project)
   - `./anygpt.config.ts` (project root)
   - `./anygpt.config.js`
   - `./anygpt.config.json`
   - `~/.anygpt/anygpt.config.ts` (user home)
   - `~/.anygpt/anygpt.config.js`
   - `~/.anygpt/anygpt.config.json`
3. Return first found file
4. If none found, return default config (mock provider)

**Format Detection**:
- `.ts`, `.js`, `.mjs` → Dynamic import
- `.json` → JSON.parse
- `.yaml`, `.yml` → YAML parser

**Connector Loading**:
1. Check if factory function provided → use directly
2. Otherwise, check if module path provided → dynamic import
3. Instantiate connector with config
4. Return connector instance

## Dependencies

### Internal Dependencies
- `@anygpt/types` - Type definitions

### External Dependencies
- `zod` - Schema validation
- `yaml` - YAML parsing
- `cosmiconfig` or custom search logic

## Interfaces

### Public API

```typescript
// Main entry point
export async function loadConfig(
  options?: LoadConfigOptions
): Promise<LoadedConfig>

export function validateConfig(
  config: unknown
): config is AnyGPTConfig

// Options
interface LoadConfigOptions {
  configPath?: string;      // Explicit config file
  searchPaths?: string[];   // Custom search paths
  skipValidation?: boolean; // Skip validation (dangerous)
}

// Result
interface LoadedConfig {
  config: AnyGPTConfig;
  source: string;           // Which file was loaded
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

### Error Types
- **ConfigNotFoundError**: No configuration file found
- **ConfigParseError**: Failed to parse configuration file
- **ConfigValidationError**: Configuration doesn't match schema
- **ConnectorLoadError**: Failed to load connector module

### Error Flow
1. Search errors → ConfigNotFoundError (or use default)
2. Parse errors → ConfigParseError with file path and reason
3. Validation errors → ConfigValidationError with detailed messages
4. Connector errors → ConnectorLoadError with module name and reason

All errors include:
- Clear message
- File path (if applicable)
- Suggestions for fixing

## Implementation Strategy

### Phase 1: Basic Loading
- [ ] Implement ConfigSearcher (file system search)
- [ ] Implement ConfigParser (JSON only initially)
- [ ] Implement basic validation
- [ ] Return parsed config

### Phase 2: Format Support
- [ ] Add TypeScript config support (dynamic import)
- [ ] Add YAML support
- [ ] Add format auto-detection

### Phase 3: Connector Loading
- [ ] Implement ConnectorLoader
- [ ] Support factory functions
- [ ] Support dynamic module loading
- [ ] Return loaded connectors

### Phase 4: Error Handling
- [ ] Add custom error types
- [ ] Add helpful error messages
- [ ] Add error recovery (default config)

## Open Questions

- [ ] Use cosmiconfig or custom search logic?
- [ ] How to handle TypeScript config compilation?
- [ ] Should we cache loaded configuration?
- [ ] How to handle configuration reloading?

## References

- **Spec**: [Configuration Loader](../../../../../products/anygpt/specs/README.md#configuration-loader)
- **Use Case**: [Flexible Configuration](../../../../../products/anygpt/use-cases/flexible-configuration.md)
- **Architecture**: [../../architecture.md](../../architecture.md)
- **Types Package**: `packages/types/`
