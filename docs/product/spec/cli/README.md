# AnyGPT CLI Specification

This directory contains RFC-style specifications for the AnyGPT CLI, focusing on concepts, design principles, and architectural decisions rather than detailed usage instructions.

## Specifications

| Specification | Purpose | Status |
|---------------|---------|--------|
| **[Chat Command](./chat.md)** | Stateless interaction model | ✅ Implemented |
| **[Conversation Command](./conversation.md)** | Stateful interaction model with advanced features | ✅ Implemented |
| **[Config Command](./config.md)** | Configuration management and inspection | ✅ Implemented |

## Design Principles

### 1. Separation of Concerns
- **Chat**: Stateless, single-purpose interactions
- **Conversation**: Stateful, contextual interactions with lifecycle management
- **Config**: Configuration inspection and management

### 2. Progressive Complexity
- **Simple**: Chat command for basic needs
- **Advanced**: Conversation command for complex workflows
- **Management**: Config command for system administration

### 3. Consistent Interface
- Unified command structure across all operations
- Consistent option naming and behavior patterns
- Predictable output formats and error handling

### 4. Extensibility
- Modular command architecture supporting future extensions
- Plugin-ready design for additional AI providers
- Configuration-driven behavior customization

## Architecture Overview

```
CLI Interface
├── Chat Command (Stateless)
│   ├── Direct AI interaction
│   ├── No persistent state
│   └── Single request/response cycle
├── Conversation Command (Stateful)
│   ├── Persistent conversation state
│   ├── Context management and optimization
│   ├── Advanced features (fork, condense, summarize)
│   └── Lifecycle management
└── Config Command (Management)
    ├── Configuration inspection
    ├── Multi-source configuration loading
    ├── TypeScript configuration support
    └── Export/import capabilities
```

## Implementation Status

- ✅ **Chat Command**: Complete stateless implementation
- ✅ **Conversation Command**: Complete stateful implementation with advanced features
- ✅ **Config Command**: Complete configuration management
- ✅ **Auto-start Conversations**: Automatic conversation initialization
- ✅ **Factory Configuration**: Direct connector instantiation support
- ✅ **TypeScript Configuration**: Modern configuration with type safety

## Related Documentation

- **[Detailed CLI Documentation](../../../packages/cli/docs/README.md)** - Complete usage guides and examples
- **[Configuration Guide](../../configuration.md)** - Configuration setup and patterns
- **[Troubleshooting Guide](../../troubleshooting.md)** - Common issues and solutions
