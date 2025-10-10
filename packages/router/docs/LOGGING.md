# Logging Guide

This guide explains how logging works in the AnyGPT Router and how to integrate custom loggers.

## Architecture

The router uses a **logger facade pattern** with dependency injection:

```
Application Logger (CLI/MCP/Custom)
    ↓ (injected via config)
BaseConnector (uses injected logger)
    ↓ (fallback if no logger provided)
NoOpLogger (silent fallback)
```

## Logger Interface

All loggers must implement the `Logger` interface from `@anygpt/types`:

```typescript
interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
```

## Usage

### 1. Creating a Custom Logger

```typescript
import type { Logger } from '@anygpt/router';

class ConsoleLogger implements Logger {
  debug(message: string, ...args: unknown[]): void {
    console.log('[DEBUG]', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.log('[INFO]', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn('[WARN]', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error('[ERROR]', message, ...args);
  }
}
```

### 2. Injecting Logger into Connectors

**Option A: Via ConnectorConfig (Direct Usage)**

```typescript
import { OpenAIConnector } from '@anygpt/openai';

const logger = new ConsoleLogger();

const connector = new OpenAIConnector({
  apiKey: process.env.OPENAI_API_KEY,
  logger: logger  // ← Inject logger here
});
```

**Option B: Via setupRouterFromFactory (Recommended)**

```typescript
import { setupRouterFromFactory, config } from '@anygpt/config';
import { openai } from '@anygpt/openai';

const logger = new ConsoleLogger();

const myConfig = config({
  providers: {
    openai: {
      connector: openai({ baseURL: '...' })
    }
  }
});

// Logger gets injected into all connectors
const { router } = await setupRouterFromFactory(myConfig, logger);
```

### 3. NoOpLogger Fallback

If no logger is provided, connectors use a built-in `NoOpLogger` that silently discards all log messages:

```typescript
// No logger provided
const connector = new OpenAIConnector({
  apiKey: process.env.OPENAI_API_KEY
  // logger is undefined
});

// Connector will use NoOpLogger internally
// No logs will be emitted
```

This is useful for:
- Production environments where logging is handled elsewhere
- Testing scenarios where log output is not needed
- Embedded usage where logging would be intrusive

## Examples

### CLI Logger (Verbose Mode)

```typescript
class CLILogger implements Logger {
  constructor(private verbose = false) {}

  debug(message: string, ...args: unknown[]): void {
    if (this.verbose) {
      console.log('[DEBUG]', message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.verbose) {
      console.log(message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(message, ...args);
  }
}

// Usage
const logger = new CLILogger(process.argv.includes('--verbose'));
```

### MCP Server Logger (stderr)

```typescript
class MCPLogger implements Logger {
  private shouldLog(level: string): boolean {
    const logLevel = process.env.MCP_LOG_LEVEL || 'info';
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[logLevel];
  }

  debug(message: string): void {
    if (this.shouldLog('debug')) {
      console.error(`[AnyGPT MCP] DEBUG: ${message}`);
    }
  }

  info(message: string): void {
    if (this.shouldLog('info')) {
      console.error(`[AnyGPT MCP] INFO: ${message}`);
    }
  }

  warn(message: string): void {
    if (this.shouldLog('warn')) {
      console.error(`[AnyGPT MCP] WARN: ${message}`);
    }
  }

  error(message: string, error?: Error): void {
    if (this.shouldLog('error')) {
      console.error(`[AnyGPT MCP] ERROR: ${message}`);
      if (error) {
        console.error(`[AnyGPT MCP] ERROR: ${error.stack || error.message}`);
      }
    }
  }
}
```

### File Logger

```typescript
import * as fs from 'fs';

class FileLogger implements Logger {
  constructor(private logFile: string) {}

  private write(level: string, message: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const logLine = `${timestamp} [${level}] ${message} ${args.join(' ')}\n`;
    fs.appendFileSync(this.logFile, logLine);
  }

  debug(message: string, ...args: unknown[]): void {
    this.write('DEBUG', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.write('INFO', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.write('WARN', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.write('ERROR', message, ...args);
  }
}

// Usage
const logger = new FileLogger('/var/log/anygpt.log');
```

### Structured Logger (JSON)

```typescript
class StructuredLogger implements Logger {
  private log(level: string, message: string, ...args: unknown[]): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: args.length > 0 ? args : undefined
    };
    console.log(JSON.stringify(entry));
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }
}
```

## Best Practices

### 1. One Logger Per Process

Create a single logger instance at application startup and inject it into all connectors:

```typescript
// ✅ Good: One logger instance
const logger = new ConsoleLogger();
const { router } = await setupRouterFromFactory(config, logger);

// ❌ Bad: Multiple logger instances
const connector1 = new OpenAIConnector({ logger: new ConsoleLogger() });
const connector2 = new OpenAIConnector({ logger: new ConsoleLogger() });
```

### 2. Use Appropriate Log Levels

- **debug**: Detailed diagnostic information (disabled by default)
- **info**: General informational messages (connector loading, configuration)
- **warn**: Warning messages that don't prevent operation
- **error**: Error conditions that should be investigated

```typescript
logger.debug('Request payload:', request);  // Verbose details
logger.info('Loaded connector for provider: openai');  // Important events
logger.warn('Retrying request after timeout');  // Recoverable issues
logger.error('Failed to initialize connector', error);  // Critical errors
```

### 3. Respect User Preferences

Allow users to control logging verbosity:

```typescript
class ConfigurableLogger implements Logger {
  constructor(private level: 'debug' | 'info' | 'warn' | 'error' = 'info') {}

  private shouldLog(messageLevel: string): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[messageLevel] >= levels[this.level];
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log('[DEBUG]', message, ...args);
    }
  }
  // ... other methods
}

// Usage
const logLevel = process.env.LOG_LEVEL || 'info';
const logger = new ConfigurableLogger(logLevel);
```

### 4. Don't Log Sensitive Data

Never log API keys, tokens, or user data:

```typescript
// ❌ Bad: Logs API key
logger.debug('Config:', { apiKey: config.apiKey });

// ✅ Good: Redacts sensitive data
logger.debug('Config:', { 
  apiKey: config.apiKey ? '[REDACTED]' : undefined,
  baseURL: config.baseURL 
});
```

## Testing with Loggers

### Mock Logger for Tests

```typescript
import { vi } from 'vitest';

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Verify logging behavior
await setupRouterFromFactory(config, mockLogger);
expect(mockLogger.info).toHaveBeenCalledWith('Loaded connector...');
```

### Silent Logger for Tests

```typescript
const silentLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
};

// No log output during tests
const { router } = await setupRouterFromFactory(config, silentLogger);
```

## Integration Examples

### With Pino

```typescript
import pino from 'pino';
import type { Logger } from '@anygpt/router';

class PinoLogger implements Logger {
  private pino = pino();

  debug(message: string, ...args: unknown[]): void {
    this.pino.debug({ args }, message);
  }

  info(message: string, ...args: unknown[]): void {
    this.pino.info({ args }, message);
  }

  warn(message: string, ...args: unknown[]): void {
    this.pino.warn({ args }, message);
  }

  error(message: string, ...args: unknown[]): void {
    this.pino.error({ args }, message);
  }
}
```

### With Winston

```typescript
import winston from 'winston';
import type { Logger } from '@anygpt/router';

class WinstonLogger implements Logger {
  private winston = winston.createLogger({
    transports: [new winston.transports.Console()]
  });

  debug(message: string, ...args: unknown[]): void {
    this.winston.debug(message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.winston.info(message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.winston.warn(message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.winston.error(message, ...args);
  }
}
```

## Troubleshooting

### Logs Not Appearing

**Problem**: Logger is provided but no logs appear

**Solution**: Check if logger is actually being injected:

```typescript
// Verify logger injection
const connector = providerConfig.connector;
console.log('Logger injected?', connector.logger !== undefined);
```

### Multiple Log Instances

**Problem**: Seeing duplicate logs

**Solution**: Ensure only one logger instance is created and passed to `setupRouterFromFactory`:

```typescript
// ✅ Create logger once
const logger = new ConsoleLogger();
await setupRouterFromFactory(config, logger);
```

### Silent Connectors

**Problem**: Connectors not logging anything

**Solution**: This is expected behavior when no logger is provided. Connectors use `NoOpLogger` by default. Inject a logger if you need logging.

## See Also

- [Configuration Guide](CONFIG.md) - How to configure connectors
- [API Reference](API.md) - Complete API documentation
- [Architecture](ARCHITECTURE.md) - System design and patterns
