# @anygpt/mcp

A Model Context Protocol (MCP) server that bridges MCP clients with multiple AI providers through the AnyGPT router system.

## Features

- **Multi-Provider Support**: Currently supports OpenAI, with plans for Anthropic and local models
- **MCP Protocol Compliance**: Full implementation of MCP specification using official TypeScript SDK
- **Secure Gateway Architecture**: Credentials managed by gateway service, not exposed to MCP clients
- **Tool-Based Interface**: Exposes AI functionality through MCP tools
- **Self-Documenting Resources**: AI agents can read documentation about providers and workflows
- **Pre-Built Prompts**: Ready-to-use templates for common tasks like discovery and comparison

## Available Tools

### `anygpt_list_providers`
Discover all configured AI providers and their types. **Use this first** to understand what providers are available.

**Parameters:** None

**Returns:**
- `providers`: Array of provider information
  - `id`: Provider identifier (used in other tools)
  - `type`: Provider type (e.g., "openai", "anthropic")
  - `isDefault`: Whether this is the default provider
- `default_provider`: The default provider ID (if configured)

**Example response:**
```json
{
  "providers": [
    { "id": "openai", "type": "openai", "isDefault": true },
    { "id": "anthropic", "type": "anthropic", "isDefault": false }
  ],
  "default_provider": "openai"
}
```

### `anygpt_list_models`
List available models dynamically from AI providers. Requires valid API credentials.

**Parameters:**
- `provider` (optional): AI provider to list models from (uses default if not specified)

**Note:** This tool fetches models in real-time from the provider's API, ensuring you always get the most up-to-date list of available models.

### `anygpt_chat_completion`
Send chat completion requests to AI providers via the gateway.

**Parameters:**
- `messages` (required): Array of chat messages with `role` and `content`
- `model` (optional): Model to use (uses default if not specified)
- `provider` (optional): AI provider (uses default if not specified)
- `temperature` (optional): Sampling temperature (0-2, default: 1)
- `max_tokens` (optional): Maximum tokens to generate (default: 4096)

**Understanding Response Truncation:**

If the response has `"finish_reason": "length"`, it means the output was **truncated** because it reached the `max_tokens` limit. To get a complete response:

1. **Increase `max_tokens`** in your request
2. **Use these guidelines:**
   - Short answers: 100-500 tokens
   - Medium responses: 500-2000 tokens
   - Long/comprehensive outputs: 2000-4096+ tokens
3. **Trade-offs:** Higher `max_tokens` values increase latency and cost but prevent truncation

**Example of handling truncation:**
```typescript
// First attempt - might be truncated
const response1 = await anygpt_chat_completion({
  messages: [{ role: "user", content: "Explain quantum computing in detail" }],
  max_tokens: 100  // Too low!
});

if (response1.choices[0].finish_reason === "length") {
  // Response was truncated, retry with higher limit
  const response2 = await anygpt_chat_completion({
    messages: [{ role: "user", content: "Explain quantum computing in detail" }],
    max_tokens: 2000  // Much better!
  });
}
```

## Discovery Workflow

The MCP server is **self-documenting**. Follow this workflow to discover and use available providers and models:

1. **Discover Providers**: Call `anygpt_list_providers` to see what AI providers are configured
2. **List Models**: Call `anygpt_list_models` with a specific provider to see available models
3. **Chat**: Call `anygpt_chat_completion` with your chosen provider and model

**Example:**
```typescript
// Step 1: What providers are available?
anygpt_list_providers()
// Returns: { providers: [{ id: "openai", type: "openai", isDefault: true }], ... }

// Step 2: What models does OpenAI offer?
anygpt_list_models({ provider: "openai" })
// Returns: { provider: "openai", models: [...] }

// Step 3: Use a specific model
anygpt_chat_completion({
  provider: "openai",
  model: "gpt-4",
  messages: [{ role: "user", content: "Hello!" }]
})
```

## Resources (AI-Readable Documentation)

The server exposes documentation using **resource templates** that AI agents can read:

### Templates

- **`anygpt://docs/{section}`** - Access documentation sections
  - Available sections: `overview`, `workflow`, `providers`
- **`anygpt://examples/{example}`** - Access usage examples
  - Available examples: `basic-chat`

### Example URIs

- `anygpt://docs/overview` - Introduction to AnyGPT MCP server
- `anygpt://docs/workflow` - Step-by-step discovery workflow guide
- `anygpt://docs/providers` - Currently configured providers (dynamic)
- `anygpt://examples/basic-chat` - Complete usage example

**Benefits**: Resource templates reduce token overhead when listing resources and allow for dynamic, scalable documentation.

## Sampling (AI Assistant Integration)

The MCP server supports **sampling**, which allows AI assistants (VS Code Copilot, Windsurf, Claude Desktop) to use your configured providers for completions.

### How It Works

1. **Enable in VS Code**: Click "Configure Model Access" in the MCP server menu
2. **Select Models**: Choose which models to make available (e.g., `opus`, `gpt-4`, `sonnet`)
3. **AI Uses Your Server**: The AI assistant calls `anygpt_chat_completion` through your MCP server
4. **Smart Resolution**: Your config's aliases and tags work automatically

### Available Models

You can use any of:
- **Aliases** from your config (e.g., `opus`, `fast`, `cheap`)
- **Tags** from provider models (e.g., `flagship`, `best`)
- **Direct model names** (e.g., `gpt-4`, `claude-opus-4-20250514`)

### Benefits

✅ **Unified Configuration** - Same config for CLI, MCP, and IDE  
✅ **Smart Resolution** - Use shortcuts instead of full model names  
✅ **Cost Control** - Route to appropriate models based on task  
✅ **Provider Flexibility** - Switch providers without reconfiguring IDE  

## Prompts (Pre-Built Workflows)

The server provides ready-to-use prompt templates for common tasks:

### `discover-and-chat`
Complete workflow that discovers providers, lists models, and sends a chat message.

**Arguments:**
- `question` (required): The question to ask the AI

### `compare-providers`
Compare how different AI providers respond to the same question.

**Arguments:**
- `question` (required): The question to ask all providers

### `list-capabilities`
Show all available providers and their models in an organized format.

**No arguments required**

These prompts guide AI agents through complex multi-step workflows automatically.

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
