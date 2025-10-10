# 3-4-cli-conversation-summarize

**Spec**: [Conversation Command - Summarize](../../../../../products/anygpt/specs/anygpt/cli/conversation.md)  
**Use Case**: [Context Optimization](../../../../../products/anygpt/use-cases/context-optimization.md)  
**Status**: ❌ Not Started  
**Progress**: 0/6 tasks

## Overview

Reduce context length while preserving meaning using AI summarization. Compress old messages to reduce token usage.

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

### Blockers
Depends on: 3-2-cli-conversation

## Tasks

- [ ] Implement summarize subcommand
- [ ] AI-powered summarization of old messages
- [ ] Create new conversation with summary
- [ ] Preserve recent messages (configurable)
- [ ] Write tests
- [ ] Documentation

## Design

**Summarization Strategy**:
- Use AI to summarize old messages
- Preserve recent N messages
- Create new conversation with: summary + recent messages
- Reduces token usage significantly

**See [design.md](./design.md)** for detailed design.

## Tests

**Key tests**:
- Creates new conversation
- Reduces token usage
- Preserves meaning
- Recent messages intact

**See [tests.md](./tests.md)** for detailed test scenarios.

## Dependencies

**Internal**: 3-2-cli-conversation, 1-2-provider-router  
**External**: None

## References

- [Architecture](../../architecture.md)
- [Roadmap](../../roadmap.md)
- [Spec](../../../../../products/anygpt/specs/anygpt/cli/conversation.md)
