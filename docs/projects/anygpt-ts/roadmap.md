# AnyGPT TypeScript - Roadmap

**Project**: AnyGPT TypeScript Monorepo  
**Generated**: 2025-01-10  
**Status**: Planning Phase

## Overview

Implementation roadmap for AnyGPT TypeScript ecosystem. Features are organized by dependency phases and will be implemented using the `/feature` workflow.

See [architecture.md](./architecture.md) for high-level system design, component overview, and key design decisions.

## Feature List

**Total features**: 18 (+ 2 future)

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

### Phase 4: Integrations (6 features)

- 4-1-docker-mcp-container
- 4-2-docker-compose-config
- 4-3-docker-mcp-toolkit-integration
- 4-4-mcp-discovery-engine
- 4-5-mcp-discovery-server
- 4-6-cli-discovery-commands

### Future (not prioritized)

- mcp-server-tools
- mcp-server-resources
- mcp-source-imports (auto-import from Docker MCP, Claude Desktop, Windsurf)

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

**Status**: ✅ Complete (2025-01-10)  
**Depends on**: Phase 1 complete

#### 2-1-cli-chat ✅ COMPLETE

- **Spec**: [Chat Command](../../../products/anygpt/specs/cli/chat.md)
- **Use Case**: [Provider Agnostic Chat](../../../products/anygpt/use-cases/provider-agnostic-chat.md)
- **Purpose**: Stateless single-turn AI interaction
- **Dependencies**: config-loader, provider-router, connectors
- **Status**: ✅ Complete (2025-01-10)
- **Key Features**:
  - ✅ Simple command-line interface
  - ✅ Provider override options
  - ✅ Model override options
  - ✅ Token usage display
- **Acceptance**:
  - [x] Command syntax matches spec
  - [x] All options work as specified
  - [x] Output format matches spec
  - [x] Exit codes match spec
  - [x] All examples from spec work

#### 2-2-cli-config ✅ COMPLETE

- **Spec**: [Config Command](../../../products/anygpt/specs/cli/config.md)
- **Use Case**: [Flexible Configuration](../../../products/anygpt/use-cases/flexible-configuration.md)
- **Purpose**: Configuration inspection and validation
- **Dependencies**: config-loader
- **Status**: ✅ Complete (2025-01-10)
- **Key Features**:
  - ✅ Show current configuration
  - ✅ Validate configuration files
  - ✅ List configuration locations
- **Acceptance**:
  - [x] Shows configuration correctly
  - [x] Validates configuration
  - [x] Lists all config sources
  - [x] All examples from spec work

#### 2-3-mcp-server-core ✅ COMPLETE

- **Spec**: [MCP Server](../../../products/anygpt/specs/mcp-server.md)
- **Use Case**: [MCP Server for Cross-Component Agents](../../../products/anygpt/use-cases/mcp-server.md)
- **Purpose**: MCP protocol server for IDE/tool integration
- **Dependencies**: config-loader, provider-router, connectors
- **Status**: ✅ Complete (2025-01-10)
- **Key Features**:
  - ✅ JSON-RPC 2.0 over stdin/stdout (via MCP SDK)
  - ✅ Initialize method (handled by SDK)
  - ✅ Tools: chat_completion, list_models, list_providers, list_tags
  - ✅ Resources and prompts support
  - ✅ Integration tests
- **Acceptance**:
  - [x] MCP protocol compliance
  - [x] All required methods work
  - [x] Error codes match spec
  - [x] Works with MCP clients

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

#### 4-4-mcp-discovery-engine 🔄 DESIGN COMPLETE

- **Spec**: [MCP Discovery](../../../products/anygpt/specs/anygpt/mcp-discovery.md)
- **Use Case**: [On-Demand MCP Tool Discovery](../../../products/anygpt/cases/mcp-tool-discovery.md)
- **Purpose**: Core discovery logic, search, filtering, caching, and tool execution proxy
- **Dependencies**: config-loader (Phase 1), glob-matcher from config package
- **Status**: 🔄 Design Complete (2025-10-17)
- **Design**: [design.md](features/4-4-mcp-discovery-engine/design.md)
- **Key Features**:
  - TypeScript configuration format (discovery section)
  - Tool rules with pattern matching (glob, regex)
  - Search engine (free-text with relevance scoring)
  - Tool metadata management
  - Caching strategy
  - Configuration validation
  - Tool execution proxy (connects to actual MCP servers)
- **Acceptance**:
  - [ ] Loads discovery configuration from TS config
  - [ ] Pattern matching works (glob, regex, negation)
  - [ ] Search returns relevant results with scores
  - [ ] Caching improves performance
  - [ ] Tool execution proxies to actual MCP servers
  - [ ] All configuration examples from spec work

#### 4-5-mcp-discovery-server 🔄 DESIGN COMPLETE

- **Spec**: [MCP Discovery](../../../products/anygpt/specs/anygpt/mcp-discovery.md)
- **Use Case**: [On-Demand MCP Tool Discovery](../../../products/anygpt/cases/mcp-tool-discovery.md)
- **Purpose**: Expose discovery via MCP protocol (PRIMARY interface - true gateway)
- **Dependencies**: mcp-discovery-engine (4-4), mcp-server-core (2-3)
- **Status**: 🔄 Design Complete (2025-10-17)
- **Design**: [design.md](features/4-5-mcp-discovery-server/design.md)
- **Key Features**:
  - Implement 5 meta-tools (list_mcp_servers, search_tools, list_tools, get_tool_details, execute_tool)
  - MCP protocol integration (stdio)
  - Zero-configuration setup
  - Agentic discovery and execution workflow
  - Tool execution proxy (gateway capability)
- **Acceptance**:
  - [ ] All 5 meta-tools work via MCP protocol
  - [ ] AI agents can discover tools autonomously
  - [ ] AI agents can execute tools via execute_tool
  - [ ] Token usage: ~600 tokens (5 meta-tools)
  - [ ] Works with Claude Desktop, Windsurf, Cursor
  - [ ] Agentic workflow example from spec works (discovery + execution)

#### 4-6-cli-discovery-commands 🔄 DESIGN COMPLETE

- **Spec**: [MCP Discovery](../../../products/anygpt/specs/anygpt/mcp-discovery.md)
- **Use Case**: [On-Demand MCP Tool Discovery](../../../products/anygpt/cases/mcp-tool-discovery.md)
- **Purpose**: CLI interface for debugging (SECONDARY interface)
- **Dependencies**: mcp-discovery-engine (4-4), CLI infrastructure (Phase 2)
- **Status**: 🔄 Design Complete (2025-10-17)
- **Design**: [design.md](features/4-6-cli-discovery-commands/design.md)
- **Key Features**:
  - anygpt mcp list - List MCP servers
  - anygpt mcp search - Search for tools
  - anygpt mcp tools - List tools from server
  - anygpt mcp inspect - Inspect tool details
  - anygpt mcp execute - Execute a tool (NEW!)
  - anygpt mcp config - Manage configuration
- **Acceptance**:
  - [ ] All CLI commands work (including execute)
  - [ ] Human-friendly output
  - [ ] JSON output option works
  - [ ] Tool execution works from CLI
  - [ ] All CLI examples from spec work

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

- **Phase 1**: 4/4 features (100%) ✅
- **Phase 2**: 3/3 features (100%) ✅
- **Phase 3**: 5/5 features (100%) ✅
- **Phase 4**: 3/6 features (50%) 🔄 - Design phase complete for 4-4, 4-5, 4-6

**Overall**: 12/18 features (67%)  
**Design Complete**: 15/18 features (83%)

### Completed Features

- ✅ 1-1-config-loader (2025-10-10)
- ✅ 1-2-provider-router (2025-01-10)
- ✅ 1-3-connector-mock (2025-01-10)
- ✅ 1-4-connector-openai (2025-01-10)
- ✅ 2-1-cli-chat (2025-01-10)
- ✅ 2-2-cli-config (2025-01-10)
- ✅ 2-3-mcp-server-core (2025-01-10)
- ✅ 3-1-conversation-storage (2025-01-10)
- ✅ 3-2-cli-conversation (2025-01-10)
- ✅ 3-3-cli-conversation-fork (2025-01-10 - bonus, included in 3-2)
- ✅ 3-4-cli-conversation-summarize (2025-01-10 - bonus, included in 3-2)
- ✅ 3-5-cli-benchmark (2025-10-10 - complete, 90%)

## Next Steps

1. ✅ ~~Complete Phase 1 features~~ (Done)
2. ✅ ~~Complete Phase 2 features~~ (Done)
3. ✅ ~~Complete Phase 3 features~~ (Done - 5/5 core features)
4. Start Phase 4: Docker integrations
5. Update this roadmap as work progresses

## Notes

- Features marked 📋 Future are planned but not prioritized
- Each feature links back to specs and use cases
- Dependencies must be complete before starting dependent features
- Use TDD approach: tests before implementation
- Update progress regularly
