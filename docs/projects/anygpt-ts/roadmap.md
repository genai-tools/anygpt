# AnyGPT TypeScript - Roadmap

**Project**: AnyGPT TypeScript Monorepo  
**Generated**: 2025-01-10  
**Status**: Planning Phase

## Overview

Implementation roadmap for AnyGPT TypeScript ecosystem. Features are organized by dependency phases and will be implemented using the `/feature` workflow.

See [architecture.md](./architecture.md) for high-level system design, component overview, and key design decisions.

## Feature List

**Total features**: 15 (+ 2 future)

### Phase 1: Foundation (4 features)

- 1-1-config-loader
- 1-2-provider-router
- 1-3-connector-mock
- 1-4-connector-openai

### Phase 2: Core Applications (3 features)

- 2-1-cli-chat
- 2-2-cli-config
- 2-3-mcp-server-core

### Phase 3: Advanced Features (5 features)

- 3-1-conversation-storage
- 3-2-cli-conversation
- 3-3-cli-conversation-fork
- 3-4-cli-conversation-summarize
- 3-5-cli-benchmark

### Phase 4: Integrations (3 features)

- 4-1-docker-mcp-container
- 4-2-docker-compose-config
- 4-3-docker-mcp-toolkit-integration

### Future (not prioritized)

- mcp-server-tools
- mcp-server-resources

## Implementation Phases

### Phase 1: Foundation

**Goal**: Build core infrastructure that everything depends on

**Status**: 🔄 In Progress (1/4 complete)

#### 1-1-config-loader ✅ COMPLETE

- **Spec**: [Configuration Loader](../../../products/anygpt/specs/README.md#configuration-loader)
- **Use Case**: [Flexible Configuration](../../../products/anygpt/use-cases/flexible-configuration.md)
- **Purpose**: Load and validate configuration from multiple sources
- **Dependencies**: None (foundation)
- **Status**: ✅ Complete (2025-10-10)
- **Key Features**:
  - ✅ Search hierarchy (project → user → system)
  - ✅ Support TypeScript, JSON formats
  - ✅ Runtime connector loading
  - ✅ Custom error types with validation
  - ✅ Factory config pattern with model rules
- **Acceptance**:
  - [x] Loads config from all sources
  - [x] Validates configuration schema
  - [x] Supports dynamic connector loading
  - [x] All examples from spec work
- **Metrics**:
  - 49 tests passing
  - 43% coverage (core files 85%+)
  - Custom error types: 100% coverage

#### 1-2-provider-router

- **Spec**: [Provider Router](../../../products/anygpt/specs/README.md#provider-router)
- **Use Cases**:
  - [Provider Agnostic Chat](../../../products/anygpt/use-cases/provider-agnostic-chat.md)
  - [Cost Optimization](../../../products/anygpt/use-cases/cost-optimization.md)
  - [Resilience & Failover](../../../products/anygpt/use-cases/resilience-failover.md)
- **Purpose**: Abstract provider differences, route requests
- **Dependencies**: config-loader
- **Key Features**:
  - Provider abstraction layer
  - Connector registry
  - Request/response normalization
  - Routing strategies (cost, failover)
  - Error handling and retry logic
- **Acceptance**:
  - [ ] Routes requests to correct provider
  - [ ] Handles errors with retry logic
  - [ ] Supports multiple routing strategies
  - [ ] All connectors can register

#### 1-3-connector-mock

- **Spec**: [Mock Connector](../../../products/anygpt/specs/README.md#provider-connectors)
- **Use Case**: [Rapid Prototyping](../../../products/anygpt/use-cases/rapid-prototyping.md)
- **Purpose**: Testing and development without real API calls
- **Dependencies**: provider-router
- **Key Features**:
  - Configurable responses
  - Configurable delays
  - Failure simulation
  - Deterministic behavior
- **Acceptance**:
  - [ ] Returns configurable responses
  - [ ] Simulates delays and failures
  - [ ] Works with all commands
  - [ ] Enables offline development

#### 1-4-connector-openai

- **Spec**: [Provider Connectors](../../../products/anygpt/specs/README.md#provider-connectors)
- **Use Case**: [Provider Agnostic Chat](../../../products/anygpt/use-cases/provider-agnostic-chat.md)
- **Purpose**: OpenAI and OpenAI-compatible API integration
- **Dependencies**: provider-router
- **Key Features**:
  - OpenAI API support
  - Ollama support
  - LocalAI support
  - Response API fallback
- **Acceptance**:
  - [ ] Connects to OpenAI API
  - [ ] Connects to Ollama
  - [ ] Connects to LocalAI
  - [ ] Handles all error cases

---

### Phase 2: Core Applications

**Goal**: Implement essential user-facing functionality

**Status**: ❌ Not Started  
**Depends on**: Phase 1 complete

#### 2-1-cli-chat

- **Spec**: [Chat Command](../../../products/anygpt/specs/cli/chat.md)
- **Use Case**: [Provider Agnostic Chat](../../../products/anygpt/use-cases/provider-agnostic-chat.md)
- **Purpose**: Stateless single-turn AI interaction
- **Dependencies**: config-loader, provider-router, connectors
- **Key Features**:
  - Simple command-line interface
  - Provider override options
  - Model override options
  - Token usage display
- **Acceptance**:
  - [ ] Command syntax matches spec
  - [ ] All options work as specified
  - [ ] Output format matches spec
  - [ ] Exit codes match spec
  - [ ] All examples from spec work

#### 2-2-cli-config

- **Spec**: [Config Command](../../../products/anygpt/specs/cli/config.md)
- **Use Case**: [Flexible Configuration](../../../products/anygpt/use-cases/flexible-configuration.md)
- **Purpose**: Configuration inspection and validation
- **Dependencies**: config-loader
- **Key Features**:
  - Show current configuration
  - Validate configuration files
  - List configuration locations
- **Acceptance**:
  - [ ] Shows configuration correctly
  - [ ] Validates configuration
  - [ ] Lists all config sources
  - [ ] All examples from spec work

#### 2-3-mcp-server-core

- **Spec**: [MCP Server](../../../products/anygpt/specs/mcp-server.md)
- **Use Case**: [MCP Server for Cross-Component Agents](../../../products/anygpt/use-cases/mcp-server.md)
- **Purpose**: MCP protocol server for IDE/tool integration
- **Dependencies**: config-loader, provider-router, connectors
- **Key Features**:
  - JSON-RPC 2.0 over stdin/stdout
  - initialize method
  - models/list method
  - completion/complete method
- **Acceptance**:
  - [ ] MCP protocol compliance
  - [ ] All required methods work
  - [ ] Error codes match spec
  - [ ] Works with MCP clients

---

### Phase 3: Advanced Features

**Goal**: Add sophisticated capabilities

**Status**: ❌ Not Started  
**Depends on**: Phase 2 complete

#### 3-1-conversation-storage

- **Spec**: Implied by [Conversation Command](../../../products/anygpt/specs/cli/conversation.md)
- **Use Case**: [Conversations](../../../products/anygpt/use-cases/conversations.md)
- **Purpose**: Persistent conversation storage
- **Dependencies**: cli-chat
- **Key Features**:
  - Save conversation history
  - Load conversation history
  - List conversations
  - Delete conversations
- **Acceptance**:
  - [ ] Persists conversations
  - [ ] Loads conversations correctly
  - [ ] Handles concurrent access
  - [ ] Efficient retrieval

#### 3-2-cli-conversation

- **Spec**: [Conversation Command](../../../products/anygpt/specs/cli/conversation.md)
- **Use Cases**:
  - [Conversations](../../../products/anygpt/use-cases/conversations.md)
  - [Context Optimization](../../../products/anygpt/use-cases/context-optimization.md)
- **Purpose**: Stateful multi-turn AI interaction
- **Dependencies**: conversation-storage
- **Key Features**:
  - Start/end conversations
  - Send messages with context
  - List conversations
  - Show conversation history
  - Auto-start behavior
- **Acceptance**:
  - [ ] All subcommands work
  - [ ] Context is maintained
  - [ ] Auto-start works
  - [ ] All examples from spec work

#### 3-3-cli-conversation-fork

- **Spec**: [Conversation Command - Fork](../../../products/anygpt/specs/cli/conversation.md)
- **Use Case**: [Context Optimization](../../../products/anygpt/use-cases/context-optimization.md)
- **Purpose**: Branch conversations to explore alternatives
- **Dependencies**: cli-conversation
- **Key Features**:
  - Copy conversation history
  - Independent evolution
  - Track fork relationships
- **Acceptance**:
  - [ ] Creates exact copy
  - [ ] Both conversations independent
  - [ ] Fork relationship tracked

#### 3-4-cli-conversation-summarize

- **Spec**: [Conversation Command - Summarize](../../../products/anygpt/specs/cli/conversation.md)
- **Use Case**: [Context Optimization](../../../products/anygpt/use-cases/context-optimization.md)
- **Purpose**: Reduce context length while preserving meaning
- **Dependencies**: cli-conversation
- **Key Features**:
  - AI-powered summarization
  - Create new conversation with summary
  - Preserve recent messages
- **Acceptance**:
  - [ ] Generates accurate summary
  - [ ] Creates new conversation
  - [ ] Reduces token usage

#### 3-5-cli-benchmark

- **Spec**: [Benchmark Command](../../../products/anygpt/specs/cli/benchmark.md)
- **Use Case**: [Model Benchmarking](../../../products/anygpt/use-cases/model-benchmarking.md)
- **Purpose**: Compare model performance across providers
- **Dependencies**: provider-router, connectors
- **Key Features**:
  - Compare multiple models
  - Collect performance metrics
  - Multiple output formats (table, JSON, CSV)
  - Parallel execution
- **Acceptance**:
  - [ ] All command arguments work
  - [ ] All output formats work
  - [ ] Metrics are accurate
  - [ ] All examples from spec work

#### mcp-server-tools

- **Spec**: [MCP Server - Tools](../../../products/anygpt/specs/mcp-server.md)
- **Status**: 📋 Future
- **Purpose**: Tools support in MCP server
- **Dependencies**: mcp-server-core
- **Key Features**:
  - tools/list method
  - tools/call method
  - Tool registration

---

### Phase 4: Integrations

**Goal**: External integrations and deployment

**Status**: ❌ Not Started  
**Depends on**: Phase 3 complete

#### 4-1-docker-mcp-container

- **Spec**: [Docker MCP Toolkit Integration](../../../products/anygpt/specs/docker-mcp-toolkit.md)
- **Use Case**: [Docker MCP Toolkit Integration](../../../products/anygpt/use-cases/docker-mcp-toolkit.md)
- **Purpose**: Container image for MCP server
- **Dependencies**: mcp-server-core
- **Key Features**:
  - Dockerfile
  - Container entrypoint
  - Environment variable configuration
  - Health checks
- **Acceptance**:
  - [ ] Container builds successfully
  - [ ] MCP server runs in container
  - [ ] Configuration via env vars works
  - [ ] Health check works

#### 4-2-docker-compose-config

- **Spec**: [Docker MCP Toolkit Integration](../../../products/anygpt/specs/docker-mcp-toolkit.md)
- **Use Case**: [Docker MCP Toolkit Integration](../../../products/anygpt/use-cases/docker-mcp-toolkit.md)
- **Purpose**: Docker Compose configuration
- **Dependencies**: docker-mcp-container
- **Key Features**:
  - Docker Compose file
  - Service configuration
  - Volume mounts
  - Network configuration
- **Acceptance**:
  - [ ] Compose file is valid
  - [ ] Service starts correctly
  - [ ] MCP clients can connect
  - [ ] All examples from spec work

#### 4-3-docker-mcp-toolkit-integration

- **Spec**: [Docker MCP Toolkit Integration](../../../products/anygpt/specs/docker-mcp-toolkit.md)
- **Use Case**: [Docker MCP Toolkit Integration](../../../products/anygpt/use-cases/docker-mcp-toolkit.md)
- **Purpose**: Integration with Docker Desktop MCP Toolkit
- **Dependencies**: docker-compose-config
- **Key Features**:
  - Docker MCP Toolkit compatibility
  - Multiple client support
  - Centralized configuration
- **Acceptance**:
  - [ ] Works with Docker MCP Toolkit
  - [ ] Multiple clients can connect
  - [ ] Configuration is centralized

#### mcp-server-resources

- **Spec**: [MCP Server - Resources](../../../products/anygpt/specs/mcp-server.md)
- **Status**: 📋 Future
- **Purpose**: Resources support in MCP server
- **Dependencies**: mcp-server-core
- **Key Features**:
  - resources/list method
  - resources/read method
  - Resource registration

---

## Feature Development Process

Each feature will be developed using the `/feature` workflow:

1. **Design**: Create feature-specific design document
2. **Tests**: Define test scenarios (TDD approach)
3. **Tasks**: Break into implementation tasks
4. **Implement**: Build feature to pass tests
5. **Status**: Track progress

Feature documentation will be in:

```
docs/projects/anygpt-ts/features/[feature-name]/
├── design.md
├── tests.md
├── tasks.md
└── status.md
```

## Progress Tracking

- **Phase 1**: 1/4 features (25%) 🔄
- **Phase 2**: 0/3 features (0%)
- **Phase 3**: 0/6 features (0%)
- **Phase 4**: 0/4 features (0%)

**Overall**: 1/17 features (6%)

### Completed Features

- ✅ 1-1-config-loader (2025-10-10)

## Next Steps

1. Start with Phase 1 features
2. Use `/feature` workflow for each feature
3. Complete all Phase 1 before moving to Phase 2
4. Update this roadmap as work progresses

## Notes

- Features marked 📋 Future are planned but not prioritized
- Each feature links back to specs and use cases
- Dependencies must be complete before starting dependent features
- Use TDD approach: tests before implementation
- Update progress regularly
