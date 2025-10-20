/**
 * Clean configuration API
 * - defineConfig: Define a single config with type safety
 * - mergeConfigs: Merge multiple configs with deep merge
 */

import type { Config, PluginContext } from './types.js';
import type { Plugin } from './plugins/types.js';

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
      // Concatenate arrays
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
 * Define a configuration with type safety and plugin support
 *
 * This is a type helper that provides IntelliSense and validation.
 * It doesn't transform the config, just returns it with proper typing.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@anygpt/config';
 * import { openai } from '@anygpt/openai';
 * import dockerMCP from '@anygpt/docker-mcp-plugin';
 *
 * export default defineConfig({
 *   providers: {
 *     openai: {
 *       name: 'OpenAI',
 *       connector: openai({ apiKey: process.env.OPENAI_API_KEY })
 *     }
 *   },
 *   plugins: [dockerMCP()]
 * });
 * ```
 */
export function defineConfig(config: Config): Config {
  return config;
}

/**
 * Merge multiple configurations with deep merge
 *
 * Accepts either individual configs or an array of configs.
 * Merges configurations from left to right, with later configs taking precedence.
 * Collects plugins from all configs and applies them in order.
 *
 * @example
 * ```ts
 * import { mergeConfigs } from '@anygpt/config';
 *
 * // Variadic style
 * export default mergeConfigs(baseConfig, overrideConfig);
 *
 * // Array style (useful for dynamic composition)
 * export default mergeConfigs([baseConfig, overrideConfig]);
 *
 * // Mixed style with spread
 * export default mergeConfigs(base, ...otherConfigs);
 * ```
 */
export function mergeConfigs(...configs: Array<Config | Config[]>): Config {
  // Flatten array if first argument is an array
  const flatConfigs: Config[] =
    configs.length === 1 && Array.isArray(configs[0])
      ? configs[0]
      : (configs as Config[]);

  if (flatConfigs.length === 0) {
    return {};
  }

  if (flatConfigs.length === 1) {
    return flatConfigs[0];
  }

  // Collect all plugins from all configs
  const allPlugins: Plugin[] = [];
  for (const config of flatConfigs) {
    if (config.plugins) {
      allPlugins.push(...config.plugins);
    }
  }

  // Start with first config as base (without plugins)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { plugins: _firstPlugins, ...firstConfig } = flatConfigs[0];
  let result = firstConfig as Config;

  // Merge remaining configs (without plugins)
  for (let i = 1; i < flatConfigs.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { plugins: _plugins, ...configWithoutPlugins } = flatConfigs[i];
    result = deepMerge(result, configWithoutPlugins);
  }

  // Add all collected plugins to the result
  return {
    ...result,
    plugins: allPlugins.length > 0 ? allPlugins : undefined,
  };
}

/**
 * Resolve configuration with plugins
 *
 * This function applies all plugins to the config and returns the final resolved config.
 * Used internally by the config loader.
 *
 * @param config - Configuration with plugins
 * @param context - Plugin context (optional)
 * @returns Resolved configuration
 */
export async function resolveConfig(
  config: Config,
  context?: Partial<PluginContext>
): Promise<Config> {
  const { plugins = [], ...baseConfig } = config;

  // Create plugin context
  const pluginContext: PluginContext = {
    cwd: context?.cwd || process.cwd(),
    env: (context?.env || process.env) as Record<string, string>,
    config: baseConfig,
  };

  let resolvedConfig = baseConfig as Config;

  // Apply plugin.config() hooks
  for (const plugin of plugins) {
    if (plugin.config) {
      try {
        const contribution = await plugin.config(pluginContext);
        resolvedConfig = deepMerge(resolvedConfig, contribution);

        // Update context with merged config
        pluginContext.config = resolvedConfig;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Plugin "${plugin.name}" failed during config(): ${message}`
        );
      }
    }
  }

  // Apply plugin.configResolved() hooks
  for (const plugin of plugins) {
    if (plugin.configResolved) {
      try {
        resolvedConfig = await plugin.configResolved(
          resolvedConfig,
          pluginContext
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Plugin "${plugin.name}" failed during configResolved(): ${message}`
        );
      }
    }
  }

  return resolvedConfig;
}
