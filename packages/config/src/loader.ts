/**
 * Configuration loader with support for multiple sources
 */

import { readFile, access } from 'fs/promises';
import { join, resolve } from 'path';
import { homedir } from 'os';
import type { AnyGPTConfig, ConfigLoadOptions } from './types.js';

/**
 * Default configuration paths to search
 */
const DEFAULT_CONFIG_PATHS = [
  // Current directory
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
  '/etc/anygpt/anygpt.config.json'
];

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AnyGPTConfig = {
  version: '1.0',
  providers: {},
  settings: {
    timeout: 30000,
    maxRetries: 3,
    logging: {
      level: 'info'
    }
  }
};

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
 */
async function loadTSConfig(path: string): Promise<AnyGPTConfig> {
  try {
    // Dynamic import for TypeScript/JavaScript files
    const module = await import(path);
    return module.default || module;
  } catch (error) {
    throw new Error(`Failed to load config from ${path}: ${error}`);
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
  const { configPath, mergeDefaults = true } = options;
  
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
      config = DEFAULT_CONFIG;
    }
  }
  
  // Merge with defaults if requested
  if (mergeDefaults && config !== DEFAULT_CONFIG) {
    config = mergeConfigs(DEFAULT_CONFIG, config);
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
