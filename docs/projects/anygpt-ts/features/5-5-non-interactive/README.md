# Non-Interactive Mode (CI/CD)

|                       |                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------- |
| **Status**            | 🔒 Blocked by 5-4                                                                           |
| **Progress**          | 0/7 tasks (0%)                                                                              |
| **Spec**              | [Agentic Chat](../../../../products/anygpt/specs/anygpt/agentic-chat.md)                   |
| **Use Case**          | [Agentic CI/CD Automation](../../../../products/anygpt/cases/agentic-cicd-automation.md)   |
| **Architecture**      | [System Design](../../architecture.md)                                                      |
| **Roadmap**           | [Feature List](../../roadmap.md#5-5-non-interactive)                                        |

## Overview

Single-shot execution mode for CI/CD pipelines. Executes task autonomously, outputs JSON, and exits with proper exit codes.

**Key Capability**: Headless automation for CI/CD with JSON output and exit codes.

## Status

**Last Updated**: 2025-10-20  
**Current Phase**: Blocked by 5-4 🔒

**Dependencies**:
- 🔒 Feature 5-4 (agentic-orchestrator) - Must complete first

## Design Summary

### Core Components

1. **Single-Shot Executor**
   - No REPL, single task execution
   - Timeout handling
   - Exit code management (0 = success, 1 = failure)

2. **JSON Output**
   - Structured output format
   - Parseable by scripts
   - Error details included

3. **CI/CD Integration**
   - Environment variable support
   - Logging to stderr
   - Results to stdout

### Interface

```typescript
interface NonInteractiveMode {
  execute(task: string, options: NonInteractiveOptions): Promise<NonInteractiveResult>;
}

interface NonInteractiveOptions {
  timeout?: number;
  maxIterations?: number;
  outputFormat: 'json' | 'text';
  verbose?: boolean;
}

interface NonInteractiveResult {
  success: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata: {
    duration: number;
    tokensUsed: number;
    toolsUsed: string[];
  };
}
```

## Test Summary

### Test Categories

- **Unit Tests**: Exit codes, JSON output, timeout handling
- **Integration Tests**: Full CI/CD workflows
- **E2E Tests**: Real CI/CD scenarios

**Total Tests**: 15 planned  
**Coverage Target**: 85%+

## Implementation Plan

### Phase 1: Single-Shot Executor

- [ ] Implement non-interactive mode
- [ ] Timeout handling
- [ ] Exit code logic
- [ ] Unit tests

**Deliverable**: Single-shot execution works

### Phase 2: JSON Output

- [ ] Implement JSON formatter
- [ ] Error serialization
- [ ] Metadata output
- [ ] Unit tests

**Deliverable**: JSON output works

### Phase 3: CI/CD Integration & Testing

- [ ] Environment variable support
- [ ] Logging strategy (stderr)
- [ ] Integration tests
- [ ] E2E tests with real CI/CD

**Deliverable**: Production-ready CI/CD mode

## Dependencies

- **Internal**:
  - Feature 5-4 (agentic-orchestrator)
  - `@anygpt/config` (configuration)
- **External**: None

## Success Metrics

**Functional**:
- ✅ Single-shot execution works
- ✅ JSON output is valid
- ✅ Exit codes correct
- ✅ Timeout handling works

**Performance**:
- Typical tasks: <30s
- Timeout: 5 min default

**Reliability**:
- Exit code accuracy: 100%
- JSON validity: 100%

## Scope

### In Scope

- ✅ Single-shot execution
- ✅ JSON output
- ✅ Exit codes
- ✅ Timeout handling
- ✅ Environment variables

### Out of Scope

- ❌ Interactive mode (Feature 5-1)
- ❌ Streaming output (not needed for CI/CD)
- ❌ Advanced formatting (Feature 5-6)

## Notes

- Focus on CI/CD use case
- JSON output must be parseable
- Exit codes are critical
- No user interaction

## Related Features

- **[5-1-chat-loop](../5-1-chat-loop/README.md)**: Interactive mode
- **[5-4-agentic-orchestrator](../5-4-agentic-orchestrator/README.md)**: Execution engine
- **[5-6-output-formatting](../5-6-output-formatting/README.md)**: Human-readable output
