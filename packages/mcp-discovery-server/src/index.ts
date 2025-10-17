/**
 * @anygpt/mcp-discovery-server
 * 
 * MCP Discovery Server - PRIMARY interface for AI agents
 * Exposes 5 meta-tools for tool discovery and execution
 */

// Export server
export { DiscoveryMCPServer } from './server.js';

// Re-export types from mcp-discovery
export type {
  DiscoveryConfig,
  ServerMetadata,
  ToolMetadata,
  SearchResult,
  SearchOptions,
  ExecutionResult
} from '@anygpt/mcp-discovery';
