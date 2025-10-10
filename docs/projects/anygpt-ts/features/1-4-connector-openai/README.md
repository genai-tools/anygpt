# 1-4-connector-openai

**Status**: ❌ Not Started  
**Progress**: 0/6 tasks

## Overview

OpenAI connector supporting OpenAI API and OpenAI-compatible APIs (Ollama, LocalAI, Together AI, Anyscale).

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

### Blockers
Depends on: 1-2-provider-router

## Tasks

- [ ] Implement Connector interface
- [ ] OpenAI API integration
- [ ] Support baseURL override (Ollama, LocalAI)
- [ ] Error handling
- [ ] Response normalization
- [ ] Model listing

## Design

**See [design.md](./design.md)** for detailed design.

Key features:
- OpenAI SDK integration
- Custom baseURL for compatible APIs
- Error handling for all OpenAI error codes

## Tests

**See [tests.md](./tests.md)** for test scenarios.

Key tests:
- Call OpenAI API
- Use custom baseURL (Ollama)
- Handle API errors
- List models

## References

- [Architecture](../../architecture.md)
- [Spec](../../../../../products/anygpt/specs/README.md#provider-connectors)
