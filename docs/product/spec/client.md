# Client Integration Specification

## Overview

This document specifies the integration requirements for MCP clients connecting to GenAI Gateway MCP server.

## Distribution

### Package Names
- **Docker**: `ghcr.io/theplenkov/genai-gateway:mcp`
- **NPM**: `genai-gateway-mcp`

### Repository
- **Source**: `https://github.com/ThePlenkov/genai-gateway`

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GATEWAY_URL` | Base URL of GenAI gateway service | ✅ | - |
| `GATEWAY_API_KEY` | Authentication token for gateway | ✅ | - |
| `PROVIDER_TYPE` | Default AI provider | ❌ | `openai` |
| `DEFAULT_MODEL` | Default model name | ❌ | `gpt-3.5-turbo` |
| `TIMEOUT` | Request timeout (seconds) | ❌ | `30` |
| `MAX_RETRIES` | Maximum retry attempts | ❌ | `3` |
| `LOG_LEVEL` | Logging verbosity | ❌ | `info` |

### Configuration Schema

```typescript
interface ClientConfig {
  gateway: {
    url: string;
    apiKey: string;
    timeout?: number;
    maxRetries?: number;
  };
  providers: {
    default: string;
    [provider: string]: {
      defaultModel?: string;
    };
  };
  mcp: {
    name: string;
    version: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}
```

## MCP Client Integration Requirements

### Transport
- **Protocol**: JSON-RPC 2.0 over stdin/stdout
- **Command**: Docker container or NPM package execution
- **Environment**: Configuration via environment variables

### Required MCP Client Configuration Fields
- **command**: Execution method (`docker` or `npx`)
- **args**: Command arguments including image/package name
- **env**: Environment variables for configuration
