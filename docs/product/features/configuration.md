# AnyGPT Configuration Guide

## 🔒 Private Configuration Location

AnyGPT uses a **private configuration folder** that is excluded from git:

```
.anygpt/
├── anygpt.config.ts    # Your private configuration
└── (other config files)
```

**This folder is automatically excluded from git** to protect sensitive information like:
- API keys
- Company gateway URLs  
- Internal service endpoints
- Authentication tokens

## 📁 Configuration Priority

The config loader searches in this order:

1. **`./.anygpt/anygpt.config.ts`** ← **Private config** (highest priority)
2. `./anygpt.config.ts` ← Project root (for examples/testing)
3. `~/.anygpt/anygpt.config.ts` ← User home directory
4. `~/.codex/config.toml` ← Codex compatibility
5. Built-in defaults ← Fallback (mock provider)

## 🚀 Quick Start

1. **Create your private config:**
   ```bash
   mkdir -p .anygpt
   ```

2. **Create `.anygpt/anygpt.config.ts`:**
   ```typescript
   import type { AnyGPTConfig } from '@anygpt/config';

   const config: AnyGPTConfig = {
     version: '1.0',
     
     providers: {
       'my-provider': {
         name: 'My AI Provider',
         connector: {
           connector: '@anygpt/openai',
           config: {
             apiKey: process.env.MY_API_KEY,
             baseURL: 'https://my-gateway.company.com/v1'
           }
         },
         settings: {
           defaultModel: 'gpt-4'
         }
       }
     },
     
     settings: {
       defaultProvider: 'my-provider'
     }
   };

   export default config;
   ```

3. **Set environment variables:**
   ```bash
   export MY_API_KEY="your-api-key-here"
   ```

4. **Test the configuration:**
   ```bash
   npx anygpt chat "Hello!"
   ```

## 🔄 Migration from Codex

If you have an existing `~/.codex/config.toml` file:

```bash
npx anygpt migrate
```

This will convert your TOML configuration to the new TypeScript format.

## 📝 Configuration Examples

### Factory Configuration (Recommended)

**Factory configs** provide direct connector instantiation with cleaner syntax:

```typescript
import { config, openai } from '@anygpt/config';

export default config({
  defaults: {
    provider: 'company-gateway',
    model: 'gpt-4o'
  },
  providers: {
    'company-gateway': {
      name: 'Company AI Gateway',
      connector: openai({
        baseURL: 'https://internal-ai.company.com/v1',
        apiKey: process.env.COMPANY_AI_KEY
      })
    }
  }
});
```

### Standard Configuration

```typescript
const config: AnyGPTConfig = {
  providers: {
    'company-gateway': {
      name: 'Company AI Gateway',
      connector: {
        connector: '@anygpt/openai',
        config: {
          baseURL: 'https://internal-ai.company.com/v1',
          apiKey: process.env.COMPANY_AI_KEY
        }
      }
    }
  },
  settings: {
    defaultProvider: 'company-gateway'
  }
};
```

### Multiple Providers (Factory Style)
```typescript
import { config, openai, mock } from '@anygpt/config';

export default config({
  defaults: {
    provider: 'openai',
    model: 'gpt-4o'
  },
  providers: {
    'openai': {
      name: 'OpenAI',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY
      })
    },
    'local-ollama': {
      name: 'Local Ollama',
      connector: openai({
        baseURL: 'http://localhost:11434/v1'
      })
    },
    'mock': {
      name: 'Mock Provider',
      connector: mock()
    }
  }
});
```

### Multiple Providers (Standard Style)
```typescript
const config: AnyGPTConfig = {
  providers: {
    'openai': {
      connector: { 
        connector: '@anygpt/openai',
        config: { apiKey: process.env.OPENAI_API_KEY }
      }
    },
    'local-ollama': {
      connector: {
        connector: '@anygpt/openai',
        config: { baseURL: 'http://localhost:11434/v1' }
      }
    },
    'mock': {
      connector: { connector: '@anygpt/mock' }
    }
  }
};
```

## 🛡️ Security Best Practices

1. **Never commit `.anygpt/` folder** - It's already in `.gitignore`
2. **Use environment variables** for API keys
3. **Share config templates** - Not actual config files
4. **Backup configs securely** - Store encrypted backups

## 🎯 Usage

### Quick Chat (Stateless)
```bash
# Uses default provider and model from config
npx anygpt chat "Hello!"

# Override provider
npx anygpt chat "Hello!" --provider openai

# Override model  
npx anygpt chat "Hello!" --model gpt-3.5-turbo
```

### Conversations (Stateful)
```bash
# Auto-start conversation (NEW: no manual start needed)
npx anygpt conversation message "Hello!"

# Manual conversation management
npx anygpt conversation start --name "my-session"
npx anygpt conversation message "Hello!"
npx anygpt conversation list
npx anygpt conversation end
```

**Auto-Start Feature**: Conversations now automatically start when you send a message without an active conversation, using your default provider and model settings.

## 🔧 Environment Variables

Common environment variables to set:

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Company gateway
export COMPANY_AI_KEY="your-company-key"

# Anthropic (if using)
export ANTHROPIC_API_KEY="sk-ant-..."
```

## 📚 Advanced Configuration

### CLI Configuration Management
For detailed information about configuration management through the CLI:
- **[Config Command Guide](../packages/cli/docs/config.md)** - Complete configuration management documentation
- **[CLI Overview](../packages/cli/docs/README.md)** - Full CLI documentation with configuration examples

### Package Documentation
See the [Config Package Documentation](../packages/config/README.md) for advanced features like:
- Dynamic connector loading
- Custom connectors
- Configuration validation
- Multiple config sources
