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

// Connector loading
export {
  loadConnectors,
  getConnectorConfig,
  clearConnectorCache
} from './connector-loader.js';

// Convenience function to set up router with config
export { setupRouter } from './setup.js';
