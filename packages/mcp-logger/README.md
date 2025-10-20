# @anygpt/mcp-logger

File-based logging for MCP servers with automatic rotation and multiple output formats.

## Features

- ✅ **File-based logging** - No console output, logs to files only
- ✅ **Automatic log rotation** - Rotate logs based on file size
- ✅ **Multiple log levels** - debug, info, warn, error
- ✅ **JSON and text formats** - Choose your preferred format
- ✅ **Async write queue** - Prevents race conditions
- ✅ **Optional stderr output** - For debugging during development
- ✅ **Child loggers** - Create contextual loggers
- ✅ **Metadata support** - Attach structured data to logs

## Installation

```bash
npm install @anygpt/mcp-logger
```

## Usage

### Basic Usage

```typescript
import { createLogger } from '@anygpt/mcp-logger';

const logger = createLogger({
  logFile: './logs/my-server.log',
  level: 'info',
  serverName: 'my-mcp-server',
});

logger.info('Server started');
logger.warn('Connection slow');
logger.error('Failed to connect', error);
```

### Configuration Options

```typescript
interface LoggerConfig {
  /** Log file path (default: './logs/mcp-server.log') */
  logFile?: string;

  /** Minimum log level (default: 'info') */
  level?: 'debug' | 'info' | 'warn' | 'error';

  /** Max file size before rotation in bytes (default: 10MB) */
  maxSize?: number;

  /** Max number of rotated files to keep (default: 5) */
  maxFiles?: number;

  /** Also log to stderr for debugging (default: false) */
  enableStderr?: boolean;

  /** Server name in log entries (default: 'mcp-server') */
  serverName?: string;

  /** Include timestamps (default: true) */
  includeTimestamp?: boolean;

  /** Format logs as JSON (default: false) */
  jsonFormat?: boolean;
}
```

### Log Rotation

Logs automatically rotate when they reach `maxSize`:

```typescript
const logger = createLogger({
  logFile: './logs/server.log',
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5, // Keep 5 rotated files
});

// Files created:
// - server.log (current)
// - server.log.1 (most recent rotation)
// - server.log.2
// - server.log.3
// - server.log.4
// - server.log.5 (oldest, will be deleted on next rotation)
```

### JSON Format

Enable JSON format for structured logging:

```typescript
const logger = createLogger({
  logFile: './logs/server.log',
  jsonFormat: true,
});

logger.info('User logged in', { userId: '123', ip: '192.168.1.1' });

// Output:
// {"timestamp":"2024-01-15T10:30:00.000Z","level":"info","serverName":"mcp-server","message":"User logged in","metadata":{"userId":"123","ip":"192.168.1.1"}}
```

### Child Loggers

Create child loggers with additional context:

```typescript
const mainLogger = createLogger({
  logFile: './logs/server.log',
  serverName: 'main-server',
});

const toolLogger = mainLogger.child({ serverName: 'tool-executor' });

mainLogger.info('Server started');
toolLogger.info('Tool executed');

// Output:
// [2024-01-15T10:30:00.000Z] [main-server] INFO: Server started
// [2024-01-15T10:30:05.000Z] [tool-executor] INFO: Tool executed
```

### Error Logging

Log errors with full stack traces:

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error as Error, {
    operation: 'riskyOperation',
    userId: '123',
  });
}

// Output:
// [2024-01-15T10:30:00.000Z] [mcp-server] ERROR: Operation failed
//   Error: Connection timeout
//   Stack: Error: Connection timeout
//     at riskyOperation (file.ts:10:15)
//     ...
//   Metadata: {
//     "operation": "riskyOperation",
//     "userId": "123"
//   }
```

### Flushing Logs

Ensure all logs are written before exiting:

```typescript
const logger = createLogger({ logFile: './logs/server.log' });

logger.info('Starting shutdown');
await logger.flush(); // Wait for all logs to be written
process.exit(0);
```

## Integration with MCP Servers

### MCP Discovery Server Example

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { createLogger } from '@anygpt/mcp-logger';

const logger = createLogger({
  logFile: './logs/mcp-discovery.log',
  level: process.env.LOG_LEVEL || 'info',
  serverName: 'mcp-discovery',
  maxSize: 10 * 1024 * 1024,
  maxFiles: 5,
});

const server = new Server(
  { name: 'mcp-discovery-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  logger.info('Tool called', { tool: request.params.name });
  try {
    const result = await executeTool(request.params.name);
    logger.info('Tool executed successfully', { tool: request.params.name });
    return result;
  } catch (error) {
    logger.error('Tool execution failed', error as Error, {
      tool: request.params.name,
    });
    throw error;
  }
});

// Flush logs on shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down');
  await logger.flush();
  process.exit(0);
});
```

## Log Output Examples

### Text Format (Default)

```
[2024-01-15T10:30:00.000Z] [mcp-server] INFO: Server started
[2024-01-15T10:30:05.000Z] [mcp-server] INFO: Tool executed
  Metadata: {
    "toolName": "search_tools",
    "duration": 123
  }
[2024-01-15T10:30:10.000Z] [mcp-server] ERROR: Connection failed
  Error: ECONNREFUSED
  Stack: Error: ECONNREFUSED
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1144:16)
```

### JSON Format

```json
{"timestamp":"2024-01-15T10:30:00.000Z","level":"info","serverName":"mcp-server","message":"Server started"}
{"timestamp":"2024-01-15T10:30:05.000Z","level":"info","serverName":"mcp-server","message":"Tool executed","metadata":{"toolName":"search_tools","duration":123}}
{"timestamp":"2024-01-15T10:30:10.000Z","level":"error","serverName":"mcp-server","message":"Connection failed","error":{"message":"ECONNREFUSED","stack":"Error: ECONNREFUSED\n    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1144:16)","code":"ECONNREFUSED"}}
```

## Environment Variables

Control logging via environment variables:

```bash
# Set log level
export LOG_LEVEL=debug

# Enable stderr output
export LOG_STDERR=true

# Set log file path
export LOG_FILE=./logs/custom.log
```

```typescript
const logger = createLogger({
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  enableStderr: process.env.LOG_STDERR === 'true',
  logFile: process.env.LOG_FILE || './logs/mcp-server.log',
});
```

## Best Practices

1. **Always flush logs before exit**:
   ```typescript
   process.on('SIGINT', async () => {
     await logger.flush();
     process.exit(0);
   });
   ```

2. **Use appropriate log levels**:
   - `debug` - Detailed debugging information
   - `info` - General informational messages
   - `warn` - Warning messages for potential issues
   - `error` - Error messages for failures

3. **Include metadata for context**:
   ```typescript
   logger.info('Request processed', {
     requestId: '123',
     duration: 456,
     userId: 'user-789',
   });
   ```

4. **Use child loggers for components**:
   ```typescript
   const toolLogger = mainLogger.child({ serverName: 'tool-executor' });
   const cacheLogger = mainLogger.child({ serverName: 'cache-manager' });
   ```

5. **Configure rotation for production**:
   ```typescript
   const logger = createLogger({
     maxSize: 50 * 1024 * 1024, // 50MB
     maxFiles: 10, // Keep 10 rotated files
   });
   ```

## License

MIT
