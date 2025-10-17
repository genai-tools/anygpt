//#region src/types.d.ts
/**
 * Discovery configuration types
 */
/**
 * Cache configuration
 */
interface CacheConfig {
  /** Whether caching is enabled */
  enabled: boolean;
  /** Time-to-live in seconds */
  ttl: number;
}
/**
 * Tool rule for pattern-based filtering
 */
interface ToolRule {
  /** Glob or regex patterns to match tool names */
  pattern: string[];
  /** Optional: server name to apply rule to */
  server?: string;
  /** Whether tools matching this pattern are enabled */
  enabled?: boolean;
  /** Tags to apply to matching tools */
  tags?: string[];
}
/**
 * Configuration source type
 */
type ConfigSourceType = 'docker-mcp' | 'claude-desktop' | 'windsurf' | 'custom';
/**
 * Configuration source
 */
interface ConfigSource {
  /** Source type */
  type: ConfigSourceType;
  /** Path to configuration file */
  path: string;
}
/**
 * Discovery configuration
 */
interface DiscoveryConfig {
  /** Whether discovery is enabled */
  enabled: boolean;
  /** Cache configuration */
  cache?: CacheConfig;
  /** Configuration sources */
  sources?: ConfigSource[];
  /** Tool filtering rules */
  toolRules?: ToolRule[];
}
/**
 * MCP server configuration
 */
interface MCPServerConfig {
  /** Command to execute */
  command: string;
  /** Command arguments */
  args: string[];
  /** Environment variables */
  env?: Record<string, string>;
}
/**
 * Server metadata
 */
interface ServerMetadata {
  /** Server name */
  name: string;
  /** Server description */
  description: string;
  /** Total number of tools */
  toolCount: number;
  /** Number of enabled tools */
  enabledCount: number;
  /** Connection status */
  status: 'connected' | 'disconnected' | 'error';
  /** Server configuration */
  config: MCPServerConfig;
}
/**
 * Tool parameter
 */
interface ToolParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: string;
  /** Parameter description */
  description: string;
  /** Whether parameter is required */
  required: boolean;
}
/**
 * Tool example
 */
interface ToolExample {
  /** Example description */
  description: string;
  /** Example parameters */
  parameters: Record<string, any>;
}
/**
 * Tool metadata
 */
interface ToolMetadata {
  /** Server name */
  server: string;
  /** Tool name */
  name: string;
  /** Short summary */
  summary: string;
  /** Detailed description */
  description?: string;
  /** Tool parameters */
  parameters?: ToolParameter[];
  /** Usage examples */
  examples?: ToolExample[];
  /** Whether tool is enabled */
  enabled: boolean;
  /** Tool tags */
  tags: string[];
}
/**
 * Search options
 */
interface SearchOptions {
  /** Filter by server name */
  server?: string;
  /** Maximum number of results */
  limit?: number;
  /** Include disabled tools */
  includeDisabled?: boolean;
}
/**
 * Search result
 */
interface SearchResult {
  /** Server name */
  server: string;
  /** Tool name */
  tool: string;
  /** Tool summary */
  summary: string;
  /** Relevance score (0-1) */
  relevance: number;
  /** Tool tags */
  tags: string[];
}
/**
 * Execution error
 */
interface ExecutionError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Server name */
  server: string;
  /** Tool name */
  tool: string;
}
/**
 * Execution result
 */
interface ExecutionResult {
  /** Whether execution was successful */
  success: boolean;
  /** Execution result (if successful) */
  result?: any;
  /** Execution error (if failed) */
  error?: ExecutionError;
}
//#endregion
//#region src/configuration-loader.d.ts
/**
 * Validation result
 */
interface ValidationResult {
  /** Whether configuration is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
}
/**
 * Configuration loader for discovery engine
 */
declare class ConfigurationLoader {
  /**
   * Get default configuration
   */
  getDefaultConfig(): DiscoveryConfig;
  /**
   * Validate discovery configuration
   */
  validate(config: any): ValidationResult;
  /**
   * Merge partial configuration with defaults
   */
  mergeWithDefaults(partial: Partial<DiscoveryConfig>): DiscoveryConfig;
}
//#endregion
//#region src/pattern-matcher.d.ts
/**
 * Pattern matcher for tool filtering
 * Reuses glob-matcher from @anygpt/config
 */
declare class PatternMatcher {
  /**
   * Check if a tool name matches any of the patterns
   *
   * @param toolName - Tool name to match
   * @param patterns - Array of glob or regex patterns
   * @returns true if tool matches any pattern
   */
  matchTool(toolName: string, patterns: string[]): boolean;
  /**
   * Check if a tool matches a specific rule
   *
   * @param toolName - Tool name to match
   * @param serverName - Server name
   * @param rule - Tool rule to check
   * @returns true if tool matches the rule
   */
  matchRule(toolName: string, serverName: string, rule: ToolRule): boolean;
  /**
   * Find all rules that match a tool
   *
   * @param toolName - Tool name to match
   * @param serverName - Server name
   * @param rules - Array of tool rules
   * @returns Array of matching rules
   */
  findMatchingRules(toolName: string, serverName: string, rules: ToolRule[]): ToolRule[];
}
//#endregion
//#region src/search-engine.d.ts
/**
 * Search engine for tool discovery with relevance scoring
 */
declare class SearchEngine {
  private tools;
  /**
   * Index tools for search
   *
   * @param tools - Array of tool metadata to index
   */
  index(tools: ToolMetadata[]): void;
  /**
   * Search for tools with relevance scoring
   *
   * @param query - Search query
   * @param options - Search options
   * @returns Array of search results sorted by relevance
   */
  search(query: string, options?: SearchOptions): SearchResult[];
  /**
   * Calculate relevance score for a tool
   *
   * @param tool - Tool metadata
   * @param query - Lowercase query string
   * @param queryTokens - Query split into tokens
   * @returns Relevance score (0-1)
   */
  private calculateRelevance;
}
//#endregion
//#region src/tool-metadata-manager.d.ts
/**
 * Tool metadata manager for storing and filtering tools
 */
declare class ToolMetadataManager {
  private tools;
  private patternMatcher;
  /**
   * Add or update a tool
   *
   * @param tool - Tool metadata to add
   */
  addTool(tool: ToolMetadata): void;
  /**
   * Get a specific tool
   *
   * @param server - Server name
   * @param tool - Tool name
   * @returns Tool metadata or null if not found
   */
  getTool(server: string, tool: string): ToolMetadata | null;
  /**
   * Get all tools from a specific server
   *
   * @param server - Server name
   * @param includeDisabled - Include disabled tools
   * @returns Array of tool metadata
   */
  getToolsByServer(server: string, includeDisabled?: boolean): ToolMetadata[];
  /**
   * Get all tools from all servers
   *
   * @param includeDisabled - Include disabled tools
   * @returns Array of tool metadata
   */
  getAllTools(includeDisabled?: boolean): ToolMetadata[];
  /**
   * Apply filtering rules to all tools
   *
   * @param rules - Array of tool rules
   */
  applyRules(rules: ToolRule[]): void;
  /**
   * Get total tool count for a server
   *
   * @param server - Server name
   * @returns Total tool count
   */
  getToolCount(server: string): number;
  /**
   * Get enabled tool count for a server
   *
   * @param server - Server name
   * @returns Enabled tool count
   */
  getEnabledCount(server: string): number;
  /**
   * Generate a unique key for a tool
   *
   * @param server - Server name
   * @param tool - Tool name
   * @returns Unique key
   */
  private getToolKey;
}
//#endregion
//#region src/caching-layer.d.ts
/**
 * Caching layer for discovery engine
 * Supports TTL-based caching for servers and tool summaries
 * Indefinite caching for tool details
 */
declare class CachingLayer {
  private cache;
  /**
   * Cache server list with TTL
   *
   * @param servers - Array of server metadata
   * @param ttl - Time-to-live in seconds
   */
  cacheServerList(servers: ServerMetadata[], ttl: number): void;
  /**
   * Get cached server list
   *
   * @returns Cached server list or null if not cached/expired
   */
  getServerList(): ServerMetadata[] | null;
  /**
   * Cache tool summaries for a specific server with TTL
   *
   * @param server - Server name
   * @param tools - Array of tool metadata
   * @param ttl - Time-to-live in seconds
   */
  cacheToolSummaries(server: string, tools: ToolMetadata[], ttl: number): void;
  /**
   * Get cached tool summaries for a specific server
   *
   * @param server - Server name
   * @returns Cached tool summaries or null if not cached/expired
   */
  getToolSummaries(server: string): ToolMetadata[] | null;
  /**
   * Cache tool details indefinitely
   *
   * @param server - Server name
   * @param tool - Tool name
   * @param details - Tool metadata with full details
   */
  cacheToolDetails(server: string, tool: string, details: ToolMetadata): void;
  /**
   * Get cached tool details
   *
   * @param server - Server name
   * @param tool - Tool name
   * @returns Cached tool details or null if not cached
   */
  getToolDetails(server: string, tool: string): ToolMetadata | null;
  /**
   * Invalidate a specific cache key
   *
   * @param key - Cache key to invalidate (e.g., 'servers', 'tools:github')
   */
  invalidate(key: string): void;
  /**
   * Invalidate all caches
   */
  invalidateAll(): void;
  /**
   * Get cached value if not expired
   *
   * @param key - Cache key
   * @returns Cached value or null if not cached/expired
   */
  private get;
}
//#endregion
//#region src/tool-execution-proxy.d.ts
/**
 * Tool execution proxy for connecting to MCP servers
 *
 * Note: This is the initial implementation that provides the interface.
 * Full MCP SDK integration will be added in the next iteration.
 */
declare class ToolExecutionProxy {
  private connections;
  /**
   * Execute a tool on a remote MCP server
   *
   * @param server - Server name
   * @param tool - Tool name
   * @param args - Tool arguments
   * @returns Execution result
   */
  execute(server: string, tool: string, args: any): Promise<ExecutionResult>;
  /**
   * Connect to an MCP server
   *
   * @param server - Server name
   * @param config - Server configuration
   */
  connect(server: string, config: MCPServerConfig): Promise<void>;
  /**
   * Disconnect from an MCP server
   *
   * @param server - Server name
   */
  disconnect(server: string): Promise<void>;
  /**
   * Check if connected to a server
   *
   * @param server - Server name
   * @returns true if connected
   */
  isConnected(server: string): boolean;
}
//#endregion
//#region src/discovery-engine.d.ts
/**
 * Main discovery engine facade that coordinates all components
 */
declare class DiscoveryEngine {
  private config;
  private configLoader;
  private patternMatcher;
  private searchEngine;
  private metadataManager;
  private cache;
  private executionProxy;
  constructor(config: DiscoveryConfig);
  /**
   * List all available MCP servers
   *
   * @returns Array of server metadata
   */
  listServers(): Promise<ServerMetadata[]>;
  /**
   * Search for tools across all servers
   *
   * @param query - Search query
   * @param options - Search options
   * @returns Array of search results
   */
  searchTools(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  /**
   * List tools from a specific server
   *
   * @param server - Server name
   * @param includeDisabled - Include disabled tools
   * @returns Array of tool metadata
   */
  listTools(server: string, includeDisabled?: boolean): Promise<ToolMetadata[]>;
  /**
   * Get detailed information about a specific tool
   *
   * @param server - Server name
   * @param tool - Tool name
   * @returns Tool metadata or null if not found
   */
  getToolDetails(server: string, tool: string): Promise<ToolMetadata | null>;
  /**
   * Execute a tool from any discovered MCP server
   *
   * @param server - Server name
   * @param tool - Tool name
   * @param args - Tool arguments
   * @returns Execution result
   */
  executeTool(server: string, tool: string, args: any): Promise<ExecutionResult>;
  /**
   * Reload configuration
   */
  reload(): Promise<void>;
  /**
   * Get current configuration
   *
   * @returns Current discovery configuration
   */
  getConfig(): DiscoveryConfig;
  /**
   * Apply configuration to components
   */
  private applyConfiguration;
}
//#endregion
export { type CacheConfig, CachingLayer, type ConfigSource, type ConfigSourceType, ConfigurationLoader, type DiscoveryConfig, DiscoveryEngine, type ExecutionError, type ExecutionResult, type MCPServerConfig, PatternMatcher, SearchEngine, type SearchOptions, type SearchResult, type ServerMetadata, type ToolExample, ToolExecutionProxy, type ToolMetadata, ToolMetadataManager, type ToolParameter, type ToolRule, type ValidationResult };
//# sourceMappingURL=index.d.ts.map