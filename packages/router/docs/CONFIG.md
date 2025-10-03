# Router Configuration System

A flexible configuration system for the AnyGPT Router. Define provider configurations with URL, model, and parameter settings.

## 🎯 **Core Concept**

The AnyGPT Router allows you to:
- **Configure multiple providers** (OpenAI, Anthropic, Google, etc.)
- **Customize provider settings** (change URL, model, parameters)
- **Create company-specific configs** (proxy, headers, custom models)
- **Environment-based setup** (dev/staging/prod)

## 🚀 **Quick Start**

### **1. Basic Configuration**
```typescript
import { defineConfig, createRouter } from '@anygpt/router';

// Define configuration
const config = defineConfig({
  providers: {
    openai: {
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1'
    }
  }
});

// Create router
const router = createRouter(config);
```

### **2. Multiple Providers**
```typescript
import { defineConfig } from '@anygpt/router';

const config = defineConfig({
  providers: {
    openai: {
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1'
    },
    company: {
      type: 'openai',
      apiKey: process.env.COMPANY_API_KEY,
      baseURL: 'https://api.company.com/openai/v1',
      headers: {
        'X-Company-ID': 'engineering'
      }
    }
  }
});
```

### **3. Environment-Based Setup**
```bash
# Set environment variables
export OPENAI_API_KEY=sk-your-key
export ANYGPT_LOG_LEVEL=debug
export ANYGPT_CONFIG_PATH=/path/to/config.json
```

```typescript
import { ConfigLoader } from 'genai-gateway/config';

// Load from environment
const config = ConfigLoader.loadFromEnv();
```

## 📋 **Built-in Presets (OpenAI Focus)**

| Preset | Model | Use Case |
|--------|-------|----------|
| `openai-gpt-4o` | GPT-4o | General purpose, vision, functions |
| `openai-o1` | o1 | Advanced reasoning tasks |
| `openai-gpt-4o-mini` | GPT-4o mini | Efficient, cost-effective |
| `openai-gpt-3-5-turbo` | GPT-3.5 Turbo | Fast, legacy support |
| `openai-coding-assistant` | GPT-4o | Code generation (low temp) |
| `openai-creative-writer` | GPT-4o | Creative writing (high temp) |
| `openai-reasoning-expert` | o1 | Complex problem solving |

## 🔧 **Configuration File Format**

### **JSON Configuration**
```json
{
  "version": "1.0",
  "defaultProfile": "my-setup",
  "profiles": [
    {
      "slug": "my-setup",
      "name": "🚀 My Custom Setup",
      "description": "Personal configuration",
      "provider": {
        "type": "openai",
        "baseURL": "https://api.openai.com/v1",
        "apiKey": "${OPENAI_API_KEY}",
        "timeout": 30000,
        "maxRetries": 3
      },
      "model": {
        "id": "gpt-4o",
        "displayName": "GPT-4o"
      },
      "parameters": {
        "temperature": 0.7,
        "maxTokens": 4096,
        "streaming": true,
        "verbosity": "medium",
        "reasoningEffort": "high"
      },
      "context": {
        "systemPrompt": "You are a helpful AI assistant.",
        "contextWindow": 128000,
        "memory": {
          "enabled": true,
          "maxMessages": 20
        }
      }
    }
  ],
  "global": {
    "logLevel": "info",
    "enableMetrics": true
  }
}
```

## 🏢 **Real-World Examples**

### **Company Proxy Setup**
```typescript
const companySetup = createCustomPreset('openai-gpt4o', {
  slug: 'company-proxy',
  name: '🏢 Company Proxy',
  provider: {
    baseURL: 'https://api.company.com/openai/v1',
    apiKey: '${COMPANY_API_KEY}',
    headers: {
      'X-Company-ID': 'engineering-team',
      'X-Cost-Center': 'ai-research'
    }
  },
  parameters: {
    temperature: 0.2,  // Lower for consistency
    maxTokens: 8192,   // Higher limit
    verbosity: 'low'   // Concise responses
  }
});
```

### **Local Development**
```typescript
const devSetup = createCustomPreset('ollama-llama', {
  slug: 'dev-local',
  name: '🛠️ Development',
  model: {
    id: 'codellama:13b',
    displayName: 'CodeLlama 13B'
  },
  parameters: {
    temperature: 0.1,  // Very low for code
    maxTokens: 8192,
    streaming: true
  },
  context: {
    systemPrompt: 'You are a coding assistant. Write clean, documented code.'
  }
});
```

### **Azure OpenAI**
```typescript
const azureSetup = createCustomPreset('openai-gpt4o', {
  slug: 'azure-openai',
  name: '☁️ Azure OpenAI',
  provider: {
    baseURL: 'https://your-resource.openai.azure.com/openai/deployments/gpt-4o',
    apiKey: '${AZURE_OPENAI_KEY}',
    headers: {
      'api-version': '2024-02-15-preview'
    }
  }
});
```

### **Multi-Model Routing**
```json
{
  "version": "1.0",
  "profiles": [
    {
      "slug": "fast-queries",
      "name": "⚡ Fast Queries",
      "description": "Groq for simple questions",
      "provider": { "type": "openai", "baseURL": "https://api.groq.com/openai/v1" },
      "model": { "id": "llama-3.1-70b-versatile" },
      "parameters": { "temperature": 0.3, "maxTokens": 1024 }
    },
    {
      "slug": "complex-reasoning", 
      "name": "🧠 Complex Reasoning",
      "description": "OpenAI o1 for hard problems",
      "provider": { "type": "openai", "baseURL": "https://api.openai.com/v1" },
      "model": { "id": "o1" },
      "parameters": { "reasoningEffort": "high", "maxTokens": 32768 }
    },
    {
      "slug": "private-tasks",
      "name": "🔒 Private Tasks", 
      "description": "Local Ollama for sensitive data",
      "provider": { "type": "local", "baseURL": "http://localhost:11434/v1" },
      "model": { "id": "llama3.1:8b" }
    }
  ]
}
```

## 🌍 **Environment Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `GATEWAY_PRESET` | Use built-in preset | `openai-gpt4o` |
| `GATEWAY_BASE_URL` | Custom endpoint | `http://localhost:11434/v1` |
| `GATEWAY_MODEL` | Model ID | `llama3.1:8b` |
| `GATEWAY_API_KEY` | API key | `sk-...` |
| `GATEWAY_TEMPERATURE` | Temperature | `0.7` |
| `GATEWAY_STREAMING` | Enable streaming | `true` |
| `GATEWAY_LOG_LEVEL` | Log level | `debug` |

## 🎯 **Key Benefits**

### **✅ Like Kilocode:**
- **Profile-based**: Switch between different AI setups
- **Preset system**: Start with built-ins, customize as needed
- **Environment support**: Different configs for dev/prod
- **Parameter control**: Temperature, tokens, streaming, verbosity

### **✅ Gateway-Specific:**
- **Multi-provider**: OpenAI, Anthropic, local models, custom endpoints
- **baseURL flexibility**: Point to any OpenAI-compatible API
- **MCP compliance**: Proper logging, no stdout pollution
- **Enterprise ready**: Proxy support, custom headers, authentication

### **✅ Developer Friendly:**
- **Type-safe**: Full TypeScript support
- **Tested**: Comprehensive unit tests
- **Extensible**: Easy to add new presets and providers
- **Simple**: JSON config or environment variables

This configuration system gives you **Kilocode-like flexibility** while being specifically designed for our **multi-provider GenAI Gateway architecture**! 🎯
