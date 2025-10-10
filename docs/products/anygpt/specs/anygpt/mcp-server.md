# MCP Server Specification

**Related Use Case**: [MCP Server for Cross-Component Agents](../use-cases/mcp-server.md)

MCP protocol server that bridges MCP clients to AI providers via Provider Router.

## MCP Protocol Implementation

### Supported MCP Methods

| Method | Description | Status | Parameters |
|--------|-------------|--------|------------|
| `initialize` | Initialize MCP session | ✅ | `clientInfo`, `capabilities` |
| `models/list` | List available models | ✅ | None |
| `completion/complete` | Generate text completion | ✅ | `prompt`, `model?`, `maxTokens?` |
| `tools/list` | List available tools | 🔄 | None |
| `tools/call` | Execute tool function | 🔄 | `name`, `arguments` |
| `resources/list` | List available resources | 📋 | None |
| `resources/read` | Read resource content | 📋 | `uri` |

**Legend**: ✅ Implemented, 🔄 Planned, 📋 Future

### MCP Capabilities

```json
{
  "capabilities": {
    "models": {
      "listChanged": true
    },
    "completion": {
      "supportsStreaming": false
    },
    "tools": {
      "supportsProgress": false
    },
    "resources": {
      "subscribe": false,
      "listChanged": false
    }
  }
}
```

## Configuration

### Environment Variables

**Provider API Keys** (at least one required):
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`

**Optional Settings**:
- `DEFAULT_PROVIDER`: Default provider name
- `DEFAULT_MODEL`: Default model name
- `LOG_LEVEL`: Logging level (`debug`, `info`, `warn`, `error`)

### Configuration File

Alternatively, use configuration file (see Configuration Loader spec for format).

## Transport

### Protocol
JSON-RPC 2.0 over stdin/stdout

### Startup
1. Load configuration
2. Initialize Provider Router
3. Register MCP method handlers
4. Begin listening on stdin

### Shutdown
Graceful shutdown on SIGTERM, complete in-flight requests

## Request/Response Flow

1. **MCP Client** sends JSON-RPC request via stdin
2. **MCP Server** validates request format
3. **Provider Router** routes to appropriate provider
4. **Provider Connector** calls AI provider API
5. **MCP Server** formats response as JSON-RPC
6. **MCP Client** receives response via stdout

### Example Request

```json
{
  "jsonrpc": "2.0",
  "method": "completion/complete",
  "params": {
    "prompt": "Hello, world!",
    "model": "gpt-4o"
  },
  "id": 1
}
```

### Example Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "message": {
      "role": "assistant",
      "content": "Hi! How can I help you today?"
    },
    "usage": {
      "promptTokens": 3,
      "completionTokens": 8,
      "totalTokens": 11
    }
  },
  "id": 1
}
```

## Error Handling

### Error Code Mapping

#### MCP Protocol Errors
- `-32700`: Parse Error (Invalid JSON)
- `-32600`: Invalid Request (Invalid JSON-RPC)
- `-32601`: Method Not Found
- `-32602`: Invalid Params

#### Gateway Errors  
- `-32001`: Authentication Error
- `-32002`: Rate Limited
- `-32003`: Model Not Found
- `-32004`: Provider Unavailable

#### Internal Errors
- `-32005`: Configuration Error
- `-32006`: Network Error
- `-32007`: Timeout Error

### Retry Strategy
- **Retryable Errors**: Rate limit, network, timeout
- **Max Retries**: 3 attempts
- **Backoff**: Exponential (1s, 2s, 4s)

## Security

### Credentials
- API keys from environment variables or config file
- Never log API keys
- Never include credentials in error messages

### Input Validation
- Validate JSON-RPC format
- Validate method names
- Validate parameter types

### Output
- Sanitize error messages (no sensitive data)
- Log to stderr, not stdout
