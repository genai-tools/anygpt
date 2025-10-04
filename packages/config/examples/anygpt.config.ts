/* eslint-disable @nx/enforce-module-boundaries */
/**
 * Example AnyGPT configuration file
 * Save as ~/.anygpt/anygpt.config.ts
 */

import type { AnyGPTConfig } from '@anygpt/config';

const config: AnyGPTConfig = {
  version: '1.0',
  
  providers: {
    // OpenAI provider
    'openai-main': {
      name: 'OpenAI GPT Models',
      connector: {
        connector: '@anygpt/openai',
        config: {
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: 'https://api.openai.com/v1',
          timeout: 30000,
          maxRetries: 3
        }
      },
      settings: {
        defaultModel: 'gpt-4'
      }
    },
    
    // Local Ollama instance
    'ollama-local': {
      name: 'Local Ollama',
      connector: {
        connector: '@anygpt/openai', // Uses OpenAI-compatible API
        config: {
          baseURL: 'http://localhost:11434/v1',
          // No API key needed for Ollama
          timeout: 60000 // Longer timeout for local models
        }
      },
      settings: {
        defaultModel: 'llama2'
      }
    },
    
    // Together AI
    'together-ai': {
      name: 'Together AI',
      connector: {
        connector: '@anygpt/openai', // Uses OpenAI-compatible API
        config: {
          apiKey: process.env.TOGETHER_API_KEY,
          baseURL: 'https://api.together.xyz/v1'
        }
      }
    }
  },
  
  settings: {
    defaultProvider: 'openai-main',
    timeout: 30000,
    maxRetries: 3,
    logging: {
      level: 'info',
      file: '~/.anygpt/logs/anygpt.log'
    }
  }
};

export default config;
