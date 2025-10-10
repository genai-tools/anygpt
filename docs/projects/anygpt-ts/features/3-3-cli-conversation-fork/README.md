# CLI: Conversation Fork

| | |
|---|---|
| **Status** | ❌ Not Started |
| **Progress** | 0/5 tasks |
| **Spec** | [Conversation Fork](../../../../products/anygpt/specs/anygpt/cli/conversation.md) |
| **Use Case** | [Context Optimization](../../../../products/anygpt/cases/context-optimization.md) |
| **Architecture** | [System Design](../../architecture.md) |
| **Roadmap** | [Feature List](../../roadmap.md) |
| **Technical Design** | [design.md](./design.md) |
| **Testing Strategy** | [tests.md](./tests.md) |

---

## Overview

Branch conversations to explore alternatives. Create a copy of conversation at specific point to try different approaches.

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

## Implementation Plan

- [ ] Implement fork subcommand
- [ ] Copy conversation history up to fork point
- [ ] Track fork relationships (parent/child)
- [ ] Both conversations remain independent
- [ ] Write tests

## Technical Design

**Fork Logic**: Copy conversation at specific message, create new ID, track parent, both independent after fork

**See [design.md](./design.md)** for detailed design.

## Tests

**Key tests**: Fork creates independent copy, both work independently, relationship tracked

**See [tests.md](./tests.md)** for detailed test scenarios.

## Dependencies

**Internal**: 3-2-cli-conversation  
**External**: None
