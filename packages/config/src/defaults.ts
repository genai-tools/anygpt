/**
 * Default AnyGPT configuration
 */

import type { AnyGPTConfig } from '@anygpt/types';

/**
 * Get default configuration with common providers
 */
export function getDefaultConfig(): AnyGPTConfig {
  return {
    version: '1.0',

    providers: {
      // OpenAI as primary provider
      openai: {
        name: 'OpenAI',
        connector: {
          connector: '@anygpt/openai',
          config: {
            apiKey: process.env['OPENAI_API_KEY'],
            baseURL: 'https://api.openai.com/v1',
            timeout: 30000,
            maxRetries: 3,
          },
        },
        settings: {
          defaultModel: 'gpt-4o-mini',
        },
      },

      // Mock provider for testing (always available)
      mock: {
        name: 'Mock Provider (Testing)',
        connector: {
          connector: '@anygpt/mock',
          config: {
            delay: 100,
            failureRate: 0,
          },
        },
        settings: {
          defaultModel: 'mock-gpt-4',
        },
      },
    },

    settings: {
      defaultProvider: process.env['OPENAI_API_KEY'] ? 'openai' : 'mock',
      timeout: 30000,
      maxRetries: 3,
      logging: {
        level: 'info',
      },
    },
  };
}
