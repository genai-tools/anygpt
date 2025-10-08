/**
 * Simple logger for MCP server
 * Uses stderr as required by MCP protocol (stdout is for JSON-RPC)
 */

const LOG_LEVEL = process.env.MCP_LOG_LEVEL || 'info';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[LOG_LEVEL as LogLevel];
}

function formatMessage(level: LogLevel, message: string): string {
  const prefix = level === 'error' ? 'ERROR' : level === 'warn' ? 'WARN' : 'INFO';
  return `[AnyGPT MCP] ${prefix}: ${message}`;
}

export const logger = {
  debug(message: string): void {
    if (shouldLog('debug')) {
      console.error(`[AnyGPT MCP] DEBUG: ${message}`);
    }
  },

  info(message: string): void {
    if (shouldLog('info')) {
      console.error(formatMessage('info', message));
    }
  },

  warn(message: string): void {
    if (shouldLog('warn')) {
      console.error(formatMessage('warn', message));
    }
  },

  error(message: string, error?: Error): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message));
      if (error) {
        console.error(`[AnyGPT MCP] ERROR: ${error.stack || error.message}`);
      }
    }
  },
};
