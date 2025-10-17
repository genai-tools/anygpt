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
export { type CacheConfig, type ConfigSource, type ConfigSourceType, ConfigurationLoader, type DiscoveryConfig, type ExecutionError, type ExecutionResult, type MCPServerConfig, PatternMatcher, type SearchOptions, type SearchResult, type ServerMetadata, type ToolExample, type ToolMetadata, type ToolParameter, type ToolRule, type ValidationResult };
//# sourceMappingURL=index.d.ts.map