# Chat Loop (Foundation)

|                       |                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------- |
| **Status**            | 📋 Ready to Implement                                                                       |
| **Progress**          | 0/8 tasks (0%)                                                                              |
| **Spec**              | [Agentic Chat](../../../../products/anygpt/specs/anygpt/agentic-chat.md)                   |
| **Use Case**          | [Agentic CI/CD Automation](../../../../products/anygpt/cases/agentic-cicd-automation.md)   |
| **Architecture**      | [System Design](../../architecture.md)                                                      |
| **Roadmap**           | [Feature List](../../roadmap.md#5-1-chat-loop)                                              |

## Overview

Basic chat loop foundation that provides interactive REPL and message history management. This is the foundation for all agentic capabilities.

**Key Capability**: Interactive command-line interface for chat interactions with message history.

## Status

**Last Updated**: 2025-10-20  
**Current Phase**: Ready to Implement 📋

## Design Summary

### Core Components

1. **REPL Interface**
   - Read-Eval-Print Loop using `readline`
   - Command parsing (`/exit`, `/help`, `/clear`, `/history`)
   - Input validation
   - Graceful shutdown (Ctrl+C handling)

2. **Message History**
   - In-memory message storage
   - History navigation (up/down arrows)
   - History commands (`/history`, `/clear`)
   - Max history limit (configurable)

3. **Output Handler**
   - Basic text output
   - Error display
   - Status messages

### Interface

```typescript
interface ChatLoop {
  start(options: ChatOptions): Promise<void>;
  stop(): Promise<void>;
  addMessage(message: Message): void;
  getHistory(): Message[];
  clearHistory(): void;
}

interface ChatOptions {
  prompt?: string;
  maxHistory?: number;
  onMessage?: (message: string) => Promise<string>;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}
```

## Test Summary

### Test Categories

- **Unit Tests**: REPL commands, history management, input parsing
- **Integration Tests**: Full chat loop, command execution
- **E2E Tests**: User interaction scenarios

**Total Tests**: 15 planned  
**Coverage Target**: 80%+

## Implementation Plan

### Phase 1: Basic REPL ✅ Ready

- [ ] Create `ChatLoop` class
- [ ] Implement readline interface
- [ ] Handle user input
- [ ] Display output
- [ ] Unit tests for REPL

**Deliverable**: Basic REPL that echoes input

### Phase 2: Message History

- [ ] Implement message storage
- [ ] Add history navigation (up/down arrows)
- [ ] Implement `/history` command
- [ ] Implement `/clear` command
- [ ] Unit tests for history

**Deliverable**: REPL with working history

### Phase 3: Commands & Polish

- [ ] Implement `/exit` command
- [ ] Implement `/help` command
- [ ] Graceful shutdown (SIGINT handling)
- [ ] Error handling
- [ ] Integration tests

**Deliverable**: Production-ready chat loop

## Dependencies

- **Internal**: None (foundation feature)
- **External**:
  - `readline` (Node.js built-in)
  - `chalk` (terminal colors)

## Success Metrics

**Functional**:
- ✅ REPL starts and accepts input
- ✅ History navigation works
- ✅ Commands execute correctly
- ✅ Graceful shutdown

**Performance**:
- Input latency: <50ms
- History size: 100 messages default

**Developer Experience**:
- Clear error messages
- Intuitive commands
- Responsive interface

## Scope

### In Scope

- ✅ Interactive REPL
- ✅ Message history (in-memory)
- ✅ Basic commands (`/exit`, `/help`, `/clear`, `/history`)
- ✅ Graceful shutdown

### Out of Scope

- ❌ AI integration (Feature 5-2)
- ❌ Tool discovery (Feature 5-3)
- ❌ Non-interactive mode (Feature 5-5)
- ❌ Advanced formatting (Feature 5-6)

## Notes

- Keep it simple - just REPL + history
- No AI integration yet
- Foundation for all other features
- Focus on solid UX basics

## Related Features

- **[5-2-ai-provider](../5-2-ai-provider/README.md)**: Will use this chat loop
- **[5-5-non-interactive](../5-5-non-interactive/README.md)**: Will extend this for single-shot mode
