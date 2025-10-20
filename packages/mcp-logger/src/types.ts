/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /**
   * Log file path (absolute or relative to cwd)
   * @default './logs/mcp-server.log'
   */
  logFile?: string;

  /**
   * Minimum log level to write
   * @default 'info'
   */
  level?: LogLevel;

  /**
   * Maximum log file size in bytes before rotation
   * @default 10485760 (10MB)
   */
  maxSize?: number;

  /**
   * Maximum number of rotated log files to keep
   * @default 5
   */
  maxFiles?: number;

  /**
   * Whether to also log to stderr (for debugging)
   * @default false
   */
  enableStderr?: boolean;

  /**
   * Server name to include in log entries
   * @default 'mcp-server'
   */
  serverName?: string;

  /**
   * Whether to include timestamps in log entries
   * @default true
   */
  includeTimestamp?: boolean;

  /**
   * Whether to format logs as JSON
   * @default false
   */
  jsonFormat?: boolean;
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  serverName: string;
  message: string;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, unknown>;
}
