# OpenAI Connector

| | |
|---|---|
| **Status** | ❌ Not Started |
| **Progress** | 0/6 tasks |
| **Spec** | [OpenAI Connector](../../../../products/anygpt/specs/README.md#provider-connectors) |
| **Use Case** | [Provider Agnostic Chat](../../../../products/anygpt/cases/provider-agnostic-chat.md) |
| **Architecture** | [System Design](../../architecture.md) |
| **Roadmap** | [Feature List](../../roadmap.md) |
| **Technical Design** | [design.md](./design.md) |
| **Testing Strategy** | [tests.md](./tests.md) |

---

## Overview

OpenAI connector supporting OpenAI API and OpenAI-compatible APIs (Ollama, LocalAI, Together AI, Anyscale).

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

## Implementation Plan

- [ ] Implement Connector interface
- [ ] OpenAI API integration (using OpenAI SDK)
- [ ] Support baseURL override for compatible APIs
- [ ] Error handling (all OpenAI error codes)
- [ ] Response normalization
- [ ] Model listing

## Technical Design

**OpenAIConnector** with:
- OpenAI SDK integration
- Custom baseURL for compatible APIs (Ollama, LocalAI)
- Comprehensive error handling

**See [design.md](./design.md)** for detailed design.

## Tests

**Key tests**: Call OpenAI API, use custom baseURL (Ollama), handle API errors, list models

**See [tests.md](./tests.md)** for detailed test scenarios.

## Dependencies

**Internal**: @anygpt/types  
**External**: openai (OpenAI SDK)
