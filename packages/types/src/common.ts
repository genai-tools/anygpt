/**
 * Common utility types and interfaces
 */

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface ConnectorConfig {
  timeout?: number;
  maxRetries?: number;
  logger?: Logger;
  [key: string]: unknown;
}
