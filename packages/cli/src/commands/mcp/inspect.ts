import { DiscoveryEngine } from '@anygpt/mcp-discovery';
import type { CLIContext } from '../../utils/cli-context.js';

interface InspectOptions {
  examples?: boolean;
  json?: boolean;
}

/**
 * Get detailed information about a specific tool
 */
export async function mcpInspectCommand(
  context: CLIContext,
  serverName: string,
  toolName: string,
  options: InspectOptions
): Promise<void> {
  const { config, logger } = context;

  try {
    // Initialize discovery engine
    const discoveryConfig = config.discovery || {
      enabled: true,
      cache: { enabled: true, ttl: 3600 }
    };
    
    const engine = new DiscoveryEngine(discoveryConfig, config.mcpServers);
    
    // Get tool details
    const tool = await engine.getToolDetails(serverName, toolName);
    
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
    console.log(`  Summary: ${tool.summary}`);
    
    if (tool.description) {
      console.log(`  Description: ${tool.description}`);
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
  }
}
