# AnyGPT TypeScript

**Status**: Planning  
**Technology**: TypeScript, Node.js, Nx

## Overview

TypeScript implementation of AnyGPT - a comprehensive ecosystem for building AI-powered applications with support for multiple providers, flexible configuration, CLI tools, and MCP protocol integration.

## Documentation

- [Architecture](./architecture.md) - System design, components, and key decisions
- [Roadmap](./roadmap.md) - Feature list and implementation phases
- [Features](./features/) - Individual feature designs

## Status

**Overall**: 0/15 features (0%)

### Phase 1: Foundation (0/4)

| Feature | Status | Progress |
|---------|--------|----------|
| [1-1-config-loader](./features/1-1-config-loader/) | ❌ Not Started | 0/23 tasks |
| [1-2-provider-router](./features/1-2-provider-router/) | ❌ Not Started | 0/15 tasks |
| [1-3-connector-mock](./features/1-3-connector-mock/) | ❌ Not Started | 0/5 tasks |
| [1-4-connector-openai](./features/1-4-connector-openai/) | ❌ Not Started | 0/6 tasks |

### Phase 2: Core Applications (0/3)

| Feature | Status | Progress |
|---------|--------|----------|
| [2-1-cli-chat](./features/2-1-cli-chat/) | ❌ Not Started | 0/8 tasks |
| [2-2-cli-config](./features/2-2-cli-config/) | ❌ Not Started | 0/6 tasks |
| [2-3-mcp-server-core](./features/2-3-mcp-server-core/) | ❌ Not Started | 0/10 tasks |

### Phase 3: Advanced Features (0/5)

| Feature | Status | Progress |
|---------|--------|----------|
| [3-1-conversation-storage](./features/3-1-conversation-storage/) | ❌ Not Started | 0/7 tasks |
| [3-2-cli-conversation](./features/3-2-cli-conversation/) | ❌ Not Started | 0/12 tasks |
| [3-3-cli-conversation-fork](./features/3-3-cli-conversation-fork/) | ❌ Not Started | 0/5 tasks |
| [3-4-cli-conversation-summarize](./features/3-4-cli-conversation-summarize/) | ❌ Not Started | 0/6 tasks |
| [3-5-cli-benchmark](./features/3-5-cli-benchmark/) | ❌ Not Started | 0/10 tasks |

### Phase 4: Integrations (0/3)

| Feature | Status | Progress |
|---------|--------|----------|
| [4-1-docker-mcp-container](./features/4-1-docker-mcp-container/) | ❌ Not Started | 0/6 tasks |
| [4-2-docker-compose-config](./features/4-2-docker-compose-config/) | ❌ Not Started | 0/5 tasks |
| [4-3-docker-mcp-toolkit-integration](./features/4-3-docker-mcp-toolkit-integration/) | ❌ Not Started | 0/4 tasks |

## Quick Start

### For Developers

1. Review the [Architecture](./architecture.md) to understand the system design
2. Check the [Roadmap](./roadmap.md) for feature priorities
3. Start with Phase 1 features in order:
   - `1-1-config-loader` - Configuration loading
   - `1-2-provider-router` - Provider abstraction
   - `1-3-connector-mock` - Mock connector for testing
   - `1-4-connector-openai` - OpenAI connector

### For Contributors

Each feature has complete documentation:
- `design.md` - Technical design and implementation approach
- `tests.md` - Test scenarios (TDD approach)
- `status.md` - Progress tracking and task list

## Structure

```
anygpt-ts/
├── README.md           # This file
├── architecture.md     # System design
├── roadmap.md         # Feature roadmap
└── features/          # Feature designs
    ├── 1-1-config-loader/
    │   ├── design.md
    │   ├── tests.md
    │   └── status.md
    ├── 1-2-provider-router/
    ├── 1-3-connector-mock/
    ├── 1-4-connector-openai/
    ├── 2-1-cli-chat/
    ├── 2-2-cli-config/
    ├── 2-3-mcp-server-core/
    ├── 3-1-conversation-storage/
    ├── 3-2-cli-conversation/
    ├── 3-3-cli-conversation-fork/
    ├── 3-4-cli-conversation-summarize/
    ├── 3-5-cli-benchmark/
    ├── 4-1-docker-mcp-container/
    ├── 4-2-docker-compose-config/
    └── 4-3-docker-mcp-toolkit-integration/
```

## Implementation Approach

1. **TDD**: Write tests before implementation
2. **Phased**: Complete Phase 1 before Phase 2
3. **Documented**: Update status.md as you progress
4. **Reviewed**: Architecture consistency checks

## Technology Stack

### Core
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Build**: Nx monorepo, tsdown
- **Package Manager**: npm/pnpm

### CLI
- **Framework**: commander
- **Validation**: zod
- **Testing**: Vitest

### MCP
- **Protocol**: JSON-RPC 2.0
- **Transport**: stdin/stdout

## Related Documentation

- **Product Specs**: [../../products/anygpt/specs/](../../products/anygpt/specs/)
- **Use Cases**: [../../products/anygpt/cases/](../../products/anygpt/cases/)
- **Workflows**: [../../../.windsurf/workflows/docs/](../../../.windsurf/workflows/docs/)
