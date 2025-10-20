/**
 * AnyGPT Configuration Types (v3.0+)
 *
 * Clean, unified configuration types with no legacy format support.
 * Supports both direct connector instances (TypeScript) and module references (JSON/YAML).
 */

import type { IConnector } from './connector.js';
import type { ExtraBodyParams } from './chat.js';
import type { MCPConfig, MCPDiscoveryConfig } from './mcp.js';

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
 * Provider configuration - supports two formats via connector field:
 *
 * 1. Direct instance (TypeScript/JavaScript):
 *    { connector: openai({ ... }) }
 *
 * 2. Module reference (JSON/YAML):
 *    { connector: '@anygpt/openai', config: { ... } }
 */
export interface ProviderConfig {
  /** Human-readable provider name */
  name?: string;

  /**
   * Connector: either a direct IConnector instance OR a module string
   * - IConnector: Direct instance (TypeScript/JavaScript configs)
   * - string: Module package name to dynamically import (JSON/YAML configs)
   */
  connector: IConnector | string;

  /**
   * Configuration for module-based connectors
   * Only used when connector is a string
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
 * Unified AnyGPT configuration format (v3.0+)
 *
 * - Uses IConnector instances or module references
 * - Supports plugins
 * - No legacy ConnectorConfig objects
 */
export interface Config {
  /** Provider configurations */
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
}

/**
 * Configuration loading options
 */
export interface ConfigLoadOptions {
  /** Custom config file path */
  configPath?: string;
  /** Merge with defaults */
  mergeDefaults?: boolean;
}
