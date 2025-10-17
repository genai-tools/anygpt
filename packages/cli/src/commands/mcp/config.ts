import { DiscoveryEngine } from '@anygpt/mcp-discovery';
import type { CLIContext } from '../../utils/cli-context.js';

interface ConfigOptions {
  json?: boolean;
}

/**
 * Show MCP discovery configuration
 */
export async function mcpConfigShowCommand(
  context: CLIContext,
  options: ConfigOptions
): Promise<void> {
  const { config, logger } = context;

  try {
    const discoveryConfig = config.discovery || {
      enabled: true,
      cache: { enabled: true, ttl: 3600 }
    };
    
    if (options.json) {
      console.log(JSON.stringify(discoveryConfig, null, 2));
      return;
    }
    
    // Human-friendly output
    console.log(`\n⚙️  MCP Discovery Configuration\n`);
    console.log(`  Enabled: ${discoveryConfig.enabled ? '✓ Yes' : '✗ No'}`);
    
    if (discoveryConfig.cache) {
      console.log(`\n  Cache:`);
      console.log(`    Enabled: ${discoveryConfig.cache.enabled ? '✓ Yes' : '✗ No'}`);
      console.log(`    TTL: ${discoveryConfig.cache.ttl}s`);
    }
    
    if (discoveryConfig.sources && discoveryConfig.sources.length > 0) {
      console.log(`\n  Sources (${discoveryConfig.sources.length}):`);
      for (const source of discoveryConfig.sources) {
        console.log(`    • ${source.type}: ${source.path || source.url || 'default'}`);
      }
    }
    
    if (discoveryConfig.toolRules && discoveryConfig.toolRules.length > 0) {
      console.log(`\n  Tool Rules (${discoveryConfig.toolRules.length}):`);
      for (const rule of discoveryConfig.toolRules) {
        const patterns = Array.isArray(rule.pattern) ? rule.pattern.join(', ') : rule.pattern;
        const status = rule.enabled === true ? '✓ enabled' : rule.enabled === false ? '✗ disabled' : 'default';
        console.log(`    • ${patterns} → ${status}`);
        if (rule.server) {
          console.log(`      Server: ${rule.server}`);
        }
        if (rule.tags && rule.tags.length > 0) {
          console.log(`      Tags: ${rule.tags.join(', ')}`);
        }
      }
    }
    
    console.log('');
  } catch (error) {
    logger.error('Failed to show config:', error);
    throw error;
  }
}

/**
 * Validate MCP discovery configuration
 */
export async function mcpConfigValidateCommand(
  context: CLIContext,
  options: ConfigOptions
): Promise<void> {
  const { config, logger } = context;

  try {
    const discoveryConfig = config.discovery || {
      enabled: true,
      cache: { enabled: true, ttl: 3600 }
    };
    
    // Initialize engine to validate config
    const engine = new DiscoveryEngine(discoveryConfig, config.mcpServers);
    
    if (options.json) {
      console.log(JSON.stringify({ valid: true, config: discoveryConfig }, null, 2));
      return;
    }
    
    console.log(`\n✓ Configuration is valid\n`);
  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({ 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, null, 2));
      return;
    }
    
    console.log(`\n✗ Configuration is invalid\n`);
    logger.error('Validation failed:', error);
    throw error;
  }
}

/**
 * Reload MCP discovery configuration
 */
export async function mcpConfigReloadCommand(
  context: CLIContext,
  options: ConfigOptions
): Promise<void> {
  const { config, logger } = context;

  try {
    const discoveryConfig = config.discovery || {
      enabled: true,
      cache: { enabled: true, ttl: 3600 }
    };
    
    const engine = new DiscoveryEngine(discoveryConfig, config.mcpServers);
    await engine.reload();
    
    if (options.json) {
      console.log(JSON.stringify({ reloaded: true }, null, 2));
      return;
    }
    
    console.log(`\n✓ Configuration reloaded successfully\n`);
  } catch (error) {
    logger.error('Failed to reload config:', error);
    throw error;
  }
}
