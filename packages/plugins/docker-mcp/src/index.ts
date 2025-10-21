/**
 * @anygpt/docker-mcp-plugin
 *
 * Auto-discovers Docker MCP servers and generates MCP server configurations.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@anygpt/config';
 * import DockerMCP from '@anygpt/docker-mcp-plugin';
 *
 * export default defineConfig({
 *   plugins: [
 *     DockerMCP({
 *       exclude: ['anygpt'],
 *       toolRules: {
 *         'github-official': {
 *           include: ['get_*', 'list_*'],
 *           exclude: ['*delete*'],
 *         },
 *       },
 *     }),
 *   ],
 *   mcp: {
 *     git: { command: 'uvx', args: ['mcp-server-git'] },
 *   },
 * });
 * ```
 */

import { execSync, exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Readable } from 'node:stream';
import type { AnyGPTConfig, MCPServerConfig } from '@anygpt/types';
import type {
  Plugin,
  PluginContext,
  BasePluginOptions,
  PluginFactory,
} from '@anygpt/config';

const execAsync = promisify(exec);

/**
 * Docker MCP server metadata from `docker mcp server inspect`
 */
interface DockerMCPServerInfo {
  name: string;
  description?: string;
  version?: string;
  tools: Array<{
    name: string;
    description?: string;
    inputSchema?: unknown;
  }>;
  resources?: unknown[];
  prompts?: unknown[];
}

/**
 * Plugin configuration options
 *
 * Extends BasePluginOptions to inherit standard serverRules and debug options
 */
export interface DockerMCPOptions extends BasePluginOptions {
  /**
   * Docker command to use (default: 'docker')
   * 
   * Use 'docker.exe' on WSL to access Windows Docker Desktop
   * 
   * @example
   * ```ts
   * DockerMCP({ dockerCommand: 'docker.exe' })
   * ```
   */
  dockerCommand?: string;

  /**
   * Environment variables per server
   */
  env?: Record<string, Record<string, string>>;

  /**
   * Docker MCP runtime flags
   */
  flags?: {
    cpus?: number;
    memory?: string;
    longLived?: boolean;
    static?: boolean;
    transport?: 'stdio' | 'sse' | 'streaming';
    blockSecrets?: boolean;
  };

  /**
   * Prefix for generated server names (default: '')
   */
  prefix?: string;

  /**
   * Maximum number of concurrent server inspections (default: 5)
   */
  concurrency?: number;
}

/**
 * Docker MCP Plugin Factory
 *
 * Creates a plugin that auto-discovers Docker MCP servers
 */
const DockerMCP: PluginFactory<DockerMCPOptions> = (options = {}) => {
  const {
    dockerCommand = 'docker',
    env = {},
    flags = {},
    prefix = '',
    concurrency = 5,
    debug = false,
    serverRules = [],
  } = options;

  return {
    name: 'docker-mcp',

    async config(context: PluginContext): Promise<Partial<AnyGPTConfig>> {
      const log = (msg: string) => debug && console.log(`[docker-mcp] ${msg}`);
      const warn = (msg: string) =>
        debug && console.warn(`[docker-mcp] ${msg}`);
      // Silent error logging - errors will be shown by CLI when servers fail to connect
      const error = (msg: string, err?: Error) =>
        debug && console.error(`[docker-mcp] ${msg}`, err);

      // Check if Docker MCP is available
      try {
        execSync(`${dockerCommand} mcp server ls`, { stdio: 'pipe', encoding: 'utf-8' });
      } catch {
        // Silently skip if Docker MCP not available
        return {};
      }

      // Discover servers
      const serverNames = discoverServers(dockerCommand, log, error);
      log(
        `Discovered ${serverNames.length} servers: ${serverNames.join(', ')}`
      );

      if (serverNames.length === 0) {
        return {};
      }

      // Inspect servers with concurrency limit using Readable.map()
      log(
        `Inspecting ${serverNames.length} servers (concurrency: ${concurrency})...`
      );
      const inspectStream = Readable.from(serverNames).map(
        async (serverName) => {
          try {
            const serverInfo = await inspectServerAsync(dockerCommand, serverName, log, error);
            return { serverName, serverInfo, success: true as const };
          } catch (err) {
            // Don't log error - just mark as failed
            // The CLI will show the error when it tries to connect
            return { serverName, serverInfo: null, success: false as const };
          }
        },
        { concurrency }
      );

      // Generate MCP server configs
      const mcp: Record<string, MCPServerConfig> = {};

      for await (const result of inspectStream) {
        const { serverName, serverInfo, success } = result;
        const configName = `${prefix}${serverName}`;

        // Check if server should be enabled and get prefix from serverRules
        const enabled = isServerEnabled(serverName, serverRules);
        const toolPrefix = getServerPrefix(serverName, serverRules);

        if (success && serverInfo) {
          // Successfully inspected - create config with full details
          try {
            const mcpConfig = generateMCPConfig(
              dockerCommand,
              serverName,
              serverInfo,
              env[serverName],
              flags,
              log
            );

            mcp[configName] = {
              ...mcpConfig,
              enabled,
              prefix: toolPrefix,
              metadata: { toolCount: serverInfo.tools.length },
            };
            log(
              `Configured ${configName}: ${serverInfo.tools.length} tools${
                toolPrefix ? ` (prefix: "${toolPrefix}")` : ''
              }${enabled ? '' : ' (disabled)'}`
            );
          } catch (err) {
            error(`Failed to configure server "${serverName}"`, err as Error);
          }
        } else {
          // Failed to inspect - still create config so it appears in list
          // The CLI will show it with error status when it fails to connect
          mcp[configName] = {
            command: dockerCommand,
            args: [
              'mcp',
              'gateway',
              'run',
              '--servers',
              serverName,
              '--transport',
              flags.transport || 'stdio',
            ],
            env: env[serverName],
            description: `Docker MCP: ${serverName}`,
            source: 'docker-mcp-plugin',
            enabled,
            prefix: toolPrefix,
          };
          log(
            `Created config for ${configName} (inspection failed, will show error in CLI)${
              toolPrefix ? ` (prefix: "${toolPrefix}")` : ''
            }${enabled ? '' : ' (disabled)'}`
          );
        }
      }

      return {
        mcp: {
          servers: mcp,
        },
      };
    },
  };
};

// Export as default
export default DockerMCP;

/**
 * Discover available Docker MCP servers
 */
function discoverServers(
  dockerCommand: string,
  log: (msg: string) => void,
  error: (msg: string, err?: Error) => void
): string[] {
  try {
    const output = execSync(`${dockerCommand} mcp server ls`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    // Parse comma-separated server names
    const allServers = output
      .trim()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    log(`Found ${allServers.length} servers: ${allServers.join(', ')}`);

    return allServers;
  } catch (err) {
    error('Failed to list Docker MCP servers', err as Error);
    return [];
  }
}

/**
 * Inspect a Docker MCP server (async)
 */
async function inspectServerAsync(
  dockerCommand: string,
  serverName: string,
  log: (msg: string) => void,
  error: (msg: string, err?: Error) => void
): Promise<DockerMCPServerInfo> {
  try {
    log(`Inspecting server: ${serverName}`);

    const { stdout } = await execAsync(
      `${dockerCommand} mcp server inspect ${serverName}`,
      {
        encoding: 'utf-8',
      }
    );

    const info = JSON.parse(stdout) as DockerMCPServerInfo;
    log(`Server ${serverName}: ${info.tools.length} tools`);
    return info;
  } catch (err) {
    error(`Failed to inspect server "${serverName}"`, err as Error);
    throw err;
  }
}

/**
 * Generate MCP server configuration
 */
function generateMCPConfig(
  dockerCommand: string,
  serverName: string,
  serverInfo: DockerMCPServerInfo,
  serverEnv: Record<string, string> | undefined,
  flags: DockerMCPOptions['flags'],
  log: (msg: string) => void
): MCPServerConfig {
  const args = ['mcp', 'gateway', 'run', '--servers', serverName];

  // Add transport
  const transport = flags.transport || 'stdio';
  args.push('--transport', transport);

  // Add resource flags
  if (flags.cpus) {
    args.push('--cpus', flags.cpus.toString());
  }
  if (flags.memory) {
    args.push('--memory', flags.memory);
  }
  if (flags.longLived) {
    args.push('--long-lived');
  }
  if (flags.static) {
    args.push('--static');
  }
  if (flags.blockSecrets !== undefined) {
    args.push(`--block-secrets=${flags.blockSecrets.toString()}`);
  }

  return {
    command: dockerCommand,
    args,
    env: serverEnv && Object.keys(serverEnv).length > 0 ? serverEnv : undefined,
    description: serverInfo.description || `Docker MCP: ${serverName}`,
    source: 'docker-mcp-plugin',
  };
}

/**
 * Check if a server should be enabled based on serverRules
 *
 * Uses simplified matching - checks if rule's 'when' condition matches server name
 * and returns the 'set.enabled' value
 */
function isServerEnabled(
  serverName: string,
  serverRules: BasePluginOptions['serverRules']
): boolean {
  if (!serverRules || serverRules.length === 0) {
    return true; // No rules = all enabled
  }

  // Check each rule - simplified matching for now
  for (const rule of serverRules) {
    const when = rule.when as {
      name?: string;
      enabled?: boolean;
      tags?: string[];
    };
    const set = rule.set as { enabled?: boolean };

    // Check if rule matches this server by name
    if (when.name === serverName) {
      return set.enabled ?? true;
    }

    // TODO: Add tag matching when we have server tags
    // if (when.tags && serverTags.some(tag => when.tags?.includes(tag))) {
    //   return set.enabled ?? true;
    // }
  }

  // No matching rule = enabled by default
  return true;
}

/**
 * Get tool name prefix for a server from serverRules
 *
 * Checks if any rule matches the server and has a prefix in the 'set' clause
 */
function getServerPrefix(
  serverName: string,
  serverRules: BasePluginOptions['serverRules']
): string | undefined {
  if (!serverRules || serverRules.length === 0) {
    return undefined;
  }

  // Check each rule
  for (const rule of serverRules) {
    const when = rule.when as { name?: string; tags?: string[] };
    const set = rule.set as { prefix?: string };

    // Check if rule matches this server by name
    if (when.name === serverName && set.prefix) {
      return set.prefix;
    }

    // TODO: Add tag matching when we have server tags
  }

  return undefined;
}
