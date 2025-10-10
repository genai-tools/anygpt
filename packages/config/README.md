# @anygpt/config

Shared configuration management for AnyGPT with dynamic connector loading and powerful model rules.

## Features

- **Model Rules**: Pattern-based configuration for tags, reasoning, and model enablement
- **Dynamic Connector Loading**: Load connectors on-demand via `import()`
- **Multiple Config Sources**: Support for TypeScript, JavaScript, and JSON config files
- **User Configuration**: `~/.anygpt/anygpt.config.ts` support
- **No Monster Dependencies**: CLI and MCP packages stay lean
- **Type Safety**: Full TypeScript support

## Documentation

- **[Model Rules Guide](./docs/MODEL_RULES.md)** - Comprehensive guide to pattern-based model configuration

## 🔒 Private Configuration

AnyGPT uses a **private configuration folder** that is automatically excluded from git:

```
.anygpt/
├── anygpt.config.ts    # Your private configuration
└── (other config files)
```

**This protects sensitive information** like API keys, company gateway URLs, and authentication tokens.

## Configuration Priority

The config loader searches for configuration files in this order:

1. **`./.anygpt/anygpt.config.ts`** ← **Private config** (highest priority, git-ignored)
2. **`./.anygpt/anygpt.config.js`**
3. **`./.anygpt/anygpt.config.json`**
4. `./anygpt.config.ts` ← Project root (for examples/testing)
5. `./anygpt.config.js`
6. `./anygpt.config.json`
7. `~/.anygpt/anygpt.config.ts` ← User home directory
8. `~/.anygpt/anygpt.config.js`
9. `~/.anygpt/anygpt.config.json`
10. `~/.codex/config.toml` ← Codex compatibility
11. `/etc/anygpt/anygpt.config.ts` ← System-wide
12. `/etc/anygpt/anygpt.config.js`
13. `/etc/anygpt/anygpt.config.json`
14. Built-in defaults ← Fallback (OpenAI + Mock providers)

## 🚀 Quick Start

### Step 1: Create Private Config

```bash
mkdir -p .anygpt
```

### Step 2: Factory Config (Recommended)

The modern approach using connector instances and model rules:

```typescript
import { config } from '@anygpt/config';
import { openai } from '@anygpt/openai';

export default config({
  defaults: {
    provider: 'openai',
    // Global model rules apply to all providers
    modelRules: [
      {
        pattern: [/o[13]/, /thinking/],
        tags: ['reasoning'],
        reasoning: { effort: 'medium' },
      },
      {
        pattern: [/gpt-5/, /sonnet/, /opus/],
        tags: ['premium'],
      },
    ],
  },
  providers: {
    openai: {
      name: 'OpenAI',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY,
      }),
      // Provider-specific rules
      modelRules: [
        {
          pattern: [/gpt-5/, /gpt-4/],
          enabled: true,
        },
      ],
    },
  },
});
```

See **[Model Rules Guide](./docs/MODEL_RULES.md)** for comprehensive documentation.

### Step 3: Set Environment Variables

```bash
export OPENAI_API_KEY="sk-..."
export COMPANY_AI_KEY="your-company-key"
```

### Step 4: Test Configuration

```bash
npx anygpt chat "Hello!"
```

## 📝 Configuration Examples

### Multiple Providers

```typescript
import { config, openai } from '@anygpt/config';

export default config({
  defaults: {
    provider: 'openai',
    model: 'gpt-4o',
  },
  providers: {
    openai: {
      name: 'OpenAI',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY,
      }),
    },
    'local-ollama': {
      name: 'Local Ollama',
      connector: openai({
        baseURL: 'http://localhost:11434/v1',
      }),
    },
  },
});
```

### Company Gateway

```typescript
import { config, openai } from '@anygpt/config';

export default config({
  defaults: {
    provider: 'company-gateway',
    model: 'gpt-4o',
  },
  providers: {
    'company-gateway': {
      name: 'Company AI Gateway',
      connector: openai({
        baseURL: 'https://internal-ai.company.com/v1',
        apiKey: process.env.COMPANY_AI_KEY,
      }),
    },
  },
});
```

### Legacy Config Format

<details>
<summary>Click to expand legacy format (deprecated)</summary>

```typescript
import type { AnyGPTConfig } from '@anygpt/config';

const config: AnyGPTConfig = {
  version: '1.0',

  providers: {
    'openai-main': {
      name: 'OpenAI GPT Models',
      connector: {
        connector: '@anygpt/openai',
        config: {
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: 'https://api.openai.com/v1',
        },
      },
    },
  },

  settings: {
    defaultProvider: 'openai-main',
    timeout: 30000,
  },
};

export default config;
```

</details>
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
  messages: [{ role: 'user', content: 'Hello!' }],
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
  configPath: './my-custom-config.ts',
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

## 🛡️ Security Best Practices

1. **Never commit `.anygpt/` folder** - It's already in `.gitignore`
2. **Use environment variables** for API keys
3. **Share config templates** - Not actual config files
4. **Backup configs securely** - Store encrypted backups

## 🔄 Migration from Codex

If you have an existing `~/.codex/config.toml` file:

```bash
npx anygpt migrate
```

This will convert your TOML configuration to the new TypeScript format.

## 🔧 Environment Variables

Common environment variables:

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Company gateway
export COMPANY_AI_KEY="your-company-key"

# Anthropic (if using)
export ANTHROPIC_API_KEY="sk-ant-..."
```

## 📚 Advanced Topics

### CLI Usage

```bash
# Quick chat (stateless)
npx anygpt chat "Hello!"

# Override provider
npx anygpt chat "Hello!" --provider openai

# Override model
npx anygpt chat "Hello!" --model gpt-3.5-turbo

# Conversations (stateful)
npx anygpt conversation message "Hello!"
```

### CLI Configuration Management

For detailed CLI configuration commands, see:

- **[Config Command Guide](../cli/docs/config.md)** - Configuration inspection and validation
- **[CLI Overview](../cli/docs/README.md)** - Full CLI documentation

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
