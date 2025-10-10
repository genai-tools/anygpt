# CLI: Conversation Summarize

| | |
|---|---|
| **Status** | ❌ Not Started |
| **Progress** | 0/6 tasks |
| **Spec** | [Conversation Summarize](../../../../../products/anygpt/specs/anygpt/cli/conversation.md) |
| **Use Case** | [Context Optimization](../../../../../products/anygpt/cases/context-optimization.md) |
| **Architecture** | [System Design](../../architecture.md) |
| **Roadmap** | [Feature List](../../roadmap.md) |

---

## Overview

Reduce context length while preserving meaning using AI summarization. Compress old messages to reduce token usage.

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

### Blockers
Depends on: 3-2-cli-conversation

## Implementation Plan

- [ ] Implement summarize subcommand
- [ ] AI-powered summarization of old messages
- [ ] Create new conversation with summary
- [ ] Preserve recent messages (configurable)
- [ ] Write tests
- [ ] Documentation

## Technical Design

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

