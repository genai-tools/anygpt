# E2E Testing Guide

Comprehensive guide for end-to-end testing of CLI commands using fixture-based mock responses.

## Overview

E2E tests validate the complete CLI workflow:
- **Real CLI execution**: Actual command parsing and execution
- **Mock backend**: Deterministic responses via fixtures
- **Full integration**: Tests CLI → Router → Connector → Response flow

## Architecture

```
E2E Test
  ↓
CLI Command (real)
  ↓
Router (real)
  ↓
MockConnector + Fixtures (simulated API)
  ↓
Deterministic Response
```

## Directory Structure

```
e2e/
  cli/
    fixtures/
      chat/
        simple-greeting.fixture.ts
        error-handling.fixture.ts
        multi-model.fixture.ts
      conversation/
        multi-turn.fixture.ts
        context-management.fixture.ts
        fork-scenario.fixture.ts
    tests/
      chat.e2e.spec.ts
      conversation.e2e.spec.ts
      config.e2e.spec.ts
    helpers/
      cli-runner.ts          # Execute CLI commands
      fixture-loader.ts      # Load and manage fixtures
      test-config.ts         # Generate test configs
      output-capture.ts      # Capture stdout/stderr
    vitest.config.ts
```

## Fixture System

### Fixture Types

Fixtures define request patterns and their responses:

```typescript
import { exactMatch, patternMatch, containsMatch, type Fixture } from '@anygpt/mock/fixtures';

// 1. Exact match - content must match exactly
export const simpleGreeting = exactMatch(
  'hello',
  'Hello! How can I help you today?',
  'simple-greeting'
);

// 2. Pattern match - regex matching
export const questionPattern = patternMatch(
  /what is \w+\?/i,
  (req) => {
    const match = req.messages[0]?.content.match(/what is (\w+)\?/i);
    return `${match?.[1]} is a concept I can explain...`;
  },
  'question-pattern'
);

// 3. Contains match - substring matching
export const helpRequest = containsMatch(
  'help',
  'I\'m here to help! What do you need assistance with?',
  'help-request'
);

// 4. Custom function match - full control
export const complexMatch: Fixture = {
  name: 'complex-scenario',
  matcher: {
    type: 'function',
    match: (req) => {
      return req.messages.length > 2 && 
             req.messages.some(m => m.content.includes('error'));
    }
  },
  response: 'I see you encountered an error. Let me help...',
  model: 'gpt-4' // Only match for specific model
};
```

### Fixture Response Types

```typescript
// Simple string response
response: 'Hello world'

// Response with custom usage
response: {
  content: 'Hello world',
  usage: {
    prompt_tokens: 10,
    completion_tokens: 5,
    total_tokens: 15
  }
}

// Dynamic response (function)
response: (request) => {
  const userName = extractName(request.messages[0]?.content);
  return `Hello ${userName}!`;
}

// Delayed response (for timeout testing)
{
  name: 'slow-response',
  matcher: { type: 'exact', content: 'slow' },
  response: 'This took a while',
  delay: 5000 // 5 second delay
}
```

### Multi-Turn Conversations

For conversation tests with multiple turns:

```typescript
export const multiTurnFixtures: Fixture[] = [
  exactMatch('What is TypeScript?', 'TypeScript is a typed superset of JavaScript.'),
  exactMatch('Can you give an example?', 'Sure! Here\'s a simple example: `const x: number = 5;`'),
  exactMatch('Thanks!', 'You\'re welcome! Happy coding!')
];
```

## Writing E2E Tests

### Basic Chat Command Test

```typescript
// e2e/cli/tests/chat.e2e.spec.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { runCLI, createTestConfig } from '../helpers';
import { simpleGreeting, helpRequest } from '../fixtures/chat/basic.fixture';

describe('chat command E2E', () => {
  let configPath: string;

  beforeAll(async () => {
    // Create test config with fixtures
    configPath = await createTestConfig([simpleGreeting, helpRequest]);
  });

  it('should respond to simple greeting', async () => {
    const result = await runCLI(['chat', 'hello'], { configPath });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Hello! How can I help you today?');
    expect(result.stdout).toContain('Usage:'); // Token usage info
  });

  it('should handle help request', async () => {
    const result = await runCLI(['chat', 'I need help'], { configPath });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('I\'m here to help!');
  });

  it('should handle unknown input with default response', async () => {
    const result = await runCLI(['chat', 'random unknown input'], { configPath });

    expect(result.exitCode).toBe(0);
    // Falls back to default mock response
    expect(result.stdout).toContain('Mock connector');
  });
});
```

### Conversation Command Test

```typescript
// e2e/cli/tests/conversation.e2e.spec.ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { runCLI, createTestConfig, cleanupConversations } from '../helpers';
import { multiTurnFixtures } from '../fixtures/conversation/multi-turn.fixture';

describe('conversation command E2E', () => {
  let configPath: string;

  beforeAll(async () => {
    configPath = await createTestConfig(multiTurnFixtures);
  });

  afterEach(async () => {
    await cleanupConversations();
  });

  it('should handle multi-turn conversation', async () => {
    // Start conversation
    const start = await runCLI(['conversation', 'start', '--name', 'test'], { configPath });
    expect(start.exitCode).toBe(0);

    // First message
    const msg1 = await runCLI(['conversation', 'message', 'What is TypeScript?'], { configPath });
    expect(msg1.stdout).toContain('typed superset of JavaScript');

    // Second message
    const msg2 = await runCLI(['conversation', 'message', 'Can you give an example?'], { configPath });
    expect(msg2.stdout).toContain('const x: number = 5');

    // Third message
    const msg3 = await runCLI(['conversation', 'message', 'Thanks!'], { configPath });
    expect(msg3.stdout).toContain('You\'re welcome');
  });

  it('should auto-start conversation if none exists', async () => {
    const result = await runCLI(['conversation', 'message', 'What is TypeScript?'], { configPath });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Starting a new one');
    expect(result.stdout).toContain('typed superset of JavaScript');
  });
});
```

### Error Handling Test

```typescript
// e2e/cli/tests/error-handling.e2e.spec.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { runCLI, createTestConfig } from '../helpers';
import { errorFixtures } from '../fixtures/errors.fixture';

describe('error handling E2E', () => {
  let configPath: string;

  beforeAll(async () => {
    configPath = await createTestConfig(errorFixtures);
  });

  it('should handle missing config gracefully', async () => {
    const result = await runCLI(['chat', 'hello'], { configPath: '/nonexistent.ts' });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('Failed to load config');
  });

  it('should handle provider not configured', async () => {
    const result = await runCLI(['chat', 'hello', '--provider', 'unknown'], { configPath });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('not configured');
  });
});
```

## Helper Functions

### CLI Runner

```typescript
// e2e/cli/helpers/cli-runner.ts
import { execa } from 'execa';

export interface CLIResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface CLIOptions {
  configPath?: string;
  cwd?: string;
  env?: Record<string, string>;
}

export async function runCLI(args: string[], options: CLIOptions = {}): Promise<CLIResult> {
  const { configPath, cwd = process.cwd(), env = {} } = options;

  const fullArgs = configPath ? ['--config', configPath, ...args] : args;

  try {
    const result = await execa('npx', ['anygpt', ...fullArgs], {
      cwd,
      env: { ...process.env, ...env },
      reject: false // Don't throw on non-zero exit
    });

    return {
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    throw new Error(`Failed to run CLI: ${error}`);
  }
}
```

### Test Config Generator

```typescript
// e2e/cli/helpers/test-config.ts
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { Fixture } from '@anygpt/mock/fixtures';

export async function createTestConfig(fixtures: Fixture[]): Promise<string> {
  const testDir = join(tmpdir(), `anygpt-e2e-${Date.now()}`);
  await mkdir(testDir, { recursive: true });

  const configPath = join(testDir, 'test.config.ts');
  const configContent = `
import { config } from '@anygpt/config';
import { MockConnector } from '@anygpt/mock';

const fixtures = ${JSON.stringify(fixtures, null, 2)};

export default config({
  defaults: {
    provider: 'mock',
    model: 'mock-gpt-4'
  },
  providers: {
    mock: {
      name: 'Mock Provider',
      connector: new MockConnector({ fixtures })
    }
  }
});
`;

  await writeFile(configPath, configContent, 'utf-8');
  return configPath;
}
```

### Cleanup Helper

```typescript
// e2e/cli/helpers/cleanup.ts
import { rm } from 'fs/promises';
import { join } from 'os';

export async function cleanupConversations(): Promise<void> {
  const conversationDir = join(os.homedir(), '.anygpt', 'conversations');
  try {
    await rm(conversationDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore if doesn't exist
  }
}
```

## Running E2E Tests

```bash
# Run all E2E tests
npx vitest run e2e/

# Run specific test file
npx vitest run e2e/cli/tests/chat.e2e.spec.ts

# Watch mode for development
npx vitest watch e2e/

# With coverage
npx vitest run e2e/ --coverage
```

## Best Practices

### 1. Fixture Organization
- **One file per scenario**: Keep fixtures focused
- **Descriptive names**: `simple-greeting.fixture.ts`, not `test1.fixture.ts`
- **Reusable fixtures**: Export common fixtures for reuse

### 2. Test Isolation
- **Clean state**: Use `beforeEach`/`afterEach` to reset state
- **Unique configs**: Each test gets its own config file
- **No shared data**: Tests should not depend on each other

### 3. Assertions
- **Test behavior, not implementation**: Assert on user-visible output
- **Multiple assertions**: Check exit code, stdout, stderr
- **Error messages**: Verify helpful error messages

### 4. Performance
- **Fast tests**: E2E tests should run in <1s each
- **Parallel execution**: Tests should be parallelizable
- **Mock delays**: Only add delays when testing timeouts

### 5. Maintenance
- **Update fixtures with API changes**: Keep fixtures realistic
- **Document complex scenarios**: Add comments for non-obvious tests
- **Regular review**: Ensure fixtures match actual API behavior

## Fixture Examples

### Simple Scenarios

```typescript
// fixtures/chat/greetings.fixture.ts
export const greetings = [
  exactMatch('hello', 'Hello! How can I help you today?'),
  exactMatch('hi', 'Hi there! What can I do for you?'),
  exactMatch('hey', 'Hey! How\'s it going?'),
];
```

### Error Scenarios

```typescript
// fixtures/errors.fixture.ts
export const errorScenarios: Fixture[] = [
  {
    name: 'rate-limit',
    matcher: { type: 'contains', substring: 'many requests' },
    response: {
      content: 'Error: Rate limit exceeded. Please try again later.',
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    }
  }
];
```

### Model-Specific Responses

```typescript
// fixtures/models.fixture.ts
export const modelSpecific: Fixture[] = [
  {
    name: 'gpt-4-response',
    matcher: { type: 'exact', content: 'explain quantum computing' },
    response: 'Quantum computing leverages quantum mechanics...',
    model: 'gpt-4'
  },
  {
    name: 'gpt-3.5-response',
    matcher: { type: 'exact', content: 'explain quantum computing' },
    response: 'Quantum computing is a type of computing...',
    model: 'gpt-3.5-turbo'
  }
];
```

## Integration with CI

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - run: npm install
      - run: npx nx build cli
      - run: npx vitest run e2e/ --reporter=verbose
```

## Next Steps

1. **Implement MockConnector fixture integration** (see `packages/connectors/mock/src/fixtures.ts`)
2. **Create E2E test infrastructure** (helpers, config generator)
3. **Write initial test suite** (chat, conversation, config commands)
4. **Add to CI pipeline** (automated E2E testing)
5. **Expand coverage** (error cases, edge cases, all commands)

This E2E testing approach provides:
- ✅ **Deterministic tests**: No flaky API calls
- ✅ **Fast execution**: Mock responses are instant
- ✅ **Easy maintenance**: Just update fixtures
- ✅ **Realistic scenarios**: Fixtures simulate real API behavior
- ✅ **Full coverage**: Tests complete CLI workflows
