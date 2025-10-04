/**
 * Default AnyGPT configuration
 */

import type { AnyGPTConfig } from '@anygpt/types';

export interface CodexProviderConfig {
  name?: string;
  base_url?: string;
  env_key?: string;
  wire_api?: string;
  query_params?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CodexConfig {
  model?: string;
  model_provider?: string;
  model_providers?: Record<string, CodexProviderConfig>;
  [key: string]: unknown;
}

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
export function convertCodexToAnyGPTConfig(codexConfig: CodexConfig): AnyGPTConfig {
  const providers: AnyGPTConfig['providers'] = {};
  const defaultModel = codexConfig.model ?? 'gpt-3.5-turbo';

  if (codexConfig.model_providers) {
    for (const [providerId, providerConfig] of Object.entries(codexConfig.model_providers)) {
      const normalizedConfig: CodexProviderConfig = providerConfig ?? {};

      let apiKey: string | undefined;
      if (normalizedConfig.env_key) {
        apiKey = process.env[normalizedConfig.env_key];
        if (!apiKey) {
          console.warn(`Warning: Environment variable ${normalizedConfig.env_key} not set for provider ${providerId}`);
        }
      }

      let baseURL = normalizedConfig.base_url ?? 'https://api.openai.com/v1';
      if (baseURL.endsWith('/chat/completions')) {
        baseURL = baseURL.slice(0, -'/chat/completions'.length);
      }

      providers[providerId] = {
        name: normalizedConfig.name || providerId,
        connector: {
          connector: '@anygpt/openai',
          config: {
            baseURL,
            ...(apiKey ? { apiKey } : {}),
            timeout: 30000,
            maxRetries: 3,
          },
        },
        settings: {
          defaultModel,
        },
      };
    }
  }

  const defaultProvider = codexConfig.model_provider || Object.keys(providers)[0] || 'mock';

  return {
    version: '1.0',
    providers,
    settings: {
      defaultProvider,
      timeout: 30000,
      maxRetries: 3,
      logging: {
        level: 'info',
      },
    },
  };
}
