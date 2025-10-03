# @anygpt/mcp

A Model Context Protocol (MCP) server that bridges MCP clients with multiple AI providers through the AnyGPT router system.

## Features

- **Multi-Provider Support**: Currently supports OpenAI, with plans for Anthropic and local models
- **MCP Protocol Compliance**: Full implementation of MCP specification using official TypeScript SDK
- **Secure Gateway Architecture**: Credentials managed by gateway service, not exposed to MCP clients
- **Tool-Based Interface**: Exposes AI functionality through MCP tools

## Available Tools

### `chat_completion`
Send chat completion requests to AI providers via the gateway.

**Parameters:**
- `messages` (required): Array of chat messages with `role` and `content`
- `model` (optional): Model to use (default: "gpt-3.5-turbo")
- `provider` (optional): AI provider (default: "openai")
- `temperature` (optional): Sampling temperature (0-2, default: 1)
- `max_tokens` (optional): Maximum tokens to generate (default: 1000)

### `list_models`
List available models dynamically from AI providers. Requires valid API credentials.

**Parameters:**
- `provider` (optional): AI provider to list models from (default: "openai")

**Note:** This tool fetches models in real-time from the provider's API, ensuring you always get the most up-to-date list of available models.

## Installation

```bash
# Install dependencies
npm install

# Build the project
npx nx build mcp
```

## Configuration

The server is configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | - |
| `DEFAULT_MODEL` | Default model to use | `gpt-3.5-turbo` |
| `TIMEOUT` | Request timeout in milliseconds | `30000` |
| `MAX_RETRIES` | Maximum retry attempts | `3` |

## Usage

### Running the Server

```bash
# Run directly
node ./dist/index.js

# Or if installed globally
anygpt-mcp
```

### Testing with MCP Inspector

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Test the server
npx @modelcontextprotocol/inspector node ./dist/index.js
```

### Claude Desktop Integration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "anygpt": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key"
      }
    }
  }
}
```

### Docker Desktop MCP Toolkit Integration

```json
{
  "name": "AnyGPT MCP",
  "command": "node",
  "args": ["/path/to/dist/index.js"],
  "env": {
    "OPENAI_API_KEY": "your-openai-api-key",
    "DEFAULT_MODEL": "gpt-4"
  }
}
```

## Architecture

```
MCP Client → @anygpt/mcp → @anygpt/router → AI Provider APIs
```

The server acts as a protocol translator:
1. Receives MCP tool calls from clients
2. Translates them to router API calls
3. Routes requests to appropriate AI providers via connectors
4. Returns responses in MCP format

## Development

```bash
# Build the project
npx nx build mcp

# Run tests
npx nx test mcp

# Lint code
npx nx lint mcp
```

## Security

- API keys are managed by the gateway service
- No direct API key exposure to MCP clients
- Input validation on all requests
- Secure transport over stdio

## License

MIT
