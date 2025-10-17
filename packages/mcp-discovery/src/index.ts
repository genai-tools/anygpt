/**
 * @anygpt/mcp-discovery
 * MCP Discovery Engine - Core logic for on-demand MCP tool discovery
 */

// Export types
export type {
  CacheConfig,
  ToolRule,
  ConfigSourceType,
  ConfigSource,
  DiscoveryConfig,
  MCPServerConfig,
  ServerMetadata,
  ToolParameter,
  ToolExample,
  ToolMetadata,
  SearchOptions,
  SearchResult,
  ExecutionError,
  ExecutionResult
} from './types.js';

// Export configuration loader
export { ConfigurationLoader } from './configuration-loader.js';
export type { ValidationResult } from './configuration-loader.js';

// Export pattern matcher
export { PatternMatcher } from './pattern-matcher.js';

// Export search engine
export { SearchEngine } from './search-engine.js';

// Export tool metadata manager
export { ToolMetadataManager } from './tool-metadata-manager.js';

// Export caching layer
export { CachingLayer } from './caching-layer.js';

// Export tool execution proxy
export { ToolExecutionProxy } from './tool-execution-proxy.js';

// Export main discovery engine
export { DiscoveryEngine } from './discovery-engine.js';
