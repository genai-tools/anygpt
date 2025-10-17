import { DiscoveryEngine } from '@anygpt/mcp-discovery';
import type { CLIContext } from '../../utils/cli-context.js';

interface ExecuteOptions {
  args?: string;
  json?: boolean;
  stream?: boolean;
}

/**
 * Execute a tool from any discovered MCP server
 */
export async function mcpExecuteCommand(
  context: CLIContext,
  serverName: string,
  toolName: string,
  options: ExecuteOptions
): Promise<void> {
  const { config, logger } = context;

  try {
    // Initialize discovery engine
    const discoveryConfig = config.discovery || {
      enabled: true,
      cache: { enabled: true, ttl: 3600 }
    };
    
    const engine = new DiscoveryEngine(discoveryConfig);
    
    // Parse arguments
    let args: Record<string, unknown> = {};
    if (options.args) {
      try {
        args = JSON.parse(options.args);
      } catch (error) {
        throw new Error(`Invalid JSON arguments: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Execute tool
    const result = await engine.executeTool(serverName, toolName, args);
    
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    
    // Human-friendly output
    if (result.success) {
      console.log(`\n✓ Tool executed successfully\n`);
      console.log(`Result:`);
      console.log(JSON.stringify(result.result, null, 2));
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
  }
}
