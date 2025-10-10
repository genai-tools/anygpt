# 2-3-mcp-server-core - Design

**Spec**: [MCP Server](../../../../../products/anygpt/specs/mcp-server.md)  
**Use Case**: [MCP Server](../../../../../products/anygpt/use-cases/mcp-server.md)  
**Project**: anygpt-ts

## Overview
MCP protocol server (JSON-RPC over stdin/stdout).

## Components
- JSON-RPC transport
- initialize method
- models/list method
- completion/complete method

## Dependencies
- config-loader, provider-router, connectors

## Implementation
- [ ] Setup stdin/stdout transport
- [ ] Implement initialize
- [ ] Implement models/list
- [ ] Implement completion/complete
- [ ] Error handling (MCP error codes)
