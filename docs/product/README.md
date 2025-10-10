# Product Documentation

High-level design, specifications, and usage documentation for the end product.

## 📁 Structure

```
product/
├── spec/              # Technical specifications
├── use-cases/         # Real-world usage scenarios
├── features/          # Feature documentation
└── architecture/      # Architecture and design docs
```

## 📋 Contents

### `/spec` - Specifications
Technical specifications for product components:
- **[README.md](./spec/README.md)** - Overview of all specifications
- **[cli/](./spec/cli/)** - CLI specification
- **[client.md](./spec/client.md)** - Client API specification
- **[components.md](./spec/components.md)** - Component architecture
- **[docker.md](./spec/docker.md)** - Docker deployment specification
- **[mcp-server.md](./spec/mcp-server.md)** - MCP server specification

### `/use-cases` - Use Cases
Real-world usage scenarios and examples:
- **[cross_agent_interaction/](./use-cases/cross_agent_interaction/)** - Cross-agent interaction scenarios

### `/features` - Features
User-facing feature documentation:
- **[configuration.md](./features/configuration.md)** - Configuration guide and options
- **[anthropic-thinking-support.md](./features/anthropic-thinking-support.md)** - Anthropic thinking protocol support
- **[reasoning-effort-levels.md](./features/reasoning-effort-levels.md)** - Reasoning effort levels feature

### `/architecture` - Architecture
High-level architecture and design:
- **[token-limits-architecture.md](./architecture/token-limits-architecture.md)** - Token limits architecture and design

---

## 🎯 Audience

End users, integrators, architects, and technical writers.

## 📝 Adding New Documentation

Product documentation should cover:
- User-facing features and how to use them
- High-level architecture and design
- API specifications and contracts
- Usage examples and scenarios
- Integration guides

For implementation details, use component-specific docs (`packages/{component}/docs/`) or `/docs/archive` for historical records.

## 📚 Related Documentation

- **Component Documentation**: See `packages/{component}/docs/` for implementation details
- **Examples**: See `/examples` directory for code examples
- **Workspace Setup**: See `/docs/workspace` for development environment setup
