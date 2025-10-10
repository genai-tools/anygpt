# MCP Server Core

| | |
|---|---|
| **Status** | ❌ Not Started |
| **Progress** | 0/10 tasks |
| **Spec** | [MCP Server](../../../../products/anygpt/specs/anygpt/mcp-server.md) |
| **Use Case** | [MCP Server](../../../../products/anygpt/cases/mcp-server.md) |
| **Architecture** | [System Design](../../architecture.md) |
| **Roadmap** | [Feature List](../../roadmap.md) |

---

## Overview

MCP protocol server (JSON-RPC over stdin/stdout) for IDE/tool integration. Enables AI assistants to use AnyGPT as a provider-agnostic backend.

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

### Blockers
Depends on: 1-1-config-loader, 1-2-provider-router, 1-3-connector-mock, 1-4-connector-openai

## Implementation Plan

- [ ] Setup JSON-RPC transport (stdin/stdout)
- [ ] Implement initialize method
- [ ] Implement models/list method
- [ ] Implement completion/complete method
- [ ] Response formatting
- [ ] Error handling (MCP error codes)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] MCP protocol compliance tests
- [ ] Documentation

## Technical Design

**Components**:
- **JSON-RPC transport** - stdin/stdout communication
- **MCP methods**: initialize, models/list, completion/complete
- **Error handling** - MCP-compliant error codes

**See [design.md](./design.md)** for detailed design.

## Tests

**Unit Tests**:
- Parse JSON-RPC requests
- Format JSON-RPC responses
- Handle all MCP methods

**Integration Tests**:
- MCP client can connect
- initialize works
- models/list returns models
- completion/complete works

**Contract Tests**:
- MCP protocol compliance
- All error codes match spec

**See [tests.md](./tests.md)** for detailed test scenarios.

## Dependencies

**Internal**: 1-1-config-loader, 1-2-provider-router, connectors  
**External**: JSON-RPC library

