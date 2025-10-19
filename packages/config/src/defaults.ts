/**
 * Default AnyGPT configuration
 */

import type { AnyGPTConfig } from '@anygpt/types';

/**
 * Get default configuration
 * 
 * Note: No providers are included by default. Users must configure their own providers.
 * This prevents unwanted dependencies and gives users full control over their setup.
 */
export function getDefaultConfig(): AnyGPTConfig {
  return {
    version: '1.0',

    providers: {},

    settings: {
      timeout: 30000,
      maxRetries: 3,
      logging: {
        level: 'info',
      },
    },
  };
}
