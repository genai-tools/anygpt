# Config Command Specification

**RFC**: Configuration Management and Inspection System  
**Status**: Implemented  
**Version**: 1.0

## Abstract

The Config command provides configuration inspection, validation, and management capabilities for the AnyGPT CLI. It supports multiple configuration sources, TypeScript-based configuration, and export/import functionality.

## Motivation

Configuration management requires:
- **Multi-source loading**: Support for various configuration formats and locations
- **Inspection capabilities**: Understanding current configuration state
- **Validation**: Ensuring configuration correctness and completeness
- **TypeScript integration**: Modern configuration with type safety and IDE support
- **Export/sharing**: Template creation and team collaboration

## Design Principles

### 1. Configuration Hierarchy
Clear precedence order for configuration sources:
1. Command-line specified config
2. Private project config (`.anygpt/`)
3. Project root config
4. User home config
5. Legacy compatibility config
6. Built-in defaults

### 2. TypeScript-First Approach
- **Type safety**: Compile-time configuration validation
- **IDE support**: IntelliSense and autocomplete for configuration
- **Modern JavaScript**: ES modules, environment integration, dynamic configuration

### 3. Inspection and Debugging
- **Transparent loading**: Clear indication of which configuration source is used
- **Validation feedback**: Detailed error messages for configuration issues
- **Export capabilities**: Configuration sharing and template creation

## Configuration Architecture

### Source Priority System
```
CLI Parameter (--config) 
    ↓ (if not found)
./.anygpt/anygpt.config.ts (Private)
    ↓ (if not found)
./anygpt.config.ts (Project)
    ↓ (if not found)
~/.anygpt/anygpt.config.ts (User)
    ↓ (if not found)
~/.codex/config.toml (Legacy)
    ↓ (if not found)
Built-in Defaults (Mock provider)
```

### Configuration Formats

#### Factory Configuration (Preferred)
```typescript
import { config, openai } from '@anygpt/config';

export default config({
  defaults: { provider: 'openai', model: 'gpt-4o' },
  providers: {
    openai: {
      connector: openai({ apiKey: process.env.OPENAI_API_KEY })
    }
  }
});
```

#### Standard Configuration
```typescript
import type { AnyGPTConfig } from '@anygpt/config';

const config: AnyGPTConfig = {
  providers: {
    openai: {
      connector: {
        connector: '@anygpt/openai',
        config: { apiKey: process.env.OPENAI_API_KEY }
      }
    }
  }
};
```

## Interface Specification

### Command Structure
```
anygpt config [options]
```

### Options
- `--json`: Output configuration as JSON for machine processing
- `--config <path>`: Specify alternative configuration file

### Output Formats

#### Human-Readable Format
```
📋 AnyGPT Configuration
══════════════════════════════════════════════════
📁 Source: ./.anygpt/anygpt.config.ts

├─ defaults:
│  ├─ provider: openai
│  ├─ model: gpt-4o
├─ providers:
│  ├─ openai:
│  │  ├─ name: OpenAI
│  │  ├─ connector: [Factory Instance]
```

#### JSON Format
```json
{
  "defaults": {
    "provider": "openai",
    "model": "gpt-4o"
  },
  "providers": {
    "openai": {
      "name": "OpenAI",
      "connector": { "type": "@anygpt/openai" }
    }
  }
}
```

## TypeScript Configuration Benefits

### 1. Type Safety
- **Compile-time validation**: Configuration errors caught before runtime
- **IntelliSense support**: IDE autocomplete and validation
- **Refactoring safety**: Type-safe configuration updates

### 2. Modern JavaScript Features
- **ES Modules**: Import/export syntax for configuration composition
- **Environment integration**: `process.env` with type safety
- **Dynamic configuration**: Conditional configuration based on environment
- **Async configuration**: Support for asynchronous configuration loading

### 3. Node.js Integration
- **Version compatibility**: Leverages modern Node.js features (14+)
- **Optional chaining**: Safe property access (`?.`)
- **Nullish coalescing**: Default value handling (`??`)
- **Template literals**: Dynamic string construction

## Configuration Loading Algorithm

### 1. Source Discovery
```typescript
async function discoverConfiguration(explicitPath?: string): Promise<ConfigSource> {
  if (explicitPath) return loadExplicitConfig(explicitPath);
  
  const sources = [
    './.anygpt/anygpt.config.ts',
    './anygpt.config.ts', 
    '~/.anygpt/anygpt.config.ts',
    '~/.codex/config.toml'
  ];
  
  for (const source of sources) {
    if (await exists(source)) return loadConfig(source);
  }
  
  return getBuiltinDefaults();
}
```

### 2. Format Detection
- **TypeScript/JavaScript**: `.ts`, `.js`, `.mjs` extensions
- **JSON**: `.json` extension with import assertion
- **TOML**: `.toml` extension (legacy Codex compatibility)

### 3. Validation Pipeline
1. **Syntax validation**: Ensure configuration file is valid
2. **Schema validation**: Verify required fields and types
3. **Provider validation**: Check provider connector availability
4. **Environment validation**: Verify required environment variables

## Export and Sharing Capabilities

### Configuration Templates
```typescript
// Export current config as template
const template = {
  defaults: { provider: 'PROVIDER_NAME', model: 'MODEL_NAME' },
  providers: {
    PROVIDER_NAME: {
      connector: openai({
        apiKey: 'REPLACE_WITH_YOUR_API_KEY',
        baseURL: 'REPLACE_WITH_YOUR_ENDPOINT'
      })
    }
  }
};
```

### Environment-Specific Configuration
```typescript
const environment = process.env.NODE_ENV || 'development';

const configurations = {
  development: { /* dev config */ },
  staging: { /* staging config */ },
  production: { /* prod config */ }
};

export default config(configurations[environment]);
```

## Security Considerations

### Credential Management
- **Environment variables**: Preferred method for API keys
- **File permissions**: Secure configuration file access
- **Git exclusion**: `.anygpt/` directory automatically ignored

### Configuration Validation
- **Input sanitization**: Safe handling of configuration values
- **Path validation**: Secure file path resolution
- **Environment isolation**: Separate configuration contexts

## Error Handling Specification

### Configuration Loading Errors
- **File not found**: Clear guidance on configuration setup
- **Syntax errors**: Detailed error messages with line numbers
- **Type errors**: TypeScript compilation error reporting
- **Missing dependencies**: Clear indication of required packages

### Runtime Validation Errors
- **Missing providers**: Guidance on provider configuration
- **Invalid credentials**: Environment variable setup instructions
- **Network issues**: Connection troubleshooting guidance

## Integration Points

### CLI Command Integration
- **Shared configuration**: All CLI commands use same configuration system
- **Override support**: Command-line parameter overrides
- **Consistent behavior**: Unified configuration handling across commands

### Development Workflow
- **Configuration testing**: Validation before deployment
- **Template sharing**: Team configuration standardization
- **Environment management**: Development/staging/production configurations

## Performance Characteristics

### Loading Performance
- **Caching**: Configuration caching for repeated access
- **Lazy loading**: On-demand configuration resolution
- **Parallel loading**: Concurrent configuration source checking

### Memory Usage
- **Efficient storage**: Minimal memory footprint for configuration
- **Garbage collection**: Automatic cleanup of unused configuration data
- **Shared instances**: Configuration sharing across CLI operations

## Future Considerations

### Planned Enhancements
- **Configuration validation service**: Real-time configuration checking
- **Interactive configuration**: Guided configuration setup
- **Configuration migration**: Automated configuration updates
- **Team configuration**: Shared team configuration management

### Extensibility Points
- **Custom configuration sources**: Plugin-based configuration loading
- **Configuration transformers**: Custom configuration processing
- **Validation plugins**: Extensible validation system
- **Export formats**: Additional export format support

## Testing Strategy

### Unit Testing
- Configuration loading from various sources
- TypeScript configuration compilation
- Validation logic and error handling
- Export and template generation

### Integration Testing
- End-to-end configuration loading
- CLI command integration with configuration
- Environment-specific configuration testing
- Cross-platform configuration compatibility

### Security Testing
- Configuration file permission validation
- Credential handling security
- Path traversal prevention
- Environment variable isolation
