/**
 * Shared CLI context utilities
 */

import { setupRouter, setupRouterFromFactory } from '@anygpt/config';
import type { Logger } from '@anygpt/types';

// Console logger implementation for CLI
class ConsoleLogger implements Logger {
  constructor(private verbose = false) {}

  debug(message: string, ...args: any[]): void {
    if (this.verbose) {
      console.debug(message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.verbose) {
      console.log(message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(message, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(message, ...args);
  }
}

// Console logger for CLI - shows connector loading messages only in verbose mode
const consoleLogger = new ConsoleLogger(
  process.env.VERBOSE === 'true' || process.argv.includes('--verbose')
);

export interface CLIContext {
  router: any;
  config: any;
  configSource: string; // Path to the loaded config file
  defaults: {
    provider?: string;
    model?: string;
  };
}

/**
 * Global config and router setup - shared by all commands
 */
export async function setupCLIContext(configPath?: string): Promise<CLIContext> {
  try {
    // Try to import the config directly (for factory configs)
    // Resolve path relative to current working directory, not the CLI dist folder
    const resolvedConfigPath = configPath || './.anygpt/anygpt.config.ts';
    const absoluteConfigPath = new URL(resolvedConfigPath, `file://${process.cwd()}/`).href;
    const module = await import(absoluteConfigPath);
    const loadedConfig = module.default;
    
    // Check if it's a factory config (has providers with connector instances)
    const hasConnectorInstances = loadedConfig.providers && Object.values(loadedConfig.providers).some((p: any) => p.connector && typeof p.connector === 'object');
    
    if (hasConnectorInstances) {
      // It's a factory config - use setupRouterFromFactory
      const { router, config } = await setupRouterFromFactory(loadedConfig);
      
      return {
        router,
        config,
        configSource: resolvedConfigPath,
        defaults: {
          provider: config.defaults?.provider,
          model: config.defaults?.model
        }
      };
    } else {
      // It's a standard config - use setupRouter
      const { router, config } = await setupRouter({ configPath }, consoleLogger);
      
      return {
        router,
        config,
        configSource: configPath || 'default config search',
        defaults: {
          provider: config.settings?.defaultProvider || config.defaults?.provider,
          model: config.defaults?.model
        }
      };
    }
  } catch {
    // Fall back to standard config loading
    const { router, config } = await setupRouter({ configPath }, consoleLogger);
    
    return {
      router,
      config,
      configSource: configPath || 'fallback config search',
      defaults: {
        provider: config.settings?.defaultProvider || config.defaults?.provider,
        model: config.defaults?.model
      }
    };
  }
}

/**
 * Wrapper for command actions that need CLI context
 */
export function withCLIContext<T extends any[]>(
  commandFn: (context: CLIContext, ...args: T) => Promise<void>
) {
  return async (...args: T) => {
    // Extract global options from commander
    const command = args[args.length - 1] as any;
    const globalOpts = command.parent?.opts() || {};
    
    try {
      const context = await setupCLIContext(globalOpts.config);
      await commandFn(context, ...args);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  };
}
