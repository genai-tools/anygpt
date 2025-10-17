# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-17

### Added

- **MCP Discovery Server**: PRIMARY interface for AI agents
- **5 Meta-Tools**:
  - `list_mcp_servers` - List all available MCP servers
  - `search_tools` - Free-text search across all tools with relevance scoring
  - `list_tools` - List tools from specific server
  - `get_tool_details` - Get detailed tool information on-demand
  - `execute_tool` - Execute tools from any MCP server (gateway capability!)
- **Zero-Configuration Setup**: Works with npx, no installation needed
- **MCP Protocol Compliance**: Full stdio transport support
- **Discovery Engine Integration**: Uses @anygpt/mcp-discovery for all operations

### Features

- Automatic MCP server discovery
- Free-text search with relevance scoring
- Gateway capability - execute tools through discovery server
- TTL-based caching for performance
- Pattern-based tool filtering
- Structured error handling

### Test Coverage

- 19 tests passing (100% coverage)
- All meta-tools fully tested
- Parameter validation tested
- Error scenarios covered

### Token Savings

- **99% reduction**: 100,000+ tokens → 600 tokens
- Enables agentic tool discovery without context explosion
- Supports multi-tool workflows with minimal token usage

### Dependencies

- `@anygpt/mcp-discovery@0.1.0` - Core discovery engine
- `@anygpt/types@1.2.0` - Type definitions
- `@modelcontextprotocol/sdk@1.20.0` - MCP protocol implementation

### Usage

```bash
# Zero-config setup
npx -y @anygpt/mcp-discovery-server

# Or install globally
npm install -g @anygpt/mcp-discovery-server
mcp-discovery-server
```

### IDE Configuration

Add to Claude Desktop, Windsurf, VS Code, or Cursor:

```json
{
  "mcpServers": {
    "anygpt-discovery": {
      "command": "npx",
      "args": ["-y", "@anygpt/mcp-discovery-server"]
    }
  }
}
```

[0.1.0]: https://github.com/genai-tools/anygpt/releases/tag/mcp-discovery-server@0.1.0
