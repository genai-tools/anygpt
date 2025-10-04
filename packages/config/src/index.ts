/**
 * @anygpt/config - Shared configuration management for AnyGPT
 */

// Types
export type * from './types.js';

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

// Connector helper re-exports for convenience
export { openai } from '@anygpt/openai';

// Note: Connector factory functions should be imported directly from their packages
// to avoid circular dependencies during build
