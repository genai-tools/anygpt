/**
 * Example AnyGPT configuration for LiteLLM Proxy integration
 * 
 * This config demonstrates how to use AnyGPT with LiteLLM as a backend gateway,
 * giving you access to 100+ providers with enterprise features while maintaining
 * AnyGPT's MCP support and TypeScript ecosystem.
 * 
 * Prerequisites:
 * 1. Install LiteLLM: pip install litellm[proxy]
 * 2. Start LiteLLM: litellm --config litellm_config.yaml --port 4000
 * 3. Set environment variables for provider API keys
 */

import type { AnyGPTConfig } from '@anygpt/config';

const litellmConfig: AnyGPTConfig = {
  version: '1.0',
  settings: {
    defaultProvider: 'litellm'
  },
  
  providers: {
    // LiteLLM Proxy - provides access to all configured providers
    'litellm': {
      name: 'LiteLLM Gateway',
      connector: {
        connector: '@anygpt/openai',
        config: {
          baseURL: 'http://localhost:4000/v1',
          apiKey: process.env.LITELLM_MASTER_KEY || 'sk-litellm-master-key'
        }
      }
    },
    
    // You can still configure direct providers as fallbacks
    'openai-direct': {
      name: 'OpenAI Direct',
      connector: {
        connector: '@anygpt/openai',
        config: {
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: 'https://api.openai.com/v1'
        }
      }
    },
    
    // Local Ollama for offline development
    'ollama': {
      name: 'Local Ollama',
      connector: {
        connector: '@anygpt/openai',
        config: {
          baseURL: 'http://localhost:11434/v1'
        }
      }
    }
  }
};

export default litellmConfig;
