# @anygpt/mock

Mock connector for testing and development with the AnyGPT router system.

## Features

- **Realistic Mock Responses**: Generates contextual responses based on input
- **Configurable Delays**: Simulate API latency for testing
- **Failure Simulation**: Test error handling with configurable failure rates
- **Custom Responses**: Override responses for specific test scenarios
- **Multiple Mock Models**: Simulates GPT-4, GPT-3.5, and Claude models
- **Zero External Dependencies**: Perfect for testing without API keys

## Installation

```bash
npm install @anygpt/mock @anygpt/types
```

## Usage

### Basic Usage

```typescript
import { MockConnectorFactory } from '@anygpt/mock';
import { GenAIRouter } from '@anygpt/router';

const router = new GenAIRouter();
router.registerConnector(new MockConnectorFactory());

// Use the mock connector
const response = await router.chatCompletion({
  provider: 'mock',
  model: 'mock-gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### Configuration

```typescript
import { MockConnector } from '@anygpt/mock';

const mockConnector = new MockConnector({
  delay: 500,        // 500ms simulated latency
  failureRate: 0.1,  // 10% chance of failure
  customResponses: {
    'chat_mock-gpt-4': {
      id: 'custom-response',
      // ... custom response object
    }
  }
});
```

### Dynamic Configuration

```typescript
// In your config file
export default {
  providers: {
    'test-provider': {
      connector: '@anygpt/mock',
      api: { url: 'mock://test' },
      config: {
        delay: 200,
        failureRate: 0.05
      }
    }
  }
};
```

### Testing Utilities

```typescript
const mockConnector = new MockConnector();

// Set custom responses for testing
mockConnector.setCustomResponse('chat_test-model', {
  id: 'test-123',
  choices: [{ message: { content: 'Expected test response' } }]
});

// Simulate network issues
mockConnector.setFailureRate(0.5); // 50% failure rate
mockConnector.setDelay(2000);      // 2 second delay
```

## Mock Models

The connector provides several mock models:

- **mock-gpt-4**: High-capability model simulation
- **mock-gpt-3.5-turbo**: Fast model simulation  
- **mock-claude-3**: Vision-capable model simulation

## Configuration Options

- `delay`: Simulated API response delay in milliseconds (default: 100)
- `failureRate`: Probability of simulated failures (0-1, default: 0)
- `customResponses`: Override responses for specific scenarios
- `timeout`: Request timeout (inherited from base config)
- `maxRetries`: Maximum retry attempts (inherited from base config)

## Use Cases

- **Unit Testing**: Test your application without external API calls
- **Development**: Develop against consistent, predictable responses
- **Integration Testing**: Test error handling and retry logic
- **Performance Testing**: Simulate various latency scenarios
- **Offline Development**: Work without internet connectivity

## Response Patterns

The mock connector generates contextual responses:

- **Hello messages**: Returns friendly greetings
- **Test queries**: Confirms testing functionality
- **Error keywords**: Simulates error scenarios
- **Default**: Random contextual responses

This makes testing more realistic while remaining predictable for assertions.
