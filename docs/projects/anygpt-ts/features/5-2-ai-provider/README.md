# AI Provider Integration

|                       |                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------- |
| **Status**            | 🚀 In Progress                                                                              |
| **Progress**          | 0/10 tasks (0%)                                                                             |
| **Spec**              | [Agentic Chat](../../../../products/anygpt/specs/anygpt/agentic-chat.md)                   |
| **Use Case**          | [Agentic CI/CD Automation](../../../../products/anygpt/cases/agentic-cicd-automation.md)   |
| **Architecture**      | [System Design](../../architecture.md)                                                      |
| **Roadmap**           | [Feature List](../../roadmap.md#5-2-ai-provider)                                            |

## Overview

Integrate AI providers (OpenAI, Anthropic) with function calling support. Enables chat loop to send messages to AI and receive responses with tool calls.

**Key Capability**: AI-powered chat with function calling protocol support.

## Status

**Last Updated**: 2025-10-20  
**Current Phase**: Blocked by 5-1 🔒

**Dependencies**:
- ✅ `@anygpt/config` (exists)
- 🔒 Feature 5-1 (chat-loop) - Must complete first

## Design Summary

**IMPORTANT**: This package wraps `@anygpt/router` - it does NOT call OpenAI/Anthropic directly!

### Architecture

```
@anygpt/ai-provider (THIS PACKAGE)
  ↓ uses
@anygpt/router (EXISTS)
  ↓ uses
@anygpt/connector-* (EXISTS)
```

### Core Components

1. **AI Provider Interface**
   - Wraps `@anygpt/router` for agentic capabilities
   - Function calling support (normalizes across providers)
   - Streaming responses
   - Token usage tracking

2. **Provider Wrapper**
   - Uses router.chatCompletion() internally
   - Adds function calling abstraction
   - Normalizes tool formats (OpenAI vs Anthropic)
   - Error handling and retries

3. **Message Formatting**
   - Convert chat history to provider format
   - Handle tool call responses
   - Normalize across providers

### Interface

```typescript
interface AIProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncIterator<ChatChunk>;
}

interface ChatRequest {
  messages: Message[];
  tools?: Tool[];
  model?: string;
  temperature?: number;
}

interface ChatResponse {
  message: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length';
  usage: TokenUsage;
}
```

## Test Summary

### Test Categories

- **Unit Tests**: Provider implementations, message formatting
- **Integration Tests**: OpenAI/Anthropic API calls (mocked)
- **Contract Tests**: Function calling protocol

**Total Tests**: 20 planned  
**Coverage Target**: 85%+

## Implementation Plan

### Phase 1: Provider Interface

- [ ] Define `AIProvider` interface
- [ ] Define message types
- [ ] Define tool types
- [ ] Unit tests for types

**Deliverable**: Type definitions

### Phase 2: OpenAI Provider

- [ ] Implement OpenAI provider
- [ ] Function calling support
- [ ] Streaming support
- [ ] Error handling
- [ ] Unit tests

**Deliverable**: Working OpenAI integration

### Phase 3: Anthropic Provider

- [ ] Implement Anthropic provider
- [ ] Tool use support
- [ ] Streaming support
- [ ] Error handling
- [ ] Unit tests

**Deliverable**: Working Anthropic integration

### Phase 4: Integration

- [ ] Integrate with chat loop
- [ ] Message formatting
- [ ] Token tracking
- [ ] Integration tests

**Deliverable**: Chat with AI responses

## Dependencies

- **Internal**:
  - `@anygpt/router` (**CRITICAL** - uses this, not direct API calls)
  - `@anygpt/config` (model selection)
  - Feature 5-1 (chat-loop)
- **External**:
  - None (router handles all external SDKs)

## Success Metrics

**Functional**:
- ✅ OpenAI chat works
- ✅ Anthropic chat works
- ✅ Function calling works
- ✅ Streaming works

**Performance**:
- Response latency: <2s
- Token tracking accurate

**Reliability**:
- Error handling: 100%
- Retry logic: 3 attempts

## Scope

### In Scope

- ✅ OpenAI integration
- ✅ Anthropic integration
- ✅ Function calling support
- ✅ Streaming responses
- ✅ Token tracking

### Out of Scope

- ❌ Local models (future)
- ❌ Other providers (future)
- ❌ Tool execution (Feature 5-3)
- ❌ Agentic loop (Feature 5-4)

## Notes

- Focus on OpenAI and Anthropic first
- Use official SDKs
- Normalize function calling across providers
- Track token usage for cost monitoring

## Related Features

- **[5-1-chat-loop](../5-1-chat-loop/README.md)**: Provides chat interface
- **[5-3-mcp-client](../5-3-mcp-client/README.md)**: Will provide tools to AI
- **[5-4-agentic-orchestrator](../5-4-agentic-orchestrator/README.md)**: Will use this for agentic loop
