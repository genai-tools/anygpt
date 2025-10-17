/**
 * Discovery configuration types
 */

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Whether caching is enabled */
  enabled: boolean;
  /** Time-to-live in seconds */
  ttl: number;
}

/**
 * Tool rule for pattern-based filtering
 */
export interface ToolRule {
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
export type ConfigSourceType = 'docker-mcp' | 'claude-desktop' | 'windsurf' | 'custom';

/**
 * Configuration source
 */
export interface ConfigSource {
  /** Source type */
  type: ConfigSourceType;
  /** Path to configuration file */
  path: string;
}

/**
 * Discovery configuration
 */
export interface DiscoveryConfig {
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
export interface MCPServerConfig {
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
export interface ServerMetadata {
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
 * Tool parameter definition
 */
export interface ToolParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: string;
  /** Parameter description */
  description?: string;
  /** Whether parameter is required */
  required: boolean;
  /** Default value */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default?: any;
}

/**
 * Tool example
 */
export interface ToolExample {
  /** Example description */
  description: string;
  /** Example parameters */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters: Record<string, any>;
}

/**
 * Tool metadata
 */
export interface ToolMetadata {
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
export interface SearchOptions {
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
export interface SearchResult {
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
export interface ExecutionError {
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
export interface ExecutionResult {
  /** Whether execution was successful */
  success: boolean;
  /** Execution result data */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
  /** Execution error (if failed) */
  error?: ExecutionError;
}
