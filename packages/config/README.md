# @anygpt/config

Shared configuration management for AnyGPT with dynamic connector loading.

## Features

- **Dynamic Connector Loading**: Load connectors on-demand via `import()`
- **Multiple Config Sources**: Support for TypeScript, JavaScript, and JSON config files
- **User Configuration**: `~/.anygpt/anygpt.config.ts` support
- **No Monster Dependencies**: CLI and MCP packages stay lean
- **Type Safety**: Full TypeScript support

## Configuration Locations

The config loader searches for configuration files in this order:

1. `./anygpt.config.ts` (current directory)
2. `./anygpt.config.js`
3. `./anygpt.config.json`
4. `~/.anygpt/anygpt.config.ts` (user home)
5. `~/.anygpt/anygpt.config.js`
6. `~/.anygpt/anygpt.config.json`
7. `/etc/anygpt/anygpt.config.ts` (system-wide)
8. `/etc/anygpt/anygpt.config.js`
9. `/etc/anygpt/anygpt.config.json`

## Configuration Format

```typescript
import type { AnyGPTConfig } from '@anygpt/config';

const config: AnyGPTConfig = {
  version: '1.0',
  
  providers: {
    'openai-main': {
      name: 'OpenAI GPT Models',
      connector: {
        connector: '@anygpt/openai',  // Package to dynamically import
        config: {
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: 'https://api.openai.com/v1'
        }
      }
    },
    
    'ollama-local': {
      name: 'Local Ollama',
      connector: {
        connector: '@anygpt/openai',  // Same connector, different config
        config: {
          baseURL: 'http://localhost:11434/v1'
        }
      }
    }
  },
  
  settings: {
    defaultProvider: 'openai-main',
    timeout: 30000
  }
};

export default config;
```

## Usage

### Simple Setup

```typescript
import { setupRouter } from '@anygpt/config';

// Automatically loads config and sets up router with connectors
const { router, config } = await setupRouter();

// Use the router
const response = await router.chatCompletion({
  provider: 'openai-main',
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### Manual Setup

```typescript
import { loadConfig, loadConnectors } from '@anygpt/config';
import { GenAIRouter } from '@anygpt/router';

// Load configuration
const config = await loadConfig();

// Create router
const router = new GenAIRouter();

// Dynamically load and register connectors
await loadConnectors(router, config);
```

### Custom Config Path

```typescript
import { setupRouter } from '@anygpt/config';

const { router, config } = await setupRouter({
  configPath: './my-custom-config.ts'
});
```

## Dynamic Connector Loading

The key innovation is that connectors are loaded dynamically:

```typescript
// Instead of hardcoding imports like this:
import { OpenAIConnectorFactory } from '@anygpt/openai';
router.registerConnector(new OpenAIConnectorFactory());

// Connectors are loaded dynamically based on config:
{
  "connector": "@anygpt/openai"  // This package is imported at runtime
}
```

This means:
- **CLI doesn't depend on specific connectors** - stays lightweight
- **MCP doesn't depend on specific connectors** - stays lightweight  
- **Users choose which connectors to install** - `npm install @anygpt/openai`
- **New connectors can be added** without touching CLI/MCP code

## Benefits

1. **No Monster Packages**: CLI and MCP stay focused and lightweight
2. **User Choice**: Install only the connectors you need
3. **Extensibility**: Easy to add new AI providers without code changes
4. **Configuration-Driven**: Everything controlled via config files
5. **Type Safety**: Full TypeScript support with proper types

## Connector Requirements

Connectors must export a factory that implements `ConnectorFactory`:

```typescript
export class OpenAIConnectorFactory implements ConnectorFactory {
  getProviderId(): string {
    return 'openai';
  }

  create(config: ConnectorConfig): IConnector {
    return new OpenAIConnector(config);
  }
}

// Export as default or named export
export default OpenAIConnectorFactory;
```
