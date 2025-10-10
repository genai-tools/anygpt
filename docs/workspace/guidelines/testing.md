# Testing Guide

Comprehensive testing strategy and patterns for the AnyGPT monorepo.

## Overview

This monorepo uses **Vitest** for testing with the following principles:
- **Unit tests**: Fast, isolated tests for individual functions/classes
- **Integration tests**: Test interactions between modules
- **End-to-end tests**: Test complete workflows (CLI commands, MCP protocol)

## Test Structure

### File Naming
- Unit tests: `*.spec.ts` (co-located with source files)
- Integration tests: `*.integration.spec.ts`
- E2E tests: `*.e2e.spec.ts`

### Test Organization
```
packages/
  router/
    src/
      lib/
        router.ts
        router.spec.ts          # Unit tests
      connectors/
        registry.ts
        registry.spec.ts
```

## Testing Patterns

### 1. Unit Test Pattern (Arrange-Act-Assert)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyClass } from './my-class.js';

describe('MyClass', () => {
  let instance: MyClass;

  beforeEach(() => {
    // Arrange: Set up test fixtures
    instance = new MyClass();
  });

  it('should perform expected behavior', () => {
    // Act: Execute the code under test
    const result = instance.doSomething();

    // Assert: Verify the outcome
    expect(result).toBe(expectedValue);
  });
});
```

### 2. Mocking External Dependencies

```typescript
import { describe, it, expect, vi } from 'vitest';
import { MyService } from './my-service.js';

describe('MyService', () => {
  it('should handle external API calls', async () => {
    // Mock external dependency
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: 'test' })
    });
    global.fetch = mockFetch;

    const service = new MyService();
    const result = await service.fetchData();

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api'));
    expect(result).toEqual({ data: 'test' });
  });
});
```

### 3. Error Testing

```typescript
import { describe, it, expect } from 'vitest';
import { MyFunction } from './my-function.js';
import { ValidationError } from './errors.js';

describe('error handling', () => {
  it('should throw ValidationError for invalid input', () => {
    expect(() => {
      MyFunction(invalidInput);
    }).toThrow(ValidationError);
  });

  it('should include error details', () => {
    try {
      MyFunction(invalidInput);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain('invalid');
      expect(error.code).toBe('VALIDATION_ERROR');
    }
  });
});
```

## Package-Specific Testing

### @anygpt/router

**Priority**: HIGH - Core infrastructure

**Test Coverage Goals**: >80%

**Key Areas**:
1. **ConnectorRegistry**
   - Register/unregister connectors
   - Get connector by provider
   - Error when provider not found
   - List available providers

2. **GenAIRouter**
   - Route chat completion to correct provider
   - Handle provider errors
   - Validate requests
   - List models from providers
   - Timeout handling

3. **BaseConnector**
   - Request validation
   - Error handling
   - Provider ID management

**Example Test**:
```typescript
describe('ConnectorRegistry', () => {
  it('should register and retrieve connectors', () => {
    const registry = new ConnectorRegistry();
    const factory = new MockConnectorFactory();
    
    registry.register(factory);
    const connector = registry.get('mock');
    
    expect(connector).toBeDefined();
    expect(connector.getProviderId()).toBe('mock');
  });

  it('should throw ConnectorNotFoundError for unknown provider', () => {
    const registry = new ConnectorRegistry();
    
    expect(() => registry.get('unknown')).toThrow(ConnectorNotFoundError);
  });
});
```

### @anygpt/config

**Priority**: HIGH - Configuration management

**Test Coverage Goals**: >80%

**Key Areas**:
1. **Config Loading**
   - Load from TypeScript file (factory config)
   - Load from TypeScript file (standard config)
   - Load from JSON file
   - Search path priority (project → user → system)
   - Handle missing config gracefully

2. **Setup Functions**
   - `setupRouter()` with standard config
   - `setupRouterFromFactory()` with factory config
   - Connector registration
   - Provider resolution

3. **Factory Function**
   - `config()` returns correct structure
   - Type safety maintained

**Example Test**:
```typescript
describe('config loader', () => {
  it('should load factory config from TypeScript file', async () => {
    const config = await loadConfig({
      configPath: './test-fixtures/factory.config.ts'
    });
    
    expect(config.providers).toBeDefined();
    expect(config.defaults?.provider).toBe('test-provider');
  });

  it('should throw error for missing config', async () => {
    await expect(loadConfig({
      configPath: './nonexistent.ts'
    })).rejects.toThrow();
  });
});
```

### @anygpt/openai

**Priority**: MEDIUM - Connector implementation

**Test Coverage Goals**: >70%

**Key Areas**:
1. **Chat Completion**
   - Successful requests
   - Error handling
   - Retry logic
   - Timeout handling

2. **Response API**
   - Successful requests
   - Fallback to chat API
   - Error handling

3. **Model Listing**
   - Return correct model info
   - Handle API errors

**Testing Strategy**: Use mocked OpenAI SDK

```typescript
import { vi } from 'vitest';
import OpenAI from 'openai';

vi.mock('openai');

describe('OpenAIConnector', () => {
  it('should make chat completion request', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: 'test-id',
      choices: [{ message: { role: 'assistant', content: 'Hello' } }]
    });
    
    OpenAI.prototype.chat = {
      completions: { create: mockCreate }
    } as any;

    const connector = new OpenAIConnector({ apiKey: 'test' });
    const response = await connector.chatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hi' }]
    });

    expect(mockCreate).toHaveBeenCalled();
    expect(response.choices[0].message.content).toBe('Hello');
  });
});
```

### @anygpt/cli

**Priority**: HIGH - User-facing interface

**Test Coverage Goals**: >75%

**Key Areas**:
1. **Command Parsing**
   - Parse arguments correctly
   - Handle missing required args
   - Default values

2. **Command Execution**
   - Chat command
   - Config command
   - Conversation commands (start, list, message, fork)

3. **Error Handling**
   - User-friendly error messages
   - Exit codes
   - Help text

**Testing Strategy**: Mix of unit and E2E tests

```typescript
describe('chat command', () => {
  it('should execute chat command with message', async () => {
    const mockRouter = {
      chatCompletion: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Response' } }]
      })
    };

    await chatCommand('Hello', { router: mockRouter });

    expect(mockRouter.chatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Hello' }]
      })
    );
  });
});
```

### @anygpt/mcp

**Priority**: MEDIUM - MCP protocol implementation

**Test Coverage Goals**: >70%

**Key Areas**:
1. **Protocol Compliance**
   - Tool listing
   - Tool execution
   - Error responses

2. **Tool Handlers**
   - chat_completion tool
   - list_models tool
   - Error handling

**Testing Strategy**: Use MCP SDK test utilities

### @anygpt/mock

**Priority**: LOW - Test utility

**Test Coverage Goals**: >90% (simple implementation)

**Status**: ✅ **Tests created** (`packages/connectors/mock/src/index.spec.ts`)

Comprehensive test suite covering:
- Initialization
- Chat completion
- Model listing
- Request validation
- Edge cases (long messages, special characters, unicode)

## Running Tests

### Run all tests
```bash
npx nx run-many -t test
```

### Run tests for specific package
```bash
npx nx test router
npx nx test config
npx nx test cli
```

### Run tests with coverage
```bash
npx nx test router --coverage
```

### Watch mode (during development)
```bash
npx nx test router --watch
```

## Coverage Goals

| Package | Priority | Target Coverage | Status |
|---------|----------|----------------|--------|
| @anygpt/types | LOW | N/A (types only) | ✅ |
| @anygpt/router | HIGH | >80% | 🔄 In Progress |
| @anygpt/config | HIGH | >80% | ⏳ Pending |
| @anygpt/openai | MEDIUM | >70% | ⏳ Pending |
| @anygpt/mock | LOW | >90% | ✅ Complete |
| @anygpt/cli | HIGH | >75% | ⏳ Pending |
| @anygpt/mcp | MEDIUM | >70% | ⏳ Pending |
| nx-tsdown | LOW | >60% | ✅ Basic tests exist |

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Don't rely on test execution order

### 2. Clear Test Names
```typescript
// ✅ Good
it('should throw ValidationError when messages array is empty', () => {});

// ❌ Bad
it('test validation', () => {});
```

### 3. Test One Thing
```typescript
// ✅ Good - tests one behavior
it('should return 404 when provider not found', () => {});

// ❌ Bad - tests multiple things
it('should handle errors', () => {
  // tests 404, 500, timeout, etc.
});
```

### 4. Use Descriptive Assertions
```typescript
// ✅ Good
expect(response.choices).toHaveLength(1);
expect(response.choices[0].message.role).toBe('assistant');

// ❌ Bad
expect(response).toBeTruthy();
```

### 5. Test Error Paths
- Don't just test happy paths
- Test error conditions
- Test edge cases
- Test boundary conditions

### 6. Keep Tests Fast
- Unit tests should run in <100ms
- Mock external dependencies
- Use in-memory databases for integration tests
- Parallelize test execution

## Continuous Integration

Tests run automatically on:
- Every commit (via GitHub Actions)
- Pull requests
- Before merging to main

### CI Configuration
```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: npx nx run-many -t test --parallel=3

- name: Check coverage
  run: npx nx run-many -t test --coverage --codeCoverage
```

## Debugging Tests

### Run single test file
```bash
npx vitest packages/router/src/lib/router.spec.ts
```

### Run single test
```bash
npx vitest -t "should register connector"
```

### Debug with VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Current Test",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run", "${file}"],
  "console": "integratedTerminal"
}
```

## Next Steps

1. ✅ **Custom Error Classes**: Added to `packages/router/src/errors.ts`
2. ✅ **Mock Connector Tests**: Comprehensive test suite created
3. 🔄 **Router Tests**: In progress - need vitest configuration
4. ⏳ **Config Tests**: Pending
5. ⏳ **CLI Tests**: Pending
6. ⏳ **OpenAI Connector Tests**: Pending
7. ⏳ **MCP Tests**: Pending

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [NX Testing](https://nx.dev/recipes/nx-console/console-run-test)
