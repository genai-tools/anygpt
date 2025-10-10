# OpenAI Connector

| | |
|---|---|
| **Status** | ✅ Complete |
| **Progress** | 6/6 tasks |
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

**Last Updated**: 2025-10-10  
**Current Phase**: Complete

### Recent Updates
- 2025-10-10: Implementation complete with tests (9 tests passing, 33.61% coverage)
- 2025-01-10: Feature documentation created

## Implementation Plan

- [x] Implement Connector interface
- [x] OpenAI API integration (using OpenAI SDK)
- [x] Support baseURL override for compatible APIs
- [x] Error handling (all OpenAI error codes)
- [x] Response normalization
- [x] Model listing

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

| Type | Dependency | Description |
|------|------------|-------------|
| 🚫 **Blocked by** | [Provider Router](../1-2-provider-router/) | Need router to register connector with |
| 📦 **Internal** | [@anygpt/types](../../packages/types/) | Shared type definitions |
| 🌐 **External** | [openai](https://www.npmjs.com/package/openai) | OpenAI SDK |
