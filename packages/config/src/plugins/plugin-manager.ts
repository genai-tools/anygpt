/**
 * Plugin Manager
 *
 * Manages plugin lifecycle and configuration merging
 *
 * @deprecated This file uses an old plugin API and is not currently exported.
 * It needs to be updated to match the current Plugin interface or removed.
 *
 * NOTE: This file has type errors but is not exported from the package.
 * It's kept for reference but should be updated or removed in the future.
 */

import type { AnyGPTConfig } from '@anygpt/types';
import type { Plugin, PluginContext } from './types.js';

/**
 * Deep merge two objects
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (sourceValue === undefined) {
      continue;
    }

    if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      // Merge arrays
      result[key] = [...targetValue, ...sourceValue] as T[Extract<
        keyof T,
        string
      >];
    } else if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(sourceValue)
    ) {
      // Recursively merge objects
      result[key] = deepMerge(
        targetValue,
        sourceValue as Partial<T[Extract<keyof T, string>]>
      );
    } else {
      // Override primitive values
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return result;
}

/**
 * Plugin Manager
 */
export class PluginManager {
  private plugins: Map<string, PluginRegistryEntry> = new Map();
  private initialized = false;

  /**
   * Register a plugin
   */
  register(plugin: ConfigPlugin, options: PluginOptions = {}): void {
    if (this.initialized) {
      throw new Error('Cannot register plugins after initialization');
    }

    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }

    this.plugins.set(plugin.name, { plugin, options });
  }

  /**
   * Register multiple plugins
   */
  registerAll(
    plugins: Array<ConfigPlugin | [ConfigPlugin, PluginOptions]>
  ): void {
    for (const item of plugins) {
      if (Array.isArray(item)) {
        const [plugin, options] = item;
        this.register(plugin, options);
      } else {
        this.register(item);
      }
    }
  }

  /**
   * Initialize all plugins and merge their contributions
   */
  async initialize(
    baseConfig: Partial<AnyGPTConfig>,
    context: PluginContext
  ): Promise<AnyGPTConfig> {
    if (this.initialized) {
      throw new Error('Plugin manager already initialized');
    }

    let config = baseConfig as AnyGPTConfig;

    // Process plugins in registration order
    for (const [name, entry] of this.plugins) {
      const { plugin, options } = entry;

      // Skip disabled plugins
      if (options.enabled === false) {
        context.logger?.debug(`Plugin "${name}" is disabled, skipping`);
        continue;
      }

      // Check if plugin can run
      if (plugin.canRun) {
        const canRun = await plugin.canRun(context);
        if (!canRun) {
          context.logger?.warn(
            `Plugin "${name}" cannot run in current environment, skipping`
          );
          continue;
        }
      }

      try {
        context.logger?.info(`Initializing plugin: ${name}`);

        // Initialize plugin and get contributions
        const contribution = await plugin.initialize(context);

        // Merge contributions into config
        config = this.mergeContribution(config, contribution);

        context.logger?.debug(`Plugin "${name}" initialized successfully`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        context.logger?.error(
          `Plugin "${name}" failed to initialize: ${message}`,
          error as Error
        );
        throw new Error(`Plugin "${name}" initialization failed: ${message}`);
      }
    }

    this.initialized = true;
    return config;
  }

  /**
   * Merge plugin contribution into config
   */
  private mergeContribution(
    config: AnyGPTConfig,
    contribution: ConfigContribution
  ): AnyGPTConfig {
    let result = { ...config };

    // Merge MCP servers
    if (contribution.mcpServers) {
      result.mcpServers = {
        ...result.mcpServers,
        ...contribution.mcpServers,
      };
    }

    // Merge discovery config
    if (contribution.discovery) {
      result.discovery = deepMerge(
        result.discovery || {},
        contribution.discovery
      );
    }

    // Merge providers
    if (contribution.providers) {
      result.providers = {
        ...result.providers,
        ...contribution.providers,
      };
    }

    // Merge defaults
    if (contribution.defaults) {
      result.defaults = deepMerge(result.defaults || {}, contribution.defaults);
    }

    return result;
  }

  /**
   * Dispose all plugins
   */
  async dispose(): Promise<void> {
    const disposePromises: Promise<void>[] = [];

    for (const [name, entry] of this.plugins) {
      if (entry.plugin.dispose) {
        try {
          const result = entry.plugin.dispose();
          if (result instanceof Promise) {
            disposePromises.push(result);
          }
        } catch (error) {
          console.error(`Error disposing plugin "${name}":`, error);
        }
      }
    }

    await Promise.all(disposePromises);
    this.plugins.clear();
    this.initialized = false;
  }

  /**
   * Get list of registered plugins
   */
  getPlugins(): Array<{
    name: string;
    version?: string;
    description?: string;
    enabled: boolean;
  }> {
    return Array.from(this.plugins.entries()).map(([name, entry]) => ({
      name,
      version: entry.plugin.version,
      description: entry.plugin.description,
      enabled: entry.options.enabled !== false,
    }));
  }
}
