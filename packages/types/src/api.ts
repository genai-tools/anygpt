/**
 * API configuration types
 */

import type { IConnector } from './connector.js';

/**
 * API configuration for provider
 */
export interface ApiConfig {
  url: string;
  token?: string;
  headers?: Record<string, string>;
}

/**
 * Provider configuration - flexible connector approach
 */
export interface ProviderConfig {
  /** Connector package name (string) or direct connector instance */
  connector: string | IConnector;
  /** API configuration */
  api: ApiConfig;
  /** Connection timeout */
  timeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Wire protocol preference */
  wireApi?: 'chat' | 'responses';
}
