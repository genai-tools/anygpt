# @anygpt/mcp-discovery-server

**MCP Discovery Server** - PRIMARY interface for AI agents to discover and execute tools from 100+ MCP servers without loading everything into context.

## Overview

This is an MCP protocol server that exposes the Discovery Engine via 5 meta-tools, enabling AI agents to:
- Discover available MCP servers
- Search for tools using free-text queries
- List tools from specific servers
- Get detailed tool information on-demand
- **Execute tools from any MCP server (gateway capability!)**

**Key Capability**: Reduces token consumption from 100,000+ tokens to ~600 tokens per message (99% reduction).

## Installation

```bash
npm install -g @anygpt/mcp-discovery-server
```

Or use directly with npx (no installation needed):

```bash
npx -y @anygpt/mcp-discovery-server
```

## Zero-Configuration Setup

Add to your IDE's MCP configuration:

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### Windsurf

Edit `.windsurf/mcp.json`:

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

### VS Code / Cursor

Edit `.vscode/mcp.json` or `.cursor/mcp.json`:

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

## The 5 Meta-Tools

### 1. list_mcp_servers

List all available MCP servers.

**Parameters**: None

**Returns**: Array of server metadata

**Example**:
```typescript
// AI agent calls
list_mcp_servers()

// Returns
{
  "servers": [
    {
      "name": "github",
      "description": "GitHub API tools",
      "toolCount": 25,
      "enabledCount": 25,
      "status": "connected"
    },
    {
      "name": "filesystem",
      "description": "File system operations",
      "toolCount": 15,
      "enabledCount": 15,
      "status": "connected"
    }
  ]
}
```

### 2. search_tools

Search for tools using free-text query with relevance scoring.

**Parameters**:
- `query` (string, required): Search query
- `server` (string, optional): Filter by server name
- `limit` (number, optional): Maximum results (default: 10)

**Returns**: Array of matching tools with relevance scores

**Example**:
```typescript
// AI agent calls
search_tools({
  query: "github issue",
  limit: 5
})

// Returns
{
  "results": [
    {
      "server": "github",
      "tool": "create_issue",
      "summary": "Create a new GitHub issue",
      "relevance": 0.95,
      "tags": ["github", "issues", "create"]
    },
    {
      "server": "github",
      "tool": "update_issue",
      "summary": "Update an existing GitHub issue",
      "relevance": 0.87,
      "tags": ["github", "issues", "update"]
    }
  ]
}
```

### 3. list_tools

List all tools from a specific MCP server.

**Parameters**:
- `server` (string, required): Server name
- `includeDisabled` (boolean, optional): Include disabled tools

**Returns**: Array of tool summaries

**Example**:
```typescript
// AI agent calls
list_tools({
  server: "github"
})

// Returns
{
  "tools": [
    {
      "server": "github",
      "name": "create_issue",
      "summary": "Create a new GitHub issue",
      "enabled": true,
      "tags": ["github", "issues"]
    },
    // ... more tools
  ]
}
```

### 4. get_tool_details

Get detailed information about a specific tool.

**Parameters**:
- `server` (string, required): Server name
- `tool` (string, required): Tool name

**Returns**: Full tool description with parameters

**Example**:
```typescript
// AI agent calls
get_tool_details({
  server: "github",
  tool: "create_issue"
})

// Returns
{
  "tool": {
    "server": "github",
    "name": "create_issue",
    "summary": "Create a new GitHub issue",
    "description": "Creates a new issue in a GitHub repository...",
    "enabled": true,
    "tags": ["github", "issues", "create"],
    "parameters": [
      {
        "name": "repo",
        "type": "string",
        "description": "Repository name (owner/repo)",
        "required": true
      },
      {
        "name": "title",
        "type": "string",
        "description": "Issue title",
        "required": true
      },
      {
        "name": "body",
        "type": "string",
        "description": "Issue body",
        "required": false
      }
    ]
  }
}
```

### 5. execute_tool (Gateway Capability!)

Execute a tool from any MCP server through the discovery server.

**Parameters**:
- `server` (string, required): Server name
- `tool` (string, required): Tool name
- `arguments` (object, required): Tool arguments

**Returns**: Execution result or error

**Example**:
```typescript
// AI agent calls
execute_tool({
  server: "github",
  tool: "create_issue",
  arguments: {
    repo: "owner/repo",
    title: "Bug report",
    body: "Description of the bug"
  }
})

// Returns
{
  "success": true,
  "result": {
    "issue_number": 123,
    "url": "https://github.com/owner/repo/issues/123"
  }
}
```

## Agentic Discovery Workflow

AI agents can autonomously discover and use tools:

```
User: "Read the README.md file and create a GitHub issue if there are any TODOs"

AI Agent:
1. search_tools({ query: "read file" })
   → Finds "filesystem:read_file"
   
2. get_tool_details({ server: "filesystem", tool: "read_file" })
   → Gets parameters

3. execute_tool({
     server: "filesystem",
     tool: "read_file",
     arguments: { path: "README.md" }
   })
   → Reads file content

4. search_tools({ query: "create github issue" })
   → Finds "github:create_issue"

5. execute_tool({
     server: "github",
     tool: "create_issue",
     arguments: { repo: "owner/repo", title: "TODO", body: "..." }
   })
   → Creates issue
```

**Token Usage**: ~1,000 tokens vs 500,000+ tokens (99.8% savings)

## Features

- **Zero Configuration**: Automatically discovers MCP servers
- **Intelligent Search**: Free-text search with relevance scoring
- **Gateway Capability**: Execute tools from any MCP server
- **Caching**: TTL-based caching for performance
- **Pattern Filtering**: Glob and regex patterns for tool filtering
- **MCP Protocol**: Full MCP protocol compliance

## Architecture

```
AI Agent (Claude Desktop, Windsurf, Cursor)
    ↓ MCP Protocol (stdio)
MCP Discovery Server (5 meta-tools)
    ↓ Uses Discovery Engine
Discovery Engine (search, cache, filter)
    ↓ Proxies to actual MCP servers
Actual MCP Servers (github, filesystem, etc)
```

## Token Savings

| Scenario | Without Discovery | With Discovery | Savings |
|----------|------------------|----------------|---------|
| 10 servers, 150 tools | 100,000+ tokens | 600 tokens | 99.4% |
| Single tool execution | 100,000+ tokens | 1,000 tokens | 99.0% |
| Multi-tool workflow | 500,000+ tokens | 2,000 tokens | 99.6% |

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Start server locally
node dist/cli.js
```

## License

MIT

## Links

- [GitHub Repository](https://github.com/genai-tools/anygpt)
- [Documentation](https://github.com/genai-tools/anygpt/tree/main/packages/mcp-discovery-server)
- [MCP Protocol](https://modelcontextprotocol.io)
