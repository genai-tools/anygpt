/**
 * Shared CLI context utilities
 */

import { setupRouter, setupRouterFromFactory } from '@anygpt/config';
import type { Logger } from '@anygpt/types';

type LogLevel = 'quiet' | 'info' | 'debug';

// Console logger implementation for CLI
class ConsoleLogger implements Logger {
  constructor(private logLevel: LogLevel = 'quiet') {}

  // Parse log level from environment and command line args
  private getLogLevel(): LogLevel {
    // Check environment variable first
    if (process.env.VERBOSE === 'debug') return 'debug';
    if (process.env.VERBOSE === 'true') return 'info';

    // Check command line arguments
    const verboseIndex = process.argv.findIndex(
      (arg) => arg === '--verbose' || arg === '-v'
    );

    if (verboseIndex !== -1) {
      // Check if next arg is a level value
      const nextArg = process.argv[verboseIndex + 1];
      if (nextArg === 'debug') return 'debug';
      return 'info'; // Default verbose level
    }

    return this.logLevel;
  }

  debug(message: string, ...args: any[]): void {
    if (this.getLogLevel() === 'debug') {
      console.log('[DEBUG]', message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    const level = this.getLogLevel();
    if (level === 'info' || level === 'debug') {
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

// Console logger for CLI
const consoleLogger = new ConsoleLogger();

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
    // A factory config has actual connector instances (with client property), not config objects
    const hasConnectorInstances =
      loadedConfig.providers &&
      Object.values(loadedConfig.providers).some(
        (p: any) => p.connector && typeof p.connector === 'object' && p.connector.client !== undefined
      );

    if (hasConnectorInstances) {
      // It's a factory config - use setupRouterFromFactory with logger
      const { router, config } = await setupRouterFromFactory(
        loadedConfig,
        consoleLogger
      );

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
        config, // Return full config including mcpServers and discovery
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
      config, // Return full config including mcpServers and discovery
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
    
    // Walk up the command tree to find the root program options
    let currentCommand = command;
    while (currentCommand.parent) {
      currentCommand = currentCommand.parent;
    }
    const globalOpts = currentCommand.opts() || {};

    try {
      const context = await setupCLIContext(globalOpts.config);
      await commandFn(context, ...args);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  };
}
