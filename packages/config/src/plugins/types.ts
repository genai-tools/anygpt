/**
 * Plugin System for AnyGPT Configuration
 *
 * Inspired by unplugin - clean, declarative, context-aware plugins.
 *
 * Plugins can dynamically contribute to the configuration by:
 * - Discovering and registering MCP servers
 * - Adding providers
 * - Modifying discovery rules
 * - Injecting environment variables
 */

import type { MCPServerRuleTarget } from '@anygpt/types';
import type { Rule } from '@anygpt/rules';
import type { Config } from '../types.js';

/**
 * Plugin context provided to plugins during config resolution
 */
export interface PluginContext {
  /** Current working directory */
  cwd: string;
  /** Environment variables */
  env: Record<string, string | undefined>;
  /** Base config before plugin contributions */
  config: Partial<Config>;
}

/**
 * Plugin hook for config resolution
 */
export interface Plugin {
  /** Plugin name (must be unique) */
  name: string;

  /**
   * Resolve and contribute to configuration
   *
   * Called during config loading with full context.
   * Return partial config to merge with base config.
   *
   * @param context - Plugin execution context
   * @returns Partial config to merge or Promise thereof
   */
  config?: (
    context: PluginContext
  ) => Partial<Config> | Promise<Partial<Config>>;

  /**
   * Optional: Transform final config after all plugins have contributed
   *
   * @param config - Final merged config
   * @param context - Plugin execution context
   * @returns Transformed config or Promise thereof
   */
  configResolved?: (
    config: Config,
    context: PluginContext
  ) => Config | Promise<Config>;
}

/**
 * Base plugin options that all MCP-related plugins should extend
 *
 * Provides standard serverRules filtering for discovered servers
 */
export interface BasePluginOptions {
  /**
   * Server rules - filter which servers to include/exclude
   * Uses the same rule engine pattern as global serverRules
   *
   * @example
   * ```ts
   * serverRules: [
   *   { when: { name: 'sequentialthinking' }, set: { enabled: false } },
   *   { when: { tags: ['github'] }, set: { enabled: true } }
   * ]
   * ```
   */
  serverRules?: Rule<MCPServerRuleTarget>[];

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Plugin factory function (unplugin-style)
 */
export type PluginFactory<T = Record<string, unknown>> = (
  options?: T
) => Plugin;
