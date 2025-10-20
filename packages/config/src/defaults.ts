/**
 * Default AnyGPT configuration
 */

import type { Config } from './types.js';

/**
 * Get default configuration
 *
 * Note: No providers are included by default. Users must configure their own providers.
 * This prevents unwanted dependencies and gives users full control over their setup.
 */
export function getDefaultConfig(): Config {
  return {
    providers: {},

    settings: {
      timeout: 30000,
      maxRetries: 3,
    },
  };
}
