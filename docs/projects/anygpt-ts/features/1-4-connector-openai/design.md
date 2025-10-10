# 1-4-connector-openai - Design

**Spec**: [OpenAI Connector](../../../../../products/anygpt/specs/README.md#provider-connectors)  
**Use Case**: [Provider Agnostic Chat](../../../../../products/anygpt/use-cases/provider-agnostic-chat.md)  
**Project**: anygpt-ts  
**Status**: 🔄 Design Phase

## Overview

OpenAI connector supporting OpenAI API and OpenAI-compatible APIs (Ollama, LocalAI, Together AI, Anyscale).

## Architecture

### Components

**OpenAIConnector**
- Implements Connector interface
- Calls OpenAI API
- Supports compatible APIs via baseURL override

### Data Structures

```typescript
interface OpenAIConnectorConfig {
  apiKey: string;
  baseURL?: string;  // Default: https://api.openai.com/v1
  organization?: string;
  timeout?: number;
}
```

## Dependencies

- `@anygpt/types` - Connector interface
- `@anygpt/router` - Registration
- `openai` - OpenAI SDK

## Implementation Strategy

- [ ] Implement Connector interface
- [ ] OpenAI API integration
- [ ] Support baseURL override (Ollama, LocalAI)
- [ ] Error handling
- [ ] Response normalization
- [ ] Model listing

## References

[Roadmap](../../roadmap.md) | [Architecture](../../architecture.md)
