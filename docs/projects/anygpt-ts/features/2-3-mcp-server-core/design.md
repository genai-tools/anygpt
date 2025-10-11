# 2-3-mcp-server-core - Design

**Status**: ✅ Complete  
**Spec**: [MCP Server](../../../../../products/anygpt/specs/mcp-server.md)  
**Use Case**: [MCP Server](../../../../../products/anygpt/use-cases/mcp-server.md)  
**Project**: anygpt-ts

## Overview

MCP protocol server (JSON-RPC over stdin/stdout) that enables AI assistants to use AnyGPT as a provider-agnostic backend. Built using the official `@modelcontextprotocol/sdk`.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        MCP Client                            │
│                   (Claude Desktop, Cody)                     │
└────────────────────────┬────────────────────────────────────┘
                         │ JSON-RPC 2.0
                         │ stdin/stdout
┌────────────────────────▼────────────────────────────────────┐
│                    @anygpt/mcp Server                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MCP SDK Server                          │   │
│  │  - StdioServerTransport                              │   │
│  │  - Request handlers                                  │   │
│  │  - Capabilities (tools, resources, prompts)          │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │              Tools (tools.ts)                        │   │
│  │  - anygpt_chat_completion                            │   │
│  │  - anygpt_list_models                                │   │
│  │  - anygpt_list_providers                             │   │
│  │  - anygpt_list_tags                                  │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │         Resources & Prompts                          │   │
│  │  - resources.ts (config access)                      │   │
│  │  - prompts.ts (prompt templates)                     │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                  @anygpt/config                              │
│  - setupRouterFromFactory                                    │
│  - resolveModel (tag/alias resolution)                       │
│  - listAvailableTags                                         │
└─────────────────────────┬────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                  Provider Router                             │
│  - chatCompletion()                                          │
│  - listModels()                                              │
└─────────────────────────┬────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│   OpenAI     │  │    Mock     │  │   Cody      │
│  Connector   │  │  Connector  │  │  Connector  │
└──────────────┘  └─────────────┘  └─────────────┘
```

## Components

### 1. MCP Server (`src/index.ts`)

**Responsibilities**:

- Initialize MCP server with capabilities
- Load configuration from `.anygpt/anygpt.config.ts`
- Setup router with logger injection
- Handle graceful shutdown
- Route requests to appropriate handlers

**Key Features**:

- Uses `@modelcontextprotocol/sdk` for protocol compliance
- StdioServerTransport for JSON-RPC communication
- Environment variable support (`CONFIG_PATH`)
- Structured logging to stderr

### 2. Tools (`src/lib/tools.ts`)

**Tools Exposed**:

1. **anygpt_chat_completion**

   - Send chat messages to AI providers
   - Supports model tags/aliases
   - Auto-detects provider from model name
   - Configurable temperature, max_tokens

2. **anygpt_list_models**

   - List available models from a provider
   - Enriched with tags from configuration
   - Defaults to default provider

3. **anygpt_list_providers**

   - List all configured providers
   - Shows provider type and default status

4. **anygpt_list_tags**
   - List all available model tags/aliases
   - Shows tag-to-model mappings
   - Optional provider filtering

**Design Pattern**: Tools-based API (not custom MCP methods)

### 3. Resources (`src/lib/resources.ts`)

**Resources Exposed**:

- Configuration access via URIs
- Provider/model information
- Resource templates for dynamic URIs

### 4. Prompts (`src/lib/prompts.ts`)

**Prompts Exposed**:

- Parameterized prompt templates
- Prompt listing and retrieval

### 5. Logger (`src/lib/logger.ts`)

**Features**:

- Structured logging to stderr
- Log levels: info, warn, error
- MCP-compliant (doesn't interfere with JSON-RPC)

## Dependencies

### Internal

- `@anygpt/config` - Configuration and model resolution
- `@anygpt/types` - Type definitions

### External

- `@modelcontextprotocol/sdk` v1.19.1 - Official MCP SDK

## Implementation Details

### Configuration Loading

```typescript
// Load config from standard location or CONFIG_PATH
const configPath = process.env.CONFIG_PATH || './.anygpt/anygpt.config.ts';
const module = await import(absoluteConfigPath);
const config = module.default;

// Setup router with logger injection
const { router, config: c } = await setupRouterFromFactory(config, logger);
```

### Model Resolution

Uses shared `resolveModel` from `@anygpt/config`:

1. Check if model is a tag/alias
2. Resolve to actual model ID
3. Determine provider (explicit or auto-detect)
4. Route to appropriate connector

### Error Handling

- Try-catch blocks around all operations
- Descriptive error messages in responses
- MCP-compliant error format
- Graceful shutdown on SIGINT/SIGTERM

## Implementation Status

- [x] Setup stdin/stdout transport (via MCP SDK)
- [x] Implement initialize (handled by SDK)
- [x] Implement models/list (via anygpt_list_models tool)
- [x] Implement completion/complete (via anygpt_chat_completion tool)
- [x] Error handling (MCP error codes)
- [x] Resources support (bonus)
- [x] Prompts support (bonus)
- [x] Tag/alias system (bonus)

## Design Decisions

### 1. Tools over Custom Methods

**Decision**: Expose functionality as MCP tools rather than custom methods.

**Rationale**:

- Better IDE integration (tools are discoverable)
- Consistent with MCP best practices
- Easier to extend with new capabilities

### 2. Official SDK

**Decision**: Use `@modelcontextprotocol/sdk` instead of custom JSON-RPC.

**Rationale**:

- Protocol compliance guaranteed
- Handles initialize automatically
- Maintained by MCP team
- Reduces maintenance burden

### 3. Shared Configuration

**Decision**: Reuse `@anygpt/config` for model resolution.

**Rationale**:

- Consistent behavior with CLI
- Single source of truth
- Tag/alias resolution works everywhere

### 4. Logger Injection

**Decision**: Pass MCP logger to all connectors.

**Rationale**:

- Unified logging across components
- Proper stderr logging (doesn't break JSON-RPC)
- Better debugging experience
