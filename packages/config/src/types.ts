/**
 * Clean, unified configuration types for AnyGPT
 * No legacy format, no crazy unions - just one way to do things
 */

import type {
  IConnector,
  ExtraBodyParams,
  MCPConfig,
  MCPDiscoveryConfig,
} from '@anygpt/types';
import type { Plugin } from './plugins/types.js';

/**
 * Reasoning effort levels matching OpenAI's ReasoningEffort type
 */
export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

/**
 * Reasoning configuration object (OpenAI o1/o3 only)
 */
export interface ReasoningConfig {
  effort?: ReasoningEffort;
}

/**
 * Base model configuration properties shared across rules, metadata, and resolved configs
 */
export interface BaseModelConfig {
  /** Tags to categorize and identify models */
  tags?: string[];
  /** Reasoning configuration for OpenAI o1/o3 models */
  reasoning?: ReasoningEffort | ReasoningConfig;
  /** Maximum tokens for completion */
  max_tokens?: number;
  /** Use Chat Completions API directly (skip Responses API) */
  useLegacyCompletionAPI?: boolean;
  /** Fallback to Chat Completions API if Responses API fails */
  fallbackToChatCompletion?: boolean;
  /** Use max_tokens parameter (Anthropic/Cody style) instead of max_completion_tokens */
  useLegacyMaxTokens?: boolean;
  /** Provider-specific extra parameters */
  extra_body?: ExtraBodyParams;
  /** Enable/disable models (true/undefined = enabled, false = disabled) */
  enabled?: boolean;
}

/**
 * Model metadata with additional properties
 */
export interface ModelMetadata extends BaseModelConfig {
  [key: string]: unknown;
}

/**
 * Pattern-based model rule
 */
export interface ModelRule extends Omit<BaseModelConfig, 'reasoning'> {
  /** Glob patterns, regex strings, or RegExp objects to match model IDs */
  pattern: (string | RegExp)[];
  /** Reasoning configuration (true = default, false = disabled, or explicit config) */
  reasoning?: boolean | ReasoningEffort | ReasoningConfig;
}

/**
 * Model alias pointing to a specific provider/model or tag
 */
export interface ModelAlias {
  provider: string;
  model?: string;
  tag?: string;
}

/**
 * Provider configuration - supports two formats:
 *
 * 1. Direct instance (TypeScript/JavaScript configs):
 *    { connector: openai({ ... }) }
 *
 * 2. Module reference (JSON/YAML configs):
 *    { module: '@anygpt/openai', config: { ... } }
 */
export interface ProviderConfig {
  /** Human-readable provider name */
  name?: string;

  /**
   * Direct connector instance (for TypeScript/JavaScript configs)
   * Mutually exclusive with 'module'
   */
  connector?: IConnector;

  /**
   * Module reference (for JSON/YAML configs)
   * Package name to dynamically import (e.g., '@anygpt/openai')
   * Mutually exclusive with 'connector'
   */
  module?: string;

  /**
   * Configuration for module-based connectors
   * Only used when 'module' is specified
   */
  config?: Record<string, unknown>;

  /** Provider-specific settings */
  settings?: {
    defaultModel?: string;
    [key: string]: unknown;
  };
  /** Model metadata */
  models?: Record<string, ModelMetadata>;
  /** Pattern-based model rules */
  modelRules?: ModelRule[];
  /** Glob patterns to filter allowed models */
  allowedModels?: string[];
}

/**
 * Unified configuration format
 * - Uses IConnector instances (factory-style)
 * - Supports plugins
 * - No legacy ConnectorConfig objects
 */
export interface Config {
  /** Provider configurations (factory-style only) */
  providers?: Record<string, ProviderConfig>;

  /** Default settings */
  defaults?: {
    provider?: string;
    model?: string;
    modelRules?: ModelRule[];
  };

  /** Model aliases */
  aliases?: Record<string, ModelAlias>;

  /** MCP servers */
  mcpServers?: MCPConfig;

  /** Discovery configuration */
  discovery?: MCPDiscoveryConfig;

  /** Global settings */
  settings?: {
    timeout?: number;
    maxRetries?: number;
    [key: string]: unknown;
  };

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
