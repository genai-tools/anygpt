import { DiscoveryEngine } from '@anygpt/mcp-discovery';
import type { CLIContext } from '../../utils/cli-context.js';

interface ListOptions {
  status?: boolean;
  tools?: boolean;
  json?: boolean;
}

/**
 * List all configured MCP servers
 */
export async function mcpListCommand(
  context: CLIContext,
  options: ListOptions
): Promise<void> {
  const { config, logger } = context;

  try {
    // Initialize discovery engine
    const discoveryConfig = config.discovery || {
      enabled: true,
      cache: { enabled: true, ttl: 3600 }
    };
    
    const engine = new DiscoveryEngine(discoveryConfig, config.mcpServers);
    
    // Get all servers
    const servers = await engine.listServers();
    
    if (options.json) {
      console.log(JSON.stringify(servers, null, 2));
      return;
    }
    
    // Human-friendly output
    if (servers.length === 0) {
      console.log('No MCP servers configured.');
      console.log('\nTo add MCP servers, configure them in your AnyGPT config file.');
      return;
    }
    
    console.log(`\n📦 MCP Servers (${servers.length})\n`);
    
    for (const server of servers) {
      console.log(`  ${server.name}`);
      console.log(`    ${server.description}`);
      
      if (options.status) {
        const statusIcon = server.status === 'connected' ? '✓' : '✗';
        console.log(`    Status: ${statusIcon} ${server.status}`);
      }
      
      if (options.tools) {
        console.log(`    Tools: ${server.enabledCount}/${server.toolCount} enabled`);
      }
      
      console.log('');
    }
  } catch (error) {
    logger.error('Failed to list MCP servers:', error);
    throw error;
  }
}
