# Agentic Chat with Tool Discovery

|                       |                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------- |
| **Status**            | 📋 Design Phase                                                                             |
| **Progress**          | 0/35 tasks (0%)                                                                             |
| **Spec**              | TBD                                                                                         |
| **Use Case**          | [Agentic CI/CD Automation](../../../../products/anygpt/cases/agentic-cicd-automation.md)   |
| **Architecture**      | [System Design](../../architecture.md)                                                      |
| **Roadmap**           | [Feature List](../../roadmap.md#5-1-agentic-chat)                                           |
| **Technical Design**  | [design.md](./design.md)                                                                    |

## Overview

Self-hosted agentic assistant that runs as a CLI command, uses MCP tool discovery, and operates autonomously in CI/CD pipelines. Unlike IDE-based assistants (Claude Desktop, Windsurf), this is designed for automation, scripting, and headless execution.

**Key Capability**: Autonomous multi-step task execution with on-demand tool discovery, reducing token usage by 99% while enabling complex workflow automation.

## Status

**Last Updated**: 2025-10-20  
**Current Phase**: Design Phase 📋

### Recent Updates

- 2025-10-20: Feature created, design phase started
- 2025-10-20: Use case documented with CI/CD focus

## Design Summary

### Core Components

1. **Chat Loop**
   - Interactive mode (REPL for local development)
   - Non-interactive mode (single-shot for CI/CD)
   - Message history management
   - Streaming response support
   - Graceful exit handling

2. **Agentic Orchestrator**
   - Multi-step task planning
   - Tool discovery integration (via `@anygpt/mcp-discovery`)
   - Autonomous tool execution
   - Error recovery and retry logic
   - Max iteration limits (safety)

3. **MCP Discovery Client**
   - Connect to `@anygpt/mcp-discovery` as MCP client
   - Use meta-tools: `search_tools`, `list_tools`, `get_tool_details`, `execute_tool`
   - Handle tool responses
   - Cache tool metadata locally

4. **AI Provider Integration**
   - Use existing `@anygpt/config` for model selection
   - Support OpenAI, Anthropic, local models
   - Function calling / tool use protocol
   - Streaming support

5. **Output Formatter**
   - Human-readable output (interactive mode)
   - JSON output (scripting mode)
   - Progress indicators
   - Error messages

### Key Workflows

**Interactive Mode** (local development):
```bash
anygpt chat --discover

> Read README.md and create GitHub issue for any TODOs
AI: Searching for file reading tools...
AI: Found filesystem_read, executing...
AI: Found 3 TODOs in README.md
AI: Searching for GitHub issue creation tools...
AI: Found github_create_issue, executing...
AI: Created issue #123: "TODO: Add documentation"
```

**Non-Interactive Mode** (CI/CD):
```bash
anygpt chat --discover --non-interactive \
  "Create GitHub release for version in package.json, \
   update Jira tickets, notify Slack"

# Exits with code 0 on success, 1 on failure
# Outputs JSON with results
```

**JSON Output Mode** (scripting):
```bash
anygpt chat --discover --output json \
  "List all failed tests" | jq '.results[]'
```

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      anygpt chat                            │
│                                                             │
│  ┌──────────────┐      ┌──────────────────────────────┐   │
│  │  Chat Loop   │─────▶│  Agentic Orchestrator        │   │
│  │              │      │  - Task planning              │   │
│  │  - REPL      │      │  - Tool discovery             │   │
│  │  - History   │      │  - Execution                  │   │
│  │  - Streaming │      │  - Error recovery             │   │
│  └──────────────┘      └──────────────────────────────┘   │
│         │                          │                        │
│         │                          ▼                        │
│         │              ┌──────────────────────────────┐    │
│         │              │  MCP Discovery Client        │    │
│         │              │  - search_tools              │    │
│         │              │  - execute_tool              │    │
│         │              │  - Cache metadata            │    │
│         │              └──────────────────────────────┘    │
│         │                          │                        │
│         ▼                          ▼                        │
│  ┌──────────────┐      ┌──────────────────────────────┐   │
│  │  Output      │      │  AI Provider                 │   │
│  │  Formatter   │      │  (OpenAI/Anthropic/Local)    │   │
│  │              │      │  - Function calling          │   │
│  │  - Human     │      │  - Streaming                 │   │
│  │  - JSON      │      │  - Tool use protocol         │   │
│  └──────────────┘      └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                   ┌──────────────────────────────┐
                   │  @anygpt/mcp-discovery       │
                   │  (MCP Server)                │
                   │                              │
                   │  - search_tools              │
                   │  - list_tools                │
                   │  - get_tool_details          │
                   │  - execute_tool              │
                   └──────────────────────────────┘
                                 │
                                 ▼
                   ┌──────────────────────────────┐
                   │  Actual MCP Servers          │
                   │  (github, jira, slack, etc.) │
                   └──────────────────────────────┘
```

## Test Summary

### Test Categories

- **Unit Tests**: Chat loop, orchestrator logic, output formatting
- **Integration Tests**: MCP discovery client, AI provider integration
- **E2E Tests**: Full workflows (interactive, non-interactive, JSON output)
- **Contract Tests**: MCP protocol compliance

**Total Tests**: TBD  
**Coverage Target**: 70%+ (agentic logic is harder to test)

## Implementation Plan

### Phase 1: Basic Chat Loop

- [ ] Create `@anygpt/chat` package
- [ ] Implement basic REPL (interactive mode)
- [ ] Message history management
- [ ] Graceful exit (Ctrl+C, /exit)
- [ ] Unit tests for chat loop

**Deliverable**: `anygpt chat` command that accepts user input and echoes back

### Phase 2: AI Provider Integration

- [ ] Integrate with `@anygpt/config` for model selection
- [ ] Implement OpenAI function calling
- [ ] Implement Anthropic tool use
- [ ] Streaming response support
- [ ] Error handling for API failures
- [ ] Unit tests for AI provider integration

**Deliverable**: Chat that sends messages to AI and displays responses

### Phase 3: MCP Discovery Client

- [ ] Create MCP client to connect to `@anygpt/mcp-discovery`
- [ ] Implement meta-tool calls (search_tools, execute_tool)
- [ ] Handle tool responses
- [ ] Local caching of tool metadata
- [ ] Error handling for MCP connection failures
- [ ] Unit tests for MCP client

**Deliverable**: Chat can discover and execute tools via MCP discovery

### Phase 4: Agentic Orchestrator

- [ ] Multi-step task planning
- [ ] Autonomous tool discovery (AI decides what to search)
- [ ] Tool execution loop
- [ ] Error recovery and retry logic
- [ ] Max iteration limits (prevent infinite loops)
- [ ] Progress indicators
- [ ] Unit tests for orchestrator

**Deliverable**: Fully autonomous agent that can complete multi-step tasks

### Phase 5: Non-Interactive Mode

- [ ] Single-shot execution (no REPL)
- [ ] Exit codes (0 = success, 1 = failure)
- [ ] JSON output mode
- [ ] Timeout handling
- [ ] CI/CD-friendly error messages
- [ ] E2E tests for CI/CD scenarios

**Deliverable**: `anygpt chat --discover --non-interactive` for CI/CD

### Phase 6: Output Formatting & Polish

- [ ] Human-readable output (colors, formatting)
- [ ] JSON output mode (`--output json`)
- [ ] Progress indicators (spinners, status)
- [ ] Verbose mode (`--verbose`)
- [ ] Quiet mode (`--quiet`)
- [ ] Help text and examples

**Deliverable**: Production-ready CLI with excellent UX

### Phase 7: Testing & Documentation

- [ ] E2E tests for all modes
- [ ] CI/CD integration tests
- [ ] Performance tests (token usage, latency)
- [ ] CLI documentation
- [ ] Example workflows
- [ ] Troubleshooting guide

## Dependencies

- **Internal**:
  - `@anygpt/config` (model selection, configuration)
  - `@anygpt/mcp-discovery` (tool discovery and execution)
  - `@anygpt/cli` (CLI framework)
- **External**:
  - `@modelcontextprotocol/sdk` (MCP client)
  - `openai` (OpenAI API)
  - `@anthropic-ai/sdk` (Anthropic API)
  - `chalk` (terminal colors)
  - `ora` (spinners)
  - `inquirer` (interactive prompts)

## Open Questions

- [ ] Should we support conversation persistence (save/load)?
- [ ] How to handle long-running tasks (>5 minutes)?
- [ ] Should we support multiple AI providers in parallel (voting)?
- [ ] What's the default max iteration limit? (10? 20?)
- [ ] Should we support custom system prompts?
- [ ] How to handle rate limits from AI providers?
- [ ] Should we support local models (Ollama, LM Studio)?

## Scope

### In Scope (Initial Implementation)

- ✅ Interactive mode (REPL)
- ✅ Non-interactive mode (single-shot)
- ✅ MCP discovery integration
- ✅ Autonomous tool execution
- ✅ OpenAI and Anthropic support
- ✅ JSON output mode
- ✅ Error recovery
- ✅ Max iteration limits

### Out of Scope (Future Features)

- ❌ Conversation persistence (save/load)
- ❌ Multi-agent collaboration
- ❌ Custom plugins/extensions
- ❌ Web UI
- ❌ Voice input/output
- ❌ Multi-modal support (images, files)

**Rationale**: Focus on core agentic capabilities and CI/CD use case. Additional features can be added in Phase 6 or later.

## Notes

- **Not a code assistant**: Don't compete with Codex/Gemini/Copilot
- **Focus on automation**: CI/CD, scripting, task orchestration
- **Self-hosted**: No SaaS dependencies (except AI provider)
- **Token efficient**: Use discovery to avoid loading 100+ tools
- **Autonomous**: No human in the loop (for non-interactive mode)

## Related Features

- **[4-4-mcp-discovery-engine](../4-4-mcp-discovery-engine/README.md)**: Core discovery logic
- **[4-5-mcp-discovery-server](../4-5-mcp-discovery-server/README.md)**: MCP server that exposes meta-tools
- **[2-1-cli-chat](../2-1-cli-chat/README.md)**: Basic chat command (to be extended)

## Success Metrics

**Token Efficiency**:
- Context size: <1,000 tokens per message (vs 100,000+ without discovery)
- Discovery overhead: <500 tokens per task

**Performance**:
- Interactive response: <2 seconds for simple queries
- Non-interactive execution: <30 seconds for typical CI/CD tasks
- Tool discovery: <1 second per search

**Reliability**:
- Success rate: >95% for well-defined tasks
- Error recovery: Retry failed tools automatically
- Timeout handling: Graceful exit after max iterations

**Developer Experience**:
- Setup time: <5 minutes (npx @anygpt/cli)
- Learning curve: Natural language (no API docs needed)
- Debugging: Verbose mode shows all tool calls
