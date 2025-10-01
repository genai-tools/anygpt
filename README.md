# GenAI Gateway MCP

A secure, enterprise-ready Model Context Protocol (MCP) server that bridges MCP clients with multiple AI providers (OpenAI, Anthropic, local models, etc.) through a layered gateway architecture.

## Why?

**Problem**: MCP clients (Docker Desktop MCP Toolkit, Windsurf, etc.) cannot directly integrate with AI provider APIs due to protocol differences and security requirements.

**Solution**: This monorepo provides a two-layer architecture:
- **Gateway Layer**: Secure proxy service managing AI provider credentials and routing
- **MCP Layer**: Protocol translator converting MCP requests to AI provider API calls

See [Architecture Specification](./docs/spec/README.md) for detailed technical design and [Components Design](./docs/spec/components.md) for system architecture.

## Architecture

```
MCP Client → genai-gateway-mcp → genai-gateway → AI Provider APIs
```

### Packages

- **`genai-gateway`**: Secure gateway service that manages AI provider connections and credentials
- **`genai-gateway-mcp`**: MCP server implementation that uses the gateway for API access

### Supported Providers

- **OpenAI**: GPT models, embeddings, completions
- **Anthropic**: Claude models (planned)
- **Local Models**: Ollama, LM Studio (planned)
- **Azure OpenAI**: Enterprise OpenAI deployment (planned)

## Installation

### Using Docker (Recommended)

```bash
# Pull the latest image
docker pull ghcr.io/theplenkov/genai-gateway:mcp

# Run with your configuration
docker run -d \
  -e GATEWAY_URL=https://your-gateway.company.com \
  -e GATEWAY_API_KEY=your-gateway-key \
  -e DEFAULT_MODEL=gpt-4 \
  -e PROVIDER_TYPE=openai \
  --name genai-gateway-mcp \
  ghcr.io/theplenkov/genai-gateway:mcp
```

### Using npm

```bash
npm install -g genai-gateway-mcp
genai-gateway-mcp --gateway-url https://your-gateway.company.com --provider openai
```

## Configuration

| Environment Variable | Description | Required | Default |
|---------------------|-------------|----------|---------|
| `GATEWAY_URL` | Base URL of your GenAI gateway service | ✅ | - |
| `GATEWAY_API_KEY` | Authentication token for gateway | ✅ | - |
| `PROVIDER_TYPE` | AI provider type (openai, anthropic, local) | ❌ | `openai` |
| `DEFAULT_MODEL` | Default model name | ❌ | `gpt-3.5-turbo` |
| `TIMEOUT` | Request timeout in seconds | ❌ | `30` |
| `MAX_RETRIES` | Maximum retry attempts | ❌ | `3` |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | ❌ | `info` |

## Docker MCP Toolkit Integration

For complete Docker integration instructions, see [Docker Integration Specification](./docs/spec/docker.md).

### Quick Setup

```json
{
  "name": "GenAI Gateway",
  "command": "docker",
  "args": [
    "run", "--rm", "-i",
    "-e", "GATEWAY_URL=https://your-gateway.company.com",
    "-e", "GATEWAY_API_KEY=your-gateway-key",
    "-e", "PROVIDER_TYPE=openai",
    "ghcr.io/theplenkov/genai-gateway:mcp"
  ]
}
```

## Usage Examples

### Basic Chat Completion

The MCP server automatically handles the protocol translation:

```typescript
// MCP Client sends this
{
  "jsonrpc": "2.0",
  "method": "completion/complete",
  "params": {
    "prompt": {
      "messages": [{"role": "user", "content": "Hello!"}]
    }
  }
}

// Gets translated to provider format via gateway
{
  "model": "gpt-3.5-turbo",
  "messages": [{"role": "user", "content": "Hello!"}],
  "provider": "openai"
}
```

### Model Listing

```bash
# MCP clients can discover available models
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "models/list", "id": 1}'
```

## Windsurf Integration

For detailed client configuration, see [Client Configuration Guide](./docs/spec/client.md).

```json
{
  "mcpServers": {
    "genai-gateway": {
      "command": "npx",
      "args": ["genai-gateway-mcp"],
      "env": {
        "GATEWAY_URL": "https://your-gateway.company.com",
        "GATEWAY_API_KEY": "your-gateway-key",
        "PROVIDER_TYPE": "openai"
      }
    }
  }
}
```

## Development

This project uses NX monorepo for managing multiple packages:

```bash
# Install dependencies
npm install

# Build all packages
nx run-many -t build

# Run tests
nx run-many -t test

# Start development server
nx serve genai-gateway-mcp
```

## Security

- **No direct API keys**: All AI provider credentials are managed by the gateway service
- **Secure transport**: All communications use HTTPS/WSS
- **Input validation**: All requests are validated before forwarding
- **Rate limiting**: Built-in protection against abuse

## Documentation

- 📋 [Architecture Specification](./docs/spec/README.md) - Overall system design
- 🏗️ [Components Design](./docs/spec/components.md) - Detailed component architecture  
- 👤 [Client Configuration](./docs/spec/client.md) - Client setup and usage
- 🖥️ [MCP Server](./docs/spec/mcp-server.md) - Server configuration and API
- 🐳 [Docker Integration](./docs/spec/docker.md) - Container deployment

## Support

- 🐛 [Issues](https://github.com/ThePlenkov/genai-gateway/issues)
- 💬 [Discussions](https://github.com/ThePlenkov/genai-gateway/discussions)

## License

MIT License - see [LICENSE](LICENSE) file for details.
