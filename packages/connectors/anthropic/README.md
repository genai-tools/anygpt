# @anygpt/anthropic

Anthropic connector for the AnyGPT router system. This package provides a connector implementation that allows the router to communicate with Anthropic's native Claude API.

## Features

- **Native Anthropic API Support**: Full support for Anthropic's Messages API
- **Extended Thinking**: Support for Claude's extended thinking models
- **Custom Endpoints**: Works with corporate Anthropic gateways
- **Flexible Configuration**: Support for custom base URLs and API keys
- **Type Safety**: Full TypeScript support with proper type definitions

## Installation

```bash
npm install @anygpt/anthropic @anygpt/router
```

## Usage

```typescript
import {
  AnthropicConnector,
  AnthropicConnectorFactory,
} from '@anygpt/anthropic';
import { ConnectorRegistry } from '@anygpt/router';

// Register the connector
const registry = new ConnectorRegistry();
registry.registerConnector(new AnthropicConnectorFactory());

// Create a connector instance
const connector = registry.createConnector('anthropic', {
  apiKey: 'your-api-key',
  baseURL: 'https://api.anthropic.com', // Optional: for custom endpoints
});

// Use the connector
const response = await connector.chatCompletion({
  model: 'claude-sonnet-4-5',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

## Configuration

The Anthropic connector accepts the following configuration options:

- `apiKey`: Your Anthropic API key (required for most endpoints)
- `baseURL`: Custom API endpoint URL (useful for corporate gateways)
- `timeout`: Request timeout in milliseconds (default: 30000)
- `maxRetries`: Maximum number of retries (default: 3)
- `logger`: Custom logger instance

## Corporate Gateways

This connector works with corporate Anthropic gateways:

```typescript
const connector = new AnthropicConnector({
  apiKey: 'dummy-key', // Some gateways use static keys
  baseURL: 'https://your-corporate-gateway.com/anthropic',
});
```

## Dependencies

This package depends on:

- `@anygpt/router`: Provides the base connector class and types
- `@anthropic-ai/sdk`: Official Anthropic SDK for API communication
