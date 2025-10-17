# MCP Discovery Engine - Design

**Spec**: [MCP Discovery](../../../../products/anygpt/specs/anygpt/mcp-discovery.md)  
**Project**: AnyGPT TypeScript  
**Status**: 🔄 In Progress

## Overview

Core discovery logic for on-demand MCP tool discovery. Provides search, filtering, caching, and tool execution proxy capabilities to enable AI agents to discover and use tools from 100+ MCP servers without loading everything into context.

**Key Capability**: Reduces token consumption from 100,000+ tokens to ~600 tokens per message (99% reduction).

## Architecture

### Components

#### 1. Configuration Loader

**Purpose**: Load and validate discovery configuration from TypeScript config.

**Responsibilities**:
- Load `discovery` section from `anygpt.config.ts`
- Parse tool rules with pattern matching
- Validate configuration schema
- Provide default configuration

**Interface**:
```typescript
interface DiscoveryConfig {
  enabled: boolean;
  cache?: CacheConfig;
  sources?: ConfigSource[];
  toolRules?: ToolRule[];
}

interface ToolRule {
  pattern: string[];
  server?: string;
  enabled?: boolean;
  tags?: string[];
}

class ConfigurationLoader {
  load(configPath?: string): Promise<DiscoveryConfig>;
  validate(config: DiscoveryConfig): ValidationResult;
}
```

**Dependencies**:
- `@anygpt/config` (config-loader, glob-matcher)
- `@anygpt/types` (type definitions)

#### 2. Pattern Matcher

**Purpose**: Match tool names against glob and regex patterns.

**Responsibilities**:
- Support glob patterns (`*github*`, `github_*`, `!*delete*`)
- Support regex patterns (`/^create_/`, `/\b(read|list)\b/i`)
- Support negation patterns (`!*dangerous*`)
- Server-specific pattern matching

**Interface**:
```typescript
interface PatternMatcher {
  match(toolName: string, patterns: string[]): boolean;
  matchWithServer(toolName: string, serverName: string, rule: ToolRule): boolean;
}
```

**Algorithm**:
1. Process patterns in order
2. Handle negation patterns (prefix `!`)
3. Detect regex patterns (wrapped in `/`)
4. Apply glob matching for non-regex patterns
5. Return true if any pattern matches (AND logic within rule)

**Reuse**: Pattern matching logic already exists in `@anygpt/config` - reuse the glob-matcher!

#### 3. Tool Metadata Manager

**Purpose**: Store and manage tool metadata from MCP servers.

**Responsibilities**:
- Store tool metadata (name, description, parameters, tags)
- Apply pattern-based filtering
- Track enabled/disabled status
- Accumulate tags from matching rules
- Provide efficient lookup

**Data Structure**:
```typescript
interface ToolMetadata {
  server: string;
  name: string;
  summary: string;
  description?: string;
  parameters?: ToolParameter[];
  examples?: ToolExample[];
  enabled: boolean;
  tags: string[];
}

interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

class ToolMetadataManager {
  // Store tool metadata
  addTool(tool: ToolMetadata): void;
  
  // Apply filtering rules
  applyRules(rules: ToolRule[]): void;
  
  // Query tools
  getToolsByServer(server: string, includeDisabled?: boolean): ToolMetadata[];
  getTool(server: string, tool: string): ToolMetadata | null;
  getAllTools(includeDisabled?: boolean): ToolMetadata[];
  
  // Statistics
  getToolCount(server: string): number;
  getEnabledCount(server: string): number;
}
```

**Filtering Algorithm**:
1. For each tool, iterate through toolRules in order
2. Check if pattern matches tool name
3. If server-specific rule, check server name
4. First matching rule determines enabled/disabled status
5. Accumulate tags from ALL matching rules
6. If any rule has `enabled: true`, whitelist mode (default disabled)

#### 4. Search Engine

**Purpose**: Free-text search across tool descriptions with relevance scoring.

**Responsibilities**:
- Index tool metadata for fast search
- Calculate relevance scores
- Rank results by relevance
- Support server-specific filtering
- Apply result limits

**Interface**:
```typescript
interface SearchResult {
  server: string;
  tool: string;
  summary: string;
  relevance: number;
  tags: string[];
}

class SearchEngine {
  // Build search index
  index(tools: ToolMetadata[]): void;
  
  // Search with relevance scoring
  search(query: string, options?: SearchOptions): SearchResult[];
}

interface SearchOptions {
  server?: string;
  limit?: number;
  includeDisabled?: boolean;
}
```

**Search Algorithm**:
1. Tokenize query (lowercase, split by whitespace)
2. For each tool:
   - Calculate exact match score (tool name or description contains exact query)
   - Calculate partial match score (tokens match)
   - Calculate tag match score
3. Combine scores with weights:
   - Exact match: 1.0
   - Partial match: 0.5
   - Tag match: 0.3
4. Sort by relevance score (descending)
5. Apply limit
6. Return results

**Optimization**: Use simple in-memory indexing for initial implementation. Can upgrade to full-text search library if needed.

#### 5. Caching Layer

**Purpose**: Cache server list, tool summaries, and tool details to improve performance.

**Responsibilities**:
- Cache server list (TTL-based)
- Cache tool summaries per server (TTL-based)
- Cache tool details (indefinite, until config reload)
- Provide cache invalidation

**Interface**:
```typescript
interface CacheConfig {
  enabled: boolean;
  ttl: number; // seconds
}

class CachingLayer {
  // Server list cache
  cacheServerList(servers: ServerMetadata[], ttl: number): void;
  getServerList(): ServerMetadata[] | null;
  
  // Tool summaries cache (per server)
  cacheToolSummaries(server: string, tools: ToolMetadata[], ttl: number): void;
  getToolSummaries(server: string): ToolMetadata[] | null;
  
  // Tool details cache (indefinite)
  cacheToolDetails(server: string, tool: string, details: ToolMetadata): void;
  getToolDetails(server: string, tool: string): ToolMetadata | null;
  
  // Invalidation
  invalidate(key?: string): void;
  invalidateAll(): void;
}
```

**Cache Strategy**:
- **Server list**: TTL-based (default 1 hour)
- **Tool summaries**: TTL-based per server (default 1 hour)
- **Tool details**: Indefinite (until config reload or manual invalidation)
- **Eviction**: Simple TTL-based expiration

**Implementation**: Use in-memory Map with timestamp tracking for initial implementation.

#### 6. Tool Execution Proxy

**Purpose**: Connect to actual MCP servers and proxy tool execution requests.

**Responsibilities**:
- Establish connections to MCP servers (stdio)
- Proxy tool execution requests
- Handle responses and errors
- Support streaming responses (if MCP server supports it)
- Connection pooling and lifecycle management

**Interface**:
```typescript
interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: ExecutionError;
}

interface ExecutionError {
  code: string;
  message: string;
  server: string;
  tool: string;
}

class ToolExecutionProxy {
  // Execute tool on remote MCP server
  execute(server: string, tool: string, arguments: any): Promise<ExecutionResult>;
  
  // Connection management
  connect(server: string, config: MCPServerConfig): Promise<void>;
  disconnect(server: string): Promise<void>;
  isConnected(server: string): boolean;
  
  // Streaming support
  executeStream(server: string, tool: string, arguments: any): AsyncIterator<any>;
}
```

**Connection Strategy**:
- Lazy connection: Connect to MCP server on first tool execution
- Connection pooling: Maintain open connections for frequently used servers
- Timeout: Close idle connections after 5 minutes
- Reconnection: Automatic retry on connection failure

**Error Handling**:
- Connection errors: Return `TOOL_EXECUTION_ERROR` with details
- Tool execution errors: Pass through from MCP server
- Timeout errors: Return `TOOL_EXECUTION_TIMEOUT`
- Validation errors: Return `TOOL_VALIDATION_ERROR`

#### 7. Discovery Engine (Facade)

**Purpose**: Main facade that coordinates all components.

**Interface**:
```typescript
class DiscoveryEngine {
  constructor(config: DiscoveryConfig);
  
  // Server operations
  listServers(): Promise<ServerMetadata[]>;
  
  // Tool discovery
  searchTools(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  listTools(server: string, includeDisabled?: boolean): Promise<ToolMetadata[]>;
  getToolDetails(server: string, tool: string): Promise<ToolMetadata | null>;
  
  // Tool execution (NEW!)
  executeTool(server: string, tool: string, arguments: any): Promise<ExecutionResult>;
  
  // Configuration
  reload(): Promise<void>;
  getConfig(): DiscoveryConfig;
}
```

### Data Structures

#### ServerMetadata
```typescript
interface ServerMetadata {
  name: string;
  description: string;
  toolCount: number;
  enabledCount: number;
  status: 'connected' | 'disconnected' | 'error';
  config: MCPServerConfig;
}

interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}
```

#### ToolMetadata
```typescript
interface ToolMetadata {
  server: string;
  name: string;
  summary: string;
  description?: string;
  parameters?: ToolParameter[];
  examples?: ToolExample[];
  enabled: boolean;
  tags: string[];
}
```

### Algorithms

#### Pattern Matching Algorithm

```typescript
function matchPattern(toolName: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Negation pattern
    if (pattern.startsWith('!')) {
      const negPattern = pattern.slice(1);
      if (matchSinglePattern(toolName, negPattern)) {
        return false; // Exclude
      }
      continue;
    }
    
    // Positive pattern
    if (matchSinglePattern(toolName, pattern)) {
      return true;
    }
  }
  return false;
}

function matchSinglePattern(toolName: string, pattern: string): boolean {
  // Regex pattern (wrapped in /)
  if (pattern.startsWith('/') && pattern.endsWith('/')) {
    const regex = parseRegex(pattern);
    return regex.test(toolName);
  }
  
  // Glob pattern
  return globMatch(toolName, pattern);
}
```

**Reuse**: Use existing glob-matcher from `@anygpt/config` package!

#### Search Relevance Scoring

```typescript
function calculateRelevance(tool: ToolMetadata, query: string): number {
  const queryLower = query.toLowerCase();
  const toolNameLower = tool.name.toLowerCase();
  const summaryLower = tool.summary.toLowerCase();
  
  let score = 0;
  
  // Exact match in tool name (highest weight)
  if (toolNameLower.includes(queryLower)) {
    score += 1.0;
  }
  
  // Exact match in summary
  if (summaryLower.includes(queryLower)) {
    score += 0.8;
  }
  
  // Partial match (tokenized)
  const queryTokens = queryLower.split(/\s+/);
  for (const token of queryTokens) {
    if (toolNameLower.includes(token)) {
      score += 0.5;
    }
    if (summaryLower.includes(token)) {
      score += 0.3;
    }
  }
  
  // Tag match
  for (const tag of tool.tags) {
    if (queryLower.includes(tag.toLowerCase())) {
      score += 0.3;
    }
  }
  
  return Math.min(score, 1.0); // Normalize to [0, 1]
}
```

#### Tool Filtering Algorithm

```typescript
function applyToolRules(tools: ToolMetadata[], rules: ToolRule[]): ToolMetadata[] {
  const hasWhitelist = rules.some(r => r.enabled === true);
  
  return tools.map(tool => {
    let enabled = !hasWhitelist; // Default: enabled unless whitelist mode
    const tags: string[] = [...tool.tags];
    
    for (const rule of rules) {
      // Check server-specific rule
      if (rule.server && rule.server !== tool.server) {
        continue;
      }
      
      // Check pattern match
      if (!matchPattern(tool.name, rule.pattern)) {
        continue;
      }
      
      // First match determines enabled/disabled
      if (rule.enabled !== undefined && enabled === !hasWhitelist) {
        enabled = rule.enabled;
      }
      
      // Accumulate tags from all matching rules
      if (rule.tags) {
        tags.push(...rule.tags);
      }
    }
    
    return {
      ...tool,
      enabled,
      tags: [...new Set(tags)] // Deduplicate
    };
  });
}
```

## Dependencies

### Internal Dependencies

| Dependency | Purpose |
|------------|---------|
| `@anygpt/config` | Config loading, glob-matcher for pattern matching |
| `@anygpt/types` | Shared type definitions |

### External Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| `@modelcontextprotocol/sdk` | MCP protocol for server connections | `^0.5.0` |

**Rationale**: Use MCP SDK for standard protocol implementation. No need for heavy search library - simple in-memory indexing is sufficient for initial implementation.

## Error Handling

### Error Types

```typescript
class DiscoveryError extends Error {
  code: string;
  details?: any;
}

// Configuration errors
class ConfigurationError extends DiscoveryError {
  code = 'CONFIGURATION_ERROR';
}

// Server connection errors
class ServerConnectionError extends DiscoveryError {
  code = 'SERVER_CONNECTION_ERROR';
  server: string;
}

// Tool execution errors
class ToolExecutionError extends DiscoveryError {
  code = 'TOOL_EXECUTION_ERROR';
  server: string;
  tool: string;
}

// Tool not found errors
class ToolNotFoundError extends DiscoveryError {
  code = 'TOOL_NOT_FOUND';
  server: string;
  tool: string;
}

// Validation errors
class ValidationError extends DiscoveryError {
  code = 'VALIDATION_ERROR';
}
```

### Error Flow

1. **Configuration errors**: Thrown during initialization, caught by caller
2. **Connection errors**: Logged, server marked as disconnected, error returned to caller
3. **Execution errors**: Wrapped in ExecutionResult with error details
4. **Not found errors**: Return null or empty array (graceful degradation)

## Implementation Strategy

### Phase 1: Configuration & Pattern Matching

**Goal**: Load configuration and implement pattern matching.

Tasks:
- [ ] Define TypeScript interfaces for DiscoveryConfig
- [ ] Implement ConfigurationLoader (load from anygpt.config.ts)
- [ ] Reuse glob-matcher from @anygpt/config
- [ ] Add regex pattern support
- [ ] Implement configuration validation
- [ ] Unit tests for pattern matching

**Acceptance**:
- Configuration loads from TS file
- Glob patterns work (*, ?, [])
- Regex patterns work (/pattern/)
- Negation patterns work (!pattern)
- Server-specific patterns work

### Phase 2: Tool Metadata Management

**Goal**: Store and filter tool metadata.

Tasks:
- [ ] Implement ToolMetadataManager class
- [ ] Add tool storage (in-memory Map)
- [ ] Implement tool filtering algorithm
- [ ] Implement tag accumulation
- [ ] Add enabled/disabled tracking
- [ ] Unit tests for filtering logic

**Acceptance**:
- Tools can be added and retrieved
- Filtering rules apply correctly
- Tags accumulate from multiple rules
- Whitelist mode works
- Enabled/disabled status is correct

### Phase 3: Search Engine

**Goal**: Implement free-text search with relevance scoring.

Tasks:
- [ ] Implement SearchEngine class
- [ ] Build search index (in-memory)
- [ ] Implement relevance scoring algorithm
- [ ] Add result ranking and limiting
- [ ] Support server-specific filtering
- [ ] Unit tests for search algorithm

**Acceptance**:
- Search returns relevant results
- Relevance scores are accurate
- Results are sorted by relevance
- Limit parameter works
- Server filtering works

### Phase 4: Caching Layer

**Goal**: Implement TTL-based caching.

Tasks:
- [ ] Implement CachingLayer class
- [ ] Add TTL-based cache for server list
- [ ] Add TTL-based cache for tool summaries
- [ ] Add indefinite cache for tool details
- [ ] Implement cache invalidation
- [ ] Unit tests for caching logic

**Acceptance**:
- Server list is cached with TTL
- Tool summaries are cached per server
- Tool details are cached indefinitely
- Cache invalidation works
- Expired entries are removed

### Phase 5: Tool Execution Proxy

**Goal**: Connect to MCP servers and proxy tool execution.

Tasks:
- [ ] Implement ToolExecutionProxy class
- [ ] Add MCP server connection (stdio)
- [ ] Implement tool execution proxying
- [ ] Add connection pooling
- [ ] Implement error handling
- [ ] Support streaming responses (if available)
- [ ] Integration tests with mock MCP server

**Acceptance**:
- Can connect to MCP servers
- Tool execution is proxied correctly
- Errors are handled gracefully
- Connection pooling works
- Idle connections are closed

### Phase 6: Discovery Engine Facade

**Goal**: Integrate all components into main facade.

Tasks:
- [ ] Implement DiscoveryEngine class
- [ ] Integrate ConfigurationLoader
- [ ] Integrate ToolMetadataManager
- [ ] Integrate SearchEngine
- [ ] Integrate CachingLayer
- [ ] Integrate ToolExecutionProxy
- [ ] Add reload functionality
- [ ] Integration tests

**Acceptance**:
- All components work together
- Configuration reload works
- Caching improves performance
- Tool execution works end-to-end

### Phase 7: Testing & Documentation

**Goal**: Comprehensive testing and API documentation.

Tasks:
- [ ] Unit tests for all components (target: 85%+ coverage)
- [ ] Integration tests for full workflows
- [ ] Contract tests (spec compliance)
- [ ] Performance tests (search latency, cache hit rate)
- [ ] API documentation (TSDoc comments)
- [ ] Usage examples

**Acceptance**:
- 85%+ code coverage
- All spec requirements tested
- Performance targets met
- API documentation complete

## Open Questions

- [x] **Which search library to use?** → Use simple in-memory indexing initially, can upgrade later if needed
- [ ] **How to handle MCP server connection lifecycle?** → Lazy connection + connection pooling + 5min idle timeout
- [ ] **Should we support hot-reloading of configuration?** → Yes, via reload() method
- [ ] **What's the cache eviction strategy for large deployments?** → TTL-based for now, can add LRU later if needed
- [ ] **How to handle streaming responses?** → Support via AsyncIterator if MCP server supports it

## Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Initial context | <600 tokens | 5 meta-tools with descriptions |
| Search latency | <100ms | In-memory search should be fast |
| Tool details latency | <50ms | Cache hit should be instant |
| Tool execution latency | <500ms | Depends on underlying MCP server |
| Cache hit rate | >80% | Most tools are reused |
| Memory usage | <100MB | For 1000+ tools |

## Security Considerations

1. **Tool execution validation**: Only execute tools that match enabled toolRules
2. **Pattern-based filtering**: Respect disabled patterns (e.g., `!*delete*`)
3. **Audit logging**: Log all tool executions for security audit
4. **Environment isolation**: MCP servers run in separate processes
5. **Input validation**: Validate all tool arguments before proxying

## References

- **Spec**: [MCP Discovery](../../../../products/anygpt/specs/anygpt/mcp-discovery.md)
- **Use Case**: [On-Demand MCP Tool Discovery](../../../../products/anygpt/cases/mcp-tool-discovery.md)
- **Architecture**: [System Design](../../architecture.md)
- **Related Features**:
  - [4-5-mcp-discovery-server](../4-5-mcp-discovery-server/README.md) - Uses this engine for MCP interface
  - [4-6-cli-discovery-commands](../4-6-cli-discovery-commands/README.md) - Uses this engine for CLI interface
