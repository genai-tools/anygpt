# AnyGPT Plugins

Plugin system for dynamic AnyGPT configuration. Inspired by unplugin - clean, declarative, context-aware.

## Available Plugins

### [@anygpt/docker-mcp-plugin](./docker-mcp)

Auto-discovers Docker MCP servers and generates MCP server configurations.

```typescript
import DockerMCP from '@anygpt/docker-mcp-plugin';

export default defineConfig({
  plugins: [
    DockerMCP({
      exclude: ['anygpt'],
      toolRules: {
        'github-official': {
          include: ['get_*', 'list_*'],
          exclude: ['*delete*'],
        },
      },
    }),
  ],
});
```

## Plugin Architecture

```
User Config (.anygpt/mcp.ts)
   ↓
defineConfig({ plugins: [...] })
   ↓
Plugin System
   ↓
   ├─→ Docker MCP Plugin (discovers Docker servers)
   ├─→ Future: Kubernetes Plugin
   ├─→ Future: AWS Plugin
   └─→ Future: Custom Plugins
   ↓
Merged Configuration
```

## Creating Plugins

Plugins follow the unplugin-style API:

```typescript
import type { Plugin, PluginContext } from '@anygpt/types';

export default function MyPlugin(options?: MyOptions): Plugin {
  return {
    name: 'my-plugin',
    
    async config(context: PluginContext) {
      // Discover resources
      const servers = await discoverServers();
      
      // Generate configuration
      return {
        mcpServers: {
          ...servers,
        },
      };
    },
    
    async configResolved(config, context) {
      // Transform final config (optional)
      return config;
    },
  };
}
```

## Plugin Context

Plugins receive context with:

```typescript
interface PluginContext {
  cwd: string;                        // Current working directory
  env: Record<string, string>;        // Environment variables
  config: Partial<AnyGPTConfig>;      // Base config before plugins
}
```

## Plugin Hooks

### `config(context)`

Called during config resolution. Return partial config to merge.

```typescript
async config(context: PluginContext) {
  return {
    mcpServers: { ... },
    discovery: { ... },
    providers: { ... },
  };
}
```

### `configResolved(config, context)`

Called after all plugins have contributed. Transform final config.

```typescript
async configResolved(config: AnyGPTConfig, context: PluginContext) {
  // Validate or transform config
  return config;
}
```

## Future Plugins

Ideas for future plugins:

- **@anygpt/kubernetes-plugin** - Discover K8s clusters
- **@anygpt/aws-plugin** - Discover AWS resources
- **@anygpt/gcp-plugin** - Discover GCP resources
- **@anygpt/database-plugin** - Discover database connections
- **@anygpt/api-plugin** - Discover REST/GraphQL APIs
- **@anygpt/git-plugin** - Discover repositories and branches
- **@anygpt/env-plugin** - Load environment-specific configs
- **@anygpt/secrets-plugin** - Load secrets from vault/keychain

## Contributing

To create a new plugin:

1. Create package: `packages/plugins/your-plugin/`
2. Implement plugin interface
3. Export default factory function
4. Add README with examples
5. Publish to npm

## License

MIT
