# AnyGPT CLI Specification

RFC-style specifications for the AnyGPT CLI, focusing on concepts, design principles, and architectural decisions.

## Specifications

| Specification | Purpose | Status | Related Use Case |
|---------------|---------|--------|------------------|
| **[Chat Command](./chat.md)** | Stateless interaction model | ✅ Implemented | [Provider Agnostic](../../use-cases/provider-agnostic-chat.md) |
| **[Conversation Command](./conversation.md)** | Stateful interaction with advanced features | ✅ Implemented | [Conversations](../../use-cases/conversations.md), [Context Optimization](../../use-cases/context-optimization.md) |
| **[Config Command](./config.md)** | Configuration management | ✅ Implemented | [Flexible Configuration](../../use-cases/flexible-configuration.md) |

## Key Design Decisions

**Stateless vs Stateful**: Chat command for one-off queries, Conversation command for multi-turn interactions with context management.

**Configuration-Driven**: All provider settings, model selection, and routing rules defined in config files, not code.

**Progressive Disclosure**: Simple commands for basic needs, advanced features (fork, summarize) available when needed.

## Related Documentation

- **[CLI Usage Guide](../../../packages/cli/docs/README.md)** - Complete command reference and examples
- **[Configuration Guide](../features/configuration.md)** - Setup and configuration patterns
- **[Troubleshooting](../../workspace/troubleshooting.md)** - Common issues and solutions
