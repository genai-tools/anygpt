# 3-2-cli-conversation

| | |
|---|---|
| **Status** | ❌ Not Started |
| **Progress** | 0/12 tasks |
| **Spec** | [Conversation Command](../../../../../products/anygpt/specs/anygpt/cli/conversation.md) |
| **Use Case** | [Conversations](../../../../../products/anygpt/cases/conversations.md) |
| **Architecture** | [System Design](../../architecture.md) |
| **Roadmap** | [Feature List](../../roadmap.md) |

---

## Overview

Stateful multi-turn conversations with context management. Maintains conversation history across multiple interactions.

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

### Blockers
Depends on: 3-1-conversation-storage

## Implementation Plan

- [ ] Implement start subcommand
- [ ] Implement message subcommand
- [ ] Implement list subcommand
- [ ] Implement show subcommand
- [ ] Implement end subcommand
- [ ] Implement delete subcommand
- [ ] Auto-start behavior
- [ ] Context management
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Documentation

## Technical Design

**Subcommands**:
- `start` - Start new conversation
- `message` - Send message in conversation
- `list` - List all conversations
- `show` - Show conversation history
- `end` - End conversation
- `delete` - Delete conversation

**Context Management**: Maintains full message history, auto-start if no active conversation

**See [design.md](./design.md)** for detailed design.

## Tests

**E2E Tests**:
- All subcommands work
- Auto-start works
- Context preserved across messages
- All examples from spec work

**See [tests.md](./tests.md)** for detailed test scenarios.

## Dependencies

**Internal**: 3-1-conversation-storage, 2-1-cli-chat  
**External**: commander

