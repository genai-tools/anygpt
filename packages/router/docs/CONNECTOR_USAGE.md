# Connector Usage Guide

This guide explains how to use the different connectors in the GenAI Gateway.

## Architecture Overview

```
GenAI Gateway
├── OpenAI Connector (Production)
├── Mock Connector (Testing)
└── Future Connectors (Anthropic, etc.)
```

## 1. Using Connectors Directly

### OpenAI Connector

```typescript
import { OpenAIConnector } from 'genai-gateway';

const openaiConnector = new OpenAIConnector({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3
});

// List models with rich metadata
const models = await openaiConnector.listModels();
console.log(models[0]);
// Output:
// {
//   id: 'gpt-5',
//   provider: 'openai',
//   description: 'OpenAI\'s most advanced model...',
//   context_length: 200000,
//   max_output_tokens: 16384,
//   input_pricing: 10.00,
//   output_pricing: 30.00,
//   capabilities: ['text', 'vision', 'audio', 'function_calling'],
//   family: 'frontier'
// }

// Send chat completion with validation
const response = await openaiConnector.chatCompletion({
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  model: 'gpt-4o',
  temperature: 0.7,
  max_tokens: 100,
  top_p: 0.9
});
```

### Mock Connector (for Testing)

```typescript
import { MockConnector } from 'genai-gateway';

const mockConnector = new MockConnector({
  delay: 500,        // Simulate 500ms API delay
  failureRate: 0.1,  // 10% chance of failure
});

// Test with predictable responses
mockConnector.setCustomResponse('chat_mock-gpt-4', {
  id: 'test-response',
  object: 'chat.completion',
  created: Date.now(),
  model: 'mock-gpt-4',
  choices: [{
    index: 0,
    message: { role: 'assistant', content: 'Test response!' },
    finish_reason: 'stop'
  }],
  usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
});

const response = await mockConnector.chatCompletion({
  messages: [{ role: 'user', content: 'Test' }],
  model: 'mock-gpt-4'
});
```

## 2. Using the Gateway (Recommended)

### Production Usage

```typescript
import { GenAIGateway } from 'genai-gateway';

const gateway = new GenAIGateway({
  openaiApiKey: process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4o',
  timeout: 30000,
  maxRetries: 3
});

// Works with any provider
const response = await gateway.chatCompletion({
  messages: [{ role: 'user', content: 'Hello!' }],
  provider: 'openai',  // or omit for default
  model: 'gpt-4o',
  temperature: 0.7
});

const models = await gateway.listModels('openai');
```

### Testing with Mock Mode

```typescript
import { GenAIGateway } from 'genai-gateway';

const gateway = new GenAIGateway({
  useMockConnector: true,  // Enable mock mode
  mockConfig: {
    delay: 100,
    failureRate: 0,
    customResponses: {
      'chat_gpt-4o': {
        id: 'test-123',
        model: 'gpt-4o',
        choices: [{ 
          message: { role: 'assistant', content: 'Mock response!' },
          finish_reason: 'stop' 
        }],
        usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 }
      }
    }
  }
});

// This will use the mock connector
const response = await gateway.chatCompletion({
  messages: [{ role: 'user', content: 'Test' }],
  model: 'gpt-4o'
});
```

### Dynamic Mock Control

```typescript
const gateway = new GenAIGateway({
  openaiApiKey: process.env.OPENAI_API_KEY
});

// Switch to mock mode for testing
gateway.enableMockMode(true);

// Configure mock behavior
gateway.setMockConfig({
  delay: 200,
  failureRate: 0.2,  // 20% failure rate
  customResponses: {
    'chat_test-model': { /* custom response */ }
  }
});

// Test with mock
const mockResponse = await gateway.chatCompletion({
  messages: [{ role: 'user', content: 'Test' }],
  provider: 'mock'
});

// Switch back to real API
gateway.enableMockMode(false);
const realResponse = await gateway.chatCompletion({
  messages: [{ role: 'user', content: 'Real request' }],
  provider: 'openai'
});
```

## 3. Connector Factory Pattern

```typescript
import { OpenAIConnector, MockConnector } from 'genai-gateway';

class ConnectorFactory {
  static create(type: 'openai' | 'mock', config: any) {
    switch (type) {
      case 'openai':
        return new OpenAIConnector(config);
      case 'mock':
        return new MockConnector(config);
      default:
        throw new Error(`Unknown connector: ${type}`);
    }
  }
}

// Environment-based connector selection
const connectorType = process.env.NODE_ENV === 'test' ? 'mock' : 'openai';
const config = connectorType === 'openai' 
  ? { apiKey: process.env.OPENAI_API_KEY }
  : { delay: 100, failureRate: 0 };

const connector = ConnectorFactory.create(connectorType, config);
```

## 4. Testing Scenarios

### Unit Testing

```typescript
import { MockConnector } from 'genai-gateway';

describe('AI Service', () => {
  let mockConnector: MockConnector;

  beforeEach(() => {
    mockConnector = new MockConnector({
      delay: 0,  // No delay in tests
      failureRate: 0  // No failures in tests
    });
  });

  test('should handle successful response', async () => {
    mockConnector.setCustomResponse('chat_test-model', {
      id: 'test-123',
      choices: [{ message: { content: 'Success!' } }],
      usage: { total_tokens: 10 }
    });

    const response = await mockConnector.chatCompletion({
      messages: [{ role: 'user', content: 'test' }],
      model: 'test-model'
    });

    expect(response.choices[0].message.content).toBe('Success!');
  });

  test('should handle API failures', async () => {
    mockConnector.setFailureRate(1.0);  // Always fail

    await expect(
      mockConnector.chatCompletion({
        messages: [{ role: 'user', content: 'test' }]
      })
    ).rejects.toThrow('Mock API failure simulation');
  });
});
```

### Integration Testing

```typescript
import { GenAIGateway } from 'genai-gateway';

describe('Gateway Integration', () => {
  test('should work with different providers', async () => {
    const gateway = new GenAIGateway({
      useMockConnector: true,
      mockConfig: { delay: 50, failureRate: 0 }
    });

    // Test mock provider
    const mockResponse = await gateway.chatCompletion({
      messages: [{ role: 'user', content: 'test' }],
      provider: 'mock'
    });
    expect(mockResponse.provider).toBe('mock');

    // Test with real API (if available)
    if (process.env.OPENAI_API_KEY) {
      gateway.enableMockMode(false);
      const realResponse = await gateway.chatCompletion({
        messages: [{ role: 'user', content: 'test' }],
        provider: 'openai'
      });
      expect(realResponse.provider).toBe('openai');
    }
  });
});
```

### Performance Testing

```typescript
import { MockConnector } from 'genai-gateway';

async function performanceTest() {
  const connector = new MockConnector({
    delay: 100,  // Simulate 100ms API delay
    failureRate: 0.05  // 5% failure rate
  });

  const requests = Array.from({ length: 100 }, (_, i) => 
    connector.chatCompletion({
      messages: [{ role: 'user', content: `Request ${i}` }],
      model: 'mock-gpt-4'
    }).catch(err => ({ error: err.message }))
  );

  const results = await Promise.all(requests);
  const successful = results.filter(r => !('error' in r));
  const failed = results.filter(r => 'error' in r);

  console.log(`Success: ${successful.length}, Failed: ${failed.length}`);
}
```

## 5. Model Information Usage

```typescript
import { getModelInfo, getChatModels, OPENAI_MODELS } from 'genai-gateway';

// Get specific model info
const gpt5Info = getModelInfo('gpt-5');
console.log(`Context: ${gpt5Info?.contextLength} tokens`);
console.log(`Pricing: $${gpt5Info?.inputPricing}/1M input tokens`);

// Get all chat models
const chatModels = getChatModels();
console.log(`Available chat models: ${chatModels.length}`);

// Filter by capabilities
const visionModels = chatModels.filter(m => 
  m.capabilities.includes('vision')
);

// Filter by family
const frontierModels = chatModels.filter(m => 
  m.family === 'frontier'
);

// Access raw model data
console.log('All models:', Object.keys(OPENAI_MODELS));
```

## 6. Error Handling

```typescript
import { GenAIGateway } from 'genai-gateway';

const gateway = new GenAIGateway({
  openaiApiKey: process.env.OPENAI_API_KEY
});

try {
  const response = await gateway.chatCompletion({
    messages: [{ role: 'user', content: 'Hello!' }],
    model: 'invalid-model'  // This will cause an error
  });
} catch (error) {
  if (error.message.includes('Unknown model')) {
    console.log('Model not found, using default...');
    // Retry with default model
  } else if (error.message.includes('API key')) {
    console.log('Authentication failed');
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

## Best Practices

1. **Use the Gateway**: Prefer `GenAIGateway` over direct connector usage for better abstraction
2. **Mock for Testing**: Always use `MockConnector` in tests to avoid API costs and ensure reliability
3. **Environment-based Configuration**: Use environment variables to switch between mock and real connectors
4. **Error Handling**: Always wrap API calls in try-catch blocks
5. **Model Validation**: Use `getModelInfo()` to validate models before making requests
6. **Resource Management**: Consider rate limits and costs when making multiple requests

## Environment Variables

```bash
# Production
OPENAI_API_KEY=your-api-key-here
NODE_ENV=production

# Testing
NODE_ENV=test
USE_MOCK_CONNECTOR=true

# Development
OPENAI_API_KEY=your-dev-api-key
NODE_ENV=development
DEFAULT_MODEL=gpt-4o-mini
```
