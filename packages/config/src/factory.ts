/**
 * Config factory for direct connector instantiation
 */

import type { IConnector } from '@anygpt/types';

export interface FactoryProviderConfig {
  name?: string;
  connector: IConnector;
  settings?: {
    defaultModel?: string;
    [key: string]: unknown;
  };
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
