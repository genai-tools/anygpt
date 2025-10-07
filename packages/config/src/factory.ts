/**
 * Config factory for direct connector instantiation
 */

import type { IConnector } from '@anygpt/types';

export interface ModelMetadata {
  tags: string[];
  [key: string]: unknown; // Allow additional metadata like cost, context window, etc.
}

export interface FactoryProviderConfig {
  name?: string;
  connector: IConnector;
  settings?: {
    defaultModel?: string;
    [key: string]: unknown;
  };
  models?: Record<string, ModelMetadata>;
}

export interface ModelAlias {
  provider: string;
  model?: string;  // Direct model name
  tag?: string;    // Or reference a tag
}

export interface FactoryConfig {
  defaults?: {
    provider?: string;
    model?: string;
    timeout?: number;
    maxRetries?: number;
    logging?: {
      level?: 'debug' | 'info' | 'warn' | 'error';
    };
    // Per-provider defaults
    providers?: Record<string, {
      model?: string;
      [key: string]: unknown;
    }>;
    // Model aliases for cross-provider model mapping
    aliases?: Record<string, ModelAlias[]>;
  };
  providers: Record<string, FactoryProviderConfig>;
}

/**
 * Factory function to create AnyGPT configuration with direct connector instances
 */
export function config(factoryConfig: FactoryConfig): FactoryConfig {
  // Just return the config as-is - no need to process settings since we eliminated them
  return factoryConfig;
}
