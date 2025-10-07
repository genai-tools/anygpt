# Cody Connector

The Cody connector enables integration with Sourcegraph's Cody AI assistant through the command-line interface. Unlike traditional API-based connectors, this connector spawns the `cody` CLI as a child process, making it ideal for scenarios where you want to leverage existing Cody CLI authentication and configuration.

## Overview

- **Package:** `@anygpt/cody`
- **Provider ID:** `cody`
- **Type:** CLI-based connector
- **Status:** ✅ Production ready

## Key Features

### CLI-Based Architecture
- Spawns `cody chat` CLI command as a child process
- Captures and parses CLI output
- No API keys needed if already authenticated via CLI
- Leverages existing Cody CLI configuration

### Authentication
- Uses Cody CLI authentication (`cody auth`)
- Supports environment variables (`SRC_ACCESS_TOKEN`, `SRC_ENDPOINT`)
- Works with enterprise Sourcegraph instances
- Configuration-based token support

### Context Awareness
- Optional working directory specification for better code context
- Can include local files in context (via CLI features)
- Supports enterprise repository context (Sourcegraph Enterprise)

## Installation

```bash
# Install the connector
npm install @anygpt/cody

# Install Cody CLI (prerequisite)
npm install -g @sourcegraph/cody

# Authenticate
cody auth
```

## Quick Start

```typescript
import { cody } from '@anygpt/cody';

// Create connector with default settings
const connector = cody();

// Chat with Cody
const response = await connector.chatCompletion({
  messages: [
    { role: 'user', content: 'Explain async/await in JavaScript' }
  ]
});

console.log(response.choices[0].message.content);
```

## Configuration

### Basic Configuration

```typescript
const connector = cody({
  workingDirectory: process.cwd(),  // For better code context
  showContext: false,                // Show context items in response
  debug: false                       // Enable debug logging
});
```

### Enterprise Configuration

```typescript
const connector = cody({
  endpoint: 'https://sourcegraph.company.com/',
  accessToken: process.env.SRC_ACCESS_TOKEN,
  workingDirectory: '/path/to/project'
});
```

### Custom CLI Path

```typescript
const connector = cody({
  cliPath: '/usr/local/bin/cody',  // Custom CLI location
  timeout: 90000                    // Longer timeout for complex queries
});
```

## Usage with Router

```typescript
import { Router } from '@anygpt/router';
import { CodyConnectorFactory } from '@anygpt/cody';

const router = new Router();
router.registerConnector(new CodyConnectorFactory());

const response = await router.chatCompletion({
  provider: 'cody',
  messages: [
    { role: 'user', content: 'How do I use TypeScript generics?' }
  ]
});
```

## Configuration File

```typescript
// anygpt.config.ts
import { cody } from '@anygpt/cody';

export default {
  providers: {
    cody: cody({
      workingDirectory: process.cwd(),
      showContext: false
    })
  }
};
```

## Models

The connector supports various models depending on your Sourcegraph instance:

- **Claude 3.5 Sonnet** (recommended)
- **Claude 3 Opus**
- **Claude 3 Sonnet**
- **GPT-4o**
- **GPT-4 Turbo**

By default, Cody uses its own model selection. You can specify a model in the configuration or per-request, but availability depends on your Sourcegraph instance.

## Implementation Details

### How It Works

1. **Request Processing:**
   - Converts chat messages to a single prompt
   - Combines system messages and conversation history
   - Formats for CLI consumption

2. **CLI Execution:**
   - Spawns `cody chat` command with appropriate flags
   - Passes environment variables for authentication
   - Captures stdout and stderr

3. **Response Parsing:**
   - Cleans CLI output (removes loading indicators, etc.)
   - Extracts actual response text
   - Estimates token usage
   - Formats as standard chat completion response

4. **Error Handling:**
   - Captures CLI exit codes
   - Provides meaningful error messages
   - Supports timeout configuration

### Output Cleaning

The connector automatically cleans Cody CLI output by removing:
- Loading spinner characters (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏)
- "Logging in" messages
- Noxide loader messages
- DelegatingProxy messages
- Extra whitespace

## Advantages

### ✅ Pros

- **No API Key Management:** Uses existing CLI authentication
- **Enterprise Support:** Works with enterprise Sourcegraph instances
- **Context Awareness:** Can leverage local file context
- **Familiar Interface:** Uses standard chat completion API
- **Easy Setup:** If Cody CLI is already configured, it just works

### ⚠️ Limitations

- **No Streaming:** CLI doesn't support streaming responses
- **Performance:** Slightly slower than direct API calls (process spawning overhead)
- **Function Calling:** Limited to what Cody CLI supports
- **Concurrency:** Each request spawns a new process

## Best Practices

1. **Set Appropriate Timeouts:**
   ```typescript
   const connector = cody({
     timeout: 60000  // Cody can take longer for complex queries
   });
   ```

2. **Use Working Directory for Context:**
   ```typescript
   const connector = cody({
     workingDirectory: process.cwd()  // Better code understanding
   });
   ```

3. **Handle Errors Gracefully:**
   ```typescript
   try {
     const response = await connector.chatCompletion(request);
   } catch (error) {
     console.error('Cody error:', error.message);
     // Fallback to another provider
   }
   ```

4. **Cache Connector Instances:**
   ```typescript
   // Don't create new connector for each request
   const connector = cody();
   
   // Reuse for multiple requests
   await connector.chatCompletion(request1);
   await connector.chatCompletion(request2);
   ```

## Troubleshooting

### "Cody CLI not found"

Ensure Cody CLI is installed and in PATH:
```bash
npm install -g @sourcegraph/cody
which cody
```

Or specify custom path:
```typescript
const connector = cody({
  cliPath: '/path/to/cody'
});
```

### "Not authenticated"

Authenticate with Cody CLI:
```bash
cody auth
```

Or provide credentials:
```typescript
const connector = cody({
  accessToken: process.env.SRC_ACCESS_TOKEN,
  endpoint: 'https://sourcegraph.com/'
});
```

### "Model not found"

Don't specify a model or check your Sourcegraph instance for available models:
```typescript
// Let Cody use its default
const connector = cody();

// Or check available models
const models = await connector.listModels();
console.log(models);
```

### Timeout Issues

Increase timeout for complex queries:
```typescript
const connector = cody({
  timeout: 90000  // 90 seconds
});
```

## Examples

See the [examples directory](../../examples/) for complete examples:
- `examples/configs/cody.config.ts` - Configuration examples
- `examples/cody-chat-example.ts` - Usage examples

## Related Documentation

- [Cody CLI Documentation](https://www.npmjs.com/package/@sourcegraph/cody)
- [Sourcegraph Documentation](https://docs.sourcegraph.com/)
- [AnyGPT Router Documentation](../router.md)
- [Connector Development Guide](../guidelines/connectors.md)
