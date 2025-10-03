/**
 * Logger interface for consistent logging across packages
 * 
 * TYPES PACKAGE RULE: Only interfaces, types, and type aliases!
 * Concrete implementations belong in consuming packages.
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
