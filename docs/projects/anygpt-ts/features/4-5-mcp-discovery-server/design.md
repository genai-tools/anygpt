# MCP Discovery Server - Design

**Spec**: [MCP Discovery](../../../../products/anygpt/specs/anygpt/mcp-discovery.md)  
**Project**: AnyGPT TypeScript  
**Status**: 🔄 In Progress

## Overview

MCP protocol server that exposes the Discovery Engine via 5 meta-tools, enabling AI agents to discover and execute tools from 100+ MCP servers without loading everything into context.

**This is the PRIMARY interface** - AI agents connect to this MCP server for agentic tool discovery and execution.

**Key Capability**: True gateway - AI agents can discover AND execute tools through a single MCP connection.

## Architecture

### High-Level Flow

```
AI Agent (Claude Desktop, Windsurf, Cursor)
    ↓ stdio (MCP Protocol)
MCP Discovery Server
    ├─→ list_mcp_servers (meta-tool)
    ├─→ search_tools (meta-tool)
    ├─→ list_tools (meta-tool)
    ├─→ get_tool_details (meta-tool)
    └─→ execute_tool (meta-tool - gateway!)
        ↓ Uses Discovery Engine
    Discovery Engine (4-4)
        ↓ Proxies to actual MCP servers
    Actual MCP Servers (github, filesystem, etc)
```

### Components

#### 1. MCP Server Core

**Purpose**: Handle MCP protocol communication via stdio.

**Responsibilities**:
- Initialize MCP server with stdio transport
- Handle MCP protocol handshake
- Register meta-tools
- Route tool calls to handlers
- Handle errors and return responses

**Interface**:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

class MCPDiscoveryServer {
  private server: Server;
  private transport: StdioServerTransport;
  private engine: DiscoveryEngine;
  
  constructor(engine: DiscoveryEngine);
  
  async start(): Promise<void>;
  async stop(): Promise<void>;
  
  private registerTools(): void;
  private handleToolCall(name: string, args: any): Promise<any>;
}
```

**MCP SDK Integration**:
- Use `@modelcontextprotocol/sdk` for protocol implementation
- Use `StdioServerTransport` for stdin/stdout communication
- Register tools via `server.setRequestHandler(ListToolsRequestSchema, ...)`
- Handle tool calls via `server.setRequestHandler(CallToolRequestSchema, ...)`

#### 2. Meta-Tool Handlers

**Purpose**: Implement the 5 meta-tools that expose discovery functionality.

##### Handler 1: list_mcp_servers

**Tool Definition**:
```typescript
{
  name: 'list_mcp_servers',
  description: 'List all available MCP servers with metadata',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
}
```

**Implementation**:
```typescript
async function handleListServers(): Promise<ToolResponse> {
  const servers = await engine.listServers();
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(servers, null, 2)
    }]
  };
}
```

**Response Format**:
```json
{
  "servers": [
    {
      "name": "github",
      "description": "GitHub API integration",
      "toolCount": 15,
      "enabledCount": 15,
      "status": "connected"
    }
  ]
}
```

##### Handler 2: search_tools

**Tool Definition**:
```typescript
{
  name: 'search_tools',
  description: 'Search for tools across all MCP servers using free-text query',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Free-text search query'
      },
      server: {
        type: 'string',
        description: 'Optional: filter by server name'
      },
      limit: {
        type: 'number',
        description: 'Optional: max results (default: 10)'
      }
    },
    required: ['query']
  }
}
```

**Implementation**:
```typescript
async function handleSearchTools(args: {
  query: string;
  server?: string;
  limit?: number;
}): Promise<ToolResponse> {
  const results = await engine.searchTools(args.query, {
    server: args.server,
    limit: args.limit || 10
  });
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(results, null, 2)
    }]
  };
}
```

**Response Format**:
```json
{
  "results": [
    {
      "server": "github",
      "tool": "create_issue",
      "summary": "Create a new GitHub issue",
      "relevance": 0.95,
      "tags": ["github", "issues"]
    }
  ]
}
```

##### Handler 3: list_tools

**Tool Definition**:
```typescript
{
  name: 'list_tools',
  description: 'List all tools from a specific MCP server',
  inputSchema: {
    type: 'object',
    properties: {
      server: {
        type: 'string',
        description: 'Server name'
      },
      includeDisabled: {
        type: 'boolean',
        description: 'Include disabled tools (default: false)'
      }
    },
    required: ['server']
  }
}
```

**Implementation**:
```typescript
async function handleListTools(args: {
  server: string;
  includeDisabled?: boolean;
}): Promise<ToolResponse> {
  const tools = await engine.listTools(args.server, args.includeDisabled);
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ server: args.server, tools }, null, 2)
    }]
  };
}
```

##### Handler 4: get_tool_details

**Tool Definition**:
```typescript
{
  name: 'get_tool_details',
  description: 'Get detailed description and parameters for a specific tool',
  inputSchema: {
    type: 'object',
    properties: {
      server: {
        type: 'string',
        description: 'Server name'
      },
      tool: {
        type: 'string',
        description: 'Tool name'
      }
    },
    required: ['server', 'tool']
  }
}
```

**Implementation**:
```typescript
async function handleGetToolDetails(args: {
  server: string;
  tool: string;
}): Promise<ToolResponse> {
  const details = await engine.getToolDetails(args.server, args.tool);
  
  if (!details) {
    throw new Error(`Tool not found: ${args.server}:${args.tool}`);
  }
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(details, null, 2)
    }]
  };
}
```

##### Handler 5: execute_tool (Gateway!)

**Tool Definition**:
```typescript
{
  name: 'execute_tool',
  description: 'Execute a tool from any discovered MCP server (proxy the call)',
  inputSchema: {
    type: 'object',
    properties: {
      server: {
        type: 'string',
        description: 'Server name'
      },
      tool: {
        type: 'string',
        description: 'Tool name'
      },
      arguments: {
        type: 'object',
        description: 'Tool arguments'
      }
    },
    required: ['server', 'tool', 'arguments']
  }
}
```

**Implementation**:
```typescript
async function handleExecuteTool(args: {
  server: string;
  tool: string;
  arguments: any;
}): Promise<ToolResponse> {
  const result = await engine.executeTool(
    args.server,
    args.tool,
    args.arguments
  );
  
  if (!result.success) {
    throw new Error(
      `Tool execution failed: ${result.error?.message || 'Unknown error'}`
    );
  }
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result.result, null, 2)
    }]
  };
}
```

**Response Format (Success)**:
```json
{
  "success": true,
  "result": {
    "issue_number": 123,
    "url": "https://github.com/owner/repo/issues/123",
    "title": "Bug report",
    "state": "open"
  }
}
```

**Response Format (Error)**:
```json
{
  "success": false,
  "error": {
    "code": "TOOL_EXECUTION_ERROR",
    "message": "Failed to create issue: API rate limit exceeded",
    "server": "github",
    "tool": "create_issue"
  }
}
```

#### 3. Configuration Manager

**Purpose**: Load and manage discovery configuration.

**Responsibilities**:
- Load configuration from `anygpt.config.ts`
- Provide default configuration for zero-config setup
- Support configuration reload

**Interface**:
```typescript
class ConfigurationManager {
  loadConfig(configPath?: string): Promise<DiscoveryConfig>;
  getDefaultConfig(): DiscoveryConfig;
  reload(): Promise<void>;
}
```

**Zero-Config Default**:
```typescript
const DEFAULT_CONFIG: DiscoveryConfig = {
  enabled: true,
  cache: {
    enabled: true,
    ttl: 3600 // 1 hour
  },
  sources: [
    // Auto-discover from common locations (future feature)
  ],
  toolRules: [
    // No rules = all tools enabled by default
  ]
};
```

#### 4. Server Lifecycle Manager

**Purpose**: Manage server startup, shutdown, and graceful termination.

**Responsibilities**:
- Start MCP server
- Handle SIGINT/SIGTERM for graceful shutdown
- Close connections to MCP servers
- Clean up resources

**Interface**:
```typescript
class ServerLifecycleManager {
  async start(server: MCPDiscoveryServer): Promise<void>;
  async stop(): Promise<void>;
  
  private setupSignalHandlers(): void;
  private async gracefulShutdown(): Promise<void>;
}
```

### Data Flow

#### Agentic Discovery Workflow

**Example: User asks to create a GitHub issue**

```
1. User → AI Agent: "Create a GitHub issue for this bug"

2. AI Agent → MCP Discovery Server: search_tools("github issue create")
   ↓
   Discovery Engine: Search index, calculate relevance
   ↓
   Response: [{server: "github", tool: "create_issue", relevance: 0.95}]

3. AI Agent → MCP Discovery Server: get_tool_details("github", "create_issue")
   ↓
   Discovery Engine: Load from cache or fetch from server
   ↓
   Response: {parameters: [{name: "repo", type: "string", ...}]}

4. AI Agent → MCP Discovery Server: execute_tool({
     server: "github",
     tool: "create_issue",
     arguments: {repo: "owner/repo", title: "Bug", body: "..."}
   })
   ↓
   Discovery Engine: Validate tool is enabled
   ↓
   Tool Execution Proxy: Connect to github MCP server
   ↓
   GitHub MCP Server: Execute create_issue
   ↓
   Response: {issue_number: 123, url: "..."}

5. AI Agent → User: "Created issue #123 at https://..."
```

**Token Usage**:
- Initial context: 500 tokens (5 meta-tools)
- Search: 200 tokens
- Tool details: 100 tokens
- Execution: 150 tokens
- **Total: 950 tokens** vs 100,000+ tokens (99% reduction)

## Dependencies

### Internal Dependencies

| Dependency | Purpose |
|------------|---------|
| `@anygpt/mcp-discovery` (4-4) | Discovery Engine - core logic |
| `@anygpt/mcp` (2-3) | MCP server utilities (if any) |
| `@anygpt/config` | Configuration loading |
| `@anygpt/types` | Type definitions |

### External Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| `@modelcontextprotocol/sdk` | MCP protocol implementation | `^0.5.0` |

## Error Handling

### Error Types

```typescript
// MCP protocol errors
class MCPProtocolError extends Error {
  code: number; // JSON-RPC error code
  data?: any;
}

// Tool execution errors (passed through from engine)
class ToolExecutionError extends Error {
  code: string;
  server: string;
  tool: string;
}
```

### Error Codes (JSON-RPC)

| Code | Name | Description |
|------|------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid request | Invalid request object |
| -32601 | Method not found | Tool not found |
| -32602 | Invalid params | Invalid tool parameters |
| -32603 | Internal error | Server error |

### Error Handling Strategy

1. **Configuration errors**: Log and exit with error code
2. **Tool not found**: Return JSON-RPC error -32601
3. **Invalid parameters**: Return JSON-RPC error -32602
4. **Execution errors**: Return JSON-RPC error -32603 with details
5. **Connection errors**: Log and mark server as disconnected

## Implementation Strategy

### Phase 1: MCP Server Setup

**Goal**: Initialize MCP server with stdio transport.

Tasks:
- [ ] Set up MCP SDK integration
- [ ] Implement MCPDiscoveryServer class
- [ ] Configure stdio transport
- [ ] Implement MCP protocol handshake
- [ ] Add error handling
- [ ] Unit tests for server initialization

**Acceptance**:
- Server starts successfully
- MCP handshake works
- Stdio communication works
- Errors are handled gracefully

### Phase 2: Discovery Meta-Tools (4 tools)

**Goal**: Implement discovery meta-tools (without execution).

Tasks:
- [ ] Implement list_mcp_servers handler
- [ ] Implement search_tools handler
- [ ] Implement list_tools handler
- [ ] Implement get_tool_details handler
- [ ] Register tools with MCP server
- [ ] Unit tests for each handler
- [ ] Integration tests with Discovery Engine

**Acceptance**:
- All 4 meta-tools are registered
- Each tool returns correct response format
- Integration with Discovery Engine works
- Error handling works

### Phase 3: Execution Meta-Tool (Gateway!)

**Goal**: Implement execute_tool for true gateway capability.

Tasks:
- [ ] Implement execute_tool handler
- [ ] Integrate with Tool Execution Proxy
- [ ] Handle execution responses
- [ ] Handle execution errors
- [ ] Add security validation (enabled tools only)
- [ ] Unit tests for execution handler
- [ ] Integration tests with mock MCP server

**Acceptance**:
- execute_tool proxies calls correctly
- Results are returned to AI agent
- Errors are handled gracefully
- Only enabled tools can be executed
- Streaming works (if supported)

### Phase 4: Configuration Management

**Goal**: Load and manage discovery configuration.

Tasks:
- [ ] Implement ConfigurationManager
- [ ] Load config from anygpt.config.ts
- [ ] Provide zero-config defaults
- [ ] Support configuration reload
- [ ] Unit tests for config loading

**Acceptance**:
- Configuration loads correctly
- Zero-config works out of the box
- Configuration reload works
- Validation errors are handled

### Phase 5: Server Lifecycle

**Goal**: Manage server startup and graceful shutdown.

Tasks:
- [ ] Implement ServerLifecycleManager
- [ ] Handle SIGINT/SIGTERM signals
- [ ] Graceful shutdown (close connections)
- [ ] Resource cleanup
- [ ] Integration tests for lifecycle

**Acceptance**:
- Server starts and stops cleanly
- Signal handlers work
- Connections are closed on shutdown
- Resources are cleaned up

### Phase 6: Testing & Documentation

**Goal**: Comprehensive testing and documentation.

Tasks:
- [ ] Unit tests for all components (target: 90%+ coverage)
- [ ] Integration tests (full MCP workflows)
- [ ] E2E tests with real AI agents (manual)
- [ ] MCP protocol compliance tests
- [ ] API documentation
- [ ] Usage examples

**Acceptance**:
- 90%+ code coverage
- All spec requirements tested
- MCP protocol compliance verified
- Documentation complete

### Phase 7: Packaging & Distribution

**Goal**: Package for NPM distribution.

Tasks:
- [ ] Create package.json
- [ ] Add bin entry for CLI execution
- [ ] Create executable script
- [ ] Add README with setup instructions
- [ ] Publish to NPM (test registry first)

**Acceptance**:
- Package can be installed via npm
- `npx @anygpt/discovery` works
- Zero-config setup works
- Documentation is clear

## Zero-Configuration Setup

**Goal**: Make it trivial for users to enable discovery.

**User adds to Claude Desktop config**:
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

**Server behavior**:
1. Loads default configuration (all tools enabled)
2. Starts MCP server on stdio
3. Exposes 5 meta-tools
4. AI agent can immediately start discovering tools

**Advanced configuration** (optional):
```typescript
// anygpt.config.ts
export default {
  discovery: {
    enabled: true,
    cache: {
      enabled: true,
      ttl: 3600
    },
    toolRules: [
      {
        pattern: ['*github*'],
        enabled: true,
        tags: ['github']
      }
    ]
  }
};
```

## Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Initial context | <600 tokens | 5 meta-tools |
| Tool call latency | <50ms | MCP protocol overhead |
| Search latency | <150ms | Including engine time |
| Execution latency | <500ms | Depends on underlying server |
| Memory usage | <50MB | Server overhead only |

## Security Considerations

1. **Tool execution validation**: Only execute enabled tools
2. **Input validation**: Validate all tool arguments
3. **Audit logging**: Log all tool executions
4. **Error sanitization**: Don't leak sensitive info in errors
5. **Resource limits**: Prevent DoS via excessive requests

## Open Questions

- [ ] **How to handle MCP server connection pooling?** → Delegate to Discovery Engine (4-4)
- [ ] **Should we support concurrent tool executions?** → Yes, via async handlers
- [ ] **How to handle long-running tool executions?** → Return immediately, support polling if needed
- [ ] **What's the timeout strategy for tool execution?** → 30s default, configurable
- [ ] **Should we support resources and prompts?** → Future feature, focus on tools first

## References

- **Spec**: [MCP Discovery](../../../../products/anygpt/specs/anygpt/mcp-discovery.md)
- **Use Case**: [On-Demand MCP Tool Discovery](../../../../products/anygpt/cases/mcp-tool-discovery.md)
- **Architecture**: [System Design](../../architecture.md)
- **Related Features**:
  - [4-4-mcp-discovery-engine](../4-4-mcp-discovery-engine/README.md) - Core discovery logic (dependency)
  - [4-6-cli-discovery-commands](../4-6-cli-discovery-commands/README.md) - CLI interface (sibling)
  - [2-3-mcp-server-core](../2-3-mcp-server-core/README.md) - MCP server patterns (reference)
