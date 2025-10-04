/**
 * Configuration types for AnyGPT
 */

/**
 * Connector configuration with dynamic loading
 */
export interface ConnectorConfig {
  /** Package name to dynamically import (e.g., "@anygpt/openai") */
  connector: string;
  /** Optional connector type identifier (legacy support) */
  type?: string;
  /** Configuration passed to the connector */
  config?: {
    apiKey?: string;
    baseURL?: string;
    timeout?: number;
    maxRetries?: number;
    [key: string]: unknown;
  };
  /** Optional options bag for alternative connector definitions */
  options?: Record<string, unknown>;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** Human-readable name */
  name?: string;
  /** Connector configuration */
  connector: ConnectorConfig;
  /** Provider-specific settings */
  settings?: {
    defaultModel?: string;
    [key: string]: unknown;
  };
}

/**
 * Main AnyGPT configuration
 */
export interface AnyGPTConfig {
  /** Configuration version for future compatibility */
  version?: string;
  
  /** Provider configurations */
  providers: Record<string, ProviderConfig>;
  
  /** Global settings */
  settings?: {
    /** Default provider to use */
    defaultProvider?: string;
    /** Global timeout */
    timeout?: number;
    /** Global retry settings */
    maxRetries?: number;
    /** Logging configuration */
    logging?: {
      level?: 'debug' | 'info' | 'warn' | 'error';
      file?: string;
    };
  };
}

/**
 * Configuration loading options
 */
export interface ConfigLoadOptions {
  /** Custom config file path */
  configPath?: string;
  /** Environment to load config for */
  env?: string;
  /** Whether to merge with default config */
  mergeDefaults?: boolean;
}
