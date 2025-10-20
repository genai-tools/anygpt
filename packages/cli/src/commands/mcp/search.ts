import { DiscoveryEngine } from '@anygpt/mcp-discovery';
import type { CLIContext } from '../../utils/cli-context.js';

interface SearchOptions {
  server?: string;
  limit?: number;
  json?: boolean;
}

/**
 * Search for tools across all MCP servers
 */
export async function mcpSearchCommand(
  context: CLIContext,
  query: string,
  options: SearchOptions
): Promise<void> {
  const { config, logger } = context;

  // Initialize discovery engine
  const discoveryConfig = config.discovery || {
    enabled: true,
    cache: { enabled: true, ttl: 3600 },
  };

  const engine = new DiscoveryEngine(discoveryConfig, config.mcp?.servers);

  try {
    // Search for tools
    const results = await engine.searchTools(query, {
      server: options.server,
      limit: options.limit || 10,
    });

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    // Human-friendly output
    if (results.length === 0) {
      console.log(`\nNo tools found matching "${query}"`);
      if (options.server) {
        console.log(`  (searched in server: ${options.server})`);
      }
      return;
    }

    console.log(`\n🔍 Search Results for "${query}" (${results.length})\n`);

    for (const result of results) {
      console.log(`  ${result.tool}`);
      console.log(`    ${result.summary}`);

      // Only show relevance if it exists
      if (result.relevance !== undefined && result.relevance !== null) {
        console.log(`    Relevance: ${result.relevance.toFixed(2)}`);
      }

      if (result.tags && result.tags.length > 0) {
        console.log(`    Tags: ${result.tags.join(', ')}`);
      }

      console.log('');
    }
  } catch (error) {
    logger.error('Failed to search tools:', error);
    throw error;
  } finally {
    // Always cleanup: disconnect from all MCP servers
    await engine.dispose();
  }
}
