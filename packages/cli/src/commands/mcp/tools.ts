import { DiscoveryEngine } from '@anygpt/mcp-discovery';
import type { CLIContext } from '../../utils/cli-context.js';

interface ToolsOptions {
  all?: boolean;
  tags?: boolean;
  json?: boolean;
}

/**
 * List tools from a specific MCP server
 */
export async function mcpToolsCommand(
  context: CLIContext,
  serverName: string,
  options: ToolsOptions
): Promise<void> {
  const { config, logger } = context;

  try {
    // Initialize discovery engine
    const discoveryConfig = config.discovery || {
      enabled: true,
      cache: { enabled: true, ttl: 3600 }
    };
    
    const engine = new DiscoveryEngine(discoveryConfig, config.mcpServers);
    
    // Get tools from server
    const tools = await engine.listTools(serverName);
    
    if (options.json) {
      console.log(JSON.stringify(tools, null, 2));
      return;
    }
    
    // Human-friendly output
    if (tools.length === 0) {
      console.log(`\nNo tools found in server "${serverName}"`);
      return;
    }
    
    // Filter by enabled status if not --all
    const displayTools = options.all ? tools : tools.filter(t => t.enabled);
    
    console.log(`\n🔧 Tools from "${serverName}" (${displayTools.length}/${tools.length})\n`);
    
    for (const tool of displayTools) {
      const enabledIcon = tool.enabled ? '✓' : '✗';
      console.log(`  ${enabledIcon} ${tool.name}`);
      console.log(`    ${tool.summary}`);
      
      if (options.tags && tool.tags.length > 0) {
        console.log(`    Tags: ${tool.tags.join(', ')}`);
      }
      
      console.log('');
    }
    
    if (!options.all && tools.length > displayTools.length) {
      const disabledCount = tools.length - displayTools.length;
      console.log(`  (${disabledCount} disabled tools hidden, use --all to show)`);
    }
  } catch (error) {
    logger.error('Failed to list tools:', error);
    throw error;
  }
}
