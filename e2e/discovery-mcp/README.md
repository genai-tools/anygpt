# MCP Discovery E2E Tests

End-to-end tests for the MCP Discovery Engine demonstrating all configuration types and real-world scenarios.

## Overview

These tests validate the complete discovery workflow including:
- Configuration loading and validation
- Pattern matching (glob, regex, negation)
- Server-specific rules
- Tag-based organization
- Caching behavior
- Search and discovery workflows

## Running Tests

```bash
# Run all E2E tests
npx vitest run e2e/discovery-mcp

# Run in watch mode
npx vitest watch e2e/discovery-mcp

# Run with coverage
npx vitest run e2e/discovery-mcp --coverage
```

## Configuration Examples

### 1. Zero-Config Setup (`configs/01-zero-config.ts`)

The simplest configuration - just enable discovery with defaults.

```typescript
const config: DiscoveryConfig = {
  enabled: true,
  cache: {
    enabled: true,
    ttl: 3600
  }
};
```

**Use Case**: Quick start, prototyping, minimal setup

### 2. Glob Pattern Filtering (`configs/02-glob-patterns.ts`)

Use glob patterns to filter tools by name.

```typescript
const config: DiscoveryConfig = {
  enabled: true,
  cache: { enabled: true, ttl: 3600 },
  toolRules: [
    { pattern: ['*github*'], enabled: true, tags: ['github'] },
    { pattern: ['create_*'], enabled: true, tags: ['create'] },
    { pattern: ['*delete*'], enabled: false, tags: ['dangerous'] }
  ]
};
```

**Supported Patterns**:
- `*github*` - Contains 'github'
- `github_*` - Starts with 'github_'
- `*_issue` - Ends with '_issue'
- `!*delete*` - Negation (exclude)

**Use Case**: Simple filtering, name-based organization

### 3. Regex Pattern Filtering (`configs/03-regex-patterns.ts`)

Use regular expressions for advanced pattern matching.

```typescript
const config: DiscoveryConfig = {
  enabled: true,
  cache: { enabled: true, ttl: 3600 },
  toolRules: [
    { pattern: ['/^create_/'], enabled: true },
    { pattern: ['/^(get|list)_/'], enabled: true },
    { pattern: ['/^(delete|remove)_/'], enabled: false }
  ]
};
```

**Regex Examples**:
- `/^create_/` - Starts with 'create_'
- `/^(get|list)_/` - Starts with 'get_' or 'list_'
- `/(create|read|update|delete)/i` - CRUD operations (case-insensitive)

**Use Case**: Complex pattern matching, operation-based filtering

### 4. Server-Specific Rules (`configs/04-server-specific.ts`)

Apply different rules to different MCP servers.

```typescript
const config: DiscoveryConfig = {
  enabled: true,
  cache: { enabled: true, ttl: 3600 },
  toolRules: [
    {
      server: 'github',
      pattern: ['*issue*', '*pr*'],
      enabled: true,
      tags: ['github']
    },
    {
      server: 'filesystem',
      pattern: ['read_*'],
      enabled: true,
      tags: ['filesystem', 'safe']
    }
  ]
};
```

**Use Case**: Different policies per server, service-specific configuration

### 5. Whitelist Mode (`configs/05-whitelist-mode.ts`)

When any rule has `enabled: true`, whitelist mode is activated.

```typescript
const config: DiscoveryConfig = {
  enabled: true,
  cache: { enabled: true, ttl: 3600 },
  toolRules: [
    // Only these tools are enabled
    { pattern: ['*read*', '*get*', '*list*'], enabled: true },
    // Everything else is disabled by default
  ]
};
```

**Behavior**:
- If ANY rule has `enabled: true`, whitelist mode activates
- Only explicitly enabled tools are available
- All other tools are disabled by default

**Use Case**: Restricted environments, security-first approach, production

### 6. Tag-Based Organization (`configs/06-tag-organization.ts`)

Use tags to organize and categorize tools.

```typescript
const config: DiscoveryConfig = {
  enabled: true,
  cache: { enabled: true, ttl: 3600 },
  toolRules: [
    { pattern: ['*create*'], tags: ['operation:create', 'write'] },
    { pattern: ['*github*'], tags: ['service:github', 'vcs'] },
    { pattern: ['*issue*'], tags: ['resource:issue'] }
  ]
};
```

**Tag Categories**:
- **Operation**: `operation:create`, `operation:read`, `operation:update`, `operation:delete`
- **Service**: `service:github`, `service:jira`, `service:slack`
- **Resource**: `resource:issue`, `resource:file`, `resource:container`
- **Team**: `team:dev`, `team:ops`, `team:product`
- **Safety**: `safety:safe`, `safety:moderate`, `safety:dangerous`

**Tag Accumulation**: A tool can match multiple rules and accumulate all their tags.

**Use Case**: Discovery, filtering, organization, team-based access

### 7. Production Configuration (`configs/07-production.ts`)

Real-world production configuration with safety-first approach.

```typescript
const config: DiscoveryConfig = {
  enabled: true,
  cache: { enabled: true, ttl: 7200 },
  toolRules: [
    // Enable safe operations
    { pattern: ['*read*', '*get*', '*list*'], enabled: true },
    // Disable dangerous operations
    { pattern: ['*delete*', '*destroy*'], enabled: false },
    // Server-specific rules
    { server: 'github', pattern: ['*issue*'], enabled: true },
    { server: 'filesystem', pattern: ['write_*'], enabled: false }
  ]
};
```

**Features**:
- Whitelist mode for safety
- Server-specific policies
- Tag-based organization
- Longer cache TTL (2 hours)

**Use Case**: Production deployments, enterprise environments

## Test Scenarios

### Scenario 1: Zero-Config Discovery

```typescript
const engine = new DiscoveryEngine({
  enabled: true,
  cache: { enabled: true, ttl: 3600 }
});

const servers = await engine.listServers();
const results = await engine.searchTools('github');
```

### Scenario 2: Pattern-Based Filtering

```typescript
const engine = new DiscoveryEngine({
  enabled: true,
  cache: { enabled: true, ttl: 3600 },
  toolRules: [
    { pattern: ['*github*'], enabled: true },
    { pattern: ['*delete*'], enabled: false }
  ]
});
```

### Scenario 3: Server-Specific Configuration

```typescript
const engine = new DiscoveryEngine({
  enabled: true,
  cache: { enabled: true, ttl: 3600 },
  toolRules: [
    { server: 'github', pattern: ['*'], enabled: true },
    { server: 'filesystem', pattern: ['read_*'], enabled: true }
  ]
});
```

### Scenario 4: Whitelist Mode

```typescript
const engine = new DiscoveryEngine({
  enabled: true,
  cache: { enabled: true, ttl: 3600 },
  toolRules: [
    { pattern: ['*read*'], enabled: true } // Whitelist mode!
  ]
});
```

### Scenario 5: Search and Discovery

```typescript
// Search for tools
const results = await engine.searchTools('github issue');

// Filter by server
const githubTools = await engine.searchTools('create', {
  server: 'github',
  limit: 5
});

// Get tool details
const tool = await engine.getToolDetails('github', 'create_issue');

// Execute tool
const result = await engine.executeTool('github', 'create_issue', {
  repo: 'owner/repo',
  title: 'Bug report'
});
```

## Configuration Best Practices

### 1. Start Simple

Begin with zero-config and add rules as needed:

```typescript
// Start here
{ enabled: true, cache: { enabled: true, ttl: 3600 } }

// Add rules gradually
{ enabled: true, cache: { enabled: true, ttl: 3600 }, toolRules: [...] }
```

### 2. Use Whitelist Mode in Production

Default-deny is safer:

```typescript
toolRules: [
  { pattern: ['*read*', '*get*', '*list*'], enabled: true },
  // Everything else disabled by default
]
```

### 3. Organize with Tags

Use consistent tag naming:

```typescript
tags: ['operation:read', 'service:github', 'team:dev', 'safety:safe']
```

### 4. Server-Specific Policies

Different servers need different rules:

```typescript
{ server: 'github', pattern: ['*'], enabled: true },
{ server: 'filesystem', pattern: ['read_*'], enabled: true }
```

### 5. Cache Configuration

Adjust TTL based on environment:

```typescript
// Production: longer cache
cache: { enabled: true, ttl: 7200 }

// Development: shorter cache
cache: { enabled: true, ttl: 1800 }

// Testing: no cache
cache: { enabled: false, ttl: 0 }
```

## Common Patterns

### Enable All Except Dangerous

```typescript
toolRules: [
  { pattern: ['*'], enabled: true },
  { pattern: ['*delete*', '*destroy*'], enabled: false }
]
```

### Read-Only Mode

```typescript
toolRules: [
  { pattern: ['*read*', '*get*', '*list*'], enabled: true }
]
```

### Team-Based Access

```typescript
toolRules: [
  { pattern: ['*github*'], tags: ['team:dev'] },
  { pattern: ['*jira*'], tags: ['team:product'] },
  { pattern: ['*docker*'], tags: ['team:ops'] }
]
```

### CRUD Operations

```typescript
toolRules: [
  { pattern: ['/^create_/'], tags: ['crud:create'] },
  { pattern: ['/^(get|list)_/'], tags: ['crud:read'] },
  { pattern: ['/^update_/'], tags: ['crud:update'] },
  { pattern: ['/^delete_/'], tags: ['crud:delete'] }
]
```

## Troubleshooting

### Tools Not Showing Up

1. Check if whitelist mode is active (any rule with `enabled: true`)
2. Verify pattern matching with test tools
3. Check server-specific rules

### Too Many Tools

1. Use whitelist mode instead of blacklist
2. Add more specific patterns
3. Use server-specific rules

### Cache Issues

1. Disable cache for testing: `cache: { enabled: false }`
2. Reduce TTL: `ttl: 60`
3. Call `engine.reload()` to invalidate cache

## Next Steps

1. Run the E2E tests: `npx vitest run e2e/discovery-mcp`
2. Try different configurations
3. Integrate with your MCP servers
4. Deploy to production

## Related Documentation

- [MCP Discovery Spec](../../docs/products/anygpt/specs/anygpt/mcp-discovery.md)
- [Use Case](../../docs/products/anygpt/cases/mcp-tool-discovery.md)
- [Package README](../../packages/mcp-discovery/README.md)
- [Server README](../../packages/mcp-discovery-server/README.md)
