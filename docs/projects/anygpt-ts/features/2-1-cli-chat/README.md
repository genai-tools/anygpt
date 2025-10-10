# CLI: Chat Command

| | |
|---|---|
| **Status** | ❌ Not Started |
| **Progress** | 0/8 tasks |
| **Spec** | [Chat Command](../../../../products/anygpt/specs/anygpt/cli/chat.md) |
| **Use Case** | [Provider Agnostic Chat](../../../../products/anygpt/cases/provider-agnostic-chat.md) |
| **Architecture** | [System Design](../../architecture.md) |
| **Roadmap** | [Feature List](../../roadmap.md) |
| **Technical Design** | [design.md](./design.md) |
| **Testing Strategy** | [tests.md](./tests.md) |

---

## Overview

Stateless single-turn AI interaction via CLI. Simple command for quick AI queries without conversation history.

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

## Implementation Plan

- [ ] Parse arguments (prompt, provider, model, options)
- [ ] Build request from arguments
- [ ] Route to provider via router
- [ ] Format output (text, JSON)
- [ ] Handle errors with proper exit codes
- [ ] Write unit tests
- [ ] Write E2E tests
- [ ] Documentation

## Dependencies

**Internal**: 1-1-config-loader, 1-2-provider-router, connectors  
**External**: commander

