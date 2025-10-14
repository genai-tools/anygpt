# Hook System Architecture

> **Note:** This is workspace documentation for contributors. For user documentation, see the package README.

## Overview

The OpenAI connector implements a powerful hook system inspired by unplugin, allowing users to transform requests and responses without modifying the connector code.

## Design Philosophy

### Why Hooks Instead of Flags?

**Before (Flag-based):**

```typescript
{
  useLegacyMaxTokens: true,
  useMaxOutputTokens: true,
  useLegacyCompletionAPI: true,
  // Need a new flag for every edge case!
}
```

**After (Hook-based):**

```typescript
{
  hooks: {
    'chat:request': (body, context) => {
      // Transform anything you want!
      return transformedBody;
    },
  },
}
```

### Benefits

1. **Infinite Flexibility** - Transform any part of the request/response
2. **No Code Changes** - Add new behaviors without modifying the connector
3. **Composable** - Chain multiple transforms together
4. **Type Safe** - Full TypeScript support with proper types
5. **Testable** - Pure functions that are easy to test

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenAI Connector                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              HookManager                             │  │
│  │  - Registers hooks                                   │  │
│  │  - Executes transforms in order                      │  │
│  │  - Provides context to each transform                │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Built-in Transforms                        │  │
│  │  - tokenParameterTransform (always registered)       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           User-provided Hooks                        │  │
│  │  - Custom transforms from config                     │  │
│  │  - Can be single function or array                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Hook Execution Flow

### Request Flow

```
1. Build base request
   ↓
2. Execute 'chat:request' hooks (in order)
   ↓
3. Send to API
   ↓
4. Receive response
   ↓
5. Execute 'response' hooks (in order)
   ↓
6. Return to caller
```

### Transform Chain

```typescript
// Multiple hooks are executed in sequence
body = hook1(body, context);
body = hook2(body, context);
body = hook3(body, context);
// Final body is sent to API
```

## Implementation Details

### HookManager Class

```typescript
class HookManager {
  private hooks: ConnectorHooks = {};

  // Register a hook
  on(event, handler): void;

  // Execute all hooks for an event
  async execute(event, initialValue, context): Promise<any>;

  // Check if hooks exist
  has(event): boolean;

  // Clear all hooks
  clear(): void;
}
```

### Hook Registration

Hooks are registered in the connector constructor:

```typescript
constructor(config: OpenAIConnectorConfig) {
  this.hooks = new HookManager();

  // 1. Register built-in transforms
  this.hooks.on('chat:request', tokenParameterTransform);

  // 2. Register user-provided hooks
  if (config.hooks?.['chat:request']) {
    const hooks = Array.isArray(config.hooks['chat:request'])
      ? config.hooks['chat:request']
      : [config.hooks['chat:request']];
    hooks.forEach(hook => this.hooks.on('chat:request', hook));
  }
}
```

### Hook Execution

Hooks are executed before API calls:

```typescript
private async executeChatCompletion(request, context) {
  let chatRequest = buildChatCompletionRequest(request);

  // Apply hooks to transform the request
  chatRequest = await this.hooks.execute('chat:request', chatRequest, {
    request,
    providerId: this.providerId,
    apiType: 'chat',
  });

  let response = await this.client.chat.completions.create(chatRequest);

  // Apply response hooks
  if (this.hooks.has('response')) {
    response = await this.hooks.execute('response', response, {
      request,
      providerId: this.providerId,
      apiType: 'chat',
    });
  }

  return response;
}
```

## Testing

Hooks are easy to test because they're pure functions:

```typescript
import type { ChatCompletionBodyTransform } from '@anygpt/openai';

const myTransform: ChatCompletionBodyTransform = (body, context) => {
  // Custom transformation logic
  return { ...body, custom_param: 'value' };
};

test('transforms requests', () => {
  const body = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'test' }],
  };

  const context = {
    request: { model: 'gpt-4' },
    providerId: 'openai',
    apiType: 'chat' as const,
  };

  const result = myTransform(body, context);

  expect(result.custom_param).toBe('value');
});
```

## Future Enhancements

### 1. Async Hooks

Support async transforms:

```typescript
'chat:request': async (body, context) => {
  const config = await fetchConfig();
  return { ...body, ...config };
}
```

### 2. Hook Priorities

Allow specifying execution order:

```typescript
hooks: {
  'chat:request': [
    { priority: 100, handler: highPriorityHook },
    { priority: 50, handler: normalHook },
  ],
}
```

### 3. Conditional Hooks

Built-in helpers for conditional execution:

```typescript
import { when } from '@anygpt/openai';

const myTransform = (body, ctx) => ({ ...body, custom: true });

hooks: {
  'chat:request': when(
    (ctx) => ctx.request.model?.includes('gpt-4'),
    myTransform
  ),
}
```

## Performance

- **Minimal overhead** - Hooks only execute when registered
- **No reflection** - Direct function calls
- **Async support** - Non-blocking transforms
- **Lazy evaluation** - Hooks only run when needed
