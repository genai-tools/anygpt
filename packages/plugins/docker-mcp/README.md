# @anygpt/docker-mcp-plugin

AnyGPT plugin for Docker MCP Gateway integration. Auto-discovers Docker MCP servers and generates MCP server configurations with intelligent tool filtering.

## Installation

```bash
npm install @anygpt/docker-mcp-plugin
```

## Usage

```typescript
import { defineConfig } from '@anygpt/config';
import DockerMCP from '@anygpt/docker-mcp-plugin';

export default defineConfig({
  plugins: [
    DockerMCP({
      exclude: ['anygpt'],
    }),
  ],
  mcpServers: {
    git: { command: 'uvx', args: ['mcp-server-git'] },
  },
});
```

## How It Works

1. **Discovers servers** using `docker mcp server ls`
2. **Inspects each server** using `docker mcp server inspect <name>`
3. **Generates MCP config** for each server with tool filtering
4. **Merges into your config** alongside static MCP servers

## Configuration Options

```typescript
interface DockerMCPOptions extends BasePluginOptions {
  // Docker command to use (default: 'docker')
  // Use 'docker.exe' on WSL to access Windows Docker Desktop
  dockerCommand?: string;
  
  // Specific servers to include (if empty, includes all)
  include?: string[];
  
  // Servers to exclude
  exclude?: string[];
  
  // Environment variables per server
  env?: Record<string, Record<string, string>>;
  
  // Docker MCP runtime flags
  flags?: {
    cpus?: number;
    memory?: string;
    longLived?: boolean;
    static?: boolean;
    transport?: 'stdio' | 'sse' | 'streaming';
  };
  
  // Prefix for generated server names (default: '')
  prefix?: string;
  
  // Maximum concurrent server inspections (default: 5)
  concurrency?: number;
  
  // Server filtering rules (from BasePluginOptions)
  serverRules?: Array<{
    when: { name?: string; tags?: string[] };
    set: { enabled?: boolean };
  }>;
  
  // Enable debug logging (from BasePluginOptions)
  debug?: boolean;
}
```

## Examples

### Minimal Setup

```typescript
export default defineConfig({
  plugins: [DockerMCP()],
});
```

Discovers all Docker MCP servers and enables all tools.

### Selective Servers

```typescript
export default defineConfig({
  plugins: [
    DockerMCP({
      include: ['github-official', 'duckduckgo', 'playwright'],
    }),
  ],
});
```

Only configures specified servers.

### WSL with Windows Docker Desktop

```typescript
export default defineConfig({
  plugins: [
    DockerMCP({
      dockerCommand: 'docker.exe', // Use Windows Docker Desktop from WSL
    }),
  ],
});
```

### Environment Variables

```typescript
export default defineConfig({
  plugins: [
    DockerMCP({
      env: {
        'github-official': {
          GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
        },
      },
    }),
  ],
});
```

### Resource Limits

```typescript
export default defineConfig({
  plugins: [
    DockerMCP({
      flags: {
        cpus: 2,
        memory: '4Gb',
        longLived: true,
        transport: 'stdio',
      },
    }),
  ],
});
```

### Concurrency Control

```typescript
export default defineConfig({
  plugins: [
    DockerMCP({
      // Inspect up to 10 servers concurrently (default: 5)
      concurrency: 10,
    }),
  ],
});
```

**Why concurrency matters:**
- **Too high**: Overwhelms system, may hit rate limits
- **Too low**: Slow discovery (sequential bottleneck)
- **Default (5)**: Good balance for most cases
- **Recommended**: 3-10 depending on system resources

**Implementation:** Uses Node.js `Readable.from().map()` with built-in `concurrency` option for efficient parallel processing.

### Server Rules (Disable Specific Servers)

```typescript
export default defineConfig({
  plugins: [
    DockerMCP({
      serverRules: [
        // Disable specific server
        {
          when: { name: 'sequentialthinking' },
          set: { enabled: false }
        },
        // Future: tag-based rules
        // {
        //   when: { tags: ['experimental'] },
        //   set: { enabled: false }
        // }
      ],
    }),
  ],
});
```

**Benefits:**
- Servers are still discovered and shown in `npx anygpt mcp list`
- Marked as disabled (⚪ icon, gray text)
- Not initialized or connected to
- Can see tool count even when disabled
- Easy to re-enable by removing the rule

## Generated Configuration

Given Docker MCP servers: `github-official`, `duckduckgo`, `playwright`

The plugin generates:

```typescript
{
  mcpServers: {
    'github-official': {
      command: 'docker',
      args: [
        'mcp', 'gateway', 'run',
        '--servers', 'github-official',
        '--transport', 'stdio',
      ],
      env: { GITHUB_TOKEN: '...' },
      source: 'docker-mcp-plugin',
      metadata: { toolCount: 49 },
    },
    'duckduckgo': {
      command: 'docker',
      args: [
        'mcp', 'gateway', 'run',
        '--servers', 'duckduckgo',
        '--transport', 'stdio',
      ],
      source: 'docker-mcp-plugin',
      metadata: { toolCount: 2 },
    },
    'sequentialthinking': {
      command: 'docker',
      args: [
        'mcp', 'gateway', 'run',
        '--servers', 'sequentialthinking',
        '--transport', 'stdio',
      ],
      source: 'docker-mcp-plugin',
      enabled: false,  // Disabled by serverRules
      metadata: { toolCount: 1 },
    },
  },
}
```

## Benefits

### 1. Zero Manual Configuration
- Auto-discovers all Docker MCP servers
- No need to manually configure each server
- Automatically updates when servers are added/removed

### 2. Intelligent Tool Filtering
- Pattern-based tool selection (glob patterns)
- Per-server filtering rules
- Security: disable dangerous operations

### 3. Separate Server Instances
- Each Docker MCP server runs independently
- Clear tool attribution (know which tool comes from which server)
- Better isolation and debugging

### 4. Context-Aware
- Access to environment variables
- Access to base configuration
- Can make decisions based on context

## Comparison

### Before (Manual Configuration)

```typescript
export default {
  mcpServers: {
    'docker-mcp': {
      command: 'docker',
      args: ['mcp', 'gateway', 'run', '--enable-all-servers'],
    },
  },
};
```

**Problems:**
- All 150+ tools loaded at once
- 100K+ tokens per message
- Can't tell which tool comes from which server
- No tool filtering

### After (Plugin-Based)

```typescript
export default defineConfig({
  plugins: [
    DockerMCP({
      serverRules: [
        // Disable specific servers
        {
          when: { name: 'sequentialthinking' },
          set: { enabled: false }
        }
      ],
    }),
  ],
});
```

**Benefits:**
- Separate server per Docker MCP server
- Server-level filtering with serverRules
- Clear tool attribution
- Easy to enable/disable servers
- Disabled servers still visible in CLI

## CLI Commands

The plugin enables powerful CLI commands for managing and using MCP servers:

### List Servers

```bash
# List all servers
npx anygpt mcp list

# List only enabled servers
npx anygpt mcp list --enabled

# List only disabled servers
npx anygpt mcp list --disabled
```

**Output:**
```
📦 MCP Servers

  🟢 duckduckgo(docker-mcp-plugin)                 2 tools
  🟢 github-official(docker-mcp-plugin)            49 tools
  ⚪ sequentialthinking(docker-mcp-plugin)         1 tools (disabled)

  ✓ All 2 servers loaded (1 disabled)
```

### Search Tools

```bash
# Search for tools across all servers
npx anygpt mcp search "github"

# Filter by server
npx anygpt mcp search "search" --server github-official
```

### Inspect Tool

```bash
# Auto-resolves server if tool name is unique
npx anygpt mcp inspect search

# Explicit server if needed
npx anygpt mcp inspect search --server duckduckgo
```

**Output:**
```
🔍 Tool Details

  Server: duckduckgo
  Name: search
  Description: Search DuckDuckGo and return formatted results.
  Enabled: ✓ Yes
```

### Execute Tool

```bash
# Simple single parameter (auto-resolves server)
npx anygpt mcp execute search "Eredivisie scores today"

# Multiple parameters (maps to tool schema)
npx anygpt mcp execute search "query here" 5

# Complex JSON for advanced use
npx anygpt mcp execute search --args '{"query": "...", "max_results": 5}'

# Explicit server if needed
npx anygpt mcp execute search "query" --server duckduckgo
```

**How it works:**
1. Auto-resolves server if tool name is unique
2. Gets tool schema to determine parameter names
3. Maps positional args to parameters in order
4. Executes tool and formats output

### List Tools from Server

```bash
# List all tools from a specific server
npx anygpt mcp tools github-official

# Include disabled tools
npx anygpt mcp tools github-official --all
```

## Requirements

- Docker Desktop with MCP Toolkit installed
- Node.js 18+
- `docker mcp` CLI available

## License

MIT
