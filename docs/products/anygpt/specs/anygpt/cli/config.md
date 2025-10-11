# Config Command Specification

**Related Use Case**: [Flexible Configuration](../../use-cases/flexible-configuration.md)

Configuration inspection and validation.

## Command Syntax

```bash
anygpt config <subcommand> [options]
```

## Subcommands

### `show`
Display current configuration.

**Syntax**: `anygpt config show`

**Output**:
```
Configuration loaded from: ./.anygpt/anygpt.config.ts

Providers:
  openai:
    Model: gpt-4o
    Base URL: https://api.openai.com/v1
    Status: ✓ Configured
  
  anthropic:
    Model: claude-sonnet-4
    Status: ✓ Configured

Defaults:
  Provider: openai
  Model: gpt-4o
```

### `validate`
Validate configuration file.

**Syntax**: `anygpt config validate [<path>]`

**Example**:
```bash
anygpt config validate ./anygpt.config.ts
```

**Output (Success)**:
```
✓ Configuration is valid

Providers: 2
Defaults: configured
```

**Output (Error)**:
```
✗ Configuration error

Provider 'openai' is missing required field: apiKey

Line 5: providers.openai
```

### `list`
List all configuration file locations.

**Syntax**: `anygpt config list`

**Output**:
```
Configuration search order:

1. ./.anygpt/anygpt.config.ts (not found)
2. ./anygpt.config.ts (✓ found)
3. ~/.anygpt/anygpt.config.ts (not found)
4. Built-in defaults

Active: ./anygpt.config.ts
```

## Exit Codes

- `0`: Success
- `1`: Invalid arguments
- `2`: Configuration file not found
- `3`: Configuration validation error

## Behavior

### Configuration Search Order
1. `./.anygpt/anygpt.config.ts` (private project config)
2. `./anygpt.config.ts` (project root)
3. `~/.anygpt/anygpt.config.ts` (user home)
4. Built-in defaults (mock provider)

First found configuration is used.

### Validation
Configuration must define:
- At least one provider
- Provider connection details (API key, base URL, etc.)
- Optional: default provider and model

## Configuration File Format

Configuration files define providers and defaults. Exact format depends on implementation language.

### Required Fields

**Provider Configuration**:
- Provider name (identifier)
- Connection details (API endpoint, authentication)
- Model selection

**Example Structure** (language-agnostic):
```yaml
defaults:
  provider: openai
  model: gpt-4o

providers:
  openai:
    apiKey: ${OPENAI_API_KEY}
    baseURL: https://api.openai.com/v1
  
  anthropic:
    apiKey: ${ANTHROPIC_API_KEY}
```

## Examples

### Show Current Config
```bash
anygpt config show
```

### Validate Config File
```bash
anygpt config validate
```

### List All Config Locations
```bash
anygpt config list
