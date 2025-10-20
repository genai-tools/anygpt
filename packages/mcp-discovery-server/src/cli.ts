#!/usr/bin/env node
// Suppress transformers library warnings BEFORE any imports
process.env['TRANSFORMERS_VERBOSITY'] = 'error';

import { DiscoveryMCPServer } from './server.js';
import { loadConfig } from '@anygpt/config';
import type { DiscoveryConfig } from '@anygpt/mcp-discovery';

/**
 * CLI entry point for MCP Discovery Server
 * Starts the server with stdio transport
 */
async function main() {
  
  // Load AnyGPT configuration to get MCP servers
  let mcpServers = {};
  
  try {
    const anygptConfig = await loadConfig();
    // MCP config is nested under mcp.servers
    mcpServers = anygptConfig.mcp?.servers || {};
  } catch {
    // Silently fail - will use empty servers
  }

  // Discovery configuration
  const config: DiscoveryConfig = {
    enabled: true,
    searchMode: 'semantic', // Use semantic search for better accuracy
    cache: {
      enabled: true,
      ttl: 3600, // 1 hour,
    },
    serverRules: [],
    toolRules: [],
  };
  
  // Create and start server with MCP servers
  const server = new DiscoveryMCPServer(config, mcpServers);
  
  await server.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
