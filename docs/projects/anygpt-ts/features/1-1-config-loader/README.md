# Configuration Loader

| | |
|---|---|
| **Status** | ❌ Not Started |
| **Progress** | 0/24 tasks |
| **Spec** | [Configuration Loader](../../../../products/anygpt/specs/README.md#configuration-loader) |
| **Use Case** | [Flexible Configuration](../../../../products/anygpt/cases/flexible-configuration.md) |
| **Architecture** | [System Design](../../architecture.md) |
| **Roadmap** | [Feature List](../../roadmap.md) |

---

## Overview

Configuration loader that searches multiple locations, supports multiple formats (TypeScript, JSON, YAML), validates configuration, and dynamically loads connectors at runtime.

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Setup - Creating package structure

### Recent Updates
- 2025-01-10: Created feature documentation, ready to start

### Blockers
None

## Implementation Plan

### Setup
- [ ] Create config package structure (`packages/config/`)
- [ ] Install dependencies (zod, yaml parser, @anygpt/types)
- [ ] Setup test infrastructure (Vitest)

### Phase 1: Basic Loading
- [ ] Implement ConfigSearcher (file system search, path resolution)
- [ ] Write ConfigSearcher tests
- [ ] Implement ConfigParser (JSON only initially)
- [ ] Write ConfigParser tests
- [ ] Implement ConfigValidator (Zod schema)
- [ ] Write ConfigValidator tests
- [ ] Implement basic loadConfig (orchestrate search → parse → validate)
- [ ] Write integration tests

### Phase 2: Format Support
- [ ] Add TypeScript config support (dynamic import)
- [ ] Write TypeScript config tests
- [ ] Add YAML config support
- [ ] Write YAML config tests

### Phase 3: Connector Loading
- [ ] Implement ConnectorLoader (factory functions, dynamic loading)
- [ ] Write ConnectorLoader tests
- [ ] Integrate connector loading into loadConfig
- [ ] Write integration tests with connectors

### Phase 4: Error Handling
- [ ] Create custom error types (ConfigNotFoundError, ConfigParseError, etc.)
- [ ] Add helpful error messages
- [ ] Implement default config fallback
- [ ] Write error handling tests

### Documentation
- [ ] Write API documentation (JSDoc, README, examples)

## Technical Design

### Components

**ConfigLoader** - Main entry point
- `loadConfig(options?)` - Load configuration from hierarchy
- `validateConfig(config)` - Validate configuration schema

**ConfigSearcher** - Search for configuration files
- Searches: `./.anygpt/`, `./`, `~/.anygpt/`
- Supports: `.ts`, `.js`, `.json`, `.yaml`

**ConfigParser** - Parse different formats
- Auto-detects format by extension
- Dynamic import for TS/JS, JSON.parse, YAML parser

**ConfigValidator** - Validate with Zod
- Schema validation
- Detailed error messages

**ConnectorLoader** - Load connector modules
- Factory functions (preferred)
- Dynamic module loading

### Data Structures

```typescript
interface AnyGPTConfig {
  defaults?: {
    provider?: string;
    model?: string;
  };
  providers: Record<string, ProviderConfig>;
}

interface LoadedConfig {
  config: AnyGPTConfig;
  source: string;
  connectors: Map<string, Connector>;
}
```

### Search Algorithm

1. If explicit path provided, use it
2. Otherwise search in order:
   - `./.anygpt/anygpt.config.ts` (private project)
   - `./anygpt.config.ts` (project root)
   - `./anygpt.config.json`
   - `~/.anygpt/anygpt.config.ts` (user home)
3. Return first found
4. If none found, return default config

## Tests

### Unit Tests

**ConfigSearcher**
- ✓ Find config in project root
- ✓ Find config in private folder (higher priority)
- ✓ Find config in user home
- ✓ No config found returns null
- ✓ Explicit config path skips hierarchy

**ConfigParser**
- ✓ Parse TypeScript config (dynamic import)
- ✓ Parse JSON config
- ✓ Parse YAML config
- ✓ Handle parse errors with helpful messages

**ConfigValidator**
- ✓ Valid config passes
- ✓ Invalid config returns detailed errors
- ✓ Missing required fields caught
- ✓ Type mismatches caught

**ConnectorLoader**
- ✓ Load connector from factory function
- ✓ Load connector from module path
- ✓ Handle load errors

### Integration Tests
- ✓ Load config from TypeScript file
- ✓ Load config from JSON file
- ✓ Load config with connectors
- ✓ Fallback to default config when not found
- ✓ All error types work correctly

### Coverage
- Target: >80% unit test coverage
- Target: >70% integration test coverage

## Dependencies

**Internal**: `@anygpt/types`  
**External**: `zod`, `yaml`

## Error Handling

- **ConfigNotFoundError**: No configuration file found
- **ConfigParseError**: Failed to parse file
- **ConfigValidationError**: Schema validation failed
- **ConnectorLoadError**: Failed to load connector

All errors include clear messages and suggestions for fixing.

