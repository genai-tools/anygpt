# MCP Server Specification

## Overview

This document specifies the MCP server component implementation requirements, protocol compliance, and configuration interface.

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

## Configuration Interface

### Required Environment Variables
- `GATEWAY_URL`: GenAI gateway service URL
- `GATEWAY_API_KEY`: Authentication token

### Optional Environment Variables
- `PROVIDER_TYPE`: Default provider (`openai`, `anthropic`, `local`)
- `DEFAULT_MODEL`: Default model name
- `TIMEOUT`: Request timeout in seconds
- `MAX_RETRIES`: Maximum retry attempts
- `LOG_LEVEL`: Logging level (`debug`, `info`, `warn`, `error`)

### Configuration Schema

```typescript
interface ServerConfig {
  server: {
    name: string;
    version: string;
  };
  gateway: {
    url: string;
    apiKey: string;
    timeout: number;
    retries: {
      max: number;
      delay: number;
      backoff: 'linear' | 'exponential';
    };
  };
  providers: {
    default: string;
    routing: Record<string, string>;
  };
  mcp: {
    capabilities: {
      models: boolean;
      completion: boolean;
      tools: boolean;
      resources: boolean;
    };
  };
}
```

## Initialization Sequence

1. **Configuration Loading**: Environment variables and config file parsing
2. **Gateway Connection**: Connectivity test and API key validation  
3. **MCP Server Setup**: stdio transport and handler registration
4. **Ready State**: Begin accepting MCP requests

## Request Processing

### Request Processing Flow

1. **MCP Request**: Client sends JSON-RPC request via stdin
2. **Validation**: Server validates request format and parameters
3. **Gateway Call**: Server forwards to GenAI Gateway
4. **Response Transform**: Gateway response converted to MCP format
5. **MCP Response**: Server sends JSON-RPC response via stdout

### Response Schema

```typescript
interface MCPResponse {
  jsonrpc: "2.0";
  result?: {
    models?: Array<{
      name: string;
      provider: string;
      capabilities: string[];
    }>;
    completion?: {
      message: {
        role: string;
        content: string;
      };
      usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      };
    };
  };
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number;
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

## Security Requirements

### Authentication
- Gateway API key validation required
- Request signature verification (optional)

### Input Validation  
- JSON schema validation for all MCP requests
- Parameter sanitization and bounds checking
- Rate limiting per client connection

### Output Security
- Sensitive data redaction in logs
- Response size limits enforcement

## Resource Requirements

### Minimum Requirements
- **Memory**: 256MB
- **CPU**: 0.5 cores  
- **Storage**: 100MB

### Scaling Characteristics
- Stateless design (except optional cache)
- Horizontal scaling supported
- Load balancer compatible
