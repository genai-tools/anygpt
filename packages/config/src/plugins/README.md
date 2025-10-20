# AnyGPT Config Plugin System

A flexible plugin system for dynamically generating and modifying AnyGPT configuration.

> **Note**: This package provides the plugin **system** (types, manager, interfaces).
> Individual plugins are separate packages (e.g., `@anygpt/docker-mcp-plugin`).

## Overview

Plugins allow you to:

- **Auto-discover resources** (e.g., Docker MCP servers)
- **Generate configuration dynamically** (e.g., MCP server entries)
- **Apply rules and filters** (e.g., tool selection per server)
- **Merge configurations** from multiple sources

## Architecture

```
Base Config (static)
   ↓
Plugin Manager
   ↓
   ├─→ Docker MCP Plugin (discovers servers)
   ├─→ Kubernetes Plugin (discovers clusters)
   ├─→ Custom Plugin (your logic)
   └─→ ...
   ↓
Final Config (merged)
```

## Core Concepts

### Plugin Interface

```typescript
interface ConfigPlugin {
  name: string;
  version?: string;
  description?: string;

  // Initialize and return config contributions
  initialize(
    context: PluginContext
  ): ConfigContribution | Promise<ConfigContribution>;

  // Optional: Check if plugin can run
  canRun?(context: PluginContext): boolean | Promise<boolean>;

  // Optional: Cleanup
  dispose?(): void | Promise<void>;
}
```

### Plugin Context

```typescript
interface PluginContext {
  cwd: string;
  env: Record<string, string | undefined>;
  logger?: {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string, error?: Error) => void;
    debug: (message: string) => void;
  };
}
```

### Config Contribution

```typescript
interface ConfigContribution {
  mcp?: Record<string, MCPServerConfig>;
  discovery?: Partial<DiscoveryConfig>;
  providers?: Record<string, ProviderConfig>;
  defaults?: Partial<DefaultsConfig>;
}
```

## Built-in Plugins

### Docker MCP Plugin

Auto-discovers Docker MCP servers and generates configurations.

**Features:**

- Discovers servers using `docker mcp server ls`
- Inspects each server using `docker mcp server inspect <name>`
- Generates separate MCP server entry per Docker server
- Applies tool filtering rules
- Supports environment-specific configs

**Usage:**

```typescript
import { PluginManager } from '@anygpt/config/plugins/plugin-manager';
import { createDockerMCPPlugin } from '@anygpt/config/plugins/docker-mcp';

const pluginManager = new PluginManager();

pluginManager.register(
  createDockerMCPPlugin({
    autoDiscover: true,
    excludeServers: ['anygpt'],
    rules: [
      {
        when: {
          and: [
            { server: { match: /docker-mcp-github-official/ } },
            { name: { match: /^(get_|list_|create_issue)/ } },
          ],
        },
        set: { enabled: true },
      },
      {
        when: {
          and: [
            { server: { match: /docker-mcp-github-official/ } },
            { name: { match: /(delete|force)/ } },
          ],
        },
        set: { enabled: false },
      },
    ],
    serverEnv: {
      'github-official': {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
      },
    },
  })
);

const config = await pluginManager.initialize(baseConfig, context);
```

**Configuration Options:**

```typescript
interface DockerMCPPluginConfig {
  // Auto-discover servers (default: true)
  autoDiscover?: boolean;

  // Specific servers to include
  includeServers?: string[];

  // Servers to exclude
  excludeServers?: string[];

  // Tool filtering rules (using @anygpt/rules)
  rules?: Rule<ToolRuleTarget>[];

  // Environment variables per server
  serverEnv?: Record<string, Record<string, string>>;

  // Docker MCP flags
  flags?: {
    cpus?: number;
    memory?: string;
    longLived?: boolean;
    static?: boolean;
    transport?: 'stdio' | 'sse' | 'streaming';
  };

  // Prefix for generated server names (default: 'docker-mcp-')
  serverPrefix?: string;
}
```

**Example Output:**

```typescript
// Input: docker mcp server ls
// Output: github-official, duckduckgo, playwright, memory

// Generated config:
{
  mcp: {
    'docker-github-official': {
      command: 'docker',
      args: [
        'mcp', 'gateway', 'run',
        '--servers', 'github-official',
        '--tools', 'get_repo',
        '--tools', 'list_repos',
        '--tools', 'create_issue',
        '--transport', 'stdio',
      ],
      env: { GITHUB_TOKEN: '...' },
    },
    'docker-duckduckgo': {
      command: 'docker',
      args: [
        'mcp', 'gateway', 'run',
        '--servers', 'duckduckgo',
        '--transport', 'stdio',
      ],
    },
    // ... more servers
  }
}
```

## Creating Custom Plugins

### Example: Kubernetes Plugin

```typescript
import type {
  ConfigPlugin,
  PluginContext,
  ConfigContribution,
} from '@anygpt/config/plugins';

export class KubernetesPlugin implements ConfigPlugin {
  name = 'kubernetes';
  version = '1.0.0';
  description = 'Auto-discovers Kubernetes clusters';

  async canRun(context: PluginContext): Promise<boolean> {
    // Check if kubectl is available
    try {
      execSync('kubectl version --client', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  async initialize(context: PluginContext): Promise<ConfigContribution> {
    // Discover clusters from kubeconfig
    const clusters = this.discoverClusters(context);

    const mcp: Record<string, MCPServerConfig> = {};

    for (const cluster of clusters) {
      mcp[`k8s-${cluster.name}`] = {
        command: 'docker',
        args: [
          'mcp',
          'gateway',
          'run',
          '--servers',
          'kubernetes',
          '--transport',
          'stdio',
        ],
        env: {
          KUBECONFIG: cluster.configPath,
          K8S_CONTEXT: cluster.context,
        },
        description: `Kubernetes: ${cluster.name}`,
      };
    }

    return { mcp };
  }

  private discoverClusters(context: PluginContext) {
    // Implementation...
  }
}
```

### Example: Environment Plugin

```typescript
export class EnvironmentPlugin implements ConfigPlugin {
  name = 'environment';
  description = 'Loads config based on environment';

  constructor(private env: string = process.env.NODE_ENV || 'development') {}

  async initialize(context: PluginContext): Promise<ConfigContribution> {
    // Load environment-specific config
    const envConfig = await this.loadEnvConfig(this.env, context);

    return {
      mcp: envConfig.mcp,
      discovery: envConfig.discovery,
    };
  }

  private async loadEnvConfig(env: string, context: PluginContext) {
    // Load from .anygpt/env/${env}.ts
    const configPath = `${context.cwd}/.anygpt/env/${env}.ts`;
    // ...
  }
}
```

## Plugin Manager API

### Register Plugins

```typescript
const manager = new PluginManager();

// Register single plugin
manager.register(plugin, options);

// Register multiple plugins
manager.registerAll([
  plugin1,
  [plugin2, { enabled: true, config: {...} }],
  plugin3,
]);
```

### Initialize

```typescript
const config = await manager.initialize(baseConfig, {
  cwd: process.cwd(),
  env: process.env,
  logger: console,
});
```

### Dispose

```typescript
await manager.dispose();
```

### List Plugins

```typescript
const plugins = manager.getPlugins();
// [{ name: 'docker-mcp', version: '1.0.0', enabled: true }, ...]
```

## Best Practices

### 1. Check Environment

Always implement `canRun()` to check if plugin can execute:

```typescript
async canRun(context: PluginContext): Promise<boolean> {
  try {
    execSync('docker mcp server ls', { stdio: 'pipe' });
    return true;
  } catch {
    context.logger?.warn('Docker MCP not available');
    return false;
  }
}
```

### 2. Handle Errors Gracefully

```typescript
async initialize(context: PluginContext): Promise<ConfigContribution> {
  try {
    // Plugin logic
  } catch (error) {
    context.logger?.error('Plugin failed', error);
    // Return empty contribution instead of throwing
    return {};
  }
}
```

### 3. Use Logger

```typescript
context.logger?.info('Discovering servers...');
context.logger?.debug(`Found ${servers.length} servers`);
context.logger?.warn('Server X is deprecated');
context.logger?.error('Failed to connect', error);
```

### 4. Cleanup Resources

```typescript
async dispose(): Promise<void> {
  // Close connections
  // Clear caches
  // Release resources
}
```

## Configuration Examples

### Minimal Setup

```typescript
import { PluginManager } from '@anygpt/config/plugins';
import { createDockerMCPPlugin } from '@anygpt/config/plugins/docker-mcp';

const manager = new PluginManager();
manager.register(createDockerMCPPlugin());

const config = await manager.initialize({}, context);
```

### Advanced Setup

```typescript
const manager = new PluginManager();

// Docker MCP with filtering
manager.register(createDockerMCPPlugin({
  excludeServers: ['anygpt'],
  rules: [
    {
      when: {
        and: [
          { server: { match: /docker-mcp-github-official/ } },
          { name: { match: /^(get_|list_)/ } }
        ]
      },
      set: { enabled: true }
    },
    {
      when: {
        and: [
          { server: { match: /docker-mcp-github-official/ } },
          { name: { match: /delete/ } }
        ]
      },
      set: { enabled: false }
    },
  },
}));

// Custom plugins
manager.register(new KubernetesPlugin());
manager.register(new EnvironmentPlugin('production'));

const config = await manager.initialize(baseConfig, context);
```

## Future Plugins

Potential plugins to implement:

- **AWS Plugin** - Discover AWS resources (S3, Lambda, etc.)
- **GCP Plugin** - Discover GCP resources
- **Database Plugin** - Discover database connections
- **API Plugin** - Discover REST/GraphQL APIs
- **File System Plugin** - Discover project structure
- **Git Plugin** - Discover repositories and branches
- **Environment Plugin** - Load environment-specific configs
- **Secrets Plugin** - Load secrets from vault/keychain

## Contributing

To create a new plugin:

1. Create folder: `packages/config/src/plugins/your-plugin/`
2. Implement `ConfigPlugin` interface
3. Export from `index.ts`
4. Add tests
5. Update documentation
