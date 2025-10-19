# E2E Tests: Docker MCP Gateway Plugin

End-to-end tests for `@anygpt/docker-mcp-plugin` that run against actual Docker MCP commands.

## Prerequisites

- Docker Desktop with MCP support installed
- At least one Docker MCP server enabled

## Running Tests

```bash
# Run E2E tests
npx nx test e2e-docker-mcp-gateway --run

# Run with verbose output
npx nx test e2e-docker-mcp-gateway --run --reporter=verbose
```

## Test Coverage

### ✅ Plugin Initialization
- Creates plugin instance correctly
- Has correct name and config function

### ✅ Docker MCP Availability
- Handles missing Docker MCP gracefully
- Returns empty config when unavailable

### ✅ Server Discovery
- Discovers available Docker MCP servers
- Generates valid MCP server configurations

### ✅ Configuration Options
- **Custom prefix**: Applies custom server name prefix
- **Environment variables**: Injects per-server env vars
- **Docker flags**: Applies transport, resource limits, etc.

## Test Behavior

Tests automatically detect if Docker MCP is available:
- ✓ **Available**: Runs full E2E tests against real servers
- ⊘ **Not available**: Skips tests with warning message

## Example Output

```
✓ Docker MCP is available
✓ Discovered 3 servers
✓ Server config: docker mcp gateway run --servers memory --transport stdio
✓ Custom prefix applied: test-memory
✓ Environment variables injected for memory
✓ Docker MCP flags applied correctly
```

## Notes

- Tests use actual `docker mcp` commands (no mocking)
- Tests may take longer due to real command execution
- Timeout set to 30 seconds for E2E operations
- Tests are safe to run - they only read, never modify servers
