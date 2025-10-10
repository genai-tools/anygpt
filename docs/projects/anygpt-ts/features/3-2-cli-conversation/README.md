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

### Recent Updates
- 2025-01-10: Feature documentation created

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

**E2E Tests**: All subcommands work, auto-start works, context preserved across messages

**See [tests.md](./tests.md)** for detailed test scenarios.

## Dependencies

| Type | Dependency | Description |
|------|------------|-------------|
| 🚫 **Blocked by** | [Conversation Storage](../3-1-conversation-storage/) | Need storage for conversations |
| ⚠️ **Depends on** | [CLI: Chat Command](../2-1-cli-chat/) | Reuse chat logic |
| 🔗 **Related to** | [CLI: Config Command](../2-2-cli-config/) | Similar CLI patterns |
| 🌐 **External** | [commander](https://www.npmjs.com/package/commander) | CLI framework |
