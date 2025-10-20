/**
 * @anygpt/mcp-logger - File-based logging for MCP servers
 *
 * Provides a robust file-based logging solution for MCP servers with:
 * - Automatic log rotation based on file size
 * - Multiple log levels (debug, info, warn, error)
 * - JSON and text output formats
 * - Optional stderr output for debugging
 * - Async write queue to prevent race conditions
 *
 * @example
 * ```typescript
 * import { createLogger } from '@anygpt/mcp-logger';
 *
 * const logger = createLogger({
 *   logFile: './logs/my-server.log',
 *   level: 'info',
 *   serverName: 'my-mcp-server',
 * });
 *
 * logger.info('Server started');
 * logger.error('Failed to connect', error);
 * ```
 */

export { MCPLogger, createLogger } from './logger.js';
export type { LoggerConfig, LogLevel, LogEntry } from './types.js';
