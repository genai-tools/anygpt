/**
 * Discovery configuration types
 */

import type { Rule } from '@anygpt/rules';
import type { MCPServerRuleTarget, MCPToolRuleTarget } from '@anygpt/types';

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
 * Configuration source type
 */
export type ConfigSourceType =
  | 'docker-mcp'
  | 'claude-desktop'
  | 'windsurf'
  | 'custom';

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
 * Server initialization progress event
 */
export interface ServerProgress {
  /** Server name */
  server: string;
  /** Progress status */
  status: 'connecting' | 'discovering' | 'connected' | 'error';
  /** Status message */
  message?: string;
  /** Error if status is 'error' */
  error?: string;
  /** Number of tools discovered (if status is 'connected') */
  toolCount?: number;
}

/**
 * Progress callback for initialization
 */
export type ProgressCallback = (progress: ServerProgress) => void;

/**
 * Search mode for tool discovery
 */
export type SearchMode = 'fuzzy' | 'semantic';

/**
 * Discovery configuration
 */
export interface DiscoveryConfig {
  /** Whether discovery is enabled */
  enabled: boolean;
  /** Search mode (default: fuzzy) */
  searchMode?: SearchMode;
  /** Cache configuration */
  cache?: CacheConfig;
  /** Configuration sources */
  sources?: ConfigSource[];
  /** Rules for filtering and tagging MCP servers */
  serverRules?: Rule<MCPServerRuleTarget>[];
  /** Rules for filtering and tagging tools */
  toolRules?: Rule<MCPToolRuleTarget>[];
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
  /** Source/origin of this server config (e.g., 'docker-mcp-plugin', 'config-file', 'claude-desktop') */
  source?: string;
  /** Optional description */
  description?: string;
  /** Optional tool name prefix (e.g., 'github' -> 'github:create_issue') */
  prefix?: string;
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
  /** Tool name (with prefix applied if configured) */
  name: string;
  /** Short summary */
  summary: string;
  /** Detailed description */
  description?: string;
  /** Tool parameters */
  parameters?: ToolParameter[];
  /** Tool input schema (JSON Schema format) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputSchema?: any;
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
  /** Tool name (with prefix applied if configured) */
  tool: string;
  /** Tool summary */
  summary: string;
  /** Relevance score (0-1) */
  relevance: number;
  /** Tool tags */
  tags: string[];
  /** Tool input schema (JSON Schema format) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputSchema?: any;
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
