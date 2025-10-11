/**
 * Example configuration for using corporate Claude API via AnyGPT
 *
 * This example shows how to configure the native Anthropic connector
 * to work with a corporate gateway endpoint.
 */

import { config } from '@anygpt/config';
import { anthropic } from '@anygpt/anthropic';
import { openai } from '@anygpt/openai';

export default config({
  defaults: {
    provider: 'corporate-claude',
    model: 'claude-sonnet-4-5',
  },
  providers: {
    // Corporate Claude API using native Anthropic connector
    'corporate-claude': {
      name: 'Corporate Claude Gateway',
      connector: anthropic({
        apiKey: 'dummy-key', // Some corporate gateways use static keys
        baseURL: 'https://your-corporate-gateway.example.com/anthropic',
        timeout: 120000, // 2 minutes for slower corporate gateways
        maxRetries: 3,
      }),
      // Configure model rules for Claude models
      modelRules: [
        {
          // All Claude models use max_tokens (Anthropic-style)
          pattern: [/.*/],
          max_tokens: 4096,
          useLegacyMaxTokens: true, // Use max_tokens parameter
        },
        {
          // Enable extended thinking for thinking models
          pattern: ['*thinking*', '*extended-thinking*'],
          max_tokens: 8192,
          extra_body: {
            thinking: {
              type: 'enabled',
              budget_tokens: 2048,
            },
          },
        },
      ],
    },

    // Fallback to public Anthropic API
    'anthropic-public': {
      name: 'Public Anthropic API',
      connector: anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        // baseURL is optional - defaults to https://api.anthropic.com
      }),
    },

    // OpenAI-compatible corporate gateway (alternative approach)
    'corporate-openai-compat': {
      name: 'Corporate Gateway (OpenAI-compatible)',
      connector: openai({
        baseURL: 'https://your-corporate-gateway.example.com/openai',
        timeout: 120000,
      }),
    },
  },
});
