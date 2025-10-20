#!/usr/bin/env node
import { DiscoveryMCPServer } from './server.js';
import type { DiscoveryConfig } from '@anygpt/mcp-discovery';

/**
 * CLI entry point for MCP Discovery Server
 * Starts the server with stdio transport
 */
async function main() {
  // Default configuration
  const config: DiscoveryConfig = {
    enabled: true,
    cache: {
      enabled: true,
      ttl: 3600, // 1 hour
    },
    serverRules: [],
    toolRules: [],
  };

  // Create and start server
  const server = new DiscoveryMCPServer(config);

  // Log to stderr (stdout is used for MCP protocol)
  console.error('MCP Discovery Server starting...');
  console.error('Registered 5 meta-tools:');
  console.error('  - list_mcp_servers');
  console.error('  - search_tools');
  console.error('  - list_tools');
  console.error('  - get_tool_details');
  console.error('  - execute_tool');

  await server.start();
  console.error('MCP Discovery Server ready');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
