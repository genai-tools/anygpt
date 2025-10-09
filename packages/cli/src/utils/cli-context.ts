/**
 * Shared CLI context utilities
 */

import { setupRouter, setupRouterFromFactory } from '@anygpt/config';
import type { Logger } from '@anygpt/types';

// Console logger implementation for CLI
class ConsoleLogger implements Logger {
  constructor(private verbose = false) {}

  // Check verbose flag dynamically
  private isVerbose(): boolean {
    return (
      this.verbose ||
      process.argv.includes('--verbose') ||
      process.argv.includes('-v')
    );
  }

  debug(message: string, ...args: any[]): void {
    if (this.isVerbose()) {
      console.log('[DEBUG]', message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.isVerbose()) {
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

import type {
  ModelAlias,
  FactoryProviderConfig,
  ModelRule,
} from '@anygpt/config';
import { buildTagRegistry, type TagRegistry } from '@anygpt/config';

export interface CLIContext {
  router: any;
  config: any;
  configSource: string; // Path to the loaded config file
  providers: Record<string, FactoryProviderConfig>; // Provider configs with model metadata
  tagRegistry?: TagRegistry; // Pre-computed tag mappings
  logger: Logger;
  defaults: {
    provider?: string;
    model?: string;
    timeout?: number;
    maxRetries?: number;
    logging?: {
      level?: 'debug' | 'info' | 'warn' | 'error';
    };
    providers?: Record<
      string,
      {
        model?: string;
        [key: string]: unknown;
      }
    >;
    aliases?: Record<string, ModelAlias[]>;
    modelRules?: ModelRule[];
  };
}

/**
 * Global config and router setup - shared by all commands
 */
export async function setupCLIContext(
  configPath?: string
): Promise<CLIContext> {
  try {
    // Try to import the config directly (for factory configs)
    // Resolve path relative to current working directory, not the CLI dist folder
    const resolvedConfigPath = configPath || './.anygpt/anygpt.config.ts';
    const absoluteConfigPath = new URL(
      resolvedConfigPath,
      `file://${process.cwd()}/`
    ).href;
    const module = await import(absoluteConfigPath);
    const loadedConfig = module.default;

    // Check if it's a factory config (has providers with connector instances)
    const hasConnectorInstances =
      loadedConfig.providers &&
      Object.values(loadedConfig.providers).some(
        (p: any) => p.connector && typeof p.connector === 'object'
      );

    if (hasConnectorInstances) {
      // It's a factory config - use setupRouterFromFactory
      const { router, config } = await setupRouterFromFactory(loadedConfig);

      // Inject the CLI logger into all connectors
      if (config.providers) {
        for (const providerConfig of Object.values(config.providers)) {
          if (
            (providerConfig as any).connector &&
            typeof (providerConfig as any).connector === 'object'
          ) {
            const connector = (providerConfig as any).connector;
            // Inject logger by setting the protected logger property
            if (connector.logger) {
              Object.defineProperty(connector, 'logger', {
                value: consoleLogger,
                writable: true,
                enumerable: false,
                configurable: true,
              });
            }
          }
        }
      }

      // Build tag registry (async, fetches models from providers)
      consoleLogger.debug('Building tag registry...');
      const tagRegistry = await buildTagRegistry(
        config.providers || {},
        config.defaults?.modelRules
      );
      consoleLogger.debug(
        `Tag registry built with ${tagRegistry.tags.size} tags`
      );

      return {
        router,
        config,
        configSource: resolvedConfigPath,
        providers: config.providers || {},
        tagRegistry,
        logger: consoleLogger,
        defaults: {
          provider: config.defaults?.provider,
          model: config.defaults?.model,
          timeout: config.defaults?.timeout,
          maxRetries: config.defaults?.maxRetries,
          logging: config.defaults?.logging,
          providers: config.defaults?.providers,
          aliases: config.defaults?.aliases,
          modelRules: config.defaults?.modelRules,
        },
      };
    } else {
      // It's a standard config - use setupRouter
      const { router, config } = await setupRouter(
        { configPath },
        consoleLogger
      );

      return {
        router,
        config,
        configSource: configPath || 'default config search',
        providers: {}, // Standard configs don't have provider metadata
        logger: consoleLogger,
        defaults: {
          provider: config.settings?.defaultProvider,
          model: undefined, // AnyGPTConfig doesn't have a global default model
        },
      };
    }
  } catch {
    // Fall back to standard config loading
    const { router, config } = await setupRouter({ configPath }, consoleLogger);

    return {
      router,
      config,
      configSource: configPath || 'fallback config search',
      providers: {}, // Fallback configs don't have provider metadata
      logger: consoleLogger,
      defaults: {
        provider: config.settings?.defaultProvider,
        model: undefined, // AnyGPTConfig doesn't have a global default model
      },
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
