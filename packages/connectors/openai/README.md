# @anygpt/openai

OpenAI connector for the AnyGPT router system. This package provides a connector implementation that allows the router to communicate with OpenAI and OpenAI-compatible APIs.

## Features

- **OpenAI API Support**: Full support for OpenAI's Chat Completions API
- **OpenAI-Compatible APIs**: Works with any OpenAI-compatible endpoint (Ollama, LocalAI, etc.)
- **Response API Fallback**: Automatically falls back to Chat Completions API when Response API is not available
- **Flexible Configuration**: Support for custom base URLs and API keys
- **Type Safety**: Full TypeScript support with proper type definitions

## Installation

```bash
npm install @anygpt/openai @anygpt/router
```

## Usage

```typescript
import { OpenAIConnector, OpenAIConnectorFactory } from '@anygpt/openai';
import { ConnectorRegistry } from '@anygpt/router';

// Register the connector
const registry = new ConnectorRegistry();
registry.registerConnector(new OpenAIConnectorFactory());

// Create a connector instance
const connector = registry.createConnector('openai', {
  apiKey: 'your-api-key',
  baseURL: 'https://api.openai.com/v1' // Optional: for custom endpoints
});

// Use the connector
const response = await connector.chatCompletion({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## Configuration

The OpenAI connector accepts the following configuration options:

- `apiKey`: Your OpenAI API key (optional for some compatible APIs)
- `baseURL`: Custom API endpoint URL (useful for Ollama, LocalAI, etc.)
- `timeout`: Request timeout in milliseconds (default: 30000)
- `maxRetries`: Maximum number of retries (default: 3)
- `logger`: Custom logger instance

## OpenAI-Compatible APIs

This connector works with various OpenAI-compatible APIs:

- **Ollama**: `baseURL: 'http://localhost:11434/v1'`
- **LocalAI**: `baseURL: 'http://localhost:8080/v1'`
- **Together AI**: `baseURL: 'https://api.together.xyz/v1'`
- **Anyscale**: `baseURL: 'https://api.endpoints.anyscale.com/v1'`

## Dependencies

This package depends on:
- `@anygpt/router`: Provides the base connector class and types
- `openai`: Official OpenAI SDK for API communication
