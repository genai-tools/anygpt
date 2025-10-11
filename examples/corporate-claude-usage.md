# Using Corporate Claude API with AnyGPT

This guide shows how to configure and use your corporate Claude API endpoint with AnyGPT's native Anthropic connector.

## Why Use the Native Anthropic Connector?

The native `@anygpt/anthropic` connector provides:

- ✅ **Proper parameter handling**: Uses `max_tokens` (Anthropic-style) instead of `max_completion_tokens`
- ✅ **Extended thinking support**: Native support for Claude's thinking models
- ✅ **Better error messages**: Anthropic-specific error handling
- ✅ **System prompt handling**: Proper separation of system prompts from messages
- ✅ **Future-proof**: Supports new Anthropic features as they're released

## Installation

```bash
# Install the Anthropic connector
npm install @anygpt/anthropic

# Or add to your project
cd /path/to/your/project
npm install @anygpt/anthropic
```

## Configuration

Create or update your `.anygpt/anygpt.config.ts`:

```typescript
import { config } from '@anygpt/config';
import { anthropic } from '@anygpt/anthropic';

export default config({
  defaults: {
    provider: 'corporate-claude',
  },
  providers: {
    'corporate-claude': {
      name: 'Corporate Claude Gateway',
      connector: anthropic({
        apiKey: 'dummy-key', // Your corporate gateway may use a static key
        baseURL: 'https://your-corporate-gateway.example.com/anthropic',
        timeout: 120000, // 2 minutes for slower gateways
        maxRetries: 3,
      }),
      // Model-specific configuration
      modelRules: [
        {
          // All models use Anthropic-style max_tokens
          pattern: [/.*/],
          max_tokens: 4096,
          useLegacyMaxTokens: true,
        },
        {
          // Tag Claude Sonnet models
          pattern: ['*sonnet*'],
          tags: ['claude', 'sonnet'],
        },
        {
          // Tag Claude Opus models
          pattern: ['*opus*'],
          tags: ['claude', 'opus'],
        },
      ],
    },
  },
});
```

## Usage with CLI

```bash
# Chat with corporate Claude
anygpt chat --provider corporate-claude --model claude-sonnet-4-5 "Hello!"

# Use tags (if configured)
anygpt chat --provider corporate-claude --tag sonnet "Explain TypeScript"

# Start a conversation
anygpt conversation start --provider corporate-claude --model claude-sonnet-4-5
anygpt conversation message "What is the capital of France?"
```

## Usage in Code

```typescript
import { setupRouterFromFactory } from '@anygpt/config';

// Load configuration and setup router
const { router } = await setupRouterFromFactory();

// Make a request
const response = await router.chatCompletion({
  provider: 'corporate-claude',
  model: 'claude-sonnet-4-5',
  messages: [{ role: 'user', content: 'Hello, Claude!' }],
});

console.log(response.choices[0].message.content);
```

## Troubleshooting

### Connection Errors

If you see connection errors like `ECONNRESET`:

1. **Check your baseURL**: Ensure it points to the correct corporate endpoint
2. **Verify authentication**: Some gateways require specific API keys or headers
3. **Check network access**: Ensure you can reach the corporate gateway from your machine

### Authentication Issues

If you get 401/403 errors:

```typescript
connector: anthropic({
  apiKey: 'your-actual-key', // Update with correct key
  baseURL: 'https://your-gateway.example.com/anthropic',
  defaultHeaders: {
    // Add any custom headers required by your gateway
    'X-Custom-Auth': 'your-token',
  },
}),
```

### Model Not Found

If you get "model not found" errors:

1. Check which models are available on your corporate gateway
2. Update the model name in your request
3. Contact your IT team for the list of available models

## Comparison: Native vs OpenAI-Compatible

Your corporate gateway may offer both endpoints:

### Native Anthropic Endpoint (Recommended)

```typescript
// /anthropic endpoint - uses native Anthropic API
connector: anthropic({
  baseURL: 'https://gateway.example.com/anthropic',
});
```

**Pros:**

- Native Anthropic features (thinking, proper max_tokens)
- Better error messages
- Future-proof

**Cons:**

- Requires @anygpt/anthropic package

### OpenAI-Compatible Endpoint (Alternative)

```typescript
// /openai endpoint - uses OpenAI-compatible API
connector: openai({
  baseURL: 'https://gateway.example.com/openai',
});
```

**Pros:**

- Works with existing @anygpt/openai package
- Simpler if you already use OpenAI

**Cons:**

- May not support all Anthropic features
- Parameter translation issues (max_tokens vs max_completion_tokens)

## Next Steps

1. Update your `.anygpt/anygpt.config.ts` with your corporate endpoint
2. Test the connection: `anygpt chat --provider corporate-claude "test"`
3. Configure model rules and tags for your use case
4. Integrate into your applications

## Support

For issues with:

- **AnyGPT configuration**: Check the [Configuration Guide](../packages/config/README.md)
- **Corporate gateway**: Contact your IT team
- **Anthropic connector**: Open an issue on GitHub
