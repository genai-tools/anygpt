# MCP Server Core

| | |
|---|---|
| **Status** | ❌ Not Started |
| **Progress** | 0/10 tasks |
| **Spec** | [MCP Server](../../../../products/anygpt/specs/anygpt/mcp-server.md) |
| **Use Case** | [MCP Server](../../../../products/anygpt/cases/mcp-server.md) |
| **Architecture** | [System Design](../../architecture.md) |
| **Roadmap** | [Feature List](../../roadmap.md) |
| **Technical Design** | [design.md](./design.md) |
| **Testing Strategy** | [tests.md](./tests.md) |

---

## Overview

MCP protocol server (JSON-RPC over stdin/stdout) for IDE/tool integration. Enables AI assistants to use AnyGPT as a provider-agnostic backend.

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Not Started

### Recent Updates
- 2025-01-10: Feature documentation created

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

**Unit Tests**: Parse JSON-RPC, format responses, handle all methods  
**Integration Tests**: MCP client can connect, all methods work  
**Contract Tests**: MCP protocol compliance

**See [tests.md](./tests.md)** for detailed test scenarios.

## Dependencies

| Type | Dependency | Description |
|------|------------|-------------|
| 🚫 **Blocked by** | [Configuration Loader](../1-1-config-loader/) | Need config for provider settings |
| 🚫 **Blocked by** | [Provider Router](../1-2-provider-router/) | Need routing to providers |
| ⚠️ **Depends on** | [Mock Connector](../1-3-connector-mock/) | For testing |
| ⚠️ **Depends on** | [OpenAI Connector](../1-4-connector-openai/) | For real usage |
| 🌐 **External** | [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) | MCP SDK |
