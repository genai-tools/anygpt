# 2-1-cli-chat

**Spec**: [Chat Command](../../../../../products/anygpt/specs/anygpt/cli/chat.md)  
**Use Case**: [Provider Agnostic Chat](../../../../../products/anygpt/use-cases/provider-agnostic-chat.md)  
**Status**: ❌ Not Started  
**Progress**: 0/8 tasks

## Overview

Stateless single-turn AI interaction via CLI. Simple command for quick AI queries without conversation history.

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

### Blockers
Depends on: 1-1-config-loader, 1-2-provider-router, 1-3-connector-mock, 1-4-connector-openai

## Tasks

- [ ] Parse arguments (prompt, provider, model, options)
- [ ] Build request from arguments
- [ ] Route to provider via router
- [ ] Format output (text, JSON)
- [ ] Handle errors with proper exit codes
- [ ] Write unit tests
- [ ] Write E2E tests
- [ ] Documentation

## Design

**Components**:
- **Command parser** (commander) - Parse CLI arguments
- **Request builder** - Convert args to CompletionRequest
- **Provider router integration** - Route to correct provider
- **Output formatter** - Format response (text/JSON)

**See [design.md](./design.md)** for detailed design.

## Tests

**Unit Tests**:
- Parse command arguments
- Build request from args
- Format output (text, JSON)
- Handle errors

**E2E Tests**:
- `anygpt chat "Hello"` works
- `anygpt chat "Hello" --provider openai` works
- `anygpt chat "Hello" --model gpt-4o` works
- Exit codes match spec
- Error messages match spec

**See [tests.md](./tests.md)** for detailed test scenarios.

## Dependencies

**Internal**: 1-1-config-loader, 1-2-provider-router, connectors  
**External**: commander

## References

- [Architecture](../../architecture.md)
- [Roadmap](../../roadmap.md)
- [Spec](../../../../../products/anygpt/specs/anygpt/cli/chat.md)
