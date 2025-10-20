# Agentic Chat - Technical Design

## Architecture Overview

The agentic chat system consists of five main components that work together to provide autonomous task execution with on-demand tool discovery.

```
User Input → Chat Loop → Agentic Orchestrator → MCP Discovery Client → Tools
                ↓              ↓                        ↓
           Output Formatter ← AI Provider ←────────────┘
```

## Component Design

### 1. Chat Loop

**Responsibility**: Manage user interaction and conversation flow

**Interface**:
```typescript
interface ChatLoop {
  start(options: ChatOptions): Promise<void>;
  stop(): Promise<void>;
  sendMessage(message: string): Promise<ChatResponse>;
}

interface ChatOptions {
  mode: 'interactive' | 'non-interactive';
  model?: string;
  maxIterations?: number;
  output?: 'human' | 'json';
  verbose?: boolean;
  quiet?: boolean;
}

interface ChatResponse {
  message: string;
  toolCalls?: ToolCall[];
  error?: Error;
  metadata: {
    tokensUsed: number;
    duration: number;
    iterationCount: number;
  };
}
```

**Key Features**:
- REPL for interactive mode (using `inquirer` or `readline`)
- Single-shot execution for non-interactive mode
- Message history management (in-memory)
- Graceful shutdown (Ctrl+C handling)
- Progress indicators (spinners for long operations)

**Implementation Notes**:
- Use `readline` for basic REPL
- Handle SIGINT for graceful exit
- Store conversation history in memory (no persistence in v1)
- Support `/exit`, `/help`, `/clear` commands in interactive mode

### 2. Agentic Orchestrator

**Responsibility**: Autonomous multi-step task execution with tool discovery

**Interface**:
```typescript
interface AgenticOrchestrator {
  execute(task: string, options: ExecutionOptions): Promise<ExecutionResult>;
}

interface ExecutionOptions {
  maxIterations: number;
  timeout?: number;
  onProgress?: (event: ProgressEvent) => void;
}

interface ExecutionResult {
  success: boolean;
  result?: unknown;
  error?: Error;
  steps: ExecutionStep[];
  metadata: {
    totalIterations: number;
    toolsUsed: string[];
    tokensUsed: number;
    duration: number;
  };
}

interface ExecutionStep {
  type: 'think' | 'search' | 'execute' | 'error';
  description: string;
  input?: unknown;
  output?: unknown;
  timestamp: Date;
}

interface ProgressEvent {
  step: ExecutionStep;
  iteration: number;
  maxIterations: number;
}
```

**Key Algorithm**:
```typescript
async function execute(task: string): Promise<ExecutionResult> {
  const steps: ExecutionStep[] = [];
  let iteration = 0;
  let completed = false;

  while (!completed && iteration < maxIterations) {
    iteration++;

    // 1. Send task + history to AI
    const aiResponse = await aiProvider.chat({
      messages: buildMessages(task, steps),
      tools: getMetaTools(), // Only 5 meta-tools!
    });

    // 2. Check if AI wants to use a tool
    if (aiResponse.toolCalls) {
      for (const toolCall of aiResponse.toolCalls) {
        // 3. Execute tool via MCP discovery
        const result = await mcpClient.executeTool(toolCall);
        steps.push({ type: 'execute', ...result });
      }
    } else {
      // 4. AI provided final answer
      completed = true;
      steps.push({ type: 'think', description: aiResponse.message });
    }

    // 5. Emit progress
    onProgress?.({ step: steps[steps.length - 1], iteration, maxIterations });
  }

  return { success: completed, steps, metadata: { ... } };
}
```

**Key Features**:
- Multi-step planning (AI decides next action)
- Tool discovery via `search_tools` meta-tool
- Tool execution via `execute_tool` meta-tool
- Error recovery (retry failed tools)
- Max iteration limit (prevent infinite loops)
- Progress tracking

**Implementation Notes**:
- Use AI provider's function calling / tool use protocol
- Only expose 5 meta-tools to AI (not 150+ actual tools)
- Let AI autonomously decide when to search for tools
- Track token usage per iteration
- Implement exponential backoff for retries

### 3. MCP Discovery Client

**Responsibility**: Connect to `@anygpt/mcp-discovery` MCP server and execute meta-tools

**Interface**:
```typescript
interface MCPDiscoveryClient {
  connect(config: MCPConfig): Promise<void>;
  disconnect(): Promise<void>;
  searchTools(query: string, server?: string): Promise<ToolSearchResult[]>;
  listTools(server: string): Promise<ToolSummary[]>;
  getToolDetails(server: string, tool: string): Promise<ToolDetails>;
  executeTool(params: ToolExecutionParams): Promise<ToolExecutionResult>;
}

interface MCPConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface ToolSearchResult {
  server: string;
  tool: string;
  summary: string;
  relevance: number;
}

interface ToolExecutionParams {
  server: string;
  tool: string;
  arguments: Record<string, unknown>;
}

interface ToolExecutionResult {
  success: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
  };
}
```

**Key Features**:
- Connect to MCP discovery server via stdio
- Call meta-tools: `search_tools`, `list_tools`, `get_tool_details`, `execute_tool`
- Handle MCP protocol (requests, responses, notifications)
- Local caching of tool metadata (reduce discovery calls)
- Connection lifecycle management

**Implementation Notes**:
- Use `@modelcontextprotocol/sdk` for MCP client
- Start discovery server as child process (stdio transport)
- Cache tool search results for 5 minutes
- Cache tool details indefinitely (until restart)
- Handle connection errors gracefully

### 4. AI Provider Integration

**Responsibility**: Interface with AI models (OpenAI, Anthropic, local)

**Interface**:
```typescript
interface AIProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncIterator<ChatChunk>;
}

interface ChatRequest {
  messages: Message[];
  tools?: Tool[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
}

interface ChatResponse {
  message: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}
```

**Key Features**:
- Support OpenAI function calling
- Support Anthropic tool use
- Streaming responses
- Token usage tracking
- Error handling (rate limits, API errors)

**Implementation Notes**:
- Use official SDKs (`openai`, `@anthropic-ai/sdk`)
- Normalize tool calling format across providers
- Implement retry logic with exponential backoff
- Track token usage per request
- Support streaming for interactive mode

**Meta-Tools Exposed to AI**:
```typescript
const META_TOOLS: Tool[] = [
  {
    name: 'search_tools',
    description: 'Search for tools by query across all MCP servers',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        server: { type: 'string', description: 'Optional server filter' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_tools',
    description: 'List all tools from a specific MCP server',
    parameters: {
      type: 'object',
      properties: {
        server: { type: 'string', description: 'Server name' },
      },
      required: ['server'],
    },
  },
  {
    name: 'get_tool_details',
    description: 'Get detailed information about a specific tool',
    parameters: {
      type: 'object',
      properties: {
        server: { type: 'string', description: 'Server name' },
        tool: { type: 'string', description: 'Tool name' },
      },
      required: ['server', 'tool'],
    },
  },
  {
    name: 'execute_tool',
    description: 'Execute a tool from any MCP server',
    parameters: {
      type: 'object',
      properties: {
        server: { type: 'string', description: 'Server name' },
        tool: { type: 'string', description: 'Tool name' },
        arguments: { type: 'object', description: 'Tool arguments' },
      },
      required: ['server', 'tool', 'arguments'],
    },
  },
  {
    name: 'list_mcp_servers',
    description: 'List all available MCP servers',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];
```

### 5. Output Formatter

**Responsibility**: Format output for different modes (human, JSON)

**Interface**:
```typescript
interface OutputFormatter {
  format(result: ExecutionResult, mode: OutputMode): string;
  progress(event: ProgressEvent): void;
  error(error: Error): void;
}

type OutputMode = 'human' | 'json';
```

**Key Features**:
- Human-readable output (colors, formatting)
- JSON output for scripting
- Progress indicators (spinners, status)
- Error messages
- Verbose mode (show all tool calls)

**Implementation Notes**:
- Use `chalk` for colors
- Use `ora` for spinners
- Use `boxen` for formatted output
- JSON output should be valid JSON (parseable)
- Verbose mode shows all intermediate steps

**Human Output Example**:
```
🤖 Analyzing task...
🔍 Searching for tools: "read file"
✓ Found filesystem_read
📖 Reading README.md...
✓ Found 3 TODOs
🔍 Searching for tools: "create github issue"
✓ Found github_create_issue
📝 Creating GitHub issue...
✓ Created issue #123: "TODO: Add documentation"

✅ Task completed in 5.2s (3 tools used, 1,234 tokens)
```

**JSON Output Example**:
```json
{
  "success": true,
  "result": {
    "issue_number": 123,
    "url": "https://github.com/owner/repo/issues/123"
  },
  "steps": [
    {
      "type": "search",
      "description": "Searching for file reading tools",
      "output": [{"server": "filesystem", "tool": "read"}]
    },
    {
      "type": "execute",
      "description": "Reading README.md",
      "input": {"path": "README.md"},
      "output": {"content": "..."}
    }
  ],
  "metadata": {
    "totalIterations": 3,
    "toolsUsed": ["filesystem_read", "github_create_issue"],
    "tokensUsed": 1234,
    "duration": 5200
  }
}
```

## CLI Design

### Command Structure

```bash
anygpt chat [options] [prompt]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--discover` | Enable MCP discovery mode | `false` |
| `--non-interactive` | Single-shot execution (no REPL) | `false` |
| `--model <model>` | AI model to use | From config |
| `--max-iterations <n>` | Max autonomous iterations | `10` |
| `--timeout <seconds>` | Max execution time | `300` |
| `--output <format>` | Output format (human/json) | `human` |
| `--verbose` | Show all tool calls | `false` |
| `--quiet` | Minimal output | `false` |
| `--help` | Show help | - |

### Usage Examples

**Interactive mode** (local development):
```bash
anygpt chat --discover
```

**Non-interactive mode** (CI/CD):
```bash
anygpt chat --discover --non-interactive \
  "Create GitHub release for version in package.json"
```

**JSON output** (scripting):
```bash
anygpt chat --discover --output json \
  "List all failed tests" | jq '.results[]'
```

**Custom model**:
```bash
anygpt chat --discover --model gpt-4o-mini \
  "Analyze test failures"
```

**Verbose mode** (debugging):
```bash
anygpt chat --discover --verbose \
  "Create release and notify team"
```

## Configuration

### anygpt.config.ts

```typescript
export default {
  chat: {
    // Default model for chat
    model: 'gpt-4o',
    
    // Max autonomous iterations
    maxIterations: 10,
    
    // Timeout in seconds
    timeout: 300,
    
    // Discovery configuration
    discover: {
      enabled: true,
      
      // MCP discovery server config
      server: {
        command: 'npx',
        args: ['-y', '@anygpt/mcp-discovery'],
      },
      
      // Cache settings
      cache: {
        toolSearchTTL: 300, // 5 minutes
        toolDetailsTTL: -1, // Indefinite
      },
    },
  },
};
```

## Error Handling

### Error Types

1. **AI Provider Errors**
   - Rate limits → Retry with exponential backoff
   - API errors → Show error, exit gracefully
   - Invalid responses → Retry once, then fail

2. **MCP Connection Errors**
   - Connection failed → Show error, suggest checking config
   - Tool execution failed → Show error, continue to next step
   - Timeout → Show error, exit gracefully

3. **User Errors**
   - Invalid command → Show help
   - Missing config → Show setup instructions
   - Invalid arguments → Show error with examples

### Recovery Strategy

```typescript
async function executeWithRetry(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on user errors
      if (error instanceof UserError) {
        throw error;
      }
      
      // Exponential backoff
      await sleep(Math.pow(2, i) * 1000);
    }
  }
  
  throw lastError;
}
```

## Testing Strategy

### Unit Tests

1. **Chat Loop**
   - REPL interaction
   - Message history
   - Graceful exit
   - Command parsing

2. **Agentic Orchestrator**
   - Multi-step execution
   - Max iteration limit
   - Error recovery
   - Progress tracking

3. **MCP Discovery Client**
   - Connection lifecycle
   - Meta-tool calls
   - Caching
   - Error handling

4. **AI Provider Integration**
   - Function calling
   - Streaming
   - Token tracking
   - Error handling

5. **Output Formatter**
   - Human output
   - JSON output
   - Progress indicators
   - Error messages

### Integration Tests

1. **End-to-End Workflows**
   - Interactive mode
   - Non-interactive mode
   - JSON output mode
   - Error scenarios

2. **MCP Discovery Integration**
   - Connect to discovery server
   - Search and execute tools
   - Handle tool errors
   - Cache behavior

3. **AI Provider Integration**
   - OpenAI function calling
   - Anthropic tool use
   - Streaming responses
   - Rate limit handling

### E2E Tests

1. **CI/CD Scenarios**
   - Create GitHub release
   - Update Jira tickets
   - Notify Slack
   - Analyze test failures

2. **Performance Tests**
   - Token usage (<1,000 per message)
   - Latency (<2s for simple queries)
   - Discovery overhead (<1s per search)

## Performance Considerations

### Token Optimization

- Only expose 5 meta-tools to AI (not 150+ actual tools)
- Cache tool search results (reduce discovery calls)
- Use streaming for long responses
- Track token usage per request

### Latency Optimization

- Start MCP discovery server on first use (lazy init)
- Cache tool metadata locally
- Use streaming for interactive mode
- Parallel tool execution (when possible)

### Memory Optimization

- Store conversation history in memory (no persistence)
- Limit history to last 10 messages
- Clear cache periodically
- Use streaming to avoid loading full responses

## Security Considerations

1. **API Keys**
   - Load from environment variables
   - Never log API keys
   - Support `.env` files

2. **Tool Execution**
   - Validate tool arguments
   - Sandbox tool execution (if possible)
   - Timeout long-running tools
   - Log all tool calls (audit trail)

3. **User Input**
   - Sanitize user input
   - Prevent prompt injection
   - Validate JSON output

## Future Enhancements

### Phase 6: Advanced Features

- **Conversation Persistence**: Save/load conversations
- **Multi-Agent Collaboration**: Multiple agents working together
- **Custom Plugins**: User-defined tools and extensions
- **Web UI**: Browser-based interface
- **Voice Input/Output**: Speech recognition and synthesis
- **Multi-Modal Support**: Images, files, etc.

### Phase 7: Enterprise Features

- **Team Collaboration**: Shared conversations
- **Access Control**: Role-based permissions
- **Audit Logging**: Track all actions
- **Cost Management**: Budget limits and alerts
- **Custom Models**: Fine-tuned models for specific tasks

## Open Questions

1. **Conversation Persistence**: Should we save conversations to disk?
   - **Decision**: Not in v1, add in Phase 6 if needed

2. **Max Iterations**: What's a good default? 10? 20?
   - **Decision**: Start with 10, make configurable

3. **Local Models**: Should we support Ollama, LM Studio?
   - **Decision**: Not in v1, focus on OpenAI/Anthropic first

4. **Streaming**: Should we stream in non-interactive mode?
   - **Decision**: No, buffer full response for JSON output

5. **Rate Limits**: How to handle AI provider rate limits?
   - **Decision**: Exponential backoff with max 3 retries

## Success Criteria

✅ **Functional**:
- Interactive mode works (REPL)
- Non-interactive mode works (single-shot)
- JSON output mode works (parseable)
- Tool discovery works (via MCP)
- Autonomous execution works (multi-step)

✅ **Performance**:
- Token usage: <1,000 per message
- Latency: <2s for simple queries
- Discovery overhead: <1s per search

✅ **Reliability**:
- Success rate: >95% for well-defined tasks
- Error recovery: Retry failed tools automatically
- Timeout handling: Graceful exit after max iterations

✅ **Developer Experience**:
- Setup time: <5 minutes
- Learning curve: Natural language (no docs needed)
- Debugging: Verbose mode shows all tool calls
