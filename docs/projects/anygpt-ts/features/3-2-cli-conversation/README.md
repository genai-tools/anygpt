# CLI: Conversation Command

| | |
|---|---|
| **Status** | ❌ Not Started |
| **Progress** | 0/12 tasks |
| **Spec** | [Conversation Command](../../../../products/anygpt/specs/anygpt/cli/conversation.md) |
| **Use Case** | [Conversations](../../../../products/anygpt/cases/conversations.md) |
| **Architecture** | [System Design](../../architecture.md) |
| **Roadmap** | [Feature List](../../roadmap.md) |
| **Technical Design** | [design.md](./design.md) |
| **Testing Strategy** | [tests.md](./tests.md) |

---

## Overview

Stateful multi-turn conversations with context management. Maintains conversation history across multiple interactions.

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

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

## Dependencies

**Internal**: 3-1-conversation-storage, 2-1-cli-chat  
**External**: commander

