# End-to-End (E2E) Tests

Comprehensive end-to-end tests for the AnyGPT CLI, validating complete user workflows from configuration to AI interactions.

## Overview

The E2E test suite validates the CLI in a realistic environment using:
- **Real CLI binary** - Tests the actual built CLI package
- **Mock AI connector** - Deterministic responses for reliable testing
- **Isolated test environment** - Clean state for each test run
- **Full workflow coverage** - From config loading to conversation management

## Test Structure

```
e2e/
├── cli/                          # CLI E2E tests
│   ├── tests/
│   │   ├── chat.e2e.spec.ts     # Stateless chat command tests
│   │   ├── conversation.e2e.spec.ts  # Stateful conversation tests
│   │   └── config.e2e.spec.ts   # Configuration management tests
│   ├── helpers/
│   │   └── cli-runner.ts        # CLI execution helper
│   ├── fixtures/
│   │   └── invalid-config.ts    # Test fixtures
│   ├── anygpt.config.ts         # Test configuration with mock connector
│   ├── vitest.config.ts         # Vitest configuration
│   └── project.json             # NX project configuration
└── README.md                     # This file
```

## Running Tests

### Run All E2E Tests
```bash
# Using NX
npx nx e2e e2e-cli

# Using Vitest directly
cd e2e/cli
npx vitest run
```

### Run Specific Test File
```bash
cd e2e/cli
npx vitest run tests/chat.e2e.spec.ts
npx vitest run tests/conversation.e2e.spec.ts
npx vitest run tests/config.e2e.spec.ts
```

### Watch Mode (for development)
```bash
cd e2e/cli
npx vitest watch
```

### Run with Coverage
```bash
npx nx e2e e2e-cli --coverage
```

## Test Categories

### 1. Chat Command Tests (`chat.e2e.spec.ts`)

Tests stateless, one-off AI interactions.

**Coverage:**
- ✅ Basic chat functionality with mock responses
- ✅ Token usage tracking and display
- ✅ Provider and model selection (defaults and overrides)
- ✅ Error handling (missing config, invalid provider)
- ✅ Stateless behavior verification (no context retention)

**Example Test:**
```typescript
it('should send a chat message and get response', async () => {
  const result = await runCLI(['chat', 'hello world'], { 
    configPath: join(E2E_DIR, "anygpt.config.ts"), 
    cwd: E2E_DIR 
  });

  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('mock response');
});
```

### 2. Conversation Command Tests (`conversation.e2e.spec.ts`)

Tests stateful, multi-turn conversations with context management.

**Coverage:**
- ✅ Conversation lifecycle (start, message, show, delete)
- ✅ Auto-start feature (automatic conversation creation)
- ✅ Context persistence across messages
- ✅ Conversation listing and filtering
- ✅ Custom conversation names
- ✅ Context metrics and statistics
- ✅ Error handling (invalid IDs, missing config)

**Example Test:**
```typescript
it('should maintain conversation context across messages', async () => {
  // First message auto-starts conversation
  const firstResult = await runCLI(['conversation', 'message', 'first message'], { 
    configPath, cwd: E2E_DIR 
  });
  expect(firstResult.exitCode).toBe(0);

  // Second message uses same conversation
  const secondResult = await runCLI(['conversation', 'message', 'second message'], { 
    configPath, cwd: E2E_DIR 
  });
  expect(secondResult.exitCode).toBe(0);
  // Both messages are in the same conversation context
});
```

### 3. Config Command Tests (`config.e2e.spec.ts`)

Tests configuration management and validation.

**Coverage:**
- ✅ Config display (human-readable and JSON formats)
- ✅ Config source path tracking
- ✅ Config validation (valid and invalid configs)
- ✅ Auto-discovery from current working directory
- ✅ Error handling (missing config files)

**Example Test:**
```typescript
it('should display current configuration', async () => {
  const result = await runCLI(['config', 'show'], { 
    configPath: join(E2E_DIR, "anygpt.config.ts"), 
    cwd: E2E_DIR 
  });

  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('Configuration');
  expect(result.stdout).toContain('mock');
});
```

## Test Infrastructure

### Mock Connector

The E2E tests use a mock AI connector that provides deterministic responses:

```typescript
// e2e/cli/anygpt.config.ts
import { config } from '@anygpt/config';
import { MockConnectorFactory } from '@anygpt/mock';

export default config({
  defaults: {
    provider: 'mock',
    model: 'mock-gpt-4'
  },
  providers: {
    mock: {
      name: 'Mock Provider',
      connector: new MockConnectorFactory()
    }
  }
});
```

**Mock Connector Features:**
- Deterministic responses based on input patterns
- Token usage simulation
- Error simulation for testing error handling
- No external API calls required

### CLI Runner Helper

The `cli-runner.ts` helper executes the CLI in a child process:

```typescript
interface RunCLIOptions {
  configPath?: string;
  cwd?: string;
  env?: Record<string, string>;
}

async function runCLI(
  args: string[], 
  options?: RunCLIOptions
): Promise<{ exitCode: number; stdout: string; stderr: string }>;
```

**Features:**
- Captures stdout, stderr, and exit codes
- Supports custom working directory
- Environment variable injection
- Timeout handling

### Test Isolation

Each test maintains isolation through:

1. **Clean State**: `beforeEach` hook clears current conversation state
2. **Unique Conversations**: Each test creates its own conversations
3. **Independent Config**: Tests use dedicated test configuration
4. **No Side Effects**: Tests don't interfere with each other

```typescript
beforeEach(async () => {
  const currentConvFile = join(homedir(), '.anygpt', 'current-conversation');
  await rm(currentConvFile, { force: true }).catch(() => {
    // Ignore if file doesn't exist
  });
});
```

## Test Patterns

### Pattern 1: Command Execution and Validation
```typescript
it('should execute command successfully', async () => {
  const result = await runCLI(['command', 'args'], { configPath, cwd });
  
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('expected output');
});
```

### Pattern 2: Error Handling
```typescript
it('should handle errors gracefully', async () => {
  const result = await runCLI(['command', 'invalid'], { configPath, cwd });
  
  expect(result.exitCode).not.toBe(0);
  expect(result.stderr).toContain('error message');
});
```

### Pattern 3: Multi-Step Workflows
```typescript
it('should complete multi-step workflow', async () => {
  // Step 1: Setup
  const setupResult = await runCLI(['setup', 'command'], { configPath, cwd });
  expect(setupResult.exitCode).toBe(0);
  
  // Step 2: Execute
  const execResult = await runCLI(['exec', 'command'], { configPath, cwd });
  expect(execResult.exitCode).toBe(0);
  
  // Step 3: Verify
  const verifyResult = await runCLI(['verify', 'command'], { configPath, cwd });
  expect(verifyResult.stdout).toContain('expected state');
});
```

### Pattern 4: State Persistence
```typescript
it('should persist state across commands', async () => {
  // Create state
  await runCLI(['create', 'item'], { configPath, cwd });
  
  // Verify state persisted
  const result = await runCLI(['list', 'items'], { configPath, cwd });
  expect(result.stdout).toContain('item');
});
```

## Adding New Tests

### 1. Create Test File
```typescript
// e2e/cli/tests/new-feature.e2e.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { runCLI } from '../helpers/cli-runner.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const E2E_DIR = join(__dirname, '..');

describe('new feature E2E', () => {
  beforeEach(async () => {
    // Setup clean state
  });

  it('should test new feature', async () => {
    const result = await runCLI(['new-command'], { 
      configPath: join(E2E_DIR, "anygpt.config.ts"), 
      cwd: E2E_DIR 
    });
    
    expect(result.exitCode).toBe(0);
  });
});
```

### 2. Build CLI Before Testing
```bash
# Always build CLI before running E2E tests
npx nx build cli
npx nx e2e e2e-cli
```

### 3. Test Naming Conventions
- Use descriptive test names: `should [action] when [condition]`
- Group related tests in `describe` blocks
- Use `beforeEach` for setup, `afterEach` for cleanup

### 4. Assertion Best Practices
- Test exit codes first: `expect(result.exitCode).toBe(0)`
- Verify output content: `expect(result.stdout).toContain('expected')`
- Check error messages: `expect(result.stderr).toMatch(/pattern/)`
- Use flexible matchers for dynamic content (timestamps, IDs)

## Debugging Tests

### View Test Output
```bash
# Run with verbose output
cd e2e/cli
npx vitest run --reporter=verbose

# Run single test with full output
npx vitest run -t "test name pattern"
```

### Debug Failed Tests
```typescript
it('should debug test', async () => {
  const result = await runCLI(['command'], { configPath, cwd });
  
  // Log full output for debugging
  console.log('Exit code:', result.exitCode);
  console.log('STDOUT:', result.stdout);
  console.log('STDERR:', result.stderr);
  
  expect(result.exitCode).toBe(0);
});
```

### Common Issues

**Issue: Tests fail with "Cannot find module"**
- **Solution**: Build the CLI first: `npx nx build cli`

**Issue: Tests interfere with each other**
- **Solution**: Ensure `beforeEach` cleans up state properly

**Issue: Flaky tests due to timing**
- **Solution**: Use deterministic mock responses, avoid time-based assertions

**Issue: Config not found**
- **Solution**: Verify `configPath` points to correct test config file

## CI/CD Integration

E2E tests run automatically in CI:

```yaml
# .github/workflows/ci.yml
- name: Build CLI
  run: npx nx build cli

- name: Run E2E Tests
  run: npx nx e2e e2e-cli
```

**CI Considerations:**
- Tests run in headless environment
- No interactive prompts allowed
- Deterministic mock responses ensure reliability
- Fast execution (< 15 seconds for full suite)

## Test Coverage

Current test coverage:

| Command | Tests | Coverage |
|---------|-------|----------|
| `chat` | 9 tests | ✅ Complete |
| `conversation start` | 2 tests | ✅ Complete |
| `conversation message` | 3 tests | ✅ Complete |
| `conversation list` | 2 tests | ✅ Complete |
| `conversation show` | 2 tests | ✅ Complete |
| `conversation delete` | 2 tests | ✅ Complete |
| `conversation context` | 1 test | ✅ Complete |
| `config show` | 3 tests | ✅ Complete |
| `config validation` | 2 tests | ✅ Complete |
| Error handling | 6 tests | ✅ Complete |

**Total: 30 tests, 0 skipped**

## Best Practices

### ✅ Do
- Build CLI before running tests
- Use mock connector for deterministic responses
- Clean state in `beforeEach` hooks
- Test both success and error paths
- Use flexible assertions for dynamic content
- Group related tests in `describe` blocks

### ❌ Don't
- Don't use real AI providers in E2E tests
- Don't hardcode timestamps or IDs in assertions
- Don't skip cleanup in `beforeEach`
- Don't make external API calls
- Don't use interactive prompts
- Don't rely on test execution order

## Future Enhancements

Potential areas for expansion:

- [ ] Advanced conversation features (fork, condense, summarize)
- [ ] Streaming response tests
- [ ] Performance benchmarks
- [ ] Multi-provider configuration tests
- [ ] Environment variable configuration tests
- [ ] Export/import configuration tests
- [ ] Conversation search and filtering tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [CLI Testing Guide](../docs/guidelines/e2e-testing.md)
- [Mock Connector Documentation](../packages/connectors/mock/README.md)
- [CLI Documentation](../packages/cli/docs/README.md)
