/**
 * @anygpt/config - Shared configuration management for AnyGPT
 */

// Re-export types from @anygpt/types
export type {
  ConnectorConfig,
  ProviderConfig,
  AnyGPTConfig,
  ConfigLoadOptions,
} from '@anygpt/types';

// Error types
export {
  ConfigError,
  ConfigNotFoundError,
  ConfigParseError,
  ConfigValidationError,
  ConnectorLoadError,
} from './errors.js';

// Default configurations
export { getDefaultConfig } from './defaults.js';
// Connector loading
export {
  loadConnectors,
  getConnectorConfig,
  clearConnectorCache,
} from './connector-loader.js';

// Convenience functions to set up router with config
export { setupRouter, setupRouterFromFactory } from './setup.js';

// Factory function for direct connector instantiation
export {
  config,
  type FactoryConfig,
  type FactoryProviderConfig,
  type ModelAlias,
  type BaseModelConfig,
  type ModelMetadata,
  type ModelRule,
  type ReasoningEffort,
  type ReasoningConfig,
} from './factory.js';

// Model pattern resolver
export {
  resolveModelConfig,
  type ResolvedModelConfig,
} from './model-pattern-resolver.js';

// Configuration loader (not exported by default, used internally)
export { loadConfig, validateConfig } from './loader.js';

// Model resolution (tags, aliases, direct models)
export {
  resolveModel,
  findModelByTag,
  listAvailableTags,
  type ModelResolution,
  type ModelResolutionContext,
  type TagInfo,
  type AliasInfo,
  type AvailableTagsResult,
} from './model-resolver.js';

// Tag registry (pre-computed tag mappings)
export {
  buildTagRegistry,
  type TagRegistry,
  type TagMapping,
} from './tag-registry.js';

// Glob pattern matching for model filtering
export { matchesGlobPatterns } from './glob-matcher.js';

// Plugin system (unplugin-style)
export { defineConfig, resolveConfig } from './plugins/define-config.js';
export type { Plugin, PluginContext, PluginFactory, BasePluginOptions } from './plugins/types.js';

// Re-export rule engine from @anygpt/rules for convenience
export { RuleEngine } from '@anygpt/rules';
export type { Rule, RuleCondition, LogicalCondition, RuleOperator } from '@anygpt/rules';

// Note: Connector factory functions (like openai()) should be imported directly
// from their packages to keep config package connector-agnostic:
// import { openai } from '@anygpt/openai';
// import { anthropic } from '@anygpt/anthropic'; // future
// etc.
