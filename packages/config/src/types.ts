/**
 * Configuration types for @anygpt/config
 *
 * All types are imported from @anygpt/types (single source of truth).
 * This file just re-exports them for convenience.
 */

import type {
  ReasoningEffort,
  ReasoningConfig,
  BaseModelConfig,
  ModelMetadata,
  ModelRule,
  ModelAlias,
  ProviderConfig,
  Config as TypesConfig,
  ConfigLoadOptions,
} from '@anygpt/types';
import type { Plugin } from './plugins/types.js';

// Re-export all types from @anygpt/types
export type {
  ReasoningEffort,
  ReasoningConfig,
  BaseModelConfig,
  ModelMetadata,
  ModelRule,
  ModelAlias,
  ProviderConfig,
  ConfigLoadOptions,
};

/**
 * Config type with plugin support
 * Extends base Config to add plugin-specific fields
 */
export interface Config extends TypesConfig {
  /** Plugins (unplugin-style) */
  plugins?: Plugin[];
}

/**
 * Context passed to plugins
 */
export interface PluginContext {
  cwd: string;
  env: Record<string, string>;
  config: Partial<Config>;
}
