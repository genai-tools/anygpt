# MCP Discovery E2E Testing Guide

Complete guide to testing the MCP Discovery Engine with realistic fixtures and comprehensive test coverage.

## Overview

**54 E2E Tests** covering all aspects of the discovery engine:
- Configuration validation
- Pattern matching (glob, regex)
- Tag-based filtering
- Server-specific rules
- Production scenarios
- Real-world use cases

## Test Suites

### 1. Configuration Tests (`discovery.e2e.test.ts`)

**20 tests** validating configuration types and API functionality.

```bash
npx vitest run --config e2e/discovery-mcp/vitest.config.ts discovery.e2e.test.ts
```

**Coverage**:
- Zero-config setup
- Glob pattern filtering
- Regex pattern filtering
- Negation patterns
- Server-specific rules
- Whitelist mode
- Tag-based organization
- Caching configuration
- Complex real-world scenarios
- Search and discovery workflows
- Configuration reload

### 2. Fixture-Based Tests (`discovery-with-fixtures.e2e.test.ts`)

**34 tests** using realistic mock MCP server data.

```bash
npx vitest run --config e2e/discovery-mcp/vitest.config.ts discovery-with-fixtures.e2e.test.ts
```

**Coverage**:
- Tool discovery with real data
- Pattern matching against real tool names
- Tag-based filtering
- Server-specific filtering
- Whitelist mode simulation
- Real-world search scenarios
- Production safety configurations
- Metadata validation
- Complex filtering scenarios
- Tag statistics

## Mock Data

### Servers (4 total)

1. **GitHub** - 6 tools
2. **Jira** - 4 tools
3. **Filesystem** - 5 tools
4. **Docker** - 4 tools

### Tools (19 total)

**GitHub Tools**:
- `github_create_issue` - Create GitHub issue
- `github_list_issues` - List GitHub issues
- `github_get_issue` - Get GitHub issue details
- `github_create_pr` - Create pull request
- `github_list_repos` - List repositories
- `github_delete_issue` - Delete GitHub issue (dangerous)

**Jira Tools**:
- `jira_create_ticket` - Create Jira ticket
- `jira_list_tickets` - List Jira tickets
- `jira_get_ticket` - Get Jira ticket details
- `jira_update_ticket` - Update Jira ticket

**Filesystem Tools**:
- `read_file` - Read file contents (safe)
- `write_file` - Write file contents (dangerous)
- `list_directory` - List directory contents (safe)
- `delete_file` - Delete file (dangerous)
- `stat_file` - Get file statistics (safe)

**Docker Tools**:
- `docker_list_containers` - List Docker containers
- `docker_inspect_container` - Inspect Docker container
- `docker_stop_container` - Stop Docker container (dangerous)
- `docker_remove_container` - Remove Docker container (dangerous)

## Running Tests

### Run All Tests

```bash
npx vitest run --config e2e/discovery-mcp/vitest.config.ts
```

### Run Specific Suite

```bash
# Configuration tests only
npx vitest run --config e2e/discovery-mcp/vitest.config.ts discovery.e2e.test.ts

# Fixture-based tests only
npx vitest run --config e2e/discovery-mcp/vitest.config.ts discovery-with-fixtures.e2e.test.ts
```

### Watch Mode

```bash
npx vitest watch --config e2e/discovery-mcp/vitest.config.ts
```

### With Coverage

```bash
npx vitest run --config e2e/discovery-mcp/vitest.config.ts --coverage
```

## Test Categories

### Pattern Matching Tests

Test glob and regex patterns against real tool names:

```typescript
// Glob patterns
'*github*'      → matches all GitHub tools
'create_*'      → matches tools starting with 'create_'
'*_file'        → matches tools ending with '_file'

// Regex patterns
'/^create_/'    → matches tools starting with 'create_'
'/^(get|list)_/'→ matches tools starting with 'get_' or 'list_'
```

### Tag-Based Tests

Test filtering by tags:

```typescript
// Safety tags
tags.includes('safe')       → read_file, list_directory, stat_file
tags.includes('dangerous')  → delete_file, write_file, docker_stop_container

// Operation tags
tags.includes('create')     → github_create_issue, jira_create_ticket
tags.includes('read')       → github_list_issues, read_file
tags.includes('write')      → github_create_issue, write_file
tags.includes('delete')     → github_delete_issue, delete_file
```

### Server-Specific Tests

Test filtering by server:

```typescript
server === 'github'      → 6 tools
server === 'jira'        → 4 tools
server === 'filesystem'  → 5 tools
server === 'docker'      → 4 tools
```

### Real-World Scenario Tests

Test realistic search queries:

```typescript
// "create GitHub issue"
→ finds: github_create_issue

// "list containers"
→ finds: docker_list_containers

// "read file"
→ finds: read_file
```

### Production Safety Tests

Test production configurations:

```typescript
// Read-only mode
tags.includes('read') && !tags.includes('write')
→ github_list_issues, read_file, docker_list_containers

// Block destructive operations
!name.match(/delete|remove|destroy|drop/)
→ excludes: github_delete_issue, delete_file, docker_remove_container

// Approved collaboration tools only
(server === 'github' && tags.includes('issues')) ||
(server === 'jira' && tags.includes('tickets'))
→ github_create_issue, jira_create_ticket
```

## Test Data Structure

### ServerMetadata

```typescript
{
  name: string;              // 'github', 'jira', etc.
  description: string;       // Server description
  toolCount: number;         // Total tools
  enabledCount: number;      // Enabled tools
  status: 'connected';       // Connection status
  config: {
    command: string;         // Command to run
    args: string[];          // Command arguments
  }
}
```

### ToolMetadata

```typescript
{
  server: string;            // Server name
  name: string;              // Tool name
  summary: string;           // Short description
  description?: string;      // Detailed description
  tags: string[];            // Tool tags
  enabled: boolean;          // Whether enabled
  parameters?: Array<{       // Tool parameters
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
}
```

## Helper Functions

### getToolsForServer

Get all tools for a specific server:

```typescript
import { getToolsForServer } from './fixtures/mock-servers.js';

const githubTools = getToolsForServer('github');
// Returns: 6 GitHub tools
```

### getServer

Get server metadata by name:

```typescript
import { getServer } from './fixtures/mock-servers.js';

const github = getServer('github');
// Returns: ServerMetadata for GitHub
```

## Common Test Patterns

### Test Pattern Matching

```typescript
it('should match tools with pattern', () => {
  const pattern = '*github*';
  const matches = mockTools.filter(t => 
    t.name.includes('github') || t.server.includes('github')
  );
  expect(matches).toHaveLength(6);
});
```

### Test Tag Filtering

```typescript
it('should filter by tag', () => {
  const dangerous = mockTools.filter(t => 
    t.tags.includes('dangerous')
  );
  expect(dangerous.length).toBeGreaterThan(0);
});
```

### Test Server Filtering

```typescript
it('should filter by server', () => {
  const githubTools = mockTools.filter(t => 
    t.server === 'github'
  );
  expect(githubTools).toHaveLength(6);
});
```

### Test Complex Filtering

```typescript
it('should apply complex filters', () => {
  const filtered = mockTools.filter(t => 
    t.server === 'github' &&
    t.tags.includes('create') &&
    !t.tags.includes('delete')
  );
  expect(filtered.length).toBeGreaterThan(0);
});
```

## Extending Tests

### Add New Mock Server

1. Add server metadata to `fixtures/mock-servers.ts`:

```typescript
export const mockSlackServer: ServerMetadata = {
  name: 'slack',
  description: 'Slack integration',
  toolCount: 3,
  enabledCount: 3,
  status: 'connected',
  config: {
    command: 'node',
    args: ['./slack-server.js']
  }
};
```

2. Add tools:

```typescript
export const mockSlackTools: ToolMetadata[] = [
  {
    server: 'slack',
    name: 'slack_send_message',
    summary: 'Send a Slack message',
    tags: ['slack', 'messaging', 'send'],
    enabled: true,
    parameters: [
      { name: 'channel', type: 'string', required: true },
      { name: 'message', type: 'string', required: true }
    ]
  }
];
```

3. Update exports:

```typescript
export const mockServers = [
  mockGitHubServer,
  mockJiraServer,
  mockFilesystemServer,
  mockDockerServer,
  mockSlackServer  // Add new server
];

export const mockTools = [
  ...mockGitHubTools,
  ...mockJiraTools,
  ...mockFilesystemTools,
  ...mockDockerTools,
  ...mockSlackTools  // Add new tools
];
```

### Add New Test

```typescript
describe('New Feature Tests', () => {
  it('should test new feature', () => {
    // Your test here
    expect(true).toBe(true);
  });
});
```

## Troubleshooting

### Tests Failing

1. **Check mock data**: Ensure fixtures match actual types
2. **Verify imports**: Check import paths are correct
3. **Run single test**: Isolate failing test
4. **Check console**: Look for error messages

### Type Errors

1. **Check types**: Ensure mock data matches `ServerMetadata` and `ToolMetadata`
2. **Update fixtures**: Fix any type mismatches
3. **Run typecheck**: `npx tsc --noEmit`

### Test Timeout

1. **Increase timeout**: Update `vitest.config.ts`
2. **Check async**: Ensure async operations complete
3. **Simplify test**: Break into smaller tests

## Best Practices

1. **Use realistic data**: Mock data should match real MCP servers
2. **Test edge cases**: Empty results, invalid inputs, etc.
3. **Keep tests focused**: One concept per test
4. **Use descriptive names**: Test names should explain what they test
5. **Organize by category**: Group related tests together
6. **Validate metadata**: Ensure mock data is valid
7. **Test production configs**: Include real-world scenarios

## Next Steps

1. **Add more servers**: Expand mock data with more MCP servers
2. **Integration tests**: Test with real MCP servers
3. **Performance tests**: Test with large datasets
4. **Error handling**: Test error scenarios
5. **CLI integration**: Test CLI commands with fixtures

## Related Documentation

- [E2E README](./README.md) - Configuration examples and guides
- [Package README](../../packages/mcp-discovery/README.md) - Discovery engine docs
- [Server README](../../packages/mcp-discovery-server/README.md) - MCP server docs
- [Spec](../../docs/products/anygpt/specs/anygpt/mcp-discovery.md) - Technical specification
