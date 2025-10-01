# OpenAI Gateway MCP

A secure, enterprise-ready Model Context Protocol (MCP) server that bridges MCP clients with OpenAI-compatible APIs through a layered gateway architecture.

## Why?

**Problem**: MCP clients (Docker Desktop MCP Toolkit, Windsurf, etc.) cannot directly integrate with OpenAI-compatible APIs due to protocol differences and security requirements.

**Solution**: This monorepo provides a two-layer architecture:
- **Gateway Layer**: Secure proxy service managing API credentials and routing
- **MCP Layer**: Protocol translator converting MCP requests to OpenAI API calls

See [Architecture Specification](./docs/spec/README.md) for detailed technical design.

## Architecture

```
MCP Client → openai-gateway-mcp → openai-gateway → OpenAI API
```

### Packages

- **`openai-gateway`**: Secure gateway service that manages OpenAI client connections and credentials
- **`openai-gateway-mcp`**: MCP server implementation that uses the gateway for API access

## Installation

### Using Docker (Recommended)

```bash
# Pull the latest image
docker pull ghcr.io/theplenkov/openai-gateway-mcp:latest

# Run with your configuration
docker run -d \
  -e GATEWAY_URL=https://your-gateway.company.com \
  -e GATEWAY_API_KEY=your-gateway-key \
  -e DEFAULT_MODEL=gpt-4 \
  --name openai-gateway-mcp \
  ghcr.io/theplenkov/openai-gateway-mcp:latest
```

### Using npm

```bash
npm install -g @theplenkov/openai-gateway-mcp
openai-gateway-mcp --gateway-url https://your-gateway.company.com
```

## Configuration

| Environment Variable | Description | Required | Default |
|---------------------|-------------|----------|---------|
| `GATEWAY_URL` | Base URL of your OpenAI gateway service | ✅ | - |
| `GATEWAY_API_KEY` | Authentication token for gateway | ✅ | - |
| `DEFAULT_MODEL` | Default model name | ❌ | `gpt-3.5-turbo` |
| `TIMEOUT` | Request timeout in seconds | ❌ | `30` |
| `MAX_RETRIES` | Maximum retry attempts | ❌ | `3` |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | ❌ | `info` |

## Docker MCP Toolkit Integration

### 1. Add to Docker Desktop

1. Open **Docker Desktop**
2. Go to **Extensions** → **MCP Toolkit**
3. Click **Add MCP Server**
4. Configure:

```json
{
  "name": "OpenAI Gateway",
  "command": "docker",
  "args": [
    "run", "--rm", "-i",
    "-e", "GATEWAY_URL=https://your-gateway.company.com",
    "-e", "GATEWAY_API_KEY=your-gateway-key",
    "ghcr.io/theplenkov/openai-gateway-mcp:latest"
  ]
}
```

### 2. Using Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  openai-gateway-mcp:
    image: ghcr.io/theplenkov/openai-gateway-mcp:latest
    environment:
      - GATEWAY_URL=https://your-gateway.company.com
      - GATEWAY_API_KEY=${GATEWAY_API_KEY}
      - DEFAULT_MODEL=gpt-4
    stdin_open: true
    tty: true
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

// Gets translated to OpenAI format via gateway
{
  "model": "gpt-3.5-turbo",
  "messages": [{"role": "user", "content": "Hello!"}]
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

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "openai-gateway": {
      "command": "npx",
      "args": ["@theplenkov/openai-gateway-mcp"],
      "env": {
        "GATEWAY_URL": "https://your-gateway.company.com",
        "GATEWAY_API_KEY": "your-gateway-key"
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
nx serve openai-gateway-mcp
```

## Security

- **No direct API keys**: All OpenAI credentials are managed by the gateway service
- **Secure transport**: All communications use HTTPS/WSS
- **Input validation**: All requests are validated before forwarding
- **Rate limiting**: Built-in protection against abuse

## Support

- 📖 [Documentation](./docs/spec/README.md)
- 🐛 [Issues](https://github.com/ThePlenkov/openai-gateway-mcp/issues)
- 💬 [Discussions](https://github.com/ThePlenkov/openai-gateway-mcp/discussions)

## License

MIT License - see [LICENSE](LICENSE) file for details.
