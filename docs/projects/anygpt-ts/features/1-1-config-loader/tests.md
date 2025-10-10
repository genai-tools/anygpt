# 1-1-config-loader - Test Scenarios

**Spec**: [Configuration Loader](../../../../../products/anygpt/specs/README.md#configuration-loader)  
**Design**: [design.md](./design.md)  
**Status**: ❌ Not Started

## Test Summary

- **Total Tests**: 0
- **Passing**: 0
- **Failing**: 0
- **Not Started**: 0
- **Coverage**: 0%

## Unit Tests

### ConfigSearcher

#### Test: Find config in project root
- **Given**: Config file exists at `./anygpt.config.ts`
- **When**: `findConfig()` is called
- **Then**: Returns `./anygpt.config.ts`
- **Status**: ❌
- **Implementation**: `packages/config/src/searcher.test.ts`

#### Test: Find config in private folder
- **Given**: Config file exists at `./.anygpt/anygpt.config.ts`
- **When**: `findConfig()` is called
- **Then**: Returns `./.anygpt/anygpt.config.ts` (higher priority)
- **Status**: ❌
- **Implementation**: `packages/config/src/searcher.test.ts`

#### Test: Find config in user home
- **Given**: No project config, config exists at `~/.anygpt/anygpt.config.ts`
- **When**: `findConfig()` is called
- **Then**: Returns `~/.anygpt/anygpt.config.ts`
- **Status**: ❌
- **Implementation**: `packages/config/src/searcher.test.ts`

#### Test: No config found
- **Given**: No config files exist
- **When**: `findConfig()` is called
- **Then**: Returns `null`
- **Status**: ❌
- **Implementation**: `packages/config/src/searcher.test.ts`

#### Test: Explicit config path
- **Given**: Explicit path provided: `/custom/path/config.ts`
- **When**: `findConfig(['/custom/path'])` is called
- **Then**: Returns `/custom/path/config.ts` (skips hierarchy)
- **Status**: ❌
- **Implementation**: `packages/config/src/searcher.test.ts`

### ConfigParser

#### Test: Parse JSON config
- **Given**: Valid JSON config file
- **When**: `parse('config.json')` is called
- **Then**: Returns parsed JavaScript object
- **Status**: ❌
- **Implementation**: `packages/config/src/parser.test.ts`

#### Test: Parse TypeScript config
- **Given**: Valid TypeScript config file with default export
- **When**: `parse('config.ts')` is called
- **Then**: Returns exported config object
- **Status**: ❌
- **Implementation**: `packages/config/src/parser.test.ts`

#### Test: Parse YAML config
- **Given**: Valid YAML config file
- **When**: `parse('config.yaml')` is called
- **Then**: Returns parsed JavaScript object
- **Status**: ❌
- **Implementation**: `packages/config/src/parser.test.ts`

#### Test: Invalid JSON
- **Given**: Malformed JSON file
- **When**: `parse('invalid.json')` is called
- **Then**: Throws ConfigParseError with line number
- **Status**: ❌
- **Implementation**: `packages/config/src/parser.test.ts`

#### Test: TypeScript config with syntax error
- **Given**: TypeScript file with syntax error
- **When**: `parse('invalid.ts')` is called
- **Then**: Throws ConfigParseError with error details
- **Status**: ❌
- **Implementation**: `packages/config/src/parser.test.ts`

### ConfigValidator

#### Test: Valid config
- **Given**: Config object matching schema
- **When**: `validate(config)` is called
- **Then**: Returns `{ valid: true }`
- **Status**: ❌
- **Implementation**: `packages/config/src/validator.test.ts`

#### Test: Missing providers
- **Given**: Config without providers field
- **When**: `validate(config)` is called
- **Then**: Returns `{ valid: false, errors: ['providers is required'] }`
- **Status**: ❌
- **Implementation**: `packages/config/src/validator.test.ts`

#### Test: Invalid provider config
- **Given**: Provider missing connector field
- **When**: `validate(config)` is called
- **Then**: Returns validation error for missing connector
- **Status**: ❌
- **Implementation**: `packages/config/src/validator.test.ts`

#### Test: Invalid defaults
- **Given**: Defaults references non-existent provider
- **When**: `validate(config)` is called
- **Then**: Returns error about invalid provider reference
- **Status**: ❌
- **Implementation**: `packages/config/src/validator.test.ts`

### ConnectorLoader

#### Test: Load connector from factory function
- **Given**: Connector config with factory function
- **When**: `loadConnector(config)` is called
- **Then**: Returns connector instance from factory
- **Status**: ❌
- **Implementation**: `packages/config/src/connector-loader.test.ts`

#### Test: Load connector from module path
- **Given**: Connector config with module path
- **When**: `loadConnector(config)` is called
- **Then**: Dynamically imports module and returns connector
- **Status**: ❌
- **Implementation**: `packages/config/src/connector-loader.test.ts`

#### Test: Module not found
- **Given**: Connector config with invalid module path
- **When**: `loadConnector(config)` is called
- **Then**: Throws ConnectorLoadError with module name
- **Status**: ❌
- **Implementation**: `packages/config/src/connector-loader.test.ts`

#### Test: Module doesn't export connector
- **Given**: Module exists but doesn't export connector
- **When**: `loadConnector(config)` is called
- **Then**: Throws ConnectorLoadError about missing export
- **Status**: ❌
- **Implementation**: `packages/config/src/connector-loader.test.ts`

## Integration Tests

### Full Config Loading Flow

#### Test: Load valid TypeScript config
- **Given**: Valid TypeScript config at `./anygpt.config.ts`
- **When**: `loadConfig()` is called
- **Then**: 
  - Returns LoadedConfig with parsed config
  - source is `./anygpt.config.ts`
  - connectors are loaded
- **Status**: ❌
- **Implementation**: `packages/config/src/index.test.ts`

#### Test: Load with explicit path
- **Given**: Config at custom path
- **When**: `loadConfig({ configPath: '/custom/config.ts' })` is called
- **Then**: Loads from custom path, skips search
- **Status**: ❌
- **Implementation**: `packages/config/src/index.test.ts`

#### Test: Fallback to default config
- **Given**: No config files exist
- **When**: `loadConfig()` is called
- **Then**: Returns default config with mock provider
- **Status**: ❌
- **Implementation**: `packages/config/src/index.test.ts`

#### Test: Config with multiple providers
- **Given**: Config with openai and mock providers
- **When**: `loadConfig()` is called
- **Then**: Both connectors are loaded and available
- **Status**: ❌
- **Implementation**: `packages/config/src/index.test.ts`

#### Test: Invalid config fails validation
- **Given**: Config file with invalid schema
- **When**: `loadConfig()` is called
- **Then**: Throws ConfigValidationError with details
- **Status**: ❌
- **Implementation**: `packages/config/src/index.test.ts`

## E2E Tests

### Real File System Tests

#### Test: Load from project directory
- **Given**: Real config file in test project directory
- **When**: CLI or MCP server loads config
- **Then**: Config is loaded correctly
- **Command**: 
  ```bash
  cd test-project && node -e "require('@anygpt/config').loadConfig()"
  ```
- **Expected Output**: Config object with providers
- **Exit Code**: 0
- **Status**: ❌
- **Implementation**: `e2e/config/load-config.test.ts`

#### Test: Load from user home
- **Given**: Config in `~/.anygpt/anygpt.config.ts`
- **When**: CLI loads config from directory without project config
- **Then**: User config is loaded
- **Status**: ❌
- **Implementation**: `e2e/config/user-config.test.ts`

#### Test: TypeScript config with factory
- **Given**: TypeScript config using factory functions
- **When**: Config is loaded
- **Then**: Connectors are instantiated correctly
- **Status**: ❌
- **Implementation**: `e2e/config/factory-config.test.ts`

## Error Tests

### Configuration Not Found

#### Test: No config and no default
- **Given**: No config files, default config disabled
- **When**: `loadConfig({ useDefault: false })` is called
- **Then**: Throws ConfigNotFoundError
- **Error Message**: `No configuration file found. Searched: [list of paths]`
- **Status**: ❌
- **Implementation**: `packages/config/src/index.test.ts`

### Parse Errors

#### Test: Malformed JSON
- **Given**: JSON file with syntax error
- **When**: Config is loaded
- **Then**: Throws ConfigParseError
- **Error Message**: `Failed to parse config.json: Unexpected token at line 5`
- **Status**: ❌
- **Implementation**: `packages/config/src/parser.test.ts`

### Validation Errors

#### Test: Missing required fields
- **Given**: Config without providers
- **When**: Config is loaded
- **Then**: Throws ConfigValidationError
- **Error Message**: `Configuration validation failed: providers is required`
- **Status**: ❌
- **Implementation**: `packages/config/src/validator.test.ts`

### Connector Loading Errors

#### Test: Connector module not found
- **Given**: Config references non-existent module
- **When**: Connectors are loaded
- **Then**: Throws ConnectorLoadError
- **Error Message**: `Failed to load connector '@anygpt/anthropic': Module not found`
- **Status**: ❌
- **Implementation**: `packages/config/src/connector-loader.test.ts`

## Contract Tests (Spec Compliance)

- [ ] Loads config from all specified locations in correct order
- [ ] Supports TypeScript, JSON, YAML formats
- [ ] Validates configuration schema
- [ ] Loads connectors dynamically
- [ ] Returns default config when none found
- [ ] All error messages are helpful and actionable

## Coverage Requirements

- [ ] Unit test coverage > 80%
- [ ] Integration test coverage > 70%
- [ ] All public APIs tested
- [ ] All error paths tested
- [ ] All file formats tested

## Notes

- Use temp directories for file system tests
- Mock file system for unit tests
- Test with real files for E2E tests
- Ensure tests are deterministic (no race conditions)
- Test both factory and module-based connector loading
