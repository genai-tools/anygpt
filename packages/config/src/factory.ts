/**
 * Config factory for direct connector instantiation
 */

import type { IConnector, ExtraBodyParams } from '@anygpt/types';

/**
 * Reasoning effort levels matching OpenAI's ReasoningEffort type
 */
export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

/**
 * Reasoning configuration object (OpenAI o1/o3 only)
 */
export interface ReasoningConfig {
  // OpenAI o1/o3 models: reasoning_effort parameter
  effort?: ReasoningEffort;
}

/**
 * Base model configuration properties shared across rules, metadata, and resolved configs
 */
export interface BaseModelConfig {
  // Tags to categorize and identify models
  tags?: string[];
  // Reasoning configuration for OpenAI o1/o3 models
  reasoning?: ReasoningEffort | ReasoningConfig;
  // Maximum tokens for completion
  // The actual parameter name used depends on API mode and capability flags
  max_tokens?: number;
  // API mode flag: determines which OpenAI API to use
  // - true: Use Chat Completions API directly (skip Responses API entirely)
  // - false/undefined: Try Responses API (default, modern API)
  useLegacyCompletionAPI?: boolean;
  // Fallback flag: only applies when using Responses API
  // - true: If Responses API fails (404/400), fallback to Chat Completions API
  // - false/undefined: No fallback, raise error
  fallbackToChatCompletion?: boolean;
  // Token parameter flag: only applies to Chat Completions API
  // - true: use max_tokens parameter (Anthropic/Cody style)
  // - false/undefined: use max_completion_tokens parameter (OpenAI style, default)
  useLegacyMaxTokens?: boolean;
  // Provider-specific extra parameters (e.g., Anthropic's thinking parameter)
  extra_body?: ExtraBodyParams;
  // Enable/disable models
  // true or undefined = enabled, false = disabled
  enabled?: boolean;
}

export interface ModelMetadata extends BaseModelConfig {
  // Allow additional metadata like cost, context window, etc.
  [key: string]: unknown;
}

export interface ModelRule extends Omit<BaseModelConfig, 'reasoning'> {
  // Glob patterns, regex strings, or RegExp objects to match model IDs
  // Glob: '*gpt-5*', '!*nano*'
  // Regex string: '/gpt-[45]/', '/^claude.*sonnet$/i'
  // RegExp: /gpt-[45]/, /^claude.*sonnet$/i
  pattern: (string | RegExp)[];
  // Reasoning configuration for matching models
  // Can be:
  //   - true: use default 'medium' effort
  //   - false: disable reasoning
  //   - ReasoningEffort: direct effort level (shorthand)
  //   - ReasoningConfig: explicit object form
  reasoning?: boolean | ReasoningEffort | ReasoningConfig;
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
  model?: string; // Direct model name
  tag?: string; // Or reference a tag
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
    providers?: Record<
      string,
      {
        model?: string;
        [key: string]: unknown;
      }
    >;
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
