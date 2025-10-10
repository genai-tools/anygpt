# Docker MCP Toolkit Integration Specification

**Related Use Case**: [Docker MCP Toolkit Integration](../use-cases/docker-mcp-toolkit.md)

**Official Docker Documentation**: [Docker MCP Toolkit](https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/)

Specification for running AnyGPT MCP server in Docker MCP Toolkit as a centralized server for multiple MCP clients.

## Container Requirements

### Image
Container image must be available via standard container registry.

**Example**: `ghcr.io/org/anygpt-mcp:latest`

### Entrypoint
Container must start MCP server on stdin/stdout when executed.

**Behavior**: 
- Listen on stdin for JSON-RPC requests
- Write JSON-RPC responses to stdout
- Log to stderr (not stdout)

### Configuration
Container accepts configuration via:
- Environment variables
- Mounted configuration file
- Command-line arguments

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
      test: ["CMD", "anygpt", "config", "validate"]
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
{"jsonrpc":"2.0","result":"pong","id":1}
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

## Non-Goals

- HTTP/REST API (MCP protocol only)
- Persistent storage (stateless)
- Web UI (CLI/MCP only)
- Authentication (handled by Docker/host)
