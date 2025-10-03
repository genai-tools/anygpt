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
      'openai': {
        name: 'OpenAI',
        connector: {
          connector: '@anygpt/openai',
          config: {
            apiKey: process.env['OPENAI_API_KEY'],
            baseURL: 'https://api.openai.com/v1',
            timeout: 30000,
            maxRetries: 3
          }
        },
        settings: {
          defaultModel: 'gpt-4o-mini'
        }
      },
      
      // Mock provider for testing (always available)
      'mock': {
        name: 'Mock Provider (Testing)',
        connector: {
          connector: '@anygpt/mock',
          config: {
            delay: 100,
            failureRate: 0
          }
        },
        settings: {
          defaultModel: 'mock-gpt-4'
        }
      }
    },
    
    settings: {
      defaultProvider: process.env['OPENAI_API_KEY'] ? 'openai' : 'mock',
      timeout: 30000,
      maxRetries: 3,
      logging: {
        level: 'info'
      }
    }
  };
}

/**
 * Convert codex-style config to AnyGPT config
 */
export function convertCodexToAnyGPTConfig(codexConfig: any): AnyGPTConfig {
  const providers: AnyGPTConfig['providers'] = {};
  
  if (codexConfig.model_providers) {
    for (const [providerId, providerConfig] of Object.entries(codexConfig.model_providers as any)) {
      const config = providerConfig as any;
      
      // Get API token from environment variable if specified
      let apiKey: string | undefined;
      if (config.env_key) {
        apiKey = process.env[config.env_key];
        if (!apiKey) {
          console.warn(`Warning: Environment variable ${config.env_key} not set for provider ${providerId}`);
        }
      }
      
      // Convert base_url to our format (remove /chat/completions if present)
      let baseURL = config.base_url;
      if (baseURL.endsWith('/chat/completions')) {
        baseURL = baseURL.slice(0, -'/chat/completions'.length);
      }
      
      providers[providerId] = {
        name: config.name || providerId,
        connector: {
          connector: '@anygpt/openai', // Assume OpenAI-compatible
          config: {
            baseURL,
            ...(apiKey && { apiKey }),
            timeout: 30000,
            maxRetries: 3
          }
        },
        settings: {
          defaultModel: codexConfig.model || 'gpt-3.5-turbo'
        }
      };
    }
  }
  
  return {
    version: '1.0',
    providers,
    settings: {
      defaultProvider: codexConfig.model_provider || Object.keys(providers)[0] || 'mock',
      timeout: 30000,
      maxRetries: 3,
      logging: {
        level: 'info'
      }
    }
  };
}
