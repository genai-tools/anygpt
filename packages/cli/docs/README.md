# AnyGPT CLI Documentation

Complete documentation for the AnyGPT command-line interface, covering all commands, concepts, and usage patterns.

## Quick Navigation

| Command | Purpose | Documentation |
|---------|---------|---------------|
| **[chat](./chat.md)** | Stateless AI interactions | [📖 Chat Guide](./chat.md) |
| **[conversation](./conversation.md)** | Stateful AI conversations | [📖 Conversation Guide](./conversation.md) |
| **[config](./config.md)** | Configuration management | [📖 Config Guide](./config.md) |

## Command Overview

### Chat Command - Simple & Fast
```bash
npx anygpt chat "What is TypeScript?"
```
- **Stateless**: No memory between messages
- **Fast**: Single request/response
- **Simple**: Perfect for quick questions
- **Use cases**: Factual queries, code snippets, translations

### Conversation Command - Contextual & Powerful
```bash
npx anygpt conversation message "Help me design a REST API"
npx anygpt conversation message "Add authentication to that design"
```
- **Stateful**: Maintains conversation history
- **Contextual**: AI remembers previous messages
- **Advanced**: Fork, condense, summarize capabilities
- **Use cases**: Code reviews, architecture discussions, learning

### Config Command - Setup & Management
```bash
npx anygpt config
```
- **Inspection**: View current configuration
- **Validation**: Verify setup correctness
- **Export**: Share configuration templates
- **TypeScript**: Modern configuration with type safety

## Core Concepts

### Stateless vs Stateful

| Aspect | Chat (Stateless) | Conversation (Stateful) |
|--------|------------------|-------------------------|
| **Memory** | None | Full history |
| **Context** | Single message | Cumulative |
| **Use Case** | Quick queries | Extended discussions |
| **Performance** | Fast | Contextual |
| **Storage** | None | Persistent |

### Configuration Hierarchy

AnyGPT loads configuration from multiple sources in priority order:

1. **Command line** (`--config path`)
2. **Private config** (`.anygpt/anygpt.config.ts`)
3. **Project config** (`anygpt.config.ts`)
4. **User config** (`~/.anygpt/anygpt.config.ts`)
5. **Legacy config** (`~/.codex/config.toml`)
6. **Built-in defaults**

## Getting Started

### 1. Setup Configuration

Create your private configuration:

```bash
mkdir -p .anygpt
```

```typescript
// .anygpt/anygpt.config.ts
import { config, openai } from '@anygpt/config';

export default config({
  defaults: {
    provider: 'openai',
    model: 'gpt-4o'
  },
  providers: {
    openai: {
      name: 'OpenAI',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
  }
});
```

### 2. Verify Setup

```bash
# Check configuration
npx anygpt config

# Test with simple chat
npx anygpt chat "Hello, world!"
```

### 3. Start Using

```bash
# Quick questions
npx anygpt chat "Explain async/await"

# Extended discussions
npx anygpt conversation message "Help me design a database schema"
npx anygpt conversation message "Add user authentication to that schema"
```

## Usage Patterns

### Development Workflow

```bash
# 1. Start development session
npx anygpt conversation start --name "Feature: User Auth"

# 2. Design phase
npx anygpt conversation message "Design JWT authentication flow"
npx anygpt conversation message "What security considerations should I include?"

# 3. Implementation phase
npx anygpt conversation message "Show JWT middleware implementation"

# 4. Review phase
npx anygpt conversation message "Review this code: [paste code]"

# 5. Alternative exploration
npx anygpt conversation fork --name "OAuth Alternative"
npx anygpt conversation message "Show OAuth 2.0 implementation instead"
```

### Learning Session

```bash
# Start learning conversation
npx anygpt conversation start --name "Learning: React Hooks"

# Progressive learning
npx anygpt conversation message "Explain useState hook"
npx anygpt conversation message "Show practical examples"
npx anygpt conversation message "What are the rules of hooks?"
npx anygpt conversation message "Give me exercises to practice"

# Create summary for later
npx anygpt conversation summarize --name "React Hooks Summary"
```

### Quick Tasks

```bash
# Use chat for independent tasks
npx anygpt chat "Convert this to TypeScript: [paste JavaScript]"
npx anygpt chat "Explain the difference between map and forEach"
npx anygpt chat "Generate a regex for email validation"
```

## Advanced Features

### Conversation Management

#### Forking - Explore Alternatives
```bash
# Original conversation about caching
npx anygpt conversation message "How should I implement caching?"

# Fork to explore Redis
npx anygpt conversation fork --name "Redis Implementation"
npx anygpt conversation message "Show Redis caching details"

# Fork to explore Memcached  
npx anygpt conversation fork --name "Memcached Implementation"
npx anygpt conversation message "Show Memcached implementation"
```

#### Condensing - Optimize Context
```bash
# Check conversation size
npx anygpt conversation context

# Condense long conversations
npx anygpt conversation condense --keep-recent 5
```

#### Summarizing - Create Overviews
```bash
# Long technical discussion
# ... many messages ...

# Create summary for team
npx anygpt conversation summarize --name "Architecture Summary"
```

### Configuration Management

#### Environment-Specific Configs
```typescript
// .anygpt/anygpt.config.ts
const env = process.env.NODE_ENV || 'development';

const configs = {
  development: {
    defaults: { provider: 'mock' },
    providers: { mock: { connector: mock() } }
  },
  production: {
    defaults: { provider: 'openai' },
    providers: { openai: { connector: openai({...}) } }
  }
};

export default config(configs[env]);
```

#### Dynamic Configuration
```typescript
// .anygpt/anygpt.config.ts
import { config, openai } from '@anygpt/config';

export default config({
  defaults: {
    provider: 'openai',
    model: process.env.NODE_ENV === 'production' ? 'gpt-4o' : 'gpt-3.5-turbo'
  },
  providers: {
    openai: {
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: parseInt(process.env.TIMEOUT || '30000')
      })
    }
  }
});
```

## Command Comparison

### When to Use Each Command

#### Chat Command ✅
- **Quick factual questions**: "What's the capital of France?"
- **Code snippets**: "Write a function to reverse a string"
- **Translations**: "Translate 'Hello' to Spanish"
- **Independent tasks**: "Generate a UUID in JavaScript"
- **Automation**: Scripting and batch processing

#### Conversation Command ✅
- **Code reviews**: Multi-file, contextual feedback
- **Architecture discussions**: Complex system design
- **Learning sessions**: Progressive, building knowledge
- **Debugging**: Step-by-step problem solving
- **Iterative development**: Refining solutions over time

#### Config Command ✅
- **Setup verification**: Ensure configuration is correct
- **Debugging**: Troubleshoot connection issues
- **Template sharing**: Export configurations for teams
- **Environment management**: Switch between dev/prod configs

## Troubleshooting

### Common Issues

#### Configuration Problems
```bash
# Check current config
npx anygpt config

# Test specific config file
npx anygpt config --config ./test-config.ts

# Validate with simple chat
npx anygpt chat "test"
```

#### Provider Issues
```bash
Error: Provider 'xyz' not configured
```
**Solution**: Check provider names in config, use `npx anygpt config` to verify.

#### Conversation State Issues
```bash
Error: No active conversation
```
**Solution**: Auto-start feature handles this automatically, or use `npx anygpt conversation start`.

#### Token/Context Issues
```bash
# Monitor conversation size
npx anygpt conversation context

# Optimize if needed
npx anygpt conversation condense
```

### Getting Help

```bash
# Command help
npx anygpt --help
npx anygpt chat --help
npx anygpt conversation --help
npx anygpt config --help

# Specific subcommand help
npx anygpt conversation fork --help
npx anygpt conversation condense --help
```

## Best Practices

### 1. Configuration Management
- Use `.anygpt/` directory for private configs
- Leverage TypeScript for type safety
- Use environment variables for secrets
- Document configuration choices

### 2. Conversation Organization
- Use descriptive conversation names
- Monitor context size with `context` command
- Use `fork` to explore alternatives
- Create summaries for important discussions

### 3. Efficient Usage
- Use `chat` for quick, independent tasks
- Use `conversation` for contextual, multi-step work
- Condense long conversations to manage context
- Fork conversations before major direction changes

### 4. Development Integration
- Create project-specific configurations
- Use conversations for code reviews
- Fork conversations to explore different approaches
- Summarize important architectural decisions

## Integration Examples

### CI/CD Integration
```bash
# Code review automation
npx anygpt chat "Review this commit: $(git show --name-only)"

# Documentation generation
npx anygpt chat "Generate README for: $(ls -la)"
```

### Development Scripts
```bash
#!/bin/bash
# dev-helper.sh

case $1 in
  "review")
    npx anygpt conversation start --name "Code Review: $2"
    npx anygpt conversation message "Review this file: $(cat $2)"
    ;;
  "explain")
    npx anygpt chat "Explain this code: $(cat $2)"
    ;;
  "optimize")
    npx anygpt conversation message "How can I optimize this code: $(cat $2)"
    ;;
esac
```

### Team Workflows
```bash
# Architecture discussion
npx anygpt conversation start --name "Architecture: Microservices Design"
npx anygpt conversation message "Design microservices for e-commerce platform"

# Share summary with team
npx anygpt conversation summarize --name "Microservices Summary for Team Review"
```

## Further Reading

- **[Chat Command Guide](./chat.md)** - Complete chat command documentation
- **[Conversation Command Guide](./conversation.md)** - Advanced conversation features
- **[Config Command Guide](./config.md)** - Configuration management and TypeScript benefits
- **[Configuration Guide](../configuration.md)** - General configuration setup
- **[Troubleshooting Guide](../troubleshooting.md)** - Common issues and solutions

The AnyGPT CLI provides powerful tools for both simple and complex AI interactions, with flexible configuration and advanced conversation management capabilities.
