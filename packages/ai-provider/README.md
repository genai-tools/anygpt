# @anygpt/ai-provider

AI provider wrapper with function calling support. Wraps `@anygpt/router` for provider-agnostic AI interactions with agentic capabilities.

## Features

- ✅ **Provider-agnostic** - Uses `@anygpt/router` internally
- ✅ **Function calling** - Normalized across OpenAI/Anthropic
- ✅ **Token tracking** - Usage statistics for cost monitoring
- ✅ **Error handling** - Robust error handling and retries
- ✅ **Type-safe** - Full TypeScript support

## Installation

```bash
npm install @anygpt/ai-provider
```

## Usage

```typescript
import { AIProvider } from '@anygpt/ai-provider';
import { createRouter } from '@anygpt/router';

// Create router (handles actual API calls)
const router = createRouter(config);

// Create AI provider
const provider = new AIProvider(router, {
  provider: 'openai',
  model: 'gpt-4o-mini',
});

// Simple chat
const response = await provider.chat({
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(response.message); // AI response
console.log(response.usage);   // Token usage

// With function calling
const response = await provider.chat({
  messages: [
    { role: 'user', content: 'What is the weather in SF?' }
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' }
          },
          required: ['location']
        }
      }
    }
  ]
});

if (response.toolCalls) {
  console.log('AI wants to call:', response.toolCalls[0].function.name);
}
```

## Architecture

```
@anygpt/ai-provider (THIS PACKAGE)
  ↓ uses
@anygpt/router (provider routing)
  ↓ uses
@anygpt/connector-* (OpenAI, Anthropic, etc.)
```

**Key Point**: This package does NOT call OpenAI/Anthropic directly. It wraps the router to add agentic capabilities while staying provider-agnostic.

## API

### `AIProvider`

```typescript
class AIProvider {
  constructor(router: any, config: ProviderConfig);
  
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncIterator<ChatChunk>; // TODO
}
```

### Types

```typescript
interface ChatRequest {
  messages: Message[];
  tools?: Tool[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ChatResponse {
  message: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  usage: TokenUsage;
  model?: string;
}
```

## License

MIT
