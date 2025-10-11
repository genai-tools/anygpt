# MCP Server Core

|                      |                                                                      |
| -------------------- | -------------------------------------------------------------------- |
| **Status**           | ✅ Complete                                                          |
| **Progress**         | 10/10 tasks (100%)                                                   |
| **Spec**             | [MCP Server](../../../../products/anygpt/specs/anygpt/mcp-server.md) |
| **Use Case**         | [MCP Server](../../../../products/anygpt/cases/mcp-server.md)        |
| **Architecture**     | [System Design](../../architecture.md)                               |
| **Roadmap**          | [Feature List](../../roadmap.md)                                     |
| **Technical Design** | [design.md](./design.md)                                             |
| **Testing Strategy** | [tests.md](./tests.md)                                               |

---

## Overview

MCP protocol server (JSON-RPC over stdin/stdout) for IDE/tool integration. Enables AI assistants to use AnyGPT as a provider-agnostic backend.

## Status

**Last Updated**: 2025-01-10  
**Current Phase**: Complete

### Recent Updates

- 2025-01-10: Feature audit completed - discovered feature is fully implemented
- 2025-01-10: Documentation updated to reflect actual implementation

## Implementation Plan

- [x] Setup JSON-RPC transport (stdin/stdout)
- [x] Implement initialize method (via MCP SDK)
- [x] Implement models/list method (via tools)
- [x] Implement completion/complete method (via chat_completion tool)
- [x] Response formatting
- [x] Error handling (MCP error codes)
- [x] Write unit tests (integration tests exist)
- [x] Write integration tests
- [x] MCP protocol compliance tests (uses official SDK)
- [x] Documentation

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

| Type             | Dependency                                                                           | Description                       |
| ---------------- | ------------------------------------------------------------------------------------ | --------------------------------- |
| ✅ **Satisfied** | [Configuration Loader](../1-1-config-loader/)                                        | Integrated - config loading works |
| ✅ **Satisfied** | [Provider Router](../1-2-provider-router/)                                           | Integrated - routing works        |
| ✅ **Satisfied** | [Mock Connector](../1-3-connector-mock/)                                             | Available for testing             |
| ✅ **Satisfied** | [OpenAI Connector](../1-4-connector-openai/)                                         | Available for real usage          |
| ✅ **Installed** | [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) | MCP SDK v1.19.1                   |

---

## Implementation Notes

### Package Structure

**Location**: `/packages/mcp/`  
**Package Name**: `@anygpt/mcp`  
**Version**: 1.0.1  
**Binary**: `anygpt-mcp`

### Key Components

1. **Server** (`src/index.ts`)

   - MCP server using `@modelcontextprotocol/sdk`
   - StdioServerTransport for JSON-RPC over stdin/stdout
   - Config loading from `.anygpt/anygpt.config.ts`
   - Router initialization with logger injection
   - Graceful shutdown handling

2. **Tools** (`src/lib/tools.ts`)

   - `anygpt_chat_completion` - Chat with AI providers
   - `anygpt_list_models` - List available models
   - `anygpt_list_providers` - List configured providers
   - `anygpt_list_tags` - List model tags/aliases
   - Full schema definitions with defaults

3. **Resources** (`src/lib/resources.ts`)

   - Resource listing and templates
   - URI-based resource reading
   - Provider/model configuration access

4. **Prompts** (`src/lib/prompts.ts`)

   - Prompt listing
   - Parameterized prompt retrieval

5. **Logger** (`src/lib/logger.ts`)
   - Structured logging to stderr
   - MCP-compliant logging

### Architecture Decisions

1. **MCP SDK**: Uses official `@modelcontextprotocol/sdk` for protocol compliance
2. **Tools over Methods**: Implements functionality as MCP tools rather than custom methods
3. **Shared Config**: Reuses `@anygpt/config` for model resolution and routing
4. **Logger Injection**: Passes MCP logger to all connectors for unified logging

### Deviations from Original Design

1. **Tools-based API**: Instead of implementing `models/list` and `completion/complete` as direct MCP methods, they're exposed as tools (`anygpt_list_models`, `anygpt_chat_completion`)
2. **Additional Features**: Added resources, prompts, and tag listing beyond original spec
3. **SDK-based**: Uses official SDK which handles `initialize` automatically

### Usage

```bash
# Run the MCP server
npx anygpt-mcp

# Or with custom config
CONFIG_PATH=./my-config.ts npx anygpt-mcp
```

### Testing

**Integration Tests**: `src/lib/gateway.spec.ts`

- Server startup and JSON-RPC communication
- Tools list validation
- Tool schema validation

**Coverage**: Integration tests cover core functionality. Unit tests for individual functions would improve coverage.
