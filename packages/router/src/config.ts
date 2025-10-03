import type { RouterConfig } from './types/router.js';

/**
 * Helper function to define a router configuration with full TypeScript support
 */
export function defineConfig(config: RouterConfig): RouterConfig {
  return config;
}

/**
 * Re-export types for convenience
 */
export type { RouterConfig, GatewayConfig, ProviderConfig, ApiConfig } from './types/router.js';
