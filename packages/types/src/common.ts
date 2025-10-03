/**
 * Common utility types and interfaces
 */

import type { Logger } from './logger.js';

export interface ConnectorConfig {
  timeout?: number;
  maxRetries?: number;
  logger?: Logger;
  [key: string]: unknown;
}
