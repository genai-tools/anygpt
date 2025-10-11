# Anthropic Extended Thinking Support

AnyGPT now supports Anthropic's extended thinking parameter for Claude models when accessed through OpenAI-compatible APIs.

## Overview

Anthropic Claude models support "extended thinking" (also called "reasoning" mode), which allows the model to show its step-by-step reasoning process. This is different from OpenAI's `reasoning_effort` parameter.

## Configuration

### Type Definition

The `reasoning` parameter now supports both OpenAI and Anthropic formats:

```typescript
reasoning?: {
  // OpenAI o1/o3 models: reasoning_effort parameter
  effort?: 'minimal' | 'low' | 'medium' | 'high';

  // Anthropic extended thinking models: thinking parameter
  thinking?: {
    type: 'enabled';
    budget_tokens?: number;
  };
}
```

### Usage Example

When using Anthropic Claude models through an OpenAI-compatible API endpoint:

```typescript
const response = await router.chatCompletion({
  provider: 'anthropic',
  model: 'claude-sonnet-4-5',
  messages: [{ role: 'user', content: 'What is 27 * 453?' }],
  reasoning: {
    thinking: {
      type: 'enabled',
      budget_tokens: 10000,
    },
  },
});
```

### Model Rules Configuration

You can configure thinking parameters per model using model rules:

```typescript
export default config({
  providers: {
    anthropic: {
      connector: openai(
        {
          baseURL: 'https://api.anthropic.com/v1',
          apiKey: process.env.ANTHROPIC_API_KEY,
        },
        'anthropic'
      ),
      modelRules: [
        {
          pattern: ['*sonnet-4*', '*opus-4*'],
          reasoning: {
            thinking: {
              type: 'enabled',
              budget_tokens: 10000,
            },
          },
        },
      ],
    },
  },
});
```

## How It Works

1. **Request Parameter**: When `reasoning.thinking` is provided, the OpenAI connector adds the `thinking` parameter to the API request
2. **SDK Compatibility**: Uses OpenAI SDK's support for undocumented parameters (parameters are sent as-is)
3. **Response Handling**: The response includes thinking blocks showing the model's reasoning process

## Supported Models

Anthropic extended thinking is supported on:

- Claude Opus 4.1 (`claude-opus-4-1-20250805`)
- Claude Opus 4 (`claude-opus-4-20250514`)
- Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- Claude Sonnet 3.7 (`claude-3-7-sonnet-20250219`)

## Cody/Sourcegraph Note

**Important**: Sourcegraph/Cody does NOT support the `thinking` parameter in API requests. Instead:

- Thinking models must be configured server-side in Sourcegraph
- The `reasoningEffort` is set per-model in the server configuration
- Client requests should NOT include thinking parameters
- **Thinking models only work through Google Vertex or AWS Bedrock** (not direct Anthropic API)
- Requires Sourcegraph v6.4+ or v6.3.416+

### Why Thinking Models Fail on Cody

If you see errors like:

```
❌ claude-sonnet-4-thinking-latest: 500 status code (no body)
```

This means:

1. Your Sourcegraph instance hasn't configured thinking models server-side
2. Your instance may be using direct Anthropic API (thinking requires Vertex/Bedrock)
3. Your instance version is older than v6.4

### Recommended Cody Configuration

Disable thinking models and reasoning parameters:

```typescript
cody: {
  connector: cody(),
  modelRules: [
    {
      // Disable all reasoning parameters
      pattern: [/.*/],
      reasoning: false
    },
    {
      // Disable thinking models entirely
      pattern: ['*thinking*', '*extended-thinking*'],
      enabled: false
    }
  ]
}
```

This will:

- ✅ Hide thinking models from the model list
- ✅ Prevent accidental usage of unsupported models
- ✅ Avoid 500 errors during benchmarks

## Differences from OpenAI Reasoning

| Feature         | OpenAI (o1/o3)                             | Anthropic (Extended Thinking)                 |
| --------------- | ------------------------------------------ | --------------------------------------------- |
| Parameter       | `reasoning_effort`                         | `thinking`                                    |
| Values          | `'minimal' \| 'low' \| 'medium' \| 'high'` | `{ type: 'enabled', budget_tokens?: number }` |
| Token Budget    | Fixed per effort level                     | Configurable via `budget_tokens`              |
| Streaming       | Not supported                              | Supported via `thinking_delta` events         |
| Response Format | Standard completion                        | Includes thinking blocks with signatures      |

## See Also

- [Anthropic Extended Thinking Documentation](https://docs.anthropic.com/en/docs/about-claude/models/extended-thinking-models)
- [OpenAI Reasoning Effort Documentation](./reasoning-effort-levels.md)
- [Model Rules Documentation](../packages/config/docs/MODEL_RULES.md)
