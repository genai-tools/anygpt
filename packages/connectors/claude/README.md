# @anygpt/claude-agent

Claude Agent SDK connector for AnyGPT - provides agentic capabilities with built-in tool support, file operations, code execution, and MCP extensibility.

## Features

- **Agentic Capabilities**: Autonomous agents that can plan, execute, and iterate
- **Built-in Tools**: File operations, bash execution, web search, and more
- **MCP Support**: Connect to Model Context Protocol servers for extended functionality
- **Context Management**: Automatic context compaction and management
- **Permission System**: Fine-grained control over agent capabilities

## Installation

```bash
npm install @anygpt/claude-agent
```

## Usage

```typescript
import { claudeAgent } from '@anygpt/claude-agent';

// Create connector with API key
const connector = claudeAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4',
  maxTokens: 4096,
});

// Use with AnyGPT router
const response = await connector.chatCompletion({
  messages: [
    { role: 'user', content: 'Read the README.md file and summarize it' }
  ],
  model: 'claude-sonnet-4',
});

console.log(response.message);
```

## Configuration

### Basic Configuration

```typescript
const connector = claudeAgent({
  apiKey: 'your-api-key',
  model: 'claude-sonnet-4',
  maxTokens: 4096,
  temperature: 0.7,
  systemPrompt: 'You are a helpful assistant',
});
```

### With MCP Servers

```typescript
const connector = claudeAgent({
  apiKey: 'your-api-key',
  mcpServers: {
    'filesystem': {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/workspace'],
    },
    'github': {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      },
    },
  },
});
```

### With Permissions

```typescript
const connector = claudeAgent({
  apiKey: 'your-api-key',
  permissions: {
    bash: 'allow', // Allow bash execution
    edit: 'ask',   // Ask before editing files
    read: 'allow', // Allow reading files
  },
});
```

## Comparison with Anthropic Connector

| Feature | @anygpt/anthropic | @anygpt/claude-agent |
|---------|-------------------|----------------------|
| **Purpose** | Direct API access | Agentic workflows |
| **Tools** | Manual tool definition | Built-in + MCP |
| **Context** | Manual management | Automatic compaction |
| **File Ops** | Via custom tools | Built-in |
| **Code Exec** | Via custom tools | Built-in |
| **Permissions** | N/A | Fine-grained control |
| **Use Case** | Chat completions | Autonomous agents |

## When to Use

**Use @anygpt/claude-agent when:**
- Building autonomous agents that need to perform complex tasks
- Need built-in file operations and code execution
- Want automatic context management
- Require MCP server integration
- Building SRE, security, or code review agents

**Use @anygpt/anthropic when:**
- Simple chat completions
- Custom tool definitions
- Direct API control
- Streaming responses
- Lower-level access

## Examples

### Code Review Agent

```typescript
const reviewer = claudeAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  systemPrompt: 'You are a code review assistant. Review code for best practices, security issues, and performance.',
  permissions: {
    read: 'allow',
    bash: 'allow',
  },
});

const response = await reviewer.chatCompletion({
  messages: [
    { role: 'user', content: 'Review the changes in src/index.ts' }
  ],
  model: 'claude-sonnet-4',
});
```

### SRE Agent

```typescript
const sreAgent = claudeAgent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  systemPrompt: 'You are an SRE assistant. Help diagnose and fix production issues.',
  permissions: {
    bash: 'ask',  // Ask before running commands
    read: 'allow',
  },
  mcpServers: {
    'kubernetes': {
      command: 'kubectl-mcp-server',
    },
  },
});

const response = await sreAgent.chatCompletion({
  messages: [
    { role: 'user', content: 'Check the status of the api-server pod and diagnose any issues' }
  ],
  model: 'claude-opus-4',
});
```

## API Reference

### ClaudeAgentConnectorConfig

```typescript
interface ClaudeAgentConnectorConfig {
  apiKey?: string;              // Anthropic API key
  model?: string;               // Model to use (default: claude-sonnet-4)
  maxTokens?: number;           // Max tokens (default: 4096)
  temperature?: number;         // Temperature (0-1)
  systemPrompt?: string;        // System prompt
  mcpServers?: Record<string, MCPServerConfig>;  // MCP servers
  permissions?: Record<string, 'allow' | 'ask' | 'deny'>;  // Tool permissions
}
```

### Methods

- `chatCompletion(request)` - Execute agentic chat completion
- `getModels()` - Get available models

## License

MIT
