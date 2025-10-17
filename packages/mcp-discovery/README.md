# @anygpt/mcp-discovery

MCP Discovery Engine - Core logic for on-demand MCP tool discovery.

## Overview

Provides search, filtering, caching, and tool execution proxy capabilities to enable AI agents to discover and use tools from 100+ MCP servers without loading everything into context.

**Key Capability**: Reduces token consumption from 100,000+ tokens to ~600 tokens per message (99% reduction).

## Installation

```bash
npm install @anygpt/mcp-discovery
```

## Usage

```typescript
import { DiscoveryEngine } from '@anygpt/mcp-discovery';

// Create discovery engine
const engine = new DiscoveryEngine({
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
});

// List servers
const servers = await engine.listServers();

// Search tools
const results = await engine.searchTools('github issue', {
  limit: 10
});

// Get tool details
const tool = await engine.getToolDetails('github', 'create_issue');

// Execute tool
const result = await engine.executeTool('github', 'create_issue', {
  repo: 'owner/repo',
  title: 'Bug report',
  body: 'Description'
});
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
