# CLI Discovery Commands - Design

**Spec**: [MCP Discovery](../../../../products/anygpt/specs/anygpt/mcp-discovery.md)  
**Project**: AnyGPT TypeScript  
**Status**: 🔄 In Progress

## Overview

CLI interface for MCP Discovery Engine, providing human-friendly commands for exploring, debugging, and validating the discovery configuration.

**This is the SECONDARY interface** - primarily for developers to debug and explore, while the MCP server (4-5) is the primary interface for AI agents.

## Architecture

### Command Structure

```
anygpt mcp <command> [args] [options]

Commands:
  list        List all configured MCP servers
  search      Search for tools across all servers
  tools       List tools from a specific server
  inspect     Get detailed information about a tool
  execute     Execute a tool from any server
  config      Manage discovery configuration
```

### Components

#### 1. CLI Framework

**Purpose**: Command registration, parsing, and routing.

**Responsibilities**:
- Register commands and subcommands
- Parse command-line arguments
- Route to command handlers
- Handle global options (--json, --help, --version)
- Format output (human-friendly or JSON)

**Technology Choice**: Use `commander.js` for CLI framework.

**Rationale**:
- Widely used and well-maintained
- Simple API for command registration
- Built-in help generation
- Good TypeScript support

**Interface**:
```typescript
import { Command } from 'commander';

class CLIFramework {
  private program: Command;
  private engine: DiscoveryEngine;
  
  constructor(engine: DiscoveryEngine);
  
  registerCommands(): void;
  async run(args: string[]): Promise<void>;
}
```

#### 2. Command Handlers

##### Command 1: anygpt mcp list

**Purpose**: List all configured MCP servers.

**Syntax**:
```bash
anygpt mcp list [options]
```

**Options**:
- `--status` - Show connection status
- `--tools` - Show tool count per server
- `--json` - Output as JSON

**Implementation**:
```typescript
async function handleList(options: {
  status?: boolean;
  tools?: boolean;
  json?: boolean;
}): Promise<void> {
  const servers = await engine.listServers();
  
  if (options.json) {
    console.log(JSON.stringify(servers, null, 2));
    return;
  }
  
  // Human-friendly output
  console.log(`MCP Servers (${servers.length} configured):\n`);
  
  for (const server of servers) {
    const statusIcon = server.status === 'connected' ? '✓' : '✗';
    console.log(`${statusIcon} ${server.name} (${server.enabledCount} tools)`);
    console.log(`  ${server.description}`);
    
    if (options.status) {
      console.log(`  Status: ${server.status}`);
    }
    console.log();
  }
}
```

**Output Format (Human-Friendly)**:
```
MCP Servers (3 configured):

✓ github (15 tools)
  GitHub API integration
  Status: Connected

✓ filesystem (8 tools)
  File system operations
  Status: Connected

✗ database (12 tools)
  Database queries
  Status: Disconnected
```

**Exit Codes**:
- `0` - Success
- `1` - Invalid arguments
- `2` - Configuration error

##### Command 2: anygpt mcp search

**Purpose**: Search for tools across all MCP servers.

**Syntax**:
```bash
anygpt mcp search <query> [options]
```

**Options**:
- `--server <name>` - Filter by server
- `--limit <n>` - Max results (default: 10)
- `--json` - Output as JSON

**Implementation**:
```typescript
async function handleSearch(
  query: string,
  options: {
    server?: string;
    limit?: number;
    json?: boolean;
  }
): Promise<void> {
  const results = await engine.searchTools(query, {
    server: options.server,
    limit: options.limit || 10
  });
  
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  
  // Human-friendly output
  console.log(`Search results for "${query}" (${results.length} found):\n`);
  
  results.forEach((result, index) => {
    const relevance = Math.round(result.relevance * 100);
    console.log(`${index + 1}. ${result.server}:${result.tool} (${relevance}% match)`);
    console.log(`   ${result.summary}`);
    if (result.tags.length > 0) {
      console.log(`   Tags: ${result.tags.join(', ')}`);
    }
    console.log();
  });
}
```

**Output Format (Human-Friendly)**:
```
Search results for "github issue" (3 found):

1. github:create_issue (95% match)
   Create a new GitHub issue with title and body
   Tags: github, issues

2. github:update_issue (87% match)
   Update an existing GitHub issue
   Tags: github, issues

3. jira:create_ticket (72% match)
   Create a new Jira ticket
   Tags: jira, issues
```

**Exit Codes**:
- `0` - Success (results found)
- `1` - Invalid arguments
- `2` - No results found

##### Command 3: anygpt mcp tools

**Purpose**: List tools from a specific MCP server.

**Syntax**:
```bash
anygpt mcp tools <server> [options]
```

**Options**:
- `--all` - Include disabled tools
- `--tags` - Show tags
- `--json` - Output as JSON

**Implementation**:
```typescript
async function handleTools(
  server: string,
  options: {
    all?: boolean;
    tags?: boolean;
    json?: boolean;
  }
): Promise<void> {
  const tools = await engine.listTools(server, options.all);
  
  if (options.json) {
    console.log(JSON.stringify({ server, tools }, null, 2));
    return;
  }
  
  // Human-friendly output
  const enabledCount = tools.filter(t => t.enabled).length;
  const disabledCount = tools.length - enabledCount;
  
  console.log(`Tools from ${server} (${enabledCount} enabled, ${disabledCount} disabled):\n`);
  
  for (const tool of tools) {
    const icon = tool.enabled ? '✓' : '✗';
    const status = tool.enabled ? '' : ' (disabled)';
    console.log(`${icon} ${tool.name}${status}`);
    console.log(`  ${tool.summary}`);
    
    if (options.tags && tool.tags.length > 0) {
      console.log(`  Tags: ${tool.tags.join(', ')}`);
    }
    console.log();
  }
}
```

**Output Format (Human-Friendly)**:
```
Tools from github (15 enabled, 2 disabled):

✓ create_issue
  Create a GitHub issue
  Tags: github, issues

✓ list_repos
  List GitHub repositories
  Tags: github, repos

✗ delete_repo (disabled)
  Delete a GitHub repository
  Tags: github, dangerous
```

**Exit Codes**:
- `0` - Success
- `1` - Invalid arguments
- `2` - Server not found

##### Command 4: anygpt mcp inspect

**Purpose**: Get detailed information about a specific tool.

**Syntax**:
```bash
anygpt mcp inspect <server> <tool> [options]
```

**Options**:
- `--examples` - Show usage examples
- `--json` - Output as JSON

**Implementation**:
```typescript
async function handleInspect(
  server: string,
  tool: string,
  options: {
    examples?: boolean;
    json?: boolean;
  }
): Promise<void> {
  const details = await engine.getToolDetails(server, tool);
  
  if (!details) {
    console.error(`Tool not found: ${server}:${tool}`);
    process.exit(2);
  }
  
  if (options.json) {
    console.log(JSON.stringify(details, null, 2));
    return;
  }
  
  // Human-friendly output
  console.log(`Tool: ${server}:${tool}\n`);
  console.log(`Description: ${details.description || details.summary}\n`);
  
  if (details.parameters && details.parameters.length > 0) {
    console.log('Parameters:');
    for (const param of details.parameters) {
      const required = param.required ? '(required)' : '(optional)';
      console.log(`  • ${param.name}: ${param.type} ${required}`);
      console.log(`    ${param.description}`);
    }
    console.log();
  }
  
  if (options.examples && details.examples && details.examples.length > 0) {
    console.log('Examples:');
    for (const example of details.examples) {
      console.log(`  ${example.description}:`);
      console.log(`  ${JSON.stringify(example.parameters, null, 2)}`);
      console.log();
    }
  }
  
  if (details.tags.length > 0) {
    console.log(`Tags: ${details.tags.join(', ')}`);
  }
}
```

**Output Format (Human-Friendly)**:
```
Tool: github:create_issue

Description: Create a new GitHub issue in a repository

Parameters:
  • repo: string (required)
    Repository name (owner/repo)
  • title: string (required)
    Issue title
  • body: string (optional)
    Issue body (markdown)

Examples:
  Create a bug report:
  {
    "repo": "owner/repo",
    "title": "Bug: Application crashes on startup",
    "body": "## Steps to reproduce\n1. Launch app\n2. Crash occurs"
  }

Tags: github, issues
```

**Exit Codes**:
- `0` - Success
- `1` - Invalid arguments
- `2` - Tool not found

##### Command 5: anygpt mcp execute

**Purpose**: Execute a tool from any discovered MCP server.

**Syntax**:
```bash
anygpt mcp execute <server> <tool> [options]
```

**Options**:
- `--args <json>` - Tool arguments as JSON string (required)
- `--json` - Output as JSON
- `--stream` - Enable streaming output (if supported)

**Implementation**:
```typescript
async function handleExecute(
  server: string,
  tool: string,
  options: {
    args: string;
    json?: boolean;
    stream?: boolean;
  }
): Promise<void> {
  // Parse arguments
  let arguments: any;
  try {
    arguments = JSON.parse(options.args);
  } catch (error) {
    console.error('Invalid JSON arguments');
    process.exit(1);
  }
  
  // Execute tool
  console.log(`Executing: ${server}:${tool}\n`);
  
  const result = await engine.executeTool(server, tool, arguments);
  
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  
  // Human-friendly output
  if (result.success) {
    console.log('✓ Success\n');
    console.log('Result:');
    console.log(JSON.stringify(result.result, null, 2));
  } else {
    console.log('✗ Error\n');
    console.log(`Code: ${result.error?.code}`);
    console.log(`Message: ${result.error?.message}`);
    console.log(`Server: ${result.error?.server}`);
    console.log(`Tool: ${result.error?.tool}`);
    process.exit(1);
  }
}
```

**Output Format (Success)**:
```
Executing: github:create_issue

✓ Success

Result:
{
  "issue_number": 123,
  "url": "https://github.com/owner/repo/issues/123",
  "title": "Bug report",
  "state": "open"
}
```

**Output Format (Error)**:
```
Executing: github:create_issue

✗ Error

Code: TOOL_EXECUTION_ERROR
Message: Failed to create issue: API rate limit exceeded
Server: github
Tool: create_issue
```

**Exit Codes**:
- `0` - Success
- `1` - Invalid arguments or execution error
- `2` - Tool not found

##### Command 6: anygpt mcp config

**Purpose**: Manage MCP discovery configuration.

**Syntax**:
```bash
anygpt mcp config <subcommand> [options]
```

**Subcommands**:
- `show` - Show current configuration
- `validate` - Validate configuration file
- `sources` - List configuration sources
- `reload` - Reload configuration

**Implementation**:
```typescript
async function handleConfig(
  subcommand: string,
  options: { json?: boolean }
): Promise<void> {
  switch (subcommand) {
    case 'show':
      const config = engine.getConfig();
      if (options.json) {
        console.log(JSON.stringify(config, null, 2));
      } else {
        console.log('Discovery Configuration:\n');
        console.log(`Enabled: ${config.enabled}`);
        console.log(`Cache: ${config.cache?.enabled ? 'enabled' : 'disabled'}`);
        console.log(`Tool Rules: ${config.toolRules?.length || 0}`);
      }
      break;
      
    case 'validate':
      // Validate configuration
      console.log('Validating configuration...');
      // Implementation
      console.log('✓ Configuration is valid');
      break;
      
    case 'sources':
      // List configuration sources
      console.log('Configuration Sources:');
      // Implementation
      break;
      
    case 'reload':
      console.log('Reloading configuration...');
      await engine.reload();
      console.log('✓ Configuration reloaded');
      break;
      
    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      process.exit(1);
  }
}
```

**Exit Codes**:
- `0` - Success
- `1` - Invalid arguments
- `2` - Configuration error

#### 3. Output Formatter

**Purpose**: Format output for human-friendly or JSON mode.

**Responsibilities**:
- Format tables for human-friendly output
- Format JSON for machine-readable output
- Apply colors and icons for better UX
- Handle error messages

**Interface**:
```typescript
class OutputFormatter {
  formatServerList(servers: ServerMetadata[], options: FormatOptions): string;
  formatSearchResults(results: SearchResult[], options: FormatOptions): string;
  formatToolList(tools: ToolMetadata[], options: FormatOptions): string;
  formatToolDetails(tool: ToolMetadata, options: FormatOptions): string;
  formatError(error: Error, options: FormatOptions): string;
}

interface FormatOptions {
  json?: boolean;
  colors?: boolean;
}
```

**Libraries**:
- `chalk` - Terminal colors
- `cli-table3` - ASCII tables (if needed)

#### 4. Error Handler

**Purpose**: Handle errors and format error messages.

**Responsibilities**:
- Catch and format errors
- Set appropriate exit codes
- Log errors to stderr
- Provide helpful error messages

**Interface**:
```typescript
class ErrorHandler {
  handle(error: Error): void;
  formatError(error: Error): string;
  getExitCode(error: Error): number;
}
```

**Error Mapping**:
- `ConfigurationError` → Exit code 2
- `ServerConnectionError` → Exit code 2
- `ToolNotFoundError` → Exit code 2
- `ValidationError` → Exit code 1
- `ToolExecutionError` → Exit code 1
- Unknown errors → Exit code 1

## Dependencies

### Internal Dependencies

| Dependency | Purpose |
|------------|---------|
| `@anygpt/mcp-discovery` (4-4) | Discovery Engine - core logic |
| `@anygpt/cli` (Phase 2) | CLI infrastructure (if exists) |
| `@anygpt/types` | Type definitions |

### External Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| `commander` | CLI framework | `^12.0.0` |
| `chalk` | Terminal colors | `^5.0.0` |

**Rationale**:
- `commander` - Industry standard for Node.js CLIs
- `chalk` - Simple and widely used for terminal colors

## Implementation Strategy

### Phase 1: CLI Infrastructure

**Goal**: Set up CLI framework and command registration.

Tasks:
- [ ] Set up commander.js
- [ ] Implement CLIFramework class
- [ ] Register command structure
- [ ] Add global options (--json, --help, --version)
- [ ] Implement error handling
- [ ] Unit tests for CLI framework

**Acceptance**:
- Commands are registered
- Help text is generated
- Global options work
- Error handling works

### Phase 2: Discovery Commands

**Goal**: Implement discovery commands (list, search, tools, inspect).

Tasks:
- [ ] Implement `anygpt mcp list` command
- [ ] Implement `anygpt mcp search` command
- [ ] Implement `anygpt mcp tools` command
- [ ] Implement `anygpt mcp inspect` command
- [ ] Add human-friendly output formatting
- [ ] Add JSON output mode
- [ ] Unit tests for each command

**Acceptance**:
- All 4 commands work
- Human-friendly output is clear
- JSON mode works
- All examples from spec work

### Phase 3: Execution Command

**Goal**: Implement execute command for tool execution.

Tasks:
- [ ] Implement `anygpt mcp execute` command
- [ ] Add argument parsing (JSON)
- [ ] Add output formatting (success/error)
- [ ] Add streaming support (if available)
- [ ] Unit tests for execute command

**Acceptance**:
- execute command works
- Arguments are parsed correctly
- Success/error output is clear
- Streaming works (if supported)

### Phase 4: Configuration Command

**Goal**: Implement config command for configuration management.

Tasks:
- [ ] Implement `anygpt mcp config show`
- [ ] Implement `anygpt mcp config validate`
- [ ] Implement `anygpt mcp config sources`
- [ ] Implement `anygpt mcp config reload`
- [ ] Unit tests for config command

**Acceptance**:
- All subcommands work
- Configuration is displayed correctly
- Validation works
- Reload works

### Phase 5: Output Formatting

**Goal**: Improve output formatting for better UX.

Tasks:
- [ ] Implement OutputFormatter class
- [ ] Add colors with chalk
- [ ] Add icons (✓, ✗, etc.)
- [ ] Format tables (if needed)
- [ ] Add progress indicators (if needed)
- [ ] Unit tests for formatter

**Acceptance**:
- Output is visually appealing
- Colors work in terminal
- Icons display correctly
- JSON mode has no formatting

### Phase 6: Testing & Documentation

**Goal**: Comprehensive testing and documentation.

Tasks:
- [ ] Unit tests for all commands (target: 85%+ coverage)
- [ ] Integration tests (full workflows)
- [ ] E2E tests (real commands)
- [ ] CLI documentation (help text, examples)
- [ ] README with usage examples

**Acceptance**:
- 85%+ code coverage
- All spec requirements tested
- All examples from spec work
- Documentation is clear

## Open Questions

- [x] **Which CLI framework to use?** → commander.js (industry standard)
- [ ] **Should we support interactive mode (prompts)?** → Not for initial implementation, focus on non-interactive first
- [ ] **How to handle long-running executions in CLI?** → Show progress, support Ctrl+C to cancel
- [ ] **Should we add shell completion support?** → Future feature, not for initial implementation

## Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Command startup | <500ms | CLI should feel responsive |
| Search latency | <200ms | Including engine time |
| Execution latency | <1s | Depends on underlying tool |

## User Experience Considerations

1. **Clear output**: Use colors, icons, and formatting for readability
2. **Helpful errors**: Provide actionable error messages
3. **Consistent format**: All commands follow same output pattern
4. **JSON mode**: Machine-readable output for scripting
5. **Exit codes**: Standard exit codes for automation

## References

- **Spec**: [MCP Discovery](../../../../products/anygpt/specs/anygpt/mcp-discovery.md)
- **Use Case**: [On-Demand MCP Tool Discovery](../../../../products/anygpt/cases/mcp-tool-discovery.md)
- **Architecture**: [System Design](../../architecture.md)
- **Related Features**:
  - [4-4-mcp-discovery-engine](../4-4-mcp-discovery-engine/README.md) - Core discovery logic (dependency)
  - [4-5-mcp-discovery-server](../4-5-mcp-discovery-server/README.md) - PRIMARY interface (sibling)
  - [2-1-cli-chat](../2-1-cli-chat/README.md) - CLI patterns (reference)
  - [2-2-cli-config](../2-2-cli-config/README.md) - Config command patterns (reference)
