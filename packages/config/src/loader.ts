/**
 * Configuration loader with support for multiple sources
 */

import { readFile, access } from 'fs/promises';
import { join, resolve } from 'path';
import { homedir } from 'os';
import type { MCPServerConfig } from '@anygpt/types';
import { getDefaultConfig } from './defaults.js';
import { ConfigParseError, ConfigValidationError } from './errors.js';
import { resolveConfig } from './config.js';
import type { Config } from './types.js';

/**
 * Config load options
 */
export interface ConfigLoadOptions {
  configPath?: string;
  mergeDefaults?: boolean;
}

/**
 * Default configuration paths to search
 */
const DEFAULT_CONFIG_PATHS = [
  // Project-local config (highest priority, git-ignored)
  './.anygpt/anygpt.config.ts',
  './.anygpt/anygpt.config.js',
  './.anygpt/anygpt.config.json',

  // Current directory (for examples/testing)
  './anygpt.config.ts',
  './anygpt.config.js',
  './anygpt.config.json',

  // User home directory
  '~/.anygpt/anygpt.config.ts',
  '~/.anygpt/anygpt.config.js',
  '~/.anygpt/anygpt.config.json',

  // System config
  '/etc/anygpt/anygpt.config.ts',
  '/etc/anygpt/anygpt.config.js',
  '/etc/anygpt/anygpt.config.json',
];

// Default config is now loaded from defaults.ts

/**
 * Resolve path with tilde expansion
 */
function resolvePath(path: string): string {
  if (path.startsWith('~/')) {
    return join(homedir(), path.slice(2));
  }
  return resolve(path);
}

/**
 * Check if file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load TypeScript/JavaScript config file
 *
 * Strategy: Uses jiti with tryNative option for smart TypeScript loading
 *
 * How it works:
 * 1. Node.js 22.18+ and 24+: Native TS support enabled by default (zero overhead!)
 * 2. Node.js 22.6-22.17: Requires --experimental-strip-types flag
 * 3. Node.js <22.6: Falls back to jiti's Babel transformation
 *
 * The tryNative option makes jiti:
 * - Try native import first (fast path for modern Node.js)
 * - Fall back to transformation only if native fails
 * - Cache transformed files for performance
 *
 * This gives us the best of both worlds:
 * - Zero overhead on Node 22.18+/24+ (native TS)
 * - Automatic fallback for older versions (jiti transformation)
 * - No breaking changes for users on any Node version
 */
async function loadTSConfig(path: string): Promise<Config> {
  try {
    // Use jiti with tryNative to prefer native Node.js import
    // This works seamlessly in Node 22+ and falls back to transformation in older versions
    const { createJiti } = await import('jiti');
    const jiti = createJiti(import.meta.url, {
      tryNative: true, // Try native import first (Node 22+ with --experimental-strip-types)
      fsCache: true, // Cache transformed files for performance
      interopDefault: true, // Handle both ESM default and named exports
      moduleCache: true, // Use Node.js native module cache
    });

    const module = await jiti.import<Config>(path, { default: true });
    return module;
  } catch (error) {
    throw new ConfigParseError(path, error);
  }
}

/**
 * Load JSON config file
 */
async function loadJSONConfig(path: string): Promise<Config> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new ConfigParseError(path, error);
  }
}

/**
 * Load configuration file
 */
async function loadConfigFile(path: string): Promise<Config> {
  const resolvedPath = resolvePath(path);

  if (!(await fileExists(resolvedPath))) {
    throw new ConfigParseError(resolvedPath, new Error('File not found'));
  }

  if (path.endsWith('.json')) {
    return loadJSONConfig(resolvedPath);
  } else {
    return loadTSConfig(resolvedPath);
  }
}

/**
 * Find first existing config file from default paths
 */
async function findConfigFile(): Promise<string | null> {
  for (const path of DEFAULT_CONFIG_PATHS) {
    const resolvedPath = resolvePath(path);
    if (await fileExists(resolvedPath)) {
      return resolvedPath;
    }
  }
  return null;
}

/**
 * Normalize MCP servers from array to object format
 */
export function normalizeMCPServers(
  mcpServers: Record<string, MCPServerConfig> | MCPServerConfig[] | undefined
): Record<string, MCPServerConfig> | undefined {
  if (!mcpServers) {
    return undefined;
  }

  // Already in object format
  if (!Array.isArray(mcpServers)) {
    return mcpServers;
  }

  // Convert array to object format
  const normalized: Record<string, MCPServerConfig> = {};

  for (const server of mcpServers) {
    if (!server.name) {
      throw new ConfigValidationError([
        'MCP server in array format must have a "name" field',
      ]);
    }

    // Extract name and create config without it
    const { name, ...config } = server;
    normalized[name] = config;
  }

  return normalized;
}

/**
 * Merge two configurations with deep merge
 */
function mergeTwoConfigs(base: Config, override: Partial<Config>): Config {
  const result: Config & Record<string, unknown> = {
    ...base,
    ...override,
    providers: {
      ...base.providers,
      ...override.providers,
    },
    settings: {
      ...base.settings,
      ...override.settings,
    },
  };

  // Normalize and merge mcpServers if either base or override has them
  const baseWithMcp = base as typeof base & {
    mcpServers?: Record<string, MCPServerConfig>;
  };
  const overrideWithMcp = override as typeof override & {
    mcpServers?: Record<string, MCPServerConfig>;
  };
  if (baseWithMcp.mcpServers || overrideWithMcp.mcpServers) {
    const normalizedBase = normalizeMCPServers(baseWithMcp.mcpServers);
    const normalizedOverride = normalizeMCPServers(overrideWithMcp.mcpServers);
    result['mcpServers'] = {
      ...normalizedBase,
      ...normalizedOverride,
    };
  }

  // Only merge discovery if either base or override has it
  const baseWithDiscovery = base as typeof base & {
    discovery?: Record<string, unknown>;
  };
  const overrideWithDiscovery = override as typeof override & {
    discovery?: Record<string, unknown>;
  };
  if (baseWithDiscovery.discovery || overrideWithDiscovery.discovery) {
    result['discovery'] = {
      ...baseWithDiscovery.discovery,
      ...overrideWithDiscovery.discovery,
    };

    // Merge cache if either has it
    const baseCache = baseWithDiscovery.discovery?.['cache'] as
      | Record<string, unknown>
      | undefined;
    const overrideCache = overrideWithDiscovery.discovery?.['cache'] as
      | Record<string, unknown>
      | undefined;
    if (baseCache || overrideCache) {
      (result['discovery'] as Record<string, unknown>)['cache'] = {
        ...baseCache,
        ...overrideCache,
      };
    }
  }

  return result;
}

/**
 * Load AnyGPT configuration
 */
export async function loadConfig(
  options: ConfigLoadOptions = {}
): Promise<Config> {
  const { configPath, mergeDefaults = !configPath } = options; // Don't merge defaults when explicit config provided

  let config: Config;

  if (configPath) {
    // Load specific config file
    config = await loadConfigFile(configPath);
  } else {
    // Find and load default config
    const foundPath = await findConfigFile();
    if (foundPath) {
      config = await loadConfigFile(foundPath);
    } else {
      // No config file found, use defaults
      config = getDefaultConfig();
    }
  }

  // Process plugins first (if any)
  config = await resolveConfig(config);

  // Merge with defaults if requested
  const defaultConfig = getDefaultConfig();
  if (mergeDefaults && config !== defaultConfig) {
    config = mergeTwoConfigs(defaultConfig, config);
  }

  return config;
}

/**
 * Merge multiple configurations with deep merge
 *
 * Accepts either individual configs or an array of configs.
 * Merges configurations from left to right, with later configs taking precedence.
 *
 * @example
 * ```ts
 * import { mergeConfigs, defineConfig } from '@anygpt/config';
 *
 * // Variadic style
 * export default mergeConfigs(base, override, extra);
 *
 * // Array style (useful for dynamic composition)
 * const configs = [base, override, extra];
 * export default mergeConfigs(configs);
 *
 * // Mixed style with spread
 * export default mergeConfigs([base, ...otherConfigs]);
 * ```
 */
// Note: mergeConfigs is now exported from config.ts
// This function is kept for backward compatibility but deprecated
/** @deprecated Use mergeConfigs from config.ts instead */
export function mergeConfigsLegacy(
  ...configs: Array<Partial<Config> | Array<Partial<Config>>>
): Config {
  // Flatten array if first argument is an array
  const flatConfigs: Array<Partial<Config>> =
    configs.length === 1 && Array.isArray(configs[0])
      ? configs[0]
      : (configs as Array<Partial<Config>>);

  if (flatConfigs.length === 0) {
    return {};
  }

  if (flatConfigs.length === 1) {
    return flatConfigs[0] as Config;
  }

  // Start with first config as base
  let result = flatConfigs[0] as Config;

  // Merge remaining configs
  for (let i = 1; i < flatConfigs.length; i++) {
    result = mergeTwoConfigs(result, flatConfigs[i]);
  }

  return result as Config;
}

/**
 * Validate configuration
 */
export function validateConfig(config: Config): void {
  const errors: string[] = [];

  if (!config.providers || Object.keys(config.providers).length === 0) {
    errors.push('Configuration must have at least one provider');
  }

  if (config.providers) {
    for (const [providerId, provider] of Object.entries(config.providers)) {
      // Must have connector
      if (!provider.connector) {
        errors.push(
          `Provider '${providerId}' must specify 'connector' (IConnector instance or module string)`
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new ConfigValidationError(errors);
  }
}
