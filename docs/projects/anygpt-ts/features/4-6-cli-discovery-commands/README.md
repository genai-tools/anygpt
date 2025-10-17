# CLI Discovery Commands

|                       |                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------- |
| **Status**            | 🔄 Design Complete                                                                      |
| **Progress**          | 0/33 tasks                                                                              |
| **Spec**              | [MCP Discovery](../../../../products/anygpt/specs/anygpt/mcp-discovery.md)              |
| **Use Case**          | [On-Demand MCP Tool Discovery](../../../../products/anygpt/cases/mcp-tool-discovery.md) |
| **Architecture**      | [System Design](../../architecture.md)                                                  |
| **Roadmap**           | [Feature List](../../roadmap.md#4-6-cli-discovery-commands)                             |
| **Technical Design**  | [design.md](./design.md)                                                                |

## Overview

CLI interface for MCP Discovery Engine, providing human-friendly commands for exploring, debugging, and validating the discovery configuration.

**This is the SECONDARY interface** - primarily for developers to debug and explore, while the MCP server (4-5) is the primary interface for AI agents.

## Status

**Last Updated**: 2025-10-17  
**Current Phase**: Design Complete

### Recent Updates

- 2025-10-17: Design phase complete - CLI commands and output formatting defined
- 2025-10-17: Feature created, awaiting design

## Design Summary

### CLI Commands (6 commands)

1. **anygpt mcp list**

   - List all configured MCP servers
   - Show connection status and tool counts
   - Options: `--status`, `--tools`, `--json`

2. **anygpt mcp search**

   - Search for tools across all MCP servers
   - Free-text query with relevance scoring
   - Options: `--server <name>`, `--limit <n>`, `--json`

3. **anygpt mcp tools**

   - List tools from a specific MCP server
   - Show enabled/disabled status and tags
   - Options: `--all`, `--tags`, `--json`

4. **anygpt mcp inspect**

   - Get detailed information about a specific tool
   - Show parameters, examples, and usage
   - Options: `--examples`, `--json`

5. **anygpt mcp execute** (NEW!)

   - Execute a tool from any discovered MCP server
   - Proxy the call and show results
   - Options: `--args <json>`, `--json`, `--stream`

6. **anygpt mcp config**
   - Manage MCP discovery configuration
   - Subcommands: `show`, `validate`, `sources`, `reload`

### Example Usage

```bash
# List all MCP servers
anygpt mcp list --status

# Search for GitHub issue tools
anygpt mcp search "github issue"

# List tools from github server
anygpt mcp tools github --tags

# Inspect a specific tool
anygpt mcp inspect github create_issue --examples

# Execute a tool
anygpt mcp execute github create_issue \
  --args='{"repo":"owner/repo","title":"Bug","body":"..."}'

# Show configuration
anygpt mcp config show
```

## Test Summary

### Test Categories

- **Unit Tests**: Command parsing, argument validation
- **Integration Tests**: Full command workflows
- **E2E Tests**: Real-world usage scenarios
- **Contract Tests**: Spec compliance (all examples work)

**Total Tests**: TBD  
**Coverage Target**: 85%+

## Implementation Plan

### Phase 1: CLI Infrastructure

- [ ] Set up CLI framework (commander.js or similar)
- [ ] Command registration system
- [ ] Common options (--json, --help)
- [ ] Error handling and formatting

### Phase 2: Discovery Commands

- [ ] Implement `anygpt mcp list`
- [ ] Implement `anygpt mcp search`
- [ ] Implement `anygpt mcp tools`
- [ ] Implement `anygpt mcp inspect`

### Phase 3: Execution Command (NEW!)

- [ ] Implement `anygpt mcp execute`
- [ ] Argument parsing (JSON)
- [ ] Output formatting (success/error)
- [ ] Streaming support

### Phase 4: Configuration Command

- [ ] Implement `anygpt mcp config show`
- [ ] Implement `anygpt mcp config validate`
- [ ] Implement `anygpt mcp config sources`
- [ ] Implement `anygpt mcp config reload`

### Phase 5: Output Formatting

- [ ] Human-friendly output (tables, colors)
- [ ] JSON output mode
- [ ] Error messages and help text
- [ ] Progress indicators

### Phase 6: Testing & Documentation

- [ ] Unit tests for each command
- [ ] Integration tests
- [ ] E2E tests
- [ ] CLI documentation and examples

## Dependencies

- **Internal**:
  - `@anygpt/mcp-discovery` (Discovery Engine - 4-4)
  - `@anygpt/cli` (CLI infrastructure - Phase 2)
  - `@anygpt/types` (type definitions)
- **External**:
  - CLI framework (commander.js, yargs, or similar)
  - Output formatting (chalk, cli-table3, or similar)

## Command Specifications

### anygpt mcp list

**Syntax**: `anygpt mcp list [options]`

**Options**:

- `--status` - Show connection status
- `--tools` - Show tool count per server
- `--json` - Output as JSON

**Output**:

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

### anygpt mcp search

**Syntax**: `anygpt mcp search <query> [options]`

**Options**:

- `--server <name>` - Filter by server
- `--limit <n>` - Max results (default: 10)
- `--json` - Output as JSON

**Output**:

```
Search results for "github issue" (3 found):

1. github:create_issue (95% match)
   Create a new GitHub issue with title and body
   Tags: github, issues

2. github:update_issue (87% match)
   Update an existing GitHub issue
   Tags: github, issues
```

### anygpt mcp execute

**Syntax**: `anygpt mcp execute <server> <tool> [options]`

**Options**:

- `--args <json>` - Tool arguments as JSON string (required)
- `--json` - Output as JSON
- `--stream` - Enable streaming output

**Output (success)**:

```
Executing: github:create_issue

✓ Success

Result:
  Issue #123 created
  URL: https://github.com/owner/repo/issues/123
  Title: Bug report
  State: open
```

**Output (error)**:

```
Executing: github:create_issue

✗ Error

Code: TOOL_EXECUTION_ERROR
Message: Failed to create issue: API rate limit exceeded
Server: github
Tool: create_issue
```

## Open Questions

- [ ] Which CLI framework to use? (commander.js vs yargs vs oclif)
- [ ] Should we support interactive mode (prompts)?
- [ ] How to handle long-running executions in CLI?
- [ ] Should we add shell completion support?

## Notes

- Focus on developer experience - clear output, helpful errors
- JSON mode for scripting and automation
- Human-friendly mode for interactive use
- All examples from spec must work
- This is SECONDARY to the MCP server interface

## Related Features

- **[4-4-mcp-discovery-engine](../4-4-mcp-discovery-engine/README.md)**: Provides the core discovery and execution logic (CLI depends on it)
- **[4-5-mcp-discovery-server](../4-5-mcp-discovery-server/README.md)**: PRIMARY interface for AI agents (this is SECONDARY)
- **[2-1-cli-chat](../2-1-cli-chat/README.md)**: CLI infrastructure (dependency)
- **[2-2-cli-config](../2-2-cli-config/README.md)**: CLI configuration commands (similar pattern)
