/**
 * @anygpt/config - Shared configuration management for AnyGPT
 */

// Types
export type {
  AnyGPTConfig,
  ProviderConfig,
  ConnectorConfig,
  ConfigLoadOptions
} from './types.js';

// Configuration loading
export {
  loadConfig,
  validateConfig
} from './loader.js';

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

// Re-export connector factory functions for convenience
export { openai } from '@anygpt/openai';
export { mock } from '@anygpt/mock';
