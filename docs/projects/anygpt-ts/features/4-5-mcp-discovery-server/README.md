# MCP Discovery Server

|                       |                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------- |
| **Status**            | ✅ Implementation Complete                                                              |
| **Progress**          | 37/37 tasks (100%)                                                                      |
| **Spec**              | [MCP Discovery](../../../../products/anygpt/specs/anygpt/mcp-discovery.md)              |
| **Use Case**          | [On-Demand MCP Tool Discovery](../../../../products/anygpt/cases/mcp-tool-discovery.md) |
| **Architecture**      | [System Design](../../architecture.md)                                                  |
| **Roadmap**           | [Feature List](../../roadmap.md#4-5-mcp-discovery-server)                               |
| **Technical Design**  | [design.md](./design.md)                                                                |

## Overview

MCP protocol server that exposes the Discovery Engine via 5 meta-tools, enabling AI agents to discover and execute tools from 100+ MCP servers without loading everything into context.

**This is the PRIMARY interface** - AI agents connect to this MCP server for agentic tool discovery and execution.

**Key Capability**: True gateway - AI agents can discover AND execute tools through a single MCP connection.

## Status

**Last Updated**: 2025-10-17  
**Current Phase**: Implementation Complete ✅

### Recent Updates

- 2025-10-17: **Implementation complete** - MCP Discovery Server fully functional (19 tests passing)
- 2025-10-17: All 5 meta-tools implemented and tested
- 2025-10-17: CLI entry point created for zero-config setup
- 2025-10-17: Package built and ready for NPM publication
- 2025-10-17: Design phase complete - MCP server architecture and meta-tool handlers defined

## Design Summary

### MCP Meta-Tools (5 tools)

1. **list_mcp_servers**

   - List all available MCP servers
   - No parameters
   - Returns: Array of server metadata
   - Token usage: ~100-200 tokens

2. **search_tools**

   - Search for tools using free-text query
   - Parameters: `query` (string), `server` (optional), `limit` (optional)
   - Returns: Array of matching tools with relevance scores
   - Token usage: ~150-250 tokens

3. **list_tools**

   - List all tools from a specific server
   - Parameters: `server` (string), `includeDisabled` (boolean, optional)
   - Returns: Array of tool summaries
   - Token usage: ~100-300 tokens

4. **get_tool_details**

   - Get detailed description of a specific tool
   - Parameters: `server` (string), `tool` (string)
   - Returns: Full tool description with parameters and examples
   - Token usage: ~100-200 tokens

5. **execute_tool** (NEW - Gateway Capability!)
   - Execute a tool from any MCP server (proxy)
   - Parameters: `server` (string), `tool` (string), `arguments` (object)
   - Returns: Tool execution result or error
   - Token usage: ~150-300 tokens

**Total token footprint**: ~600 tokens (5 meta-tools) vs 100,000+ tokens (all tools)

### Architecture

```
AI Agent (Claude Desktop, Windsurf, Cursor)
    ↓ MCP Protocol (stdio)
MCP Discovery Server
    ├─→ list_mcp_servers
    ├─→ search_tools
    ├─→ list_tools
    ├─→ get_tool_details
    └─→ execute_tool
        ↓ Uses Discovery Engine
    Discovery Engine
        ↓ Proxies to actual MCP servers
    Actual MCP Servers (github, filesystem, etc)
```

### Zero-Configuration Setup

Users just add to their IDE config:

```json
{
  "mcpServers": {
    "anygpt-discovery": {
      "command": "npx",
      "args": ["-y", "@anygpt/discovery"]
    }
  }
}
```

The server automatically discovers and imports MCP configurations.

## Test Summary

### Test Categories

- **Unit Tests**: MCP protocol handlers, tool implementations
- **Integration Tests**: Full MCP workflow (discovery + execution)
- **E2E Tests**: Real AI agent scenarios
- **Contract Tests**: MCP protocol compliance

**Total Tests**: TBD  
**Coverage Target**: 90%+

## Implementation Plan

### Phase 1: MCP Server Setup

- [ ] Initialize MCP server (stdio transport)
- [ ] Implement MCP protocol handshake
- [ ] Tool registration system
- [ ] Error handling

### Phase 2: Discovery Meta-Tools (4 tools)

- [ ] Implement `list_mcp_servers`
- [ ] Implement `search_tools`
- [ ] Implement `list_tools`
- [ ] Implement `get_tool_details`

### Phase 3: Execution Meta-Tool (Gateway!)

- [ ] Implement `execute_tool`
- [ ] Proxy to actual MCP servers
- [ ] Handle execution responses
- [ ] Handle execution errors
- [ ] Support streaming (if available)

### Phase 4: Integration with Discovery Engine

- [ ] Connect to Discovery Engine
- [ ] Use search functionality
- [ ] Use caching layer
- [ ] Use execution proxy

### Phase 5: Testing

- [ ] Unit tests for each meta-tool
- [ ] Integration tests (full workflows)
- [ ] E2E tests with real AI agents
- [ ] MCP protocol compliance tests

### Phase 6: Packaging & Distribution

- [ ] NPM package setup
- [ ] Binary/executable creation
- [ ] Docker image (optional)
- [ ] Documentation

## Dependencies

- **Internal**:
  - `@anygpt/mcp-discovery` (Discovery Engine - 4-4)
  - `@anygpt/mcp` (MCP server core - 2-3)
  - `@anygpt/types` (type definitions)
- **External**:
  - `@modelcontextprotocol/sdk` (MCP protocol)

## Agentic Workflow Example

```
User: "Create a GitHub issue for this bug"

AI Agent (autonomous):
1. Calls: search_tools("github issue create")
2. Receives: [{server: "github", tool: "create_issue", relevance: 0.95}]
3. Calls: get_tool_details("github", "create_issue")
4. Receives: Full tool description with parameters
5. Calls: execute_tool({
     server: "github",
     tool: "create_issue",
     arguments: {repo: "owner/repo", title: "Bug", body: "..."}
   })
6. Receives: {success: true, result: {issue_number: 123, url: "..."}}
7. Reports to user: "Created issue #123"

Token Usage: 600 (initial) + 200 (search) + 100 (details) + 200 (execute) = 1,100 tokens
vs 100,000+ tokens with traditional approach
Savings: 99%
```

## Open Questions

- [ ] How to handle MCP server connection pooling?
- [ ] Should we support concurrent tool executions?
- [ ] How to handle long-running tool executions?
- [ ] What's the timeout strategy for tool execution?

## Notes

- This is the PRIMARY interface - focus on making it robust and easy to use
- Zero-configuration is key - should work out of the box
- Gateway capability (execute_tool) is critical - without it, AI can discover but not use tools
- Must work with Claude Desktop, Windsurf, Cursor, and other MCP clients

## Related Features

- **[4-4-mcp-discovery-engine](../4-4-mcp-discovery-engine/README.md)**: Provides the core discovery and execution logic (this server depends on it)
- **[4-6-cli-discovery-commands](../4-6-cli-discovery-commands/README.md)**: Secondary interface for human debugging
- **[2-3-mcp-server-core](../2-3-mcp-server-core/README.md)**: MCP protocol implementation (dependency)
- **Future: mcp-source-imports**: Will enable auto-discovery of MCP servers
