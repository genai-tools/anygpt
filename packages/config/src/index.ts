/**
 * @anygpt/config - Shared configuration management for AnyGPT
 */

// Clean, unified configuration API
export { defineConfig, mergeConfigs, resolveConfig } from './config.js';

// Unified configuration types (no legacy, no crazy unions!)
export type {
  Config,
  ProviderConfig,
  ModelAlias,
  BaseModelConfig,
  ModelMetadata,
  ModelRule,
  ReasoningEffort,
  ReasoningConfig,
  PluginContext,
} from './types.js';

// Config loader types
export type { ConfigLoadOptions } from './loader.js';

// Plugin system types
export type {
  Plugin,
  PluginFactory,
  BasePluginOptions,
} from './plugins/types.js';

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

// Convenience functions to set up router with config
export { setupRouter, setupRouterFromFactory } from './setup.js';

// Connector resolution (for advanced use cases)
export { resolveConnector } from './connector-resolver.js';

// Model pattern resolver
export {
  resolveModelConfig,
  type ResolvedModelConfig,
} from './model-pattern-resolver.js';

// Configuration loader and validation
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

// Re-export rule engine from @anygpt/rules for convenience
export { RuleEngine } from '@anygpt/rules';
export type {
  Rule,
  RuleCondition,
  LogicalCondition,
  RuleOperator,
} from '@anygpt/rules';

// Legacy type aliases (DEPRECATED - will be removed in next major version)
/** @deprecated Use Config instead */
export type { Config as FactoryConfig } from './types.js';
/** @deprecated Use ProviderConfig instead */
export type { ProviderConfig as FactoryProviderConfig } from './types.js';
/** @deprecated Use defineConfig instead */
export { defineConfig as config } from './config.js';
/** @deprecated Use mergeConfigs from config.ts instead */
export { mergeConfigsLegacy as mergeConfigsOld } from './loader.js';

// Note: Connector factory functions (like openai()) should be imported directly
// from their packages to keep config package connector-agnostic:
// import { openai } from '@anygpt/openai';
// import { anthropic } from '@anygpt/anthropic'; // future
// etc.
