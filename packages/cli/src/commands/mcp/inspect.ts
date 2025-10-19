import { DiscoveryEngine } from '@anygpt/mcp-discovery';
import type { CLIContext } from '../../utils/cli-context.js';

interface InspectOptions {
  server?: string;
  examples?: boolean;
  json?: boolean;
}

/**
 * Get detailed information about a specific tool
 */
export async function mcpInspectCommand(
  context: CLIContext,
  toolName: string,
  options: InspectOptions
): Promise<void> {
  const { config, logger } = context;

  // Initialize discovery engine
  const discoveryConfig = config.discovery || {
    enabled: true,
    cache: { enabled: true, ttl: 3600 }
  };
  
  const engine = new DiscoveryEngine(discoveryConfig, config.mcpServers);

  try {
    // Initialize with progress
    process.stdout.write('🔄 Initializing MCP servers...');
    await engine.initialize();
    process.stdout.write('\r\x1b[K'); // Clear line
    
    // Auto-resolve server if not provided
    let resolvedServer: string;
    const serverName = options.server;
    
    if (serverName) {
      // Server explicitly provided via --server flag
      resolvedServer = serverName;
    } else {
      // Auto-resolve: search for tool across all servers
      process.stdout.write('🔍 Searching for tool across servers...');
      const allServers = await engine.listServers();
      process.stdout.write('\r\x1b[K'); // Clear line
      const matchingTools: Array<{ server: string; tool: string }> = [];
      
      for (const server of allServers) {
        if (server.status === 'connected') {
          const tools = await engine.listTools(server.name, false);
          const exactMatch = tools.find(t => t.name === toolName);
          if (exactMatch) {
            matchingTools.push({ server: server.name, tool: toolName });
          }
        }
      }
      
      // If exactly one match, auto-resolve
      if (matchingTools.length === 1) {
        resolvedServer = matchingTools[0].server;
        console.log(`\n🔍 Auto-resolved tool "${toolName}" from server "${resolvedServer}"\n`);
      } else if (matchingTools.length > 1) {
        console.log(`\n⚠ Multiple servers provide tool "${toolName}":\n`);
        for (const match of matchingTools) {
          console.log(`  - ${match.server}`);
        }
        console.log(`\nPlease specify the server: npx anygpt mcp inspect ${toolName} --server <server-name>\n`);
        return;
      } else {
        console.log(`\n✗ Tool "${toolName}" not found on any connected server\n`);
        return;
      }
    }
    
    // Get tool details
    const tool = await engine.getToolDetails(resolvedServer, toolName);
    
    if (!tool) {
      console.log(`\nTool "${toolName}" not found in server "${serverName}"`);
      return;
    }
    
    if (options.json) {
      console.log(JSON.stringify(tool, null, 2));
      return;
    }
    
    // Human-friendly output
    console.log(`\n🔍 Tool Details\n`);
    console.log(`  Server: ${tool.server}`);
    console.log(`  Name: ${tool.name}`);
    
    // Show description if available, otherwise summary
    const description = tool.description || tool.summary;
    if (description) {
      console.log(`  Description: ${description}`);
    }
    
    console.log(`  Enabled: ${tool.enabled ? '✓ Yes' : '✗ No'}`);
    
    if (tool.tags.length > 0) {
      console.log(`  Tags: ${tool.tags.join(', ')}`);
    }
    
    // Parameters
    if (tool.parameters && tool.parameters.length > 0) {
      console.log(`\n  Parameters:`);
      for (const param of tool.parameters) {
        const required = param.required ? '(required)' : '(optional)';
        console.log(`    • ${param.name}: ${param.type} ${required}`);
        if (param.description) {
          console.log(`      ${param.description}`);
        }
        if (param.default !== undefined) {
          console.log(`      Default: ${JSON.stringify(param.default)}`);
        }
      }
    }
    
    // Examples
    if (options.examples && tool.examples && tool.examples.length > 0) {
      console.log(`\n  Examples:`);
      for (const example of tool.examples) {
        console.log(`    ${example.description}`);
        console.log(`    Parameters: ${JSON.stringify(example.parameters, null, 2)}`);
        console.log('');
      }
    }
    
    console.log('');
  } catch (error) {
    logger.error('Failed to inspect tool:', error);
    throw error;
  } finally {
    // Always cleanup: disconnect from all MCP servers
    await engine.dispose();
  }
}
