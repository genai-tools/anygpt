/**
 * defineConfig - Helper for type-safe configuration with plugins
 * 
 * Inspired by Vite/unplugin pattern
 */

import type { AnyGPTConfig } from '@anygpt/types';
import type { Plugin, PluginContext } from './types.js';

/**
 * Configuration with plugins
 */
export interface ConfigWithPlugins extends Partial<AnyGPTConfig> {
  /** Plugins to apply */
  plugins?: Plugin[];
}

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
      result[key] = [...targetValue, ...sourceValue] as T[Extract<keyof T, string>];
    } else if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(sourceValue)
    ) {
      // Recursively merge objects
      result[key] = deepMerge(targetValue, sourceValue as Partial<T[Extract<keyof T, string>]>);
    } else {
      // Override primitive values
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }
  
  return result;
}

/**
 * Resolve configuration with plugins
 */
export async function resolveConfig(
  configWithPlugins: ConfigWithPlugins,
  context?: Partial<PluginContext>
): Promise<AnyGPTConfig> {
  const { plugins = [], ...baseConfig } = configWithPlugins;
  
  // Create plugin context
  const pluginContext: PluginContext = {
    cwd: context?.cwd || process.cwd(),
    env: context?.env || process.env,
    config: baseConfig,
  };
  
  let config = baseConfig as AnyGPTConfig;
  
  // Apply plugin.config() hooks
  for (const plugin of plugins) {
    if (plugin.config) {
      try {
        const contribution = await plugin.config(pluginContext);
        config = deepMerge(config, contribution);
        
        // Update context with merged config
        pluginContext.config = config;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Plugin "${plugin.name}" failed during config(): ${message}`);
      }
    }
  }
  
  // Apply plugin.configResolved() hooks
  for (const plugin of plugins) {
    if (plugin.configResolved) {
      try {
        config = await plugin.configResolved(config, pluginContext);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Plugin "${plugin.name}" failed during configResolved(): ${message}`);
      }
    }
  }
  
  return config;
}

/**
 * Define configuration with type safety and plugin support
 * 
 * @example
 * ```ts
 * import { defineConfig } from '@anygpt/config';
 * import DockerMCP from '@anygpt/docker-mcp-plugin';
 * 
 * export default defineConfig({
 *   plugins: [
 *     DockerMCP({
 *       exclude: ['anygpt'],
 *     }),
 *   ],
 *   mcpServers: {
 *     git: {
 *       command: 'uvx',
 *       args: ['mcp-server-git'],
 *     },
 *   },
 * });
 * ```
 */
export function defineConfig(config: ConfigWithPlugins): ConfigWithPlugins {
  return config;
}
