# AnyGPT Product Documentation

Comprehensive documentation for the AnyGPT unified AI gateway and toolkit.

## 📋 Quick Navigation

### 📖 [Technical Specifications](./specs/README.md)

Technical specifications defining **WHAT** we build and **HOW** it works.

**Core Components:**

- [CLI Interface](./specs/anygpt/cli/README.md) - Command-line interface design
- [MCP Server](./specs/anygpt/docker-mcp/mcp-server.md) - MCP protocol implementation
- [Docker MCP Toolkit](./specs/anygpt/docker-mcp/docker-mcp-toolkit.md) - Centralized MCP server deployment

**CLI Commands:**

- [Chat Command](./specs/anygpt/cli/chat.md) - Stateless AI interaction
- [Conversation Command](./specs/anygpt/cli/conversation.md) - Stateful interaction with context management
- [Config Command](./specs/anygpt/cli/config.md) - Configuration management
- [Benchmark Command](./specs/anygpt/cli/benchmark.md) - Model performance testing

**Docker & MCP:**

- [Docker Container Spec](./specs/anygpt/docker-mcp/docker-container.md) - Container architecture
- [Docker Local Development](./specs/anygpt/docker-mcp/docker-local-development.md) - Local development setup
- [Docker Registry Submission](./specs/anygpt/docker-mcp/docker-registry-submission.md) - Publishing to MCP registry

### 🎯 [Use Cases](./cases/)

Real-world usage scenarios demonstrating business value and practical applications.

**Core Use Cases:**

- [Provider-Agnostic Chat](./cases/provider-agnostic-chat.md) - Avoid vendor lock-in
- [Flexible Configuration](./cases/flexible-configuration.md) - Type-safe, dynamic configuration
- [Cost Optimization](./cases/cost-optimization.md) - Intelligent model routing
- [Resilience & Failover](./cases/resilience-failover.md) - High availability patterns

**Advanced Use Cases:**

- [Conversations](./cases/conversations.md) - Stateful conversation management
- [Context Optimization](./cases/context-optimization.md) - Context forking and summarization
- [MCP Server](./cases/mcp-server.md) - Cross-component agent interaction
- [Docker MCP Toolkit](./cases/docker-mcp-toolkit.md) - Centralized MCP deployment
- [Model Benchmarking](./cases/model-benchmarking.md) - Performance comparison
- [Rapid Prototyping](./cases/rapid-prototyping.md) - Fast development with mock providers
- [Local-First Development](./cases/local-first-development.md) - Offline-capable workflows

**Cross-Agent Interaction:**

- [Chess Game Exercise](./cases/cross_agent_interaction/chess-game-exercise.md) - Multi-agent coordination example

## 🏗️ Architecture & Features

### [Token Limits Architecture](./architecture/token-limits-architecture.md)

Unified token limit handling across different LLM providers with automatic parameter translation.

**Key Features:**

- Single source of truth for token configuration
- Automatic translation between `max_tokens` and `max_completion_tokens`
- Provider-specific capability flags
- Backward compatible with legacy APIs

**Configuration:**

```typescript
modelRules: [
  {
    pattern: [/.*/],
    max_tokens: 4096,
    useLegacyMaxTokens: true, // For Anthropic/Cody
  },
];
```

### [Anthropic Extended Thinking Support](./features/anthropic-thinking-support.md)

Support for Anthropic's extended thinking parameter for Claude models.

**Key Features:**

- Extended thinking mode with configurable token budgets
- Compatible with OpenAI-compatible APIs
- Model-specific configuration via model rules
- Streaming support via `thinking_delta` events

**Configuration:**

```typescript
reasoning: {
  thinking: {
    type: 'enabled',
    budget_tokens: 10000
  }
}
```

**Supported Models:**

- Claude Opus 4.1, Claude Opus 4
- Claude Sonnet 4.5, Claude Sonnet 4, Claude Sonnet 3.7

### [Reasoning Effort Levels](./features/reasoning-effort-levels.md)

OpenAI's reasoning effort levels for models with extended thinking capabilities.

**Effort Levels:**

- `minimal` - Fastest, lowest cost
- `low` - Light reasoning for straightforward problems
- `medium` - Balanced reasoning (default)
- `high` - Deep reasoning for complex problems

**Configuration:**

```typescript
modelRules: [
  {
    pattern: [/o3-mini/],
    reasoning: 'minimal', // String shorthand
  },
  {
    pattern: [/thinking/],
    reasoning: { effort: 'high' }, // Object form
  },
];
```

## 🎯 What is AnyGPT?

AnyGPT is a unified AI gateway and toolkit that provides:

1. **Provider Abstraction** - Single interface for OpenAI, Anthropic, Cody, and any OpenAI-compatible API
2. **Dynamic Configuration** - Type-safe, runtime-loaded configuration with model rules
3. **CLI Tools** - Command-line interface for chat, conversations, and benchmarking
4. **MCP Server** - Model Context Protocol implementation for AI agent integration
5. **Docker Integration** - Containerized deployment with MCP toolkit support

### Problems Solved

- **Vendor Lock-in**: Switch providers without code changes
- **Configuration Complexity**: Type-safe configuration with validation
- **Cost Management**: Intelligent routing based on cost/quality tradeoffs
- **Testing Challenges**: Mock providers for fast, deterministic tests
- **MCP Limitations**: Multi-provider support for MCP clients
- **Context Management**: Conversation forking and summarization

## 📚 Documentation Structure

```
docs/products/anygpt/
├── README.md              # This file - main index
├── specs/                 # Technical specifications
│   ├── README.md         # Specs overview
│   └── anygpt/           # Component specs
│       ├── cli/          # CLI specifications
│       └── docker-mcp/   # Docker & MCP specs
└── cases/                # Use cases and scenarios
    ├── *.md              # Individual use cases
    └── cross_agent_interaction/  # Multi-agent examples
```

## 🚀 Getting Started

1. **Installation**: See project README for setup instructions
2. **Configuration**: Review [Flexible Configuration](./cases/flexible-configuration.md) use case
3. **CLI Usage**: Check [CLI Interface](./specs/anygpt/cli/README.md) specification
4. **MCP Integration**: See [MCP Server](./cases/mcp-server.md) use case

## 🔗 Related Documentation

- **Component Documentation**: See `packages/{component}/docs/` for implementation details
- **Examples**: See `/examples` directory for code examples
- **Workspace Setup**: See `/docs/workspace` for development environment setup
- **Project Planning**: See `/docs/projects` for roadmap and feature planning

## 📝 Contributing

When adding new documentation:

1. **Specifications** go in `./specs/` - Define WHAT and HOW
2. **Use Cases** go in `./cases/` - Demonstrate business value and practical usage
3. **Update this index** - Keep navigation current
4. **Cross-reference** - Link related documents

---

**Last Updated**: 2025-01-14
