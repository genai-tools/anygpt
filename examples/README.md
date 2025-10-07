# AnyGPT Examples

This directory contains **cross-package integration examples** and guides for AnyGPT.

For connector-specific examples, see the individual package directories:
- **Cody**: [`packages/connectors/cody/examples/`](../packages/connectors/cody/examples/)
- **Config**: [`packages/config/examples/`](../packages/config/examples/)

## Examples

### 📚 [LiteLLM Integration](./litellm-integration.md)
Complete guide for using AnyGPT with LiteLLM Proxy as a backend gateway. This gives you:
- Access to 100+ AI providers through LiteLLM
- Enterprise features (auth, rate limiting, cost tracking)
- MCP protocol support through AnyGPT
- TypeScript ecosystem and CLI tools

**Quick Start:**
```bash
# 1. Start LiteLLM
pip install litellm[proxy]
litellm --config examples/configs/litellm_config.yaml --port 4000

# 2. Use AnyGPT with LiteLLM
export OPENAI_BASE_URL=http://localhost:4000/v1
export OPENAI_API_KEY=sk-litellm-master-key

anygpt chat --model gpt-4o "Hello from LiteLLM!"
```

## Configuration Examples

### [`configs/litellm.config.ts`](./configs/litellm.config.ts)
AnyGPT configuration for LiteLLM integration. Shows how to:
- Point AnyGPT at LiteLLM proxy
- Configure multiple providers
- Set up fallbacks

### [`configs/litellm_config.yaml`](./configs/litellm_config.yaml)
LiteLLM proxy configuration. Demonstrates:
- Multi-provider setup (OpenAI, Anthropic, Azure, Google)
- Load balancing across endpoints
- Authentication and rate limiting
- Caching and observability

## Use Cases

### 1. MCP Client Integration
Use AnyGPT as an MCP server with LiteLLM backend:

```json
// Claude Desktop config
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

### 2. CLI with Multiple Providers
```bash
# Copy config to your project
cp examples/configs/litellm.config.ts .anygpt/anygpt.config.ts

# Use any model through LiteLLM
anygpt chat --model gpt-4o "OpenAI model"
anygpt chat --model claude-3-opus "Anthropic model"
anygpt chat --model gemini-pro "Google model"
```

### 3. Programmatic Usage
```typescript
import { setupRouter } from '@anygpt/config';

// Load config (points to LiteLLM)
const { router } = await setupRouter();

// Use any provider through LiteLLM
const response = await router.chatCompletion({
  provider: 'litellm',
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## Architecture Patterns

### Pattern 1: AnyGPT + LiteLLM
```
MCP Client → AnyGPT MCP → LiteLLM → 100+ Providers
```
**Best for:** MCP clients needing enterprise features

### Pattern 2: AnyGPT Direct
```
MCP Client → AnyGPT MCP → OpenAI/Ollama
```
**Best for:** Simple setups, local development

### Pattern 3: Hybrid
```
MCP Client → AnyGPT MCP → {
  LiteLLM (production)
  OpenAI Direct (fallback)
  Ollama (offline)
}
```
**Best for:** Flexibility and resilience

## Benefits

| Feature | AnyGPT Standalone | AnyGPT + LiteLLM |
|---------|-------------------|------------------|
| MCP Protocol | ✅ | ✅ |
| TypeScript Ecosystem | ✅ | ✅ |
| CLI Tools | ✅ | ✅ |
| Conversation Management | ✅ | ✅ |
| Provider Support | OpenAI-compatible | 100+ providers |
| Auth/Rate Limiting | ❌ | ✅ |
| Cost Tracking | ❌ | ✅ |
| Load Balancing | ❌ | ✅ |
| Observability | Basic | Advanced |

## Contributing

Have an interesting integration or use case? Please contribute examples!

1. Create your example in this directory
2. Add documentation
3. Update this README
4. Submit a PR
