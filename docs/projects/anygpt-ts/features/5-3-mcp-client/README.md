# MCP Discovery Client

|                       |                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------- |
| **Status**            | 🚀 In Progress                                                                              |
| **Progress**          | 6/9 tasks (67%)                                                                             |
| **Spec**              | [Agentic Chat](../../../../products/anygpt/specs/anygpt/agentic-chat.md)                   |
| **Use Case**          | [Agentic CI/CD Automation](../../../../products/anygpt/cases/agentic-cicd-automation.md)   |
| **Architecture**      | [System Design](../../architecture.md)                                                      |
| **Roadmap**           | [Feature List](../../roadmap.md#5-3-mcp-client)                                             |

## Overview

MCP client that connects to `@anygpt/mcp-discovery` server and provides meta-tools for tool discovery and execution. Enables AI to discover and use tools on-demand.

**Key Capability**: On-demand tool discovery with 99% token reduction (100K → 600 tokens).

## Status

**Last Updated**: 2025-10-20  
**Current Phase**: Blocked by 5-2 🔒

**Dependencies**:
- ✅ `@anygpt/mcp-discovery` (exists, implemented)
- 🔒 Feature 5-2 (ai-provider) - Must complete first

## Design Summary

### Core Components

1. **MCP Connection Manager**
   - Start discovery server as child process
   - Stdio transport
   - Connection lifecycle
   - Health checks

2. **Meta-Tool Client**
   - Call `search_tools`
   - Call `list_tools`
   - Call `get_tool_details`
   - Call `execute_tool`
   - Call `list_mcp_servers`

3. **Local Cache**
   - Cache tool search results (5 min TTL)
   - Cache tool details (indefinite)
   - Cache invalidation

### Interface

```typescript
interface MCPDiscoveryClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  searchTools(query: string, server?: string): Promise<ToolSearchResult[]>;
  listTools(server: string): Promise<ToolSummary[]>;
  getToolDetails(server: string, tool: string): Promise<ToolDetails>;
  executeTool(params: ToolExecutionParams): Promise<ToolExecutionResult>;
  listServers(): Promise<ServerInfo[]>;
}

interface ToolSearchResult {
  server: string;
  tool: string;
  summary: string;
  relevance: number;
}

interface ToolExecutionParams {
  server: string;
  tool: string;
  arguments: Record<string, unknown>;
}
```

## Test Summary

### Test Categories

- **Unit Tests**: Connection management, meta-tool calls, caching
- **Integration Tests**: Connect to real discovery server
- **Contract Tests**: MCP protocol compliance

**Total Tests**: 18 planned  
**Coverage Target**: 80%+

## Implementation Plan

### Phase 1: Connection Manager

- [ ] Implement connection manager
- [ ] Start discovery server (child process)
- [ ] Stdio transport setup
- [ ] Health checks
- [ ] Unit tests

**Deliverable**: Can connect to discovery server

### Phase 2: Meta-Tool Client

- [ ] Implement `searchTools`
- [ ] Implement `listTools`
- [ ] Implement `getToolDetails`
- [ ] Implement `executeTool`
- [ ] Implement `listServers`
- [ ] Unit tests

**Deliverable**: Can call all meta-tools

### Phase 3: Caching & Integration

- [ ] Implement local cache
- [ ] Cache invalidation logic
- [ ] Error handling
- [ ] Integration tests

**Deliverable**: Production-ready MCP client

## Dependencies

- **Internal**:
  - `@anygpt/mcp-discovery` (discovery server)
  - `@anygpt/config` (configuration)
  - Feature 5-2 (ai-provider)
- **External**:
  - `@modelcontextprotocol/sdk` (MCP client)

## Success Metrics

**Functional**:
- ✅ Connect to discovery server
- ✅ All meta-tools work
- ✅ Caching works
- ✅ Error handling works

**Performance**:
- Connection time: <500ms
- Tool search: <1s
- Cache hit rate: >80%

**Token Efficiency**:
- Meta-tools: ~600 tokens
- vs Full tools: 100K+ tokens
- Reduction: 99%+

## Scope

### In Scope

- ✅ Connect to `@anygpt/mcp-discovery`
- ✅ Call all 5 meta-tools
- ✅ Local caching
- ✅ Error handling

### Out of Scope

- ❌ Direct MCP server connections (discovery handles it)
- ❌ Tool filtering (discovery handles it)
- ❌ Agentic loop (Feature 5-4)

## Notes

- Use `@anygpt/mcp-discovery` as gateway
- Don't connect directly to MCP servers
- Cache aggressively to reduce discovery calls
- Let discovery server handle tool execution

## Related Features

- **[4-4-mcp-discovery-engine](../4-4-mcp-discovery-engine/README.md)**: Discovery engine we connect to
- **[4-5-mcp-discovery-server](../4-5-mcp-discovery-server/README.md)**: Discovery server we connect to
- **[5-2-ai-provider](../5-2-ai-provider/README.md)**: Provides AI that uses these tools
- **[5-4-agentic-orchestrator](../5-4-agentic-orchestrator/README.md)**: Will orchestrate tool discovery
