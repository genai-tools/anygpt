# On-Demand MCP Tool Discovery

## The Problem

When using Docker MCP Toolkit with multiple MCP servers, IDEs load ALL tools from ALL servers into every message context. With 10+ MCP servers enabled, this results in:

- **Token explosion**: 100,000+ tokens per message just for tool descriptions
- **Cost crisis**: $200+ per conversation thread in production environments
- **Performance degradation**: Slow response times due to massive context
- **Scalability limits**: Cannot add more MCP servers without hitting token/cost limits

**Real-world impact**: Enterprise teams using Sourcegraph with Docker MCP Toolkit have experienced $200+ costs for single conversation threads due to tool description overhead.

**Root cause**: MCP protocol loads all tool descriptions upfront. With 150+ tools × ~100 tokens each = 15,000+ tokens. Complex tools with detailed schemas can push this to 100,000+ tokens per message.

## The Solution

Build an MCP server that provides **meta-operations** for tool discovery, enabling AI to search and load tools on-demand instead of loading everything upfront.

Instead of exposing 150+ tools, expose 5 meta-tools:

- `list_mcp_servers` - List available MCP servers
- `search_tools` - Free-text search across all tools
- `list_tools` - List tools from a specific server
- `get_tool_details` - Get detailed description of a specific tool
- `execute_tool` - Execute a tool from any MCP server (proxy the call)

The AI decides what it needs, requests only relevant tools, and **executes them directly** through the discovery gateway.

## Example

### Before: Traditional MCP Approach

**IDE loads all tools upfront:**

```json
{
  "tools": [
    {"name": "github_create_issue", "description": "...", "parameters": {...}},
    {"name": "github_list_repos", "description": "...", "parameters": {...}},
    {"name": "filesystem_read", "description": "...", "parameters": {...}},
    {"name": "filesystem_write", "description": "...", "parameters": {...}},
    // ... 146 more tools
  ]
}
```

**Every message context:**

- 150 tools × 100 tokens = 15,000 tokens minimum
- Complex tools with schemas: 100,000+ tokens
- Cost: $0.10 - $1.00 per message (GPT-4 pricing)

### After: On-Demand Discovery

**IDE loads only meta-tools:**

```json
{
  "tools": [
    { "name": "search_tools", "description": "Search for tools by query" },
    { "name": "list_mcp_servers", "description": "List available MCP servers" },
    { "name": "list_tools", "description": "List tools from specific server" },
    { "name": "get_tool_details", "description": "Get tool details on-demand" },
    {
      "name": "execute_tool",
      "description": "Execute a tool from any MCP server"
    }
  ]
}
```

**AI workflow:**

```
User: "Create a GitHub issue for this bug"

AI thinks: "I need GitHub tools"
AI calls: search_tools("github issue")
Response: [
  {server: "github", tool: "create_issue", summary: "Create GitHub issue"}
]

AI calls: get_tool_details("github", "create_issue")
Response: {full tool description with parameters}

AI calls: execute_tool({
  server: "github",
  tool: "create_issue",
  arguments: {repo: "owner/repo", title: "Bug report", body: "..."}
})
Response: {issue_number: 123, url: "https://github.com/owner/repo/issues/123"}
```

**Token usage:**

- Initial context: 5 tools × 100 tokens = 500 tokens
- Discovery call: ~200 tokens
- Tool details: ~100 tokens
- Tool execution: ~150 tokens
- **Total: 950 tokens vs 100,000 tokens**

## Why Existing Solutions Fall Short

- **mcp-filter** (https://github.com/pro-vi/mcp-filter):

  - Still loads all tools upfront, just filters them
  - 72% reduction, but still thousands of tokens
  - Not true on-demand loading

- **Docker MCP Gateway**:

  - Not implementing on-demand discovery (as of Oct 2025)
  - Issues #186 and #187 filed but no timeline
  - May take months or years to implement

- **Manual enable/disable**:

  - Requires knowing which servers you need beforehand
  - Tedious to manage
  - Doesn't scale beyond a few servers

- **MCP Gateway & Registry** (enterprise solution):
  - Complex setup for individual developers
  - Overkill for most use cases
  - Doesn't solve the fundamental token problem

## Expected Results

**Scenario:** Developer using Docker MCP Toolkit with 15 MCP servers (150+ tools) for a complex debugging session with 20 AI interactions.

### Before: All Tools Loaded

**Token Usage:**

- Tools in context: 100,000 tokens per message
- 20 messages × 100,000 = 2,000,000 tokens
- Input cost: 2M × $0.01/1K = $20.00
- Output tokens: ~500K = $30.00
- **Total cost: $50.00 per session**

**Performance:**

- Message latency: 3-5 seconds (large context processing)
- IDE responsiveness: Sluggish with 150+ tools
- Scalability: Cannot add more servers

### After: On-Demand Discovery

**Token Usage:**

- Meta-tools in context: 400 tokens per message
- 20 messages × 400 = 8,000 tokens
- Discovery calls: ~10 searches × 200 = 2,000 tokens
- Tool details: ~5 tools × 100 = 500 tokens
- **Total input: 10,500 tokens**
- Input cost: 10.5K × $0.01/1K = $0.11
- Output tokens: ~500K = $30.00
- **Total cost: $30.11 per session**

**Performance:**

- Message latency: <1 second (minimal context)
- IDE responsiveness: Fast with 4 meta-tools
- Scalability: Support 100+ servers without degradation

### Measurable Impact

**Cost Savings:**

- Per session: $50.00 → $30.11 = **$19.89 saved (40% reduction)**
- Per month (100 sessions): $5,000 → $3,011 = **$1,989 saved**
- Enterprise (1000 sessions/month): **$19,890 saved per month**

**Token Efficiency:**

- Input tokens: 2,000,000 → 10,500 = **99.5% reduction**
- Context size: 100,000 → 400 tokens = **99.6% reduction**

**Performance:**

- Message latency: 3-5s → <1s = **70% faster**
- Scalability: 15 servers → 100+ servers = **6x more capacity**

**Developer Experience:**

- Tool discovery: Manual search → AI-driven search
- Maintenance: Manual enable/disable → Automatic discovery
- Cognitive load: Remember 150 tools → Search when needed

## Additional Benefits

**Scalability:**

- Support 100+ MCP servers without token explosion
- Add new servers without reconfiguring IDEs
- No performance degradation with more tools

**Flexibility:**

- AI discovers tools based on actual needs
- No need to pre-configure which tools to load
- Adapts to different tasks automatically

**Cost Control:**

- Predictable token usage regardless of available tools
- Pay only for tools actually used
- Enterprise-friendly cost model

**Developer Experience:**

- No need to remember which tools exist
- Natural language search for capabilities
- Reduced cognitive load

## Implementation Notes

**Component**: `@anygpt/mcp-discovery` (new package)

**Key Features:**

- Free-text search across tool descriptions
- Lazy loading of tool details
- Caching of frequently used tools
- Integration with Docker MCP Toolkit
- Support for 100+ MCP servers

**Configuration:**

```typescript
// anygpt.config.ts
{
  mcp: {
    discovery: {
      enabled: true,
      cacheToolDetails: true,
      servers: [
        { name: "github", connection: "docker://github-mcp" },
        { name: "filesystem", connection: "docker://filesystem-mcp" },
        // ... 100+ servers
      ]
    }
  }
}
```

**Meta-Tools API:**

```typescript
// list_mcp_servers
returns: Array<{name: string, description: string, toolCount: number}>

// search_tools(query: string, server?: string)
returns: Array<{server: string, tool: string, summary: string, relevance: number}>

// list_tools(server: string)
returns: Array<{name: string, summary: string}>

// get_tool_details(server: string, tool: string)
returns: {name: string, description: string, parameters: object, examples: array}
```

## Related Use Cases

- [Docker MCP Toolkit Integration](./docker-mcp-toolkit.md) - Centralized MCP configuration
- [MCP Server](./mcp-server.md) - Cross-component agent interaction
- [Cost Optimization](./cost-optimization.md) - Intelligent model routing

## References

- **Problem Documentation**: https://github.com/ThePlenkov/issue-reporter/tree/master/problems/docker-mcp-toolkit-token-usage
- **Docker MCP Toolkit**: https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/
- **mcp-filter**: https://github.com/pro-vi/mcp-filter
- **MCP Protocol**: https://modelcontextprotocol.io/
