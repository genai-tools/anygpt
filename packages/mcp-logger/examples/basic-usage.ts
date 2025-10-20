#!/usr/bin/env node
/**
 * Basic usage example for @anygpt/mcp-logger
 * 
 * Run with: npx tsx examples/basic-usage.ts
 */

import { createLogger } from '../src/index.js';

async function main() {
  // Create logger with custom configuration
  const logger = createLogger({
    logFile: './logs/example.log',
    level: 'debug',
    serverName: 'example-server',
    maxSize: 1024 * 1024, // 1MB
    maxFiles: 3,
    enableStderr: true, // Also log to stderr for this example
  });

  // Log different levels
  logger.debug('This is a debug message');
  logger.info('Server started successfully');
  logger.warn('Connection is slow', { latency: 500 });

  // Log with metadata
  logger.info('User logged in', {
    userId: '123',
    username: 'john.doe',
    timestamp: new Date().toISOString(),
  });

  // Log errors
  try {
    throw new Error('Something went wrong');
  } catch (error) {
    logger.error('Operation failed', error as Error, {
      operation: 'exampleOperation',
      retryCount: 3,
    });
  }

  // Create child logger
  const toolLogger = logger.child({ serverName: 'tool-executor' });
  toolLogger.info('Tool executed', { toolName: 'search_tools', duration: 123 });

  // Flush logs before exit
  await logger.flush();
  await toolLogger.flush();

  console.log('\n✅ Logs written to ./logs/example.log');
  console.log('Check the file to see the output!\n');
}

main().catch(console.error);
