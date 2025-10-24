# AnyGPT Ecosystem

> **⚠️ WORK IN PROGRESS**: This project is under active development. APIs, components, and configurations may change significantly. Use at your own risk in production environments.

A comprehensive TypeScript ecosystem for building AI-powered applications with support for multiple providers, MCP protocol, and
flexible configuration management.

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
┌─────────────────────────────────────────────────────────────────┐
│ MCP Clients (Claude Desktop, Windsurf, Cursor)                 │
└─────────────────────────────────────────────────────────────────┘
                    ↓                           ↓
    ┌───────────────────────────┐   ┌─────────────────────────┐
    │ @anygpt/mcp-discovery-server │   │ @anygpt/mcp           │
    │ (5 meta-tools, 99% token    │   │ (MCP protocol server) │
    │  reduction)                  │   └─────────────────────────┘
    └───────────────────────────┘               ↓
                    ↓                   ┌─────────────────┐
        ┌───────────────────────┐       │ @anygpt/config  │
        │ @anygpt/mcp-discovery │       │ (Configuration) │
        │ (Discovery engine)    │       └─────────────────┘
        └───────────────────────┘               ↓
                                        ┌─────────────────┐
┌─────────────────────────┐             │ @anygpt/router  │
│ @anygpt/cli             │────────────→│ (Provider       │
│ (Command-line tool)     │             │  abstraction)   │
└─────────────────────────┘             └─────────────────┘
                                                ↓
                                    ┌───────────────────────┐
                                    │ @anygpt/ai-provider   │
                                    │ (Function calling)    │
                                    └───────────────────────┘
                                                ↓
                        ┌───────────────────────────────────────┐
                        │ Connectors (@anygpt/openai,           │
                        │  @anygpt/anthropic, @anygpt/cody,     │
                        │  @anygpt/claude, @anygpt/mock)        │
                        └───────────────────────────────────────┘
                                                ↓
                        ┌───────────────────────────────────────┐
                        │ AI Provider APIs (OpenAI, Anthropic,  │
                        │  Ollama, LocalAI, etc.)               │
                        └───────────────────────────────────────┘

Supporting Packages:
  • @anygpt/types - Pure type definitions (0 runtime deps)
  • @anygpt/rules - Type-safe rule engine for configuration
  • @anygpt/mcp-logger - File-based logging for MCP servers
  • @anygpt/plugins - Plugin system (docker-mcp-plugin, etc.)
```

### Core Packages

| Package                                                              | Purpose                                   | Dependencies          |
| -------------------------------------------------------------------- | ----------------------------------------- | --------------------- |
| **[@anygpt/types](./packages/types/)**                               | Pure type definitions                     | None (0 runtime deps) |
| **[@anygpt/config](./packages/config/)**                             | Configuration management                  | @anygpt/types         |
| **[@anygpt/router](./packages/router/)**                             | Core routing and connector registry       | None                  |
| **[@anygpt/ai-provider](./packages/ai-provider/)**                   | AI provider wrapper with function calling | @anygpt/router        |
| **[@anygpt/rules](./packages/rules/)**                               | Type-safe rule engine                     | None                  |
| **[@anygpt/mcp-logger](./packages/mcp-logger/)**                     | File-based logging for MCP servers        | None                  |
| **[@anygpt/plugins](./packages/plugins/)**                           | Plugin system for dynamic configuration   | @anygpt/types         |
| **[@anygpt/mcp-discovery](./packages/mcp-discovery/)**               | MCP tool discovery engine (core logic)    | @anygpt/types         |
| **[@anygpt/mcp-discovery-server](./packages/mcp-discovery-server/)** | MCP Discovery Server (PRIMARY interface)  | @anygpt/mcp-discovery |
| **[@anygpt/cli](./packages/cli/)**                                   | Command-line interface                    | @anygpt/config        |
| **[@anygpt/mcp](./packages/mcp/)**                                   | MCP server implementation                 | @anygpt/config        |

### Connector Packages

| Package                                                   | Provider                  | Dependencies                      |
| --------------------------------------------------------- | ------------------------- | --------------------------------- |
| **[@anygpt/openai](./packages/connectors/openai/)**       | OpenAI & compatible APIs  | @anygpt/router, openai            |
| **[@anygpt/anthropic](./packages/connectors/anthropic/)** | Anthropic Claude (native) | @anygpt/router, @anthropic-ai/sdk |
| **[@anygpt/claude](./packages/connectors/claude/)**       | Claude via MCP            | @anygpt/router                    |
| **[@anygpt/cody](./packages/connectors/cody/)**           | Sourcegraph Cody          | @anygpt/router                    |
| **[@anygpt/mock](./packages/connectors/mock/)**           | Testing & development     | @anygpt/types                     |

### Supported Providers

- **OpenAI**: GPT-4o, GPT-4, GPT-3.5, o1 models
- **OpenAI-Compatible**: Ollama, LocalAI, Together AI, Anyscale
- **Anthropic**: Claude Sonnet, Opus, Haiku (native API)
- **Mock Provider**: For testing and development

## Quick Start

### Install CLI Tool

```bash
npm install -g @anygpt/cli
```

### Install Individual Packages

```bash
# For building applications
npm install @anygpt/router @anygpt/openai @anygpt/anthropic

# For configuration management
npm install @anygpt/config

# For type definitions only
npm install @anygpt/types
```

### MCP Discovery Server (99% Token Reduction!)

**Zero-configuration MCP server** that enables AI agents to discover and execute tools from 100+ MCP servers without loading everything into context.

```bash
# No installation needed - use with npx
npx -y @anygpt/mcp-discovery-server
```

**Add to Claude Desktop / Windsurf / Cursor:**

```json
{
  "mcpServers": {
    "anygpt-discovery": {
      "command": "npx",
      "args": ["-y", "@anygpt/mcp-discovery-server"]
    }
  }
}
```

**What it does:**

- Exposes 5 meta-tools instead of 150+ individual tools
- AI agents autonomously discover tools using `search_tools`
- Reduces token usage from 100,000+ to ~600 tokens (99% reduction)
- Gateway capability: discover AND execute tools through single connection

**Example workflow:**

```
User: "Read README.md and create a GitHub issue if there are TODOs"

AI Agent:
1. search_tools({ query: "read file" }) → finds filesystem:read_file
2. execute_tool({ server: "filesystem", tool: "read_file", ... })
3. search_tools({ query: "create github issue" }) → finds github:create_issue
4. execute_tool({ server: "github", tool: "create_issue", ... })

Result: ~1,000 tokens vs 500,000+ tokens (99.8% savings)
```

### MCP Server

```bash
# Install and run MCP server
npm install -g @anygpt/mcp
anygpt-mcp
```

## Usage Examples

### 1. CLI Usage

#### AI Chat Commands

```bash
# Discover available models and tags
anygpt list-tags

# Quick chat with tags (stateless)
anygpt chat --tag sonnet "Explain TypeScript generics"
anygpt chat --tag opus "Write a complex algorithm"

# Specify provider explicitly
anygpt chat --provider cody --tag sonnet "Hello"
anygpt chat --provider provider1 --tag gemini "Hello"

# Use direct model name (no tag resolution)
anygpt chat --model "ml-asset:static-model/claude-sonnet-4-5" "Hello"

# Start a conversation (stateful)
anygpt conversation start --tag sonnet --name "coding-session"
anygpt conversation message "How do I implement a binary tree in TypeScript?"
anygpt conversation message "Show me the insertion method"

# List conversations
anygpt conversation list

# Fork a conversation with different tag
anygpt conversation fork --tag opus --name "binary-tree-v2"
```

#### MCP Management Commands

```bash
# List all MCP servers
anygpt mcp list
anygpt mcp list --enabled    # Only enabled servers
anygpt mcp list --disabled   # Only disabled servers

# Search for tools across all servers
anygpt mcp search "github"
anygpt mcp search "create" --server github-official

# Inspect tool details (auto-resolves server)
anygpt mcp inspect search
anygpt mcp inspect create_issue --server github-official

# Execute tools with natural syntax
anygpt mcp execute search "how to cook paella"
anygpt mcp execute search "query" 5  # Multiple parameters

# List tools from specific server
anygpt mcp tools github-official
anygpt mcp tools github-official --all  # Include disabled tools
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
  baseURL: 'https://api.openai.com/v1',
});

// Make requests
const response = await connector.chatCompletion({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

### 3. Docker MCP Plugin

Auto-discover and configure Docker MCP servers:

```typescript
// anygpt.config.ts
import { defineConfig } from '@anygpt/config';
import DockerMCP from '@anygpt/docker-mcp-plugin';

export default defineConfig({
  plugins: [
    DockerMCP({
      serverRules: [
        // Disable specific servers
        {
          when: { name: 'sequentialthinking' },
          set: { enabled: false },
        },
      ],
    }),
  ],
});
```

**What it does:**

- Discovers all Docker MCP servers automatically
- Creates separate MCP server instance for each
- Supports server-level enable/disable rules
- Disabled servers still visible for discovery

**Generated configuration:**

```typescript
{
  mcpServers: {
    'github-official': {
      command: 'docker',
      args: ['mcp', 'gateway', 'run', '--servers', 'github-official'],
      source: 'docker-mcp-plugin',
      metadata: { toolCount: 49 }
    },
    'duckduckgo': {
      command: 'docker',
      args: ['mcp', 'gateway', 'run', '--servers', 'duckduckgo'],
      source: 'docker-mcp-plugin',
      metadata: { toolCount: 2 }
    }
  }
}
```

### 4. Configuration-Driven Setup

```typescript
import { setupRouter } from '@anygpt/config';

// Automatically loads config and sets up router
const { router, config } = await setupRouter();

// Use with any registered connector
const response = await router.chatCompletion({
  provider: 'openai-main',
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

**Factory config example (`.anygpt/anygpt.config.ts`):**

```typescript
import { config } from '@anygpt/config';
import { openai } from '@anygpt/openai';
import { anthropic } from '@anygpt/anthropic';

export default config({
  defaults: {
    provider: 'openai-main',
    model: 'gpt-4o',
  },
  providers: {
    'openai-main': {
      name: 'OpenAI GPT Models',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
      }),
    },
    claude: {
      name: 'Anthropic Claude',
      connector: anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: 'https://api.anthropic.com', // Optional: for corporate gateways
      }),
    },
    'ollama-local': {
      name: 'Local Ollama',
      connector: openai({
        baseURL: 'http://localhost:11434/v1',
      }),
    },
  },
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
          baseURL: 'https://api.openai.com/v1',
        },
      },
    },
  },
  settings: {
    defaultProvider: 'openai-main',
    timeout: 30000,
  },
};

export default config;
```

### 5. MCP Server Usage

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
# Install dependencies (automatically installs Husky git hooks)
npm install

# Note: package-lock.json is created locally but never committed
# - Nx requires it for builds
# - Husky pre-commit hook auto-unstages it
# - You can use any npm registry (public or internal)

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
- **Plugin system**: Auto-discovery and configuration generation

### 🔍 **MCP Discovery & Management**

- **Auto-discovery**: Automatically finds and configures Docker MCP servers
- **Tool-focused CLI**: Execute tools without knowing which server provides them
- **Server rules**: Enable/disable servers while maintaining visibility
- **Variadic arguments**: Natural command-line syntax for tool execution
- **On-demand loading**: Load only what you need, when you need it

### 🚀 **Developer Experience**

- **Full TypeScript support**: Complete type safety across all packages
- **Comprehensive CLI**: Stateful conversations, forking, summarization, MCP management
- **Testing utilities**: Mock connector for development and testing
- **Progress indicators**: Visual feedback for long-running operations

### 🔌 **Extensible Design**

- **Connector pattern**: Easy to add new AI providers
- **Plugin architecture**: Extensible command system with auto-discovery
- **MCP compliance**: Full protocol implementation
- **Separate server instances**: Each MCP server runs independently

### ✅ **Comprehensive Testing**

- **30 E2E tests**: Complete CLI workflow validation with 0 skipped tests
- **Mock connector**: Deterministic responses for reliable testing
- **Full coverage**: Chat, conversations, config management, and error handling
- **CI/CD ready**: Fast, reliable tests that run in < 15 seconds

## Documentation

### Getting Started

- **[CLI Documentation](./packages/cli/docs/README.md)** - Complete command-line interface guide
- **[Configuration Guide](./packages/config/docs/MODEL_RULES.md)** - Complete configuration setup and examples
- **[Product Documentation](./docs/products/anygpt/README.md)** - Features, architecture, and use cases
- **[Troubleshooting Guide](./docs/workspace/troubleshooting.md)** - Common issues, recent fixes, and debugging

### Integration Examples

- **[Docker cagent Integration](./examples/cagent-integration/)** - Use AnyGPT MCP Discovery with Docker cagent for intelligent multi-agent systems (99% token reduction!)
- **[LiteLLM Integration](./examples/litellm-integration.md)** - Use AnyGPT with LiteLLM Proxy for 100+ providers and enterprise features
- **[Example Configurations](./examples/)** - Ready-to-use config examples for various setups

### Development Guidelines

- **[Testing Guide](./docs/workspace/guidelines/testing.md)** - Comprehensive testing strategy, patterns, and coverage goals
- **[E2E Testing Guide](./e2e/README.md)** - End-to-end test suite documentation and patterns
- **[Release Workflow](./docs/workspace/release-workflow.md)** - Automated Release PR workflow documentation
- **[Release Quick Reference](./docs/workspace/release-quick-reference.md)** - Quick reference for releasing packages
- **[Release Setup](./docs/workspace/release-setup.md)** - Release infrastructure documentation

### CLI Commands

- **[Chat Command](./packages/cli/docs/chat.md)** - Stateless AI interactions
- **[Conversation Command](./packages/cli/docs/conversation.md)** - Stateful conversations with advanced features
- **[Config Command](./packages/cli/docs/config.md)** - Configuration management and TypeScript benefits

### Package Documentation

**Core Packages:**

- **[@anygpt/types](./packages/types/README.md)** - Pure type definitions
- **[@anygpt/config](./packages/config/README.md)** - Configuration management
- **[@anygpt/router](./packages/router/README.md)** - Core router and connector system
- **[@anygpt/ai-provider](./packages/ai-provider/README.md)** - AI provider wrapper with function calling
- **[@anygpt/rules](./packages/rules/README.md)** - Type-safe rule engine
- **[@anygpt/mcp-logger](./packages/mcp-logger/README.md)** - File-based logging for MCP servers
- **[@anygpt/plugins](./packages/plugins/README.md)** - Plugin system for dynamic configuration

**MCP & Discovery:**

- **[@anygpt/mcp-discovery](./packages/mcp-discovery/README.md)** - MCP tool discovery engine
- **[@anygpt/mcp-discovery-server](./packages/mcp-discovery-server/README.md)** - MCP Discovery Server (PRIMARY interface)
- **[@anygpt/mcp](./packages/mcp/README.md)** - MCP server implementation

**Connectors:**

- **[@anygpt/openai](./packages/connectors/openai/README.md)** - OpenAI connector
- **[@anygpt/anthropic](./packages/connectors/anthropic/README.md)** - Anthropic connector
- **[@anygpt/claude](./packages/connectors/claude/README.md)** - Claude via MCP
- **[@anygpt/cody](./packages/connectors/cody/README.md)** - Sourcegraph Cody
- **[@anygpt/mock](./packages/connectors/mock/README.md)** - Mock connector for testing

**CLI:**

- **[@anygpt/cli](./packages/cli/README.md)** - Command-line interface

### Architecture Documentation

- **[Router API Reference](./packages/router/docs/API.md)** - Complete API documentation
- **[Router Architecture](./packages/router/docs/ARCHITECTURE.md)** - System design patterns
- **[Configuration Guide](./packages/router/docs/CONFIG.md)** - Provider configuration
- **[Connector Usage](./packages/router/docs/CONNECTOR_USAGE.md)** - Provider-specific usage

### CLI Documentation

- **[CLI Overview](./packages/cli/docs/README.md)** - Complete CLI documentation
- **[Tag Resolution Guide](./packages/cli/docs/tag-resolution.md)** - How to use tags and model discovery
- **[Chat Command](./packages/cli/docs/chat.md)** - Stateless chat usage
- **[Conversation Command](./packages/cli/docs/conversation.md)** - Stateful conversations
- **[Config Command](./packages/cli/docs/config.md)** - Configuration management
- **[Benchmark Command](./packages/cli/docs/benchmark.md)** - Model performance testing

## Security

⚠️ **Important**: This project handles sensitive credentials. Please review [SECURITY.md](./SECURITY.md) before contributing.

**Key security practices:**

- Never commit API keys or tokens
- Use environment variables for credentials
- Run security checks before committing (see `.windsurf/workflows/security-check.md`)
- Use generic examples (e.g., `example.com`) instead of internal URLs

## License

MIT License - see [LICENSE](LICENSE) file for details.
