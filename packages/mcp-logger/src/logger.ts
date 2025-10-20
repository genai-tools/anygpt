import { writeFile, appendFile, stat, rename, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import type { LoggerConfig, LogLevel, LogEntry } from './types.js';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * File-based logger for MCP servers
 * Supports log rotation and multiple output formats
 */
export class MCPLogger {
  private config: Required<LoggerConfig>;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(config: LoggerConfig = {}) {
    this.config = {
      logFile: config.logFile || './logs/mcp-server.log',
      level: config.level || 'info',
      maxSize: config.maxSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 5,
      enableStderr: config.enableStderr || false,
      serverName: config.serverName || 'mcp-server',
      includeTimestamp: config.includeTimestamp ?? true,
      jsonFormat: config.jsonFormat || false,
    };

    // Ensure log directory exists
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory(): Promise<void> {
    const logDir = dirname(resolve(this.config.logFile));
    if (!existsSync(logDir)) {
      await mkdir(logDir, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVELS[level] >= LEVELS[this.config.level];
  }

  private formatEntry(entry: LogEntry): string {
    if (this.config.jsonFormat) {
      return JSON.stringify(entry);
    }

    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(`[${entry.timestamp}]`);
    }

    parts.push(`[${entry.serverName}]`);
    parts.push(`${entry.level.toUpperCase()}:`);
    parts.push(entry.message);

    if (entry.error) {
      parts.push(`\n  Error: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`\n  Stack: ${entry.error.stack}`);
      }
      if (entry.error.code) {
        parts.push(`\n  Code: ${entry.error.code}`);
      }
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(`\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`);
    }

    return parts.join(' ');
  }

  private async checkRotation(): Promise<void> {
    try {
      const stats = await stat(this.config.logFile);
      if (stats.size >= this.config.maxSize) {
        await this.rotateLog();
      }
    } catch (err) {
      // File doesn't exist yet, no rotation needed
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  private async rotateLog(): Promise<void> {
    // Delete oldest log file if we've reached max files
    const oldestLog = `${this.config.logFile}.${this.config.maxFiles}`;
    if (existsSync(oldestLog)) {
      await unlink(oldestLog);
    }

    // Rotate existing log files
    for (let i = this.config.maxFiles - 1; i >= 1; i--) {
      const oldFile = `${this.config.logFile}.${i}`;
      const newFile = `${this.config.logFile}.${i + 1}`;
      if (existsSync(oldFile)) {
        await rename(oldFile, newFile);
      }
    }

    // Rotate current log file
    if (existsSync(this.config.logFile)) {
      await rename(this.config.logFile, `${this.config.logFile}.1`);
    }
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    const formattedEntry = this.formatEntry(entry);
    const logLine = `${formattedEntry}\n`;

    // Check if rotation is needed
    await this.checkRotation();

    // Write to file
    try {
      if (existsSync(this.config.logFile)) {
        await appendFile(this.config.logFile, logLine, 'utf8');
      } else {
        await writeFile(this.config.logFile, logLine, 'utf8');
      }
    } catch {
      // If file write fails, try to create directory and retry
      await this.ensureLogDirectory();
      await writeFile(this.config.logFile, logLine, 'utf8');
    }

    // Also log to stderr if enabled
    if (this.config.enableStderr) {
      process.stderr.write(logLine);
    }
  }

  private log(
    level: LogLevel,
    message: string,
    error?: Error,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      serverName: this.config.serverName,
      message,
    };

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as NodeJS.ErrnoException).code,
      };
    }

    if (metadata) {
      entry.metadata = metadata;
    }

    // Queue the write to avoid race conditions
    this.writeQueue = this.writeQueue
      .then(() => this.writeLog(entry))
      .catch((writeError) => {
        // Last resort: log to stderr if file write fails
        process.stderr.write(
          `[MCPLogger] Failed to write log: ${writeError.message}\n`
        );
        process.stderr.write(`[MCPLogger] Original log: ${this.formatEntry(entry)}\n`);
      });
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, undefined, metadata);
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, undefined, metadata);
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, undefined, metadata);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log('error', message, error, metadata);
  }

  /**
   * Flush any pending log writes
   */
  async flush(): Promise<void> {
    await this.writeQueue;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: { serverName?: string; metadata?: Record<string, unknown> }): MCPLogger {
    const childConfig = { ...this.config };
    if (context.serverName) {
      childConfig.serverName = context.serverName;
    }
    return new MCPLogger(childConfig);
  }
}

/**
 * Create a new MCP logger instance
 */
export function createLogger(config?: LoggerConfig): MCPLogger {
  return new MCPLogger(config);
}
