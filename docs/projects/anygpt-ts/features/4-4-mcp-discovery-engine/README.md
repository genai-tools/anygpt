# MCP Discovery Engine

|                  |                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Status**       | ❌ Not Started                                                                          |
| **Progress**     | 0/0 tasks                                                                               |
| **Spec**         | [MCP Discovery](../../../../products/anygpt/specs/anygpt/mcp-discovery.md)              |
| **Use Case**     | [On-Demand MCP Tool Discovery](../../../../products/anygpt/cases/mcp-tool-discovery.md) |
| **Architecture** | [System Design](../../architecture.md)                                                  |
| **Roadmap**      | [Feature List](../../roadmap.md#4-4-mcp-discovery-engine)                               |

## Overview

Core discovery logic for on-demand MCP tool discovery. Provides search, filtering, caching, and tool execution proxy capabilities to enable AI agents to discover and use tools from 100+ MCP servers without loading everything into context.

**Key Capability**: Reduces token consumption from 100,000+ tokens to ~600 tokens per message (99% reduction).

## Status

**Last Updated**: 2025-10-17  
**Current Phase**: Not Started

### Recent Updates

- 2025-10-17: Feature created, awaiting design

## Design Summary

### Core Components

1. **Configuration Loader**

   - Load discovery configuration from TypeScript config
   - Support `discovery` section in `anygpt.config.ts`
   - Tool rules with pattern matching (glob, regex, negation)
   - Configuration validation

2. **Search Engine**

   - Free-text search across tool descriptions
   - Relevance scoring (exact, partial, tag matches)
   - Result ranking and limiting
   - Search indexing for performance

3. **Tool Metadata Manager**

   - Store tool metadata from MCP servers
   - Track enabled/disabled status
   - Apply pattern-based filtering
   - Tag management

4. **Caching Layer**

   - Cache server list (TTL-based)
   - Cache tool summaries (per-server)
   - Cache tool details (indefinite)
   - Cache invalidation strategy

5. **Tool Execution Proxy**
   - Connect to actual MCP servers
   - Proxy tool execution requests
   - Handle responses and errors
   - Support streaming (if MCP server supports it)

### Key Algorithms

**Pattern Matching** (reuse from `@anygpt/config`):

- Glob patterns: `*github*`, `*issue*`
- Regex patterns: `/^(create|update)_/`, `/\\b(read|list)\\b/i`
- Negation: `!*delete*`, `!*dangerous*`
- Server-specific: `{server: "github", pattern: ["*issue*"]}`

**Search Relevance Scoring**:

- Exact match: weight 1.0
- Partial match: weight 0.5
- Tag match: weight 0.3
- Sort by score descending

**Tool Filtering**:

- Apply toolRules in order
- First-match-wins for enabled/disabled
- Accumulate tags from all matching rules
- Whitelist mode if any rule has `enabled: true`

## Test Summary

### Test Categories

- **Unit Tests**: Configuration loading, pattern matching, search algorithm, caching
- **Integration Tests**: Tool metadata management, execution proxy
- **Contract Tests**: Spec compliance

**Total Tests**: TBD  
**Coverage Target**: 85%+

## Implementation Plan

### Phase 1: Configuration & Pattern Matching

- [ ] Load discovery configuration from TS config
- [ ] Parse tool rules
- [ ] Implement pattern matching (reuse glob-matcher)
- [ ] Configuration validation

### Phase 2: Search Engine

- [ ] Build search index from tool metadata
- [ ] Implement relevance scoring algorithm
- [ ] Free-text search with ranking
- [ ] Result limiting

### Phase 3: Tool Metadata Management

- [ ] Store tool metadata structure
- [ ] Apply pattern-based filtering
- [ ] Track enabled/disabled status
- [ ] Tag accumulation

### Phase 4: Caching Layer

- [ ] Implement TTL-based cache for server list
- [ ] Per-server cache for tool summaries
- [ ] Indefinite cache for tool details
- [ ] Cache invalidation logic

### Phase 5: Tool Execution Proxy

- [ ] Connect to MCP servers (stdio)
- [ ] Proxy tool execution requests
- [ ] Handle responses and errors
- [ ] Support streaming responses

### Phase 6: Testing & Documentation

- [ ] Unit tests for all components
- [ ] Integration tests
- [ ] Contract tests (spec compliance)
- [ ] API documentation

## Dependencies

- **Internal**:
  - `@anygpt/config` (config-loader, glob-matcher)
  - `@anygpt/types` (type definitions)
- **External**:
  - MCP SDK for server connections
  - Search/indexing library (TBD)

## Open Questions

- [ ] Which search/indexing library to use? (simple in-memory vs full-text search)
- [ ] How to handle MCP server connection lifecycle?
- [ ] Should we support hot-reloading of configuration?
- [ ] What's the cache eviction strategy for large deployments?

## Scope

### In Scope (Initial Implementation)

- ✅ TypeScript configuration (`anygpt.config.ts` with `discovery` section)
- ✅ Manual MCP server definitions in config
- ✅ Pattern-based tool filtering (glob, regex, negation)
- ✅ Search engine with relevance scoring
- ✅ Tool metadata management
- ✅ Caching layer
- ✅ Tool execution proxy

### Out of Scope (Future Feature)

- ❌ Auto-import from Docker MCP Toolkit
- ❌ Auto-import from Claude Desktop
- ❌ Auto-import from Windsurf
- ❌ Auto-import from VS Code/Cursor

**Rationale**: Keep initial implementation focused and simple. External source imports can be added as a separate Phase 5 feature (e.g., "4-7-mcp-source-imports") once core functionality is proven.

## Notes

- Focus on core functionality: search, filter, cache, execute
- Pattern matching already exists in `@anygpt/config` - reuse it!
- Users define MCP servers directly in `anygpt.config.ts`
- Zero-config for simple cases (just enable discovery with default settings)

## Related Features

- **[4-5-mcp-discovery-server](../4-5-mcp-discovery-server/README.md)**: Uses this engine to expose MCP meta-tools (PRIMARY interface)
- **[4-6-cli-discovery-commands](../4-6-cli-discovery-commands/README.md)**: Uses this engine for CLI commands (SECONDARY interface)
- **Future: mcp-source-imports**: Will add auto-import from Docker MCP, Claude Desktop, Windsurf
