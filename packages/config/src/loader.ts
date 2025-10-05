/**
 * Configuration loader with support for multiple sources
 */

import { readFile, access } from 'fs/promises';
import { join, resolve } from 'path';
import { homedir } from 'os';
import type { AnyGPTConfig, ConfigLoadOptions } from '@anygpt/types';
import { getDefaultConfig, convertCodexToAnyGPTConfig } from './defaults.js';
import { parseCodexToml } from './codex-parser.js';

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
  
  // Codex compatibility
  '~/.codex/config.toml',
  
  // System config
  '/etc/anygpt/anygpt.config.ts',
  '/etc/anygpt/anygpt.config.js',
  '/etc/anygpt/anygpt.config.json'
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
async function loadTSConfig(path: string): Promise<AnyGPTConfig> {
  try {
    // Use jiti with tryNative to prefer native Node.js import
    // This works seamlessly in Node 22+ and falls back to transformation in older versions
    const { createJiti } = await import('jiti');
    const jiti = createJiti(import.meta.url, {
      tryNative: true,        // Try native import first (Node 22+ with --experimental-strip-types)
      fsCache: true,          // Cache transformed files for performance
      interopDefault: true,   // Handle both ESM default and named exports
      moduleCache: true       // Use Node.js native module cache
    });
    
    const module = await jiti.import<AnyGPTConfig>(path, { default: true });
    return module;
  } catch (error) {
    throw new Error(`Failed to load config from ${path}: ${error}`);
  }
}

/**
 * Load TOML config file (Codex compatibility)
 */
async function loadTOMLConfig(path: string): Promise<AnyGPTConfig> {
  try {
    const content = await readFile(path, 'utf-8');
    const codexConfig = parseCodexToml(content);
    return convertCodexToAnyGPTConfig(codexConfig);
  } catch (error) {
    throw new Error(`Failed to load TOML config from ${path}: ${error}`);
  }
}

/**
 * Load JSON config file
 */
async function loadJSONConfig(path: string): Promise<AnyGPTConfig> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load JSON config from ${path}: ${error}`);
  }
}

/**
 * Load configuration file
 */
async function loadConfigFile(path: string): Promise<AnyGPTConfig> {
  const resolvedPath = resolvePath(path);
  
  if (!(await fileExists(resolvedPath))) {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  if (path.endsWith('.json')) {
    return loadJSONConfig(resolvedPath);
  } else if (path.endsWith('.toml')) {
    return loadTOMLConfig(resolvedPath);
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
 * Merge configurations with deep merge
 */
function mergeConfigs(base: AnyGPTConfig, override: Partial<AnyGPTConfig>): AnyGPTConfig {
  return {
    ...base,
    ...override,
    providers: {
      ...base.providers,
      ...override.providers
    },
    settings: {
      ...base.settings,
      ...override.settings,
      logging: {
        ...base.settings?.logging,
        ...override.settings?.logging
      }
    }
  };
}

/**
 * Load AnyGPT configuration
 */
export async function loadConfig(options: ConfigLoadOptions = {}): Promise<AnyGPTConfig> {
  const { configPath, mergeDefaults = !configPath } = options; // Don't merge defaults when explicit config provided
  
  let config: AnyGPTConfig;
  
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
  
  // Merge with defaults if requested
  const defaultConfig = getDefaultConfig();
  if (mergeDefaults && config !== defaultConfig) {
    config = mergeConfigs(defaultConfig, config);
  }
  
  return config;
}

/**
 * Validate configuration
 */
export function validateConfig(config: AnyGPTConfig): void {
  if (!config.providers || Object.keys(config.providers).length === 0) {
    throw new Error('Configuration must have at least one provider');
  }
  
  for (const [providerId, provider] of Object.entries(config.providers)) {
    if (!provider.connector?.connector) {
      throw new Error(`Provider '${providerId}' must specify a connector package`);
    }
  }
}
