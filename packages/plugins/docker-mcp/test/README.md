# Docker MCP Plugin Tests

## Test Structure

```
test/
├── fixtures/           # JSON fixtures matching real docker mcp command output
│   ├── server-list.json
│   ├── server-inspect-basic.json
│   ├── server-inspect-dangerous.json
│   ├── server-inspect-mixed.json
│   └── server-inspect-empty.json
└── index.test.ts      # Test suite
```

## Fixtures

All fixtures match the **exact structure** of real `docker mcp` command outputs:

### `server-list.json`
Raw string output from `docker mcp server ls`:
```json
"test-server-a, test-server-b, test-server-c"
```

### `server-inspect-*.json`
JSON objects matching `docker mcp server inspect <name>` output:
```json
{
  "tools": [
    {
      "name": "tool_name",
      "description": "Tool description",
      "arguments": [...],
      "enabled": true
    }
  ],
  "readme": "# Server Name\n\nDescription..."
}
```

## Test Coverage

### Server Discovery
- ✅ Discover all servers without filters
- ✅ Filter with `includeServers`
- ✅ Exclude with `excludeServers`
- ✅ Handle empty server list
- ✅ Handle docker command failures

### Server Inspection
- ✅ Generate MCP server config structure
- ✅ Include server descriptions from readme
- ✅ Handle servers with no tools

### Tool Rules
- ✅ Apply `toolRules` from config
- ✅ Apply `serverRules` from config

### Environment Variables
- ✅ Inject per-server environment variables

### Plugin Options
- ✅ Custom server prefix
- ✅ Disable auto-discovery

### Edge Cases
- ✅ Malformed JSON from inspect
- ✅ Special characters in server names

## Running Tests

```bash
# Run tests
npx nx test docker-mcp-plugin

# Run with coverage
npx nx test docker-mcp-plugin --coverage

# Watch mode
npx nx test docker-mcp-plugin --watch
```

## Test Variety

The fixtures are designed to cover different scenarios:

1. **Basic Server** (`test-server-a`) - Simple read operations
2. **Dangerous Server** (`test-server-b`) - Operations with dangerous keywords (delete, destroy, force)
3. **Mixed Server** (`test-server-c`) - Full CRUD operations
4. **Empty Server** (`test-server-empty`) - Edge case with no tools

This variety ensures comprehensive test coverage for:
- Tool filtering rules
- Server filtering
- Different tool patterns (get, list, create, delete, etc.)
- Edge cases
