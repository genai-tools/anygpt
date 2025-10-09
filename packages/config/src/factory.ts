/**
 * Config factory for direct connector instantiation
 */

import type { IConnector } from '@anygpt/types';

/**
 * Reasoning effort levels matching OpenAI's ReasoningEffort type
 */
export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

/**
 * Reasoning configuration object
 */
export interface ReasoningConfig {
  effort?: ReasoningEffort;
}

export interface ModelMetadata {
  tags: string[];
  // Reasoning configuration for extended thinking/reasoning models
  reasoning?: ReasoningEffort | ReasoningConfig;
  [key: string]: unknown; // Allow additional metadata like cost, context window, etc.
}

export interface ModelRule {
  // Glob patterns, regex strings, or RegExp objects to match model IDs
  // Glob: '*gpt-5*', '!*nano*'
  // Regex string: '/gpt-[45]/', '/^claude.*sonnet$/i'
  // RegExp: /gpt-[45]/, /^claude.*sonnet$/i
  pattern: (string | RegExp)[];
  // Tags to apply to matching models
  tags?: string[];
  // Reasoning configuration for matching models
  // Can be:
  //   - true: use default 'medium' effort
  //   - false: disable reasoning
  //   - ReasoningEffort: direct effort level (shorthand)
  //   - ReasoningConfig: explicit object form
  reasoning?: boolean | ReasoningEffort | ReasoningConfig;
  // Enable/disable models matching this pattern
  // true or undefined = enabled, false = disabled
  enabled?: boolean;
}

export interface FactoryProviderConfig {
  name?: string;
  connector: IConnector;
  settings?: {
    defaultModel?: string;
    [key: string]: unknown;
  };
  models?: Record<string, ModelMetadata>;
  /**
   * Pattern-based model rules (applied to matching models)
   * Evaluated in order, can apply tags, reasoning, and other capabilities
   */
  modelRules?: ModelRule[];
  /**
   * Glob patterns to filter which models are allowed/enabled for this provider.
   * Supports wildcards: *, **, ?, [abc], {a,b,c}
   * Examples:
   *   - ['gpt-*'] - only GPT models
   *   - ['*sonnet*', '*opus*'] - only Sonnet and Opus models
   *   - ['!*nano*'] - exclude nano models (negation)
   */
  allowedModels?: string[];
}

export interface ModelAlias {
  provider: string;
  model?: string;  // Direct model name
  tag?: string;    // Or reference a tag
}

export interface FactoryConfig {
  defaults?: {
    provider?: string;
    model?: string;
    timeout?: number;
    maxRetries?: number;
    logging?: {
      level?: 'debug' | 'info' | 'warn' | 'error';
    };
    // Per-provider defaults
    providers?: Record<string, {
      model?: string;
      [key: string]: unknown;
    }>;
    // Model aliases for cross-provider model mapping
    aliases?: Record<string, ModelAlias[]>;
    // Global pattern-based model rules (lowest priority)
    modelRules?: ModelRule[];
  };
  providers: Record<string, FactoryProviderConfig>;
}

/**
 * Factory function to create AnyGPT configuration with direct connector instances
 */
export function config(factoryConfig: FactoryConfig): FactoryConfig {
  // Just return the config as-is - no need to process settings since we eliminated them
  return factoryConfig;
}
