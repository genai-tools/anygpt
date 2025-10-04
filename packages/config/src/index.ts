/**
 * @anygpt/config - Shared configuration management for AnyGPT
 */

// Re-export types from @anygpt/types
export type {
  ConnectorConfig,
  ProviderConfig,
  AnyGPTConfig,
  ConfigLoadOptions
} from '@anygpt/types';

// Default configurations
export {
  getDefaultConfig,
  convertCodexToAnyGPTConfig
} from './defaults.js';
// Connector loading
export {
  loadConnectors,
  getConnectorConfig,
  clearConnectorCache
} from './connector-loader.js';

// Convenience functions to set up router with config
export { setupRouter, setupRouterFromFactory } from './setup.js';

// Migration utilities
export {
  migrateFromCodex,
  runMigration
} from './migrate.js';

// Factory function for direct connector instantiation
export { 
  config,
  type FactoryConfig,
  type FactoryProviderConfig
} from './factory.js';

// Note: Connector factory functions (like openai()) should be imported directly 
// from their packages to keep config package connector-agnostic:
// import { openai } from '@anygpt/openai';
// import { anthropic } from '@anygpt/anthropic'; // future
// etc.
