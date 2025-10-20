/**
 * Shared CLI context utilities
 */

import {
  setupRouter,
  setupRouterFromFactory,
  resolveConfig,
} from '@anygpt/config';
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

  debug(message: string, ...args: unknown[]): void {
    if (this.getLogLevel() === 'debug') {
      console.log('[DEBUG]', message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    const level = this.getLogLevel();
    if (level === 'info' || level === 'debug') {
      console.log(message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(message, ...args);
  }
}

// Console logger for CLI
const consoleLogger = new ConsoleLogger();

import type { ModelAlias, ProviderConfig, ModelRule } from '@anygpt/config';
import { buildTagRegistry, type TagRegistry } from '@anygpt/config';

export interface CLIContext {
  router: unknown;
  config: unknown;
  configSource: string; // Path to the loaded config file
  providers: Record<string, ProviderConfig>; // Provider configs with model metadata
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
    let loadedConfig = module.default;

    // Process plugins to generate mcpServers and other dynamic config
    loadedConfig = await resolveConfig(loadedConfig);

    // Check if it's a factory config (has providers with connector instances)
    // A factory config has actual connector instances (with client property), not config objects
    const hasConnectorInstances =
      loadedConfig.providers &&
      Object.values(loadedConfig.providers).some(
        (p: unknown): p is { connector: { client: unknown } } =>
          typeof p === 'object' &&
          p !== null &&
          'connector' in p &&
          typeof p.connector === 'object' &&
          p.connector !== null &&
          'client' in p.connector
      );

    if (hasConnectorInstances) {
      // It's a factory config - we already have the resolved config with plugins processed
      // Now we just need to create the router and register connectors
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
        config: loadedConfig, // Use the resolved config with mcpServers from plugins
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
      // It's a standard config - use the resolved config directly
      // Don't call setupRouter again as it would reload and re-process plugins
      return {
        router: null, // Standard configs don't have router
        config: loadedConfig, // Use the resolved config with mcpServers from plugins
        configSource: resolvedConfigPath,
        providers: {}, // Standard configs don't have provider metadata
        logger: consoleLogger,
        defaults: {
          provider: loadedConfig.settings?.defaultProvider,
          model: undefined,
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
export function withCLIContext<T extends unknown[]>(
  commandFn: (context: CLIContext, ...args: T) => Promise<void>
) {
  return async (...args: T) => {
    // Extract global options from commander
    const command = args[args.length - 1] as {
      parent?: unknown;
      opts?: () => { config?: string };
    };

    // Walk up the command tree to find the root program options
    let currentCommand: { parent?: unknown; opts?: () => { config?: string } } =
      command;
    while (
      currentCommand.parent &&
      typeof currentCommand.parent === 'object' &&
      'opts' in currentCommand.parent
    ) {
      currentCommand = currentCommand.parent as {
        parent?: unknown;
        opts?: () => { config?: string };
      };
    }
    const globalOpts = currentCommand.opts?.() || {};

    try {
      const context = await setupCLIContext(globalOpts.config);
      await commandFn(context, ...args);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  };
}
