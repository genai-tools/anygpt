# AnyGPT Ecosystem

A comprehensive TypeScript ecosystem for building AI-powered applications with support for multiple providers, MCP protocol, and flexible configuration management.

## Why?

**Problem**: Building AI applications requires dealing with different provider APIs, complex configuration management, and protocol translations for MCP clients.

**Solution**: This monorepo provides a modular ecosystem with clean separation of concerns:
- **Type System**: Pure type definitions with zero runtime overhead
- **Router Layer**: Provider abstraction and routing with connector pattern
- **Configuration**: Dynamic connector loading and flexible configuration management
- **CLI Interface**: Command-line tool for AI interactions and conversation management
- **MCP Server**: Protocol translator for MCP clients (Docker Desktop, Windsurf, etc.)

## Architecture

```
MCP Client → @anygpt/mcp → @anygpt/router → AI Provider APIs
     ↓              ↓                    ↓
CLI Tool → @anygpt/config → @anygpt/connectors → Provider SDKs
```

### Core Packages

| Package | Purpose | Dependencies |
|---------|---------|--------------|
| **[@anygpt/types](./packages/types/)** | Pure type definitions | None (0 runtime deps) |
| **[@anygpt/config](./packages/config/)** | Configuration management | @anygpt/types |
| **[@anygpt/router](./packages/router/)** | Core routing and connector registry | None |
| **[@anygpt/cli](./packages/cli/)** | Command-line interface | @anygpt/config, @anygpt/mock |
| **[@anygpt/mcp](./packages/mcp/)** | MCP server implementation | @anygpt/router, @anygpt/openai |

### Connector Packages

| Package | Provider | Dependencies |
|---------|----------|--------------|
| **[@anygpt/openai](./packages/connectors/openai/)** | OpenAI & compatible APIs | @anygpt/router, openai |
| **[@anygpt/mock](./packages/connectors/mock/)** | Testing & development | @anygpt/types |

### Supported Providers

- **OpenAI**: GPT-4o, GPT-4, GPT-3.5, o1 models
- **OpenAI-Compatible**: Ollama, LocalAI, Together AI, Anyscale
- **Mock Provider**: For testing and development

## Quick Start

### Install CLI Tool

```bash
npm install -g @anygpt/cli
```

### Install Individual Packages

```bash
# For building applications
npm install @anygpt/router @anygpt/openai

# For configuration management
npm install @anygpt/config

# For type definitions only
npm install @anygpt/types
```

### MCP Server

```bash
# Install and run MCP server
npm install -g @anygpt/mcp
anygpt-mcp
```

## Usage Examples

### 1. CLI Usage

```bash
# Quick chat (stateless)
anygpt chat --model gpt-4o --token $OPENAI_API_KEY "Explain TypeScript generics"

# Start a conversation (stateful)
anygpt conversation start --model gpt-4o --name "coding-session"
anygpt conversation message "How do I implement a binary tree in TypeScript?"
anygpt conversation message "Show me the insertion method"

# List conversations
anygpt conversation list

# Fork a conversation for different approach
anygpt conversation fork --name "binary-tree-v2"
```

### 2. Router as Library

```typescript
import { GenAIRouter } from '@anygpt/router';
import { OpenAIConnectorFactory } from '@anygpt/openai';

// Create router and register connector
const router = new GenAIRouter();
router.registerConnector(new OpenAIConnectorFactory());

// Create connector instance
const connector = router.createConnector('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1'
});

// Make requests
const response = await connector.chatCompletion({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### 3. Configuration-Driven Setup

```typescript
import { setupRouter } from '@anygpt/config';

// Automatically loads config and sets up router
const { router, config } = await setupRouter();

// Use with any registered connector
const response = await router.chatCompletion({
  provider: 'openai-main',
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

**Example factory config file (`.anygpt/anygpt.config.ts`):**

```typescript
import { config, openai } from '@anygpt/config';

export default config({
  defaults: {
    provider: 'openai-main',
    model: 'gpt-4o'
  },
  providers: {
    'openai-main': {
      name: 'OpenAI GPT Models',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1'
      })
    },
    'ollama-local': {
      name: 'Local Ollama',
      connector: openai({
        baseURL: 'http://localhost:11434/v1'
      })
    }
  }
});
```

**Alternative standard config format:**

```typescript
import type { AnyGPTConfig } from '@anygpt/config';

const config: AnyGPTConfig = {
  version: '1.0',
  providers: {
    'openai-main': {
      name: 'OpenAI GPT Models',
      connector: {
        connector: '@anygpt/openai',
        config: {
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: 'https://api.openai.com/v1'
        }
      }
    }
  },
  settings: {
    defaultProvider: 'openai-main',
    timeout: 30000
  }
};

export default config;
```

### 4. MCP Server Usage

```bash
# Run MCP server
anygpt-mcp

# Test with MCP Inspector
npx @modelcontextprotocol/inspector anygpt-mcp
```

**Claude Desktop Integration:**

```json
{
  "mcpServers": {
    "anygpt": {
      "command": "anygpt-mcp",
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key"
      }
    }
  }
}
```

## Development

This project uses NX monorepo for managing multiple packages:

```bash
# Install dependencies
npm install

# Build all packages (NX handles dependencies automatically)
npx nx run-many -t build

# Build specific package (dependencies built automatically)
npx nx build cli

# Run tests
npx nx run-many -t test

# Run E2E tests
npx nx e2e e2e-cli

# Lint all packages
npx nx run-many -t lint
```

### Package Dependency Graph

```
@anygpt/types (no deps)
    ↓
@anygpt/config, @anygpt/mock
    ↓
@anygpt/router → @anygpt/openai
    ↓
@anygpt/cli, @anygpt/mcp
```

## Key Features

### 🎯 **Modular Architecture**
- **Clean separation**: Each package has a single responsibility
- **Zero runtime overhead**: Type-only packages with `import type`
- **Dependency inversion**: Connectors depend on router, not vice versa

### 🔧 **Dynamic Configuration**
- **Runtime connector loading**: No hardcoded dependencies
- **Multiple config sources**: TypeScript, JavaScript, JSON files
- **Environment support**: User home, system-wide, project-local configs

### 🚀 **Developer Experience**
- **Full TypeScript support**: Complete type safety across all packages
- **Comprehensive CLI**: Stateful conversations, forking, summarization
- **Testing utilities**: Mock connector for development and testing

### 🔌 **Extensible Design**
- **Connector pattern**: Easy to add new AI providers
- **Plugin architecture**: Extensible command system
- **MCP compliance**: Full protocol implementation

### ✅ **Comprehensive Testing**
- **30 E2E tests**: Complete CLI workflow validation with 0 skipped tests
- **Mock connector**: Deterministic responses for reliable testing
- **Full coverage**: Chat, conversations, config management, and error handling
- **CI/CD ready**: Fast, reliable tests that run in < 15 seconds

## Documentation

### Getting Started
- **[CLI Documentation](./packages/cli/docs/README.md)** - Complete command-line interface guide
- **[Configuration Guide](./docs/configuration.md)** - Complete configuration setup and examples
- **[Troubleshooting Guide](./docs/troubleshooting.md)** - Common issues, recent fixes, and debugging

### Development Guidelines
- **[Testing Guide](./docs/guidelines/testing.md)** - Comprehensive testing strategy, patterns, and coverage goals
- **[E2E Testing Guide](./e2e/README.md)** - End-to-end test suite documentation and patterns
- **[Release Guide](./docs/release-guide.md)** - How to release packages to npm
- **[Release Setup](./docs/release-setup.md)** - Release infrastructure documentation

### CLI Commands
- **[Chat Command](./packages/cli/docs/chat.md)** - Stateless AI interactions
- **[Conversation Command](./packages/cli/docs/conversation.md)** - Stateful conversations with advanced features
- **[Config Command](./packages/cli/docs/config.md)** - Configuration management and TypeScript benefits

### Package Documentation
- **[@anygpt/types](./packages/types/README.md)** - Pure type definitions
- **[@anygpt/config](./packages/config/README.md)** - Configuration management
- **[@anygpt/router](./packages/router/README.md)** - Core router and connector system
- **[@anygpt/openai](./packages/connectors/openai/README.md)** - OpenAI connector
- **[@anygpt/mock](./packages/connectors/mock/README.md)** - Mock connector for testing
- **[@anygpt/cli](./packages/cli/README.md)** - Command-line interface
- **[@anygpt/mcp](./packages/mcp/README.md)** - MCP server implementation

### Architecture Documentation
- **[Router API Reference](./packages/router/docs/API.md)** - Complete API documentation
- **[Router Architecture](./packages/router/docs/ARCHITECTURE.md)** - System design patterns
- **[Configuration Guide](./packages/router/docs/CONFIG.md)** - Provider configuration
- **[Connector Usage](./packages/router/docs/CONNECTOR_USAGE.md)** - Provider-specific usage

## License

MIT License - see [LICENSE](LICENSE) file for details.
