# @anygpt/mcp-discovery

> **⚠️ WORK IN PROGRESS**: This package is under active development. APIs and discovery mechanisms may change significantly. Use at your own risk in production environments.

MCP Discovery Engine - Core logic for on-demand MCP tool discovery.

## Overview

Provides search, filtering, caching, and tool execution proxy capabilities to enable AI agents to discover and use tools from 100+ MCP servers without loading everything into context.

**Key Capability**: Reduces token consumption from 100,000+ tokens to ~600 tokens per message (99% reduction).

## Installation

```bash
npm install @anygpt/mcp-discovery
```

## Usage

### Basic Setup

```typescript
import { DiscoveryEngine } from '@anygpt/mcp-discovery';

// Create discovery engine with default configuration
const engine = new DiscoveryEngine({
  enabled: true,
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
  },
});
```

### Search for Tools

```typescript
// Free-text search across all tools
const results = await engine.searchTools('github issue');

// Search with options
const filtered = await engine.searchTools('create', {
  server: 'github', // Filter by server
  limit: 5, // Limit results
});

// Results include relevance scores
results.forEach((result) => {
  console.log(`${result.server}:${result.tool} (${result.relevance})`);
  console.log(`  ${result.summary}`);
  console.log(`  Tags: ${result.tags.join(', ')}`);
});
```

### List and Get Tool Details

```typescript
// List all servers
const servers = await engine.listServers();

// List tools from a specific server
const githubTools = await engine.listTools('github');

// Get detailed information about a tool
const tool = await engine.getToolDetails('github', 'create_issue');
console.log(tool?.description);
console.log(tool?.parameters);
```

### Execute Tools

```typescript
// Execute a tool
const result = await engine.executeTool('github', 'create_issue', {
  repo: 'owner/repo',
  title: 'Bug report',
  body: 'Description of the bug',
});

if (result.success) {
  console.log('Tool executed successfully:', result.result);
} else {
  console.error('Execution failed:', result.error?.message);
}
```

### Advanced Configuration

```typescript
// Configure with tool rules for filtering
const engine = new DiscoveryEngine({
  enabled: true,
  cache: {
    enabled: true,
    ttl: 3600,
  },
  toolRules: [
    // Enable all github tools
    {
      pattern: ['*github*'],
      enabled: true,
      tags: ['github'],
    },
    // Disable dangerous tools
    {
      pattern: ['*delete*', '*remove*'],
      enabled: false,
      tags: ['dangerous'],
    },
    // Server-specific rules
    {
      server: 'jira',
      pattern: ['*ticket*'],
      enabled: true,
      tags: ['jira', 'tickets'],
    },
  ],
});
```

### Pattern Matching

Supports multiple pattern types:

```typescript
// Glob patterns
{ pattern: ['*github*'] }           // Contains 'github'
{ pattern: ['github_*'] }           // Starts with 'github_'
{ pattern: ['*_issue'] }            // Ends with '_issue'

// Regex patterns
{ pattern: ['/^create_/'] }         // Starts with 'create_'
{ pattern: ['/^(create|update)_/'] } // Starts with 'create_' or 'update_'

// Negation patterns
{ pattern: ['!*delete*'] }          // Exclude tools with 'delete'
{ pattern: ['!*dangerous*'] }       // Exclude dangerous tools

// Combined patterns
{
  pattern: ['*github*', '!*delete*'],
  enabled: true
}
```

## Features

- **Configuration Loading**: Load discovery config from TypeScript files
- **Pattern Matching**: Glob and regex patterns for tool filtering
- **Search Engine**: Free-text search with relevance scoring
- **Tool Metadata**: Manage tool metadata with enabled/disabled status
- **Caching**: TTL-based caching for performance
- **Tool Execution**: Proxy tool execution to actual MCP servers

## Documentation

- [Feature Documentation](../../docs/projects/anygpt-ts/features/4-4-mcp-discovery-engine/README.md)
- [Design Document](../../docs/projects/anygpt-ts/features/4-4-mcp-discovery-engine/design.md)
- [Specification](../../docs/products/anygpt/specs/anygpt/mcp-discovery.md)

## License

MIT
