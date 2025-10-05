# Integrating AnyGPT with LiteLLM Proxy

This guide shows how to use AnyGPT as an MCP server with LiteLLM Proxy as the backend gateway.

## Architecture

```
MCP Client (Claude Desktop, Docker Desktop, Windsurf)
    ↓
AnyGPT MCP Server (TypeScript, MCP protocol)
    ↓
LiteLLM Proxy (Python, enterprise features)
    ↓
100+ AI Providers (OpenAI, Anthropic, Azure, etc.)
```

## Benefits

- **AnyGPT provides**: MCP protocol, TypeScript ecosystem, CLI tools, conversation management
- **LiteLLM provides**: Multi-provider support, auth, rate limiting, cost tracking, load balancing

## Setup

### 1. Install LiteLLM

```bash
pip install litellm[proxy]
```

### 2. Configure LiteLLM

Create `litellm_config.yaml`:

```yaml
model_list:
  # OpenAI models
  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY
  
  # Anthropic models
  - model_name: claude-3-opus
    litellm_params:
      model: anthropic/claude-3-opus-20240229
      api_key: os.environ/ANTHROPIC_API_KEY
  
  # Azure OpenAI with load balancing
  - model_name: gpt-4-azure
    litellm_params:
      model: azure/gpt-4
      api_base: https://my-endpoint-eu.openai.azure.com/
      api_key: os.environ/AZURE_API_KEY_EU
  - model_name: gpt-4-azure
    litellm_params:
      model: azure/gpt-4
      api_base: https://my-endpoint-us.openai.azure.com/
      api_key: os.environ/AZURE_API_KEY_US

# Optional: Add authentication
general_settings:
  master_key: sk-litellm-master-key
  
# Optional: Add rate limiting
litellm_settings:
  success_callback: ["langfuse"]  # For logging
```

### 3. Start LiteLLM Proxy

```bash
litellm --config litellm_config.yaml --port 4000
```

### 4. Configure AnyGPT

#### Option A: Config File

Create `.anygpt/anygpt.config.ts`:

```typescript
import { config, openai } from '@anygpt/config';

export default config({
  defaults: {
    provider: 'litellm',
    model: 'gpt-4o'
  },
  providers: {
    'litellm': {
      name: 'LiteLLM Gateway',
      connector: openai({
        baseURL: 'http://localhost:4000/v1',
        apiKey: process.env.LITELLM_MASTER_KEY || 'sk-litellm-master-key'
      })
    }
  }
});
```

#### Option B: Environment Variables

```bash
export OPENAI_BASE_URL=http://localhost:4000/v1
export OPENAI_API_KEY=sk-litellm-master-key
```

### 5. Use AnyGPT CLI

```bash
# Chat with any model through LiteLLM
anygpt chat --model gpt-4o "Hello!"
anygpt chat --model claude-3-opus "Explain TypeScript"
anygpt chat --model gpt-4-azure "What's the weather?"

# Start a conversation
anygpt conversation start --model gpt-4o --name "my-session"
anygpt conversation message "Tell me about TypeScript"
```

### 6. Use AnyGPT MCP Server

Update your MCP client config (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "anygpt": {
      "command": "anygpt-mcp",
      "env": {
        "OPENAI_BASE_URL": "http://localhost:4000/v1",
        "OPENAI_API_KEY": "sk-litellm-master-key"
      }
    }
  }
}
```

## Advanced: Multiple Gateways

You can configure multiple LiteLLM instances or mix direct providers:

```typescript
import { config, openai } from '@anygpt/config';

export default config({
  providers: {
    // LiteLLM for enterprise models
    'litellm-prod': {
      name: 'Production LiteLLM',
      connector: openai({
        baseURL: 'http://litellm-prod:4000/v1',
        apiKey: process.env.LITELLM_PROD_KEY
      })
    },
    
    // LiteLLM for development
    'litellm-dev': {
      name: 'Development LiteLLM',
      connector: openai({
        baseURL: 'http://localhost:4000/v1',
        apiKey: 'sk-dev-key'
      })
    },
    
    // Direct OpenAI for fallback
    'openai-direct': {
      name: 'OpenAI Direct',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY
      })
    },
    
    // Local Ollama for offline work
    'ollama': {
      name: 'Local Ollama',
      connector: openai({
        baseURL: 'http://localhost:11434/v1'
      })
    }
  }
});
```

## Benefits of This Setup

### For Developers
- ✅ Use familiar TypeScript/Node.js ecosystem
- ✅ Rich CLI with conversation management
- ✅ MCP protocol support for IDE integration
- ✅ Type-safe configuration

### For Organizations
- ✅ Centralized auth and rate limiting (LiteLLM)
- ✅ Cost tracking and budgets (LiteLLM)
- ✅ Load balancing across providers (LiteLLM)
- ✅ Support for 100+ providers (LiteLLM)

### For MCP Clients
- ✅ Native MCP protocol support (AnyGPT)
- ✅ Access to all LiteLLM features
- ✅ Works with Claude Desktop, Docker Desktop, Windsurf

## Monitoring

LiteLLM provides monitoring dashboards. Access at:
```
http://localhost:4000/ui
```

## Troubleshooting

### Connection Issues
```bash
# Test LiteLLM directly
curl http://localhost:4000/v1/models \
  -H "Authorization: Bearer sk-litellm-master-key"

# Test through AnyGPT
anygpt chat --url http://localhost:4000/v1 \
  --token sk-litellm-master-key \
  --model gpt-4o "test"
```

### Model Not Found
Make sure the model is configured in `litellm_config.yaml` and LiteLLM is running.

### Authentication Errors
- Check `LITELLM_MASTER_KEY` matches `general_settings.master_key` in config
- Verify environment variables are set correctly

## Production Deployment

For production, run both services as containers:

```yaml
# docker-compose.yml
services:
  litellm:
    image: ghcr.io/berriai/litellm:latest
    ports:
      - "4000:4000"
    volumes:
      - ./litellm_config.yaml:/app/config.yaml
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    command: ["--config", "/app/config.yaml"]
  
  anygpt-mcp:
    build: .
    environment:
      - OPENAI_BASE_URL=http://litellm:4000/v1
      - OPENAI_API_KEY=sk-litellm-master-key
    depends_on:
      - litellm
```

## Conclusion

This integration gives you:
- **Best-in-class MCP support** from AnyGPT
- **Enterprise gateway features** from LiteLLM
- **Flexibility** to use either standalone or together
- **TypeScript ecosystem** for your applications
