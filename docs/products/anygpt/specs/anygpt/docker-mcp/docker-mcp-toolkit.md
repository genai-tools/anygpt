# Docker MCP Toolkit Integration Specification

**Related Use Case**: [Docker MCP Toolkit Integration](../use-cases/docker-mcp-toolkit.md)  
**Related Specs**:

- [Docker Container](./docker-container.md) - Container build requirements
- [Docker Registry Submission](./docker-registry-submission.md) - Registry submission process

**Official Docker Documentation**: [Docker MCP Toolkit](https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/)

Specification for running AnyGPT MCP server in Docker MCP Toolkit as a centralized server for multiple MCP clients.

## Overview

This specification covers the **end-to-end integration** with Docker Desktop MCP Toolkit. For detailed requirements, see:

- **[docker-container.md](./docker-container.md)** - Dockerfile, runtime, and testing requirements
- **[docker-registry-submission.md](./docker-registry-submission.md)** - server.yaml format and submission process

This document focuses on **usage patterns** and **client configuration**.

## Container Requirements

**See [docker-container.md](./docker-container.md)** for complete container specifications including:

- Dockerfile requirements
- Runtime behavior
- Security requirements
- Testing procedures

**Summary**:

- Image available via registry (`mcp/anygpt` or `ghcr.io/org/anygpt-mcp`)
- MCP server on stdin/stdout
- Logs to stderr only
- Configuration via environment variables

## Docker Compose Format

### Minimal Configuration

```yaml
services:
  anygpt-mcp:
    image: ghcr.io/org/anygpt-mcp:latest
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
```

### Full Configuration

```yaml
services:
  anygpt-mcp:
    image: ghcr.io/org/anygpt-mcp:latest
    environment:
      # Provider API Keys
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}

      # Default Settings
      DEFAULT_PROVIDER: openai
      DEFAULT_MODEL: gpt-4o

      # Optional: Logging
      LOG_LEVEL: info

    # Optional: Mount config file
    volumes:
      - ./anygpt.config.yaml:/config/anygpt.config.yaml:ro

    # Optional: Health check
    healthcheck:
      test: ['CMD', 'anygpt', 'config', 'validate']
      interval: 30s
      timeout: 10s
      retries: 3
```

## Environment Variables

### Required

- Provider API keys (at least one):
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `GOOGLE_API_KEY`
  - etc.

### Optional

- `DEFAULT_PROVIDER`: Default provider name (default: first configured)
- `DEFAULT_MODEL`: Default model name
- `LOG_LEVEL`: Logging verbosity (`debug`, `info`, `warn`, `error`)
- `CONFIG_FILE`: Path to configuration file (if using file-based config)

## MCP Client Configuration

### Docker Desktop MCP Toolkit

Clients connect via Docker exec:

```json
{
  "mcpServers": {
    "anygpt": {
      "command": "docker",
      "args": ["exec", "-i", "anygpt-mcp", "anygpt-mcp"]
    }
  }
}
```

### Windsurf

```json
{
  "mcpServers": {
    "anygpt": {
      "command": "docker",
      "args": ["exec", "-i", "anygpt-mcp", "anygpt-mcp"]
    }
  }
}
```

### VS Code / Cursor / Kilocode

Same configuration format as Windsurf.

## Container Behavior

### Startup

1. Load configuration from environment variables or config file
2. Validate configuration (check required API keys)
3. Initialize MCP server
4. Begin listening on stdin

### Request Handling

1. Read JSON-RPC request from stdin
2. Route to appropriate provider
3. Write JSON-RPC response to stdout
4. Log to stderr (not stdout)

### Error Handling

- Configuration errors: Exit with code 1, log error to stderr
- Runtime errors: Return JSON-RPC error response, continue running
- Provider errors: Return error to client, continue running

### Shutdown

- Graceful shutdown on SIGTERM
- Complete in-flight requests
- Exit with code 0

## Exit Codes

- `0`: Clean shutdown
- `1`: Configuration error
- `2`: Initialization error
- `3`: Fatal runtime error

## Security

### Credentials

- API keys via environment variables (Docker secrets recommended)
- Never log API keys
- Never include API keys in error messages

### Network

- No network ports exposed (stdin/stdout only)
- All communication via Docker exec

### Filesystem

- Configuration file read-only if mounted
- No persistent state required
- Stateless operation

## Health Check

Container must support health check command:

```bash
anygpt config validate
```

**Exit codes**:

- `0`: Configuration valid, server healthy
- Non-zero: Configuration invalid or server unhealthy

## Example Usage

### Start Container

```bash
docker compose up -d anygpt-mcp
```

### Test Connection

```bash
echo '{"jsonrpc":"2.0","method":"ping","id":1}' | \
  docker exec -i anygpt-mcp anygpt-mcp
```

**Expected output**:

```json
{ "jsonrpc": "2.0", "result": "pong", "id": 1 }
```

### View Logs

```bash
docker compose logs anygpt-mcp
```

### Stop Container

```bash
docker compose down
```

## Compatibility

### Docker Desktop MCP Toolkit

- Must work with Docker Desktop MCP Toolkit
- Must support `docker exec` communication
- Must handle stdin/stdout correctly

### Multiple Clients

- Support concurrent connections from multiple clients
- Each client gets independent session
- No shared state between clients

## Registry Submission

To submit AnyGPT to the official Docker MCP Registry, see **[docker-registry-submission.md](./docker-registry-submission.md)** for:

- `server.yaml` format and examples
- Testing workflow with `task` commands
- Submission process and requirements
- Post-submission maintenance

## Non-Goals

- HTTP/REST API (MCP protocol only)
- Persistent storage (stateless)
- Web UI (CLI/MCP only)
- Authentication (handled by Docker/host)

## References

- [Docker Container Spec](./docker-container.md) - Build and runtime requirements
- [Docker Registry Submission Spec](./docker-registry-submission.md) - Submission process
- [Docker MCP Registry](https://github.com/docker/mcp-registry) - Official registry
- [Docker MCP Toolkit Docs](https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/) - Official documentation
- [MCP Protocol Spec](https://modelcontextprotocol.io/introduction) - Protocol details
