/**
 * MCP (Model Context Protocol) Types
 *
 * All types related to MCP servers, tools, and configuration.
 */

import type { Rule } from '@anygpt/rules';

/**
 * MCP Server configuration
 */
export interface MCPServerConfig {
  /** Server name (required when using array format) */
  name?: string;
  /** Command to execute */
  command: string;
  /** Command arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Human-readable description */
  description?: string;
  /** Source/origin of this server config (e.g., 'docker-mcp-plugin', 'config-file', 'claude-desktop') */
  source?: string;
  /** Whether this server is enabled (default: true) */
  enabled?: boolean;
  /** Optional tool name prefix (e.g., 'github' -> 'github:create_issue') */
  prefix?: string;
  /** Optional metadata (e.g., tool count for disabled servers) */
  metadata?: {
    toolCount?: number;
    [key: string]: unknown;
  };
}

/**
 * MCP Server rule target for rule engine
 *
 * Simplified server metadata for filtering/configuring MCP servers.
 */
export interface MCPServerRuleTarget
  extends Record<string, string | boolean | string[]> {
  /** Server name */
  name: string;
  /** Whether server is enabled */
  enabled: boolean;
  /** Server tags */
  tags: string[];
  /** Tool name prefix (empty string if none, e.g., 'github:' -> 'github:create_issue') */
  prefix: string;
}

/**
 * MCP Tool rule target for rule engine
 *
 * Simplified tool metadata containing only primitive values
 * that can be matched and transformed by the rule engine.
 */
export interface MCPToolRuleTarget
  extends Record<string, string | boolean | string[]> {
  /** Server name */
  server: string;
  /** Tool name */
  name: string;
  /** Whether tool is enabled */
  enabled: boolean;
  /** Tool tags */
  tags: string[];
}

/**
 * MCP Discovery source configuration
 */
export interface MCPDiscoverySource {
  /** Source type */
  type: string;
  /** Path to configuration file */
  path?: string;
  /** URL to configuration */
  url?: string;
}

/**
 * MCP Discovery cache configuration
 */
export interface MCPDiscoveryCache {
  /** Whether caching is enabled */
  enabled?: boolean;
  /** Time-to-live in seconds */
  ttl?: number;
}

/**
 * MCP Discovery configuration
 */
export interface MCPDiscoveryConfig {
  /** Whether discovery is enabled */
  enabled?: boolean;
  /** Cache configuration */
  cache?: MCPDiscoveryCache;
  /** Configuration sources */
  sources?: MCPDiscoverySource[];
}

/**
 * MCP Configuration
 *
 * Unified configuration for all MCP-related settings:
 * - servers: MCP server definitions
 * - discovery: Discovery settings
 * - serverRules: Rules for filtering/tagging MCP servers
 * - toolRules: Rules for filtering/tagging tools
 */
export interface MCPConfig {
  /** MCP Server configurations (object or array format) */
  servers?: Record<string, MCPServerConfig> | MCPServerConfig[];

  /** Discovery configuration */
  discovery?: MCPDiscoveryConfig;

  /** Rules for filtering and tagging MCP servers */
  serverRules?: Rule<MCPServerRuleTarget>[];

  /** Rules for filtering and tagging tools */
  toolRules?: Rule<MCPToolRuleTarget>[];
}
