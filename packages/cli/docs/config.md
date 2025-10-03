# Config Command

The `config` command provides configuration management and inspection capabilities for AnyGPT. It helps you understand your current configuration, validate settings, and export configurations for sharing.

## Concept

Configuration management in AnyGPT:
- **Inspection**: View resolved configuration from all sources
- **Validation**: Verify configuration correctness
- **Debugging**: Understand which config files are loaded
- **Export**: Share configuration templates
- **TypeScript Benefits**: Leverage modern JavaScript features and type safety

## Basic Usage

### View Current Configuration

```bash
# Show human-readable configuration
npx anygpt config

# Output:
📋 AnyGPT Configuration
══════════════════════════════════════════════════
📁 Source: ./.anygpt/anygpt.config.ts

├─ defaults:
│  ├─ provider: provider1
│  ├─ model: ml-asset:static-model/gemini-2_5-flash-lite
├─ providers:
│  ├─ provider1:
│  │  ├─ name: Company GenAI Gateway
│  │  ├─ connector:
│  │  │  ├─ type: @anygpt/openai
│  │  │  ├─ options:
│  │  │  │  ├─ baseURL: https://company-ai-gateway.example.com/v1
```

### JSON Output

```bash
# Machine-readable JSON format
npx anygpt config --json

# Output:
{
  "defaults": {
    "provider": "provider1",
    "model": "ml-asset:static-model/gemini-2_5-flash-lite"
  },
  "providers": {
    "provider1": {
      "name": "Company GenAI Gateway",
      "connector": {
        "type": "@anygpt/openai",
        "options": {
          "baseURL": "https://company-ai-gateway.example.com/v1"
        }
      }
    }
  }
}
```

## Command Syntax

```bash
npx anygpt config [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output configuration as JSON | Human-readable format |
| `-c, --config <path>` | Specify config file path | Auto-discovery |

## Configuration Sources

AnyGPT loads configuration from multiple sources in priority order:

### 1. Command Line Config (`-c, --config`)
```bash
npx anygpt config --config ./custom-config.ts
```

### 2. Private Config (`.anygpt/anygpt.config.ts`)
```bash
# Highest priority for actual usage
./.anygpt/anygpt.config.ts
```

### 3. Project Config (`anygpt.config.ts`)
```bash
# For examples and templates
./anygpt.config.ts
```

### 4. User Config (`~/.anygpt/anygpt.config.ts`)
```bash
# User-wide defaults
~/.anygpt/anygpt.config.ts
```

### 5. Legacy Codex Config (`~/.codex/config.toml`)
```bash
# Backward compatibility
~/.codex/config.toml
```

### 6. Built-in Defaults
```bash
# Fallback mock provider
```

## Configuration Formats

### TypeScript Configuration (Recommended)

AnyGPT supports modern TypeScript configuration with full type safety and IDE support.

#### Factory Configuration (Preferred)

```typescript
// .anygpt/anygpt.config.ts
import { config, openai, mock } from '@anygpt/config';

export default config({
  defaults: {
    provider: 'openai',
    model: 'gpt-4o'
  },
  providers: {
    openai: {
      name: 'OpenAI',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1'
      })
    },
    'local-ollama': {
      name: 'Local Ollama',
      connector: openai({
        baseURL: 'http://localhost:11434/v1'
      })
    },
    mock: {
      name: 'Mock Provider',
      connector: mock()
    }
  }
});
```

#### Standard Configuration

```typescript
// .anygpt/anygpt.config.ts
import type { AnyGPTConfig } from '@anygpt/config';

const config: AnyGPTConfig = {
  version: '1.0',
  providers: {
    openai: {
      name: 'OpenAI',
      connector: {
        connector: '@anygpt/openai',
        config: {
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: 'https://api.openai.com/v1'
        }
      }
    }
  },
  settings: {
    defaultProvider: 'openai',
    timeout: 30000
  }
};

export default config;
```

### JSON Configuration

```json
{
  "version": "1.0",
  "providers": {
    "openai": {
      "name": "OpenAI",
      "connector": {
        "connector": "@anygpt/openai",
        "config": {
          "apiKey": "sk-...",
          "baseURL": "https://api.openai.com/v1"
        }
      }
    }
  },
  "settings": {
    "defaultProvider": "openai"
  }
}
```

### TOML Configuration (Legacy)

```toml
# ~/.codex/config.toml
model = "gpt-4o"
model_provider = "openai"

[model_providers.openai]
name = "OpenAI"
base_url = "https://api.openai.com/v1/chat/completions"
env_key = "OPENAI_API_KEY"
```

## TypeScript Configuration Benefits

### 1. Type Safety

TypeScript configurations provide compile-time type checking:

```typescript
import { config, openai } from '@anygpt/config';

export default config({
  defaults: {
    provider: 'openai',
    model: 'gpt-4o',
    // timeout: 'invalid'  // ❌ TypeScript error: Type 'string' is not assignable to type 'number'
    timeout: 30000        // ✅ Correct type
  },
  providers: {
    openai: {
      connector: openai({
        // apiKey: 123        // ❌ TypeScript error: Type 'number' is not assignable to type 'string'
        apiKey: process.env.OPENAI_API_KEY  // ✅ Correct type
      })
    }
  }
});
```

### 2. IDE Support

Full IntelliSense, autocomplete, and refactoring support:

```typescript
import { config, openai } from '@anygpt/config';

export default config({
  // IDE provides autocomplete for all valid options
  defaults: {
    provider: 'openai',  // IDE shows available providers
    model: 'gpt-4o',     // IDE can validate model names
    timeout: 30000       // IDE shows type information
  }
});
```

### 3. Environment Variable Integration

Seamless integration with Node.js environment variables:

```typescript
import { config, openai } from '@anygpt/config';

export default config({
  providers: {
    openai: {
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY,           // Environment variables
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        timeout: parseInt(process.env.TIMEOUT || '30000')
      })
    },
    company: {
      connector: openai({
        apiKey: process.env.COMPANY_AI_KEY,
        baseURL: process.env.COMPANY_AI_URL,
        headers: {
          'X-Company-ID': process.env.COMPANY_ID || 'default'
        }
      })
    }
  }
});
```

### 4. Dynamic Configuration

Use JavaScript logic for dynamic configuration:

```typescript
import { config, openai, mock } from '@anygpt/config';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export default config({
  defaults: {
    provider: isDevelopment ? 'mock' : 'openai',
    model: isProduction ? 'gpt-4o' : 'gpt-3.5-turbo'
  },
  providers: {
    ...(isDevelopment && {
      mock: {
        name: 'Development Mock',
        connector: mock()
      }
    }),
    openai: {
      name: 'OpenAI',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY,
        // Use different models based on environment
        model: isProduction ? 'gpt-4o' : 'gpt-3.5-turbo'
      })
    }
  }
});
```

### 5. Node.js Version Compatibility

TypeScript configurations leverage modern Node.js features:

#### ES Modules (Node.js 14+)
```typescript
// Uses ES module imports
import { config, openai } from '@anygpt/config';
import { readFileSync } from 'fs';
import { join } from 'path';

// Modern async/await
const loadSecrets = async () => {
  const secrets = JSON.parse(readFileSync(join(process.cwd(), 'secrets.json'), 'utf8'));
  return secrets;
};

export default config({
  // Can use top-level await in modern Node.js
  providers: {
    openai: {
      connector: openai({
        apiKey: await loadSecrets().then(s => s.openai_key)
      })
    }
  }
});
```

#### Optional Chaining (Node.js 14+)
```typescript
export default config({
  defaults: {
    provider: process.env.DEFAULT_PROVIDER ?? 'openai',
    model: process.env.DEFAULT_MODEL ?? 'gpt-4o'
  },
  providers: {
    openai: {
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY,
        // Safe property access
        timeout: parseInt(process.env.TIMEOUT?.toString() ?? '30000')
      })
    }
  }
});
```

## Configuration Export and Sharing

### Export Current Configuration

```bash
# Export as TypeScript template
npx anygpt config --json > config-template.json

# Convert to TypeScript
cat > anygpt.config.template.ts << 'EOF'
import { config, openai } from '@anygpt/config';

export default config({
  defaults: {
    provider: 'openai',
    model: 'gpt-4o'
  },
  providers: {
    openai: {
      name: 'OpenAI',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY  // Set this environment variable
      })
    }
  }
});
EOF
```

### Share Configuration Templates

Create reusable configuration templates:

```typescript
// config-templates/company-standard.ts
import { config, openai } from '@anygpt/config';

export const companyStandardConfig = config({
  defaults: {
    provider: 'company-ai',
    model: 'gpt-4o'
  },
  providers: {
    'company-ai': {
      name: 'Company AI Gateway',
      connector: openai({
        baseURL: 'https://ai-gateway.company.com/v1',
        apiKey: process.env.COMPANY_AI_KEY,
        headers: {
          'X-Department': process.env.DEPARTMENT || 'engineering'
        }
      })
    },
    'fallback-openai': {
      name: 'OpenAI Fallback',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
  }
});

export default companyStandardConfig;
```

### Environment-Specific Configurations

```typescript
// .anygpt/anygpt.config.ts
import { config, openai, mock } from '@anygpt/config';

const environment = process.env.NODE_ENV || 'development';

const configurations = {
  development: config({
    defaults: { provider: 'mock', model: 'mock-model' },
    providers: {
      mock: { name: 'Development Mock', connector: mock() }
    }
  }),
  
  staging: config({
    defaults: { provider: 'openai', model: 'gpt-3.5-turbo' },
    providers: {
      openai: {
        name: 'OpenAI Staging',
        connector: openai({
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: 'https://api.openai.com/v1'
        })
      }
    }
  }),
  
  production: config({
    defaults: { provider: 'company', model: 'gpt-4o' },
    providers: {
      company: {
        name: 'Company Production',
        connector: openai({
          baseURL: process.env.COMPANY_AI_URL,
          apiKey: process.env.COMPANY_AI_KEY
        })
      }
    }
  })
};

export default configurations[environment] || configurations.development;
```

## Debugging Configuration Issues

### 1. Check Configuration Loading

```bash
# Verify which config file is loaded
npx anygpt config

# Look for the "Source" line:
📁 Source: ./.anygpt/anygpt.config.ts
```

### 2. Validate Configuration Structure

```bash
# JSON output helps validate structure
npx anygpt config --json | jq '.'

# Check for required fields
npx anygpt config --json | jq '.providers | keys'
```

### 3. Test Specific Config File

```bash
# Test a specific configuration file
npx anygpt config --config ./test-config.ts

# Verify it loads correctly
npx anygpt chat "test" --config ./test-config.ts
```

### 4. Environment Variable Issues

```bash
# Check environment variables
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:+SET}"
echo "NODE_ENV: $NODE_ENV"

# Test with explicit variables
OPENAI_API_KEY=sk-test npx anygpt config
```

## Best Practices

### 1. Use Private Configuration

```bash
# Always use .anygpt/ for actual configurations
mkdir -p .anygpt
cat > .anygpt/anygpt.config.ts << 'EOF'
import { config, openai } from '@anygpt/config';

export default config({
  // Your private configuration
});
EOF
```

### 2. Environment Variable Management

```bash
# Use .env files for development
cat > .env << 'EOF'
OPENAI_API_KEY=sk-your-key-here
COMPANY_AI_KEY=your-company-key
NODE_ENV=development
EOF

# Load in your shell
source .env
npx anygpt config
```

### 3. Configuration Validation

```typescript
// Add validation to your config
import { config, openai } from '@anygpt/config';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

export default config({
  defaults: {
    provider: 'openai',
    model: 'gpt-4o'
  },
  providers: {
    openai: {
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
  }
});
```

### 4. Configuration Documentation

```typescript
// Document your configuration choices
import { config, openai } from '@anygpt/config';

export default config({
  // Default to GPT-4o for best quality responses
  defaults: {
    provider: 'openai',
    model: 'gpt-4o'  // Higher quality than gpt-3.5-turbo
  },
  
  providers: {
    openai: {
      name: 'OpenAI Production',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY,
        // Use default OpenAI endpoint
        baseURL: 'https://api.openai.com/v1',
        // 30 second timeout for long responses
        timeout: 30000
      })
    },
    
    // Fallback for development when OpenAI is unavailable
    mock: {
      name: 'Development Mock',
      connector: mock()
    }
  }
});
```

## Integration with Other Commands

### Configuration-Aware Commands

All AnyGPT commands respect your configuration:

```bash
# Check configuration
npx anygpt config

# Use default provider/model from config
npx anygpt chat "Hello"

# Start conversation with config defaults
npx anygpt conversation message "Hello"

# Override config settings
npx anygpt chat "Hello" --provider openai --model gpt-3.5-turbo
```

### Configuration Testing Workflow

```bash
# 1. Create/modify configuration
vim .anygpt/anygpt.config.ts

# 2. Validate configuration
npx anygpt config

# 3. Test with simple chat
npx anygpt chat "test message"

# 4. Use in conversations
npx anygpt conversation message "test conversation"
```

The config command provides essential tools for managing, validating, and debugging your AnyGPT configuration, with TypeScript providing modern language features and type safety for robust configuration management.
