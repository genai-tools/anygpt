import { DiscoveryEngine } from '@anygpt/mcp-discovery';
import type { CLIContext } from '../../utils/cli-context.js';

interface ExecuteOptions {
  server?: string;
  args?: string;
  json?: boolean;
  stream?: boolean;
}

/**
 * Execute a tool from any discovered MCP server
 */
export async function mcpExecuteCommand(
  context: CLIContext,
  toolName: string,
  argsOrOptions: string[] | ExecuteOptions,
  optionsIfArgs?: ExecuteOptions
): Promise<void> {
  // Handle both signatures:
  // 1. execute <tool> arg1 arg2 arg3 --options (args array + options)
  // 2. execute <tool> --options (just options)
  let positionalArgs: string[];
  let options: ExecuteOptions;
  
  if (Array.isArray(argsOrOptions)) {
    // Positional args provided
    positionalArgs = argsOrOptions;
    options = optionsIfArgs || {};
  } else {
    // No positional args
    positionalArgs = [];
    options = argsOrOptions;
  }
  
  const serverName = options.server; // Optional - will auto-resolve if not provided
  
  const { config, logger } = context;

  // Initialize discovery engine
  const discoveryConfig = config.discovery || {
    enabled: true,
    cache: { enabled: true, ttl: 3600 }
  };
  
  const engine = new DiscoveryEngine(discoveryConfig, config.mcpServers);

  try {
    // Initialize engine first with progress
    process.stdout.write('🔄 Initializing MCP servers...');
    await engine.initialize();
    process.stdout.write('\r\x1b[K'); // Clear line
    
    // Auto-resolve server if not provided
    let resolvedServer: string;
    
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
        console.log(`\nPlease specify the server: npx anygpt mcp execute ${toolName} --server <server-name>\n`);
        return;
      } else {
        console.log(`\n✗ Tool "${toolName}" not found on any connected server\n`);
        return;
      }
    }
    
    // Parse arguments - do this after server resolution so we can get tool schema
    let args: Record<string, unknown> = {};
    if (options.args) {
      // --args flag takes precedence
      try {
        args = JSON.parse(options.args);
      } catch (error) {
        throw new Error(`Invalid JSON arguments: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else if (positionalArgs.length > 0) {
      // Map positional args to parameter names
      // Get tool details to find the parameter names
      const tool = await engine.getToolDetails(resolvedServer, toolName);
      if (tool && tool.parameters && tool.parameters.length > 0) {
        // Map each positional arg to corresponding parameter
        for (let i = 0; i < positionalArgs.length && i < tool.parameters.length; i++) {
          const param = tool.parameters[i];
          args[param.name] = positionalArgs[i];
        }
      } else {
        // Fallback: use common parameter names
        if (positionalArgs.length > 0) args['query'] = positionalArgs[0];
        if (positionalArgs.length > 1) args['max_results'] = positionalArgs[1];
      }
    }
    
    // Execute tool
    const result = await engine.executeTool(resolvedServer, toolName, args);
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    
    // Human-friendly output
    if (result.success) {
      console.log(`\n✓ Tool executed successfully\n`);
      
      // Format the result based on content type
      const resultData = result.result;
      
      // Check if it's MCP content format (array with type/text objects)
      if (resultData && typeof resultData === 'object' && 'content' in resultData) {
        const content = (resultData as { content: Array<{ type: string; text?: string }> }).content;
        if (Array.isArray(content)) {
          for (const item of content) {
            if (item.type === 'text' && item.text) {
              // Print text content directly (already formatted)
              console.log(item.text);
            } else {
              // Other content types - show as JSON
              console.log(JSON.stringify(item, null, 2));
            }
          }
        } else {
          console.log(JSON.stringify(resultData, null, 2));
        }
      } else {
        // Not MCP format - show as formatted JSON
        console.log(JSON.stringify(resultData, null, 2));
      }
    } else {
      console.log(`\n✗ Tool execution failed\n`);
      if (result.error) {
        console.log(`Error: ${result.error.message}`);
        console.log(`Code: ${result.error.code}`);
        if (result.error.details) {
          console.log(`Details: ${JSON.stringify(result.error.details, null, 2)}`);
        }
      }
    }
    
    console.log('');
  } catch (error) {
    logger.error('Failed to execute tool:', error);
    throw error;
  } finally {
    // Always cleanup: disconnect from all MCP servers
    await engine.dispose();
  }
}
