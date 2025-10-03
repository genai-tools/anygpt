/**
 * Configuration inspection command
 */


interface ConfigOptions {
  json?: boolean;
}

import type { CLIContext } from '../utils/cli-context.js';

export async function configCommand(
  context: CLIContext,
  options: ConfigOptions
) {
  try {
    const config = context.config;
    const configSource = context.configSource;
    
    if (options.json) {
      // JSON output - pure config, no sanitization needed since we use tokenEnv
      console.log(JSON.stringify(processConfigForDisplay(config), null, 2));
    } else {
      // Tree output
      console.log('📋 AnyGPT Configuration');
      console.log('═'.repeat(50));
      console.log(`📁 Source: ${configSource}`);
      console.log();
      printConfigTree(processConfigForDisplay(config));
    }
    
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Process config for display - convert connector instances to declarative format
 * No sanitization needed since we use tokenEnv instead of storing secrets
 */
function processConfigForDisplay(config: any): any {
  return JSON.parse(JSON.stringify(config, (key, value) => {
    // Handle connector objects - both instances and declarative configs
    if (key === 'connector' && typeof value === 'object' && value !== null) {
      // Check if it's already in declarative format (from JSON config)
      if (value.type && typeof value.type === 'string') {
        // Already declarative - pass through as-is
        return value;
      }
      
      // It's a connector instance - extract config from it
      if (value.constructor) {
        // Get package name from the connector's static property
        const packageName = (value.constructor as any).packageName || `@anygpt/${value.constructor.name.toLowerCase().replace('connector', '')}`;
        
        const connectorInfo = {
          type: packageName,
          options: {}
        };
        
        try {
          if (value.getUserConfig && typeof value.getUserConfig === 'function') {
            // Use user config (only explicitly set values)
            const userConfig = value.getUserConfig();
            if (userConfig && typeof userConfig === 'object') {
              connectorInfo.options = userConfig;
            }
          } else if (value.config || value.getConfig) {
            // Fallback to full config if getUserConfig not available
            const connectorConfig = value.config || value.getConfig?.();
            if (connectorConfig && typeof connectorConfig === 'object') {
              connectorInfo.options = connectorConfig;
            }
          }
        } catch {
          connectorInfo.options = '[Unable to serialize]';
        }
        
        return connectorInfo;
      }
    }
    
    return value;
  }));
}

/**
 * Print configuration as a tree structure
 */
function printConfigTree(config: any, indent = ''): void {
  for (const [key, value] of Object.entries(config)) {
    if (value === null || value === undefined) {
      console.log(`${indent}├─ ${key}: ${value}`);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      console.log(`${indent}├─ ${key}:`);
      printConfigTree(value, indent + '│  ');
    } else if (Array.isArray(value)) {
      console.log(`${indent}├─ ${key}: [${value.length} items]`);
      value.forEach((item, i) => {
        if (typeof item === 'object') {
          console.log(`${indent}│  ├─ [${i}]:`);
          printConfigTree(item, indent + '│  │  ');
        } else {
          console.log(`${indent}│  ├─ [${i}]: ${item}`);
        }
      });
    } else {
      const displayValue = typeof value === 'string' && value.length > 50 
        ? value.substring(0, 47) + '...'
        : value;
      console.log(`${indent}├─ ${key}: ${displayValue}`);
    }
  }
}
