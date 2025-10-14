# Hook System

The OpenAI connector supports a powerful hook system that allows you to transform requests and responses.

## Quick Start

```typescript
import { openai } from '@anygpt/openai';

const connector = openai({
  baseURL: 'https://api.example.com',
  hooks: {
    'chat:request': (body, context) => {
      // Transform the request body before sending
      return { ...body, custom_param: 'value' };
    },
  },
});
```

## Hook Types

### `chat:request` - Transform Chat Completions Request

Modify the request body before it's sent to the Chat Completions API.

```typescript
import type { ChatCompletionBodyTransform } from '@anygpt/openai';

const myTransform: ChatCompletionBodyTransform = (body, context) => {
  // Example: Cap temperature
  return {
    ...body,
    temperature: Math.min(body.temperature || 1, 0.8),
  };
};
```

### `responses:request` - Transform Responses Request

Modify the request body before it's sent to the Responses API.

```typescript
import type { ResponsesBodyTransform } from '@anygpt/openai';

const responsesTransform: ResponsesBodyTransform = (body, context) => {
  return {
    ...body,
    custom_param: 'value',
  };
};
```

### `response` - Transform Response

Modify the response before it's returned.

```typescript
import type { ResponseTransform } from '@anygpt/openai';

const responseTransform: ResponseTransform = (response, context) => {
  return {
    ...response,
    _metadata: {
      provider: context.providerId,
      timestamp: Date.now(),
    },
  };
};
```

## Multiple Hooks

Register multiple hooks for the same event:

```typescript
const connector = openai({
  baseURL: 'https://api.example.com',
  hooks: {
    'chat:request': [transform1, transform2, transform3],
  },
});
```

Hooks execute in order, with each receiving the output of the previous.

## Built-in Transforms

### `tokenParameterTransform`

Automatically handles token parameter variations (registered by default).

## Transform Context

Every transform receives a context object:

```typescript
interface TransformContext {
  request: ChatCompletionRequest; // Original request
  providerId: string; // Provider ID (e.g., 'openai')
  apiType: 'chat' | 'responses'; // API being used
}
```

Use context to make intelligent decisions:

```typescript
const conditionalTransform: ChatCompletionBodyTransform = (body, context) => {
  // Only apply to specific models
  if (context.request.model?.startsWith('gpt-5')) {
    return { ...body, temperature: 0.7 };
  }
  return body;
};
```

## Examples

### Add Custom Headers

```typescript
const addHeaders: ChatCompletionBodyTransform = (body, context) => {
  return {
    ...body,
    extra_body: {
      ...body.extra_body,
      custom_header: 'my-value',
    },
  };
};
```

### Log Requests

```typescript
const logRequests: ChatCompletionBodyTransform = (body, context) => {
  console.log(`Request to ${context.request.model}:`, body);
  return body;
};
```

### Model-Specific Transform

```typescript
const customModelTransform: ChatCompletionBodyTransform = (body, context) => {
  // Example: Transform parameters for specific model types
  if (!context.request.model?.includes('custom-model')) {
    return body;
  }

  // Apply custom transformations
  return {
    ...body,
    // Add your custom parameters here
  };
};
```

## TypeScript Support

All hooks are fully typed:

```typescript
import type {
  ChatCompletionBodyTransform,
  ResponsesBodyTransform,
  ResponseTransform,
  TransformContext,
} from '@anygpt/openai';
```

Your IDE will provide autocomplete and type checking for hook functions.
