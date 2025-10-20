import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { MCPLogger, createLogger } from './logger.js';

const TEST_LOG_DIR = resolve('./test-logs');
const TEST_LOG_FILE = resolve(TEST_LOG_DIR, 'test.log');

describe('MCPLogger', () => {
  beforeEach(async () => {
    // Clean up test logs before each test
    if (existsSync(TEST_LOG_DIR)) {
      await rm(TEST_LOG_DIR, { recursive: true, force: true });
    }
    await mkdir(TEST_LOG_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test logs after each test
    if (existsSync(TEST_LOG_DIR)) {
      await rm(TEST_LOG_DIR, { recursive: true, force: true });
    }
  });

  describe('createLogger', () => {
    it('should create a logger with default config', () => {
      const logger = createLogger();
      expect(logger).toBeInstanceOf(MCPLogger);
    });

    it('should create a logger with custom config', () => {
      const logger = createLogger({
        logFile: TEST_LOG_FILE,
        level: 'debug',
        serverName: 'test-server',
      });
      expect(logger).toBeInstanceOf(MCPLogger);
    });
  });

  describe('logging', () => {
    it('should write info log to file', async () => {
      const logger = new MCPLogger({
        logFile: TEST_LOG_FILE,
        level: 'info',
        serverName: 'test-server',
      });

      logger.info('Test message');
      await logger.flush();

      const content = await readFile(TEST_LOG_FILE, 'utf8');
      expect(content).toContain('INFO: Test message');
      expect(content).toContain('[test-server]');
    });

    it('should write error log with error object', async () => {
      const logger = new MCPLogger({
        logFile: TEST_LOG_FILE,
        level: 'error',
        serverName: 'test-server',
      });

      const error = new Error('Test error');
      logger.error('Error occurred', error);
      await logger.flush();

      const content = await readFile(TEST_LOG_FILE, 'utf8');
      expect(content).toContain('ERROR: Error occurred');
      expect(content).toContain('Error: Test error');
    });

    it('should respect log level', async () => {
      const logger = new MCPLogger({
        logFile: TEST_LOG_FILE,
        level: 'warn',
        serverName: 'test-server',
      });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      await logger.flush();

      const content = await readFile(TEST_LOG_FILE, 'utf8');
      expect(content).not.toContain('Debug message');
      expect(content).not.toContain('Info message');
      expect(content).toContain('Warning message');
    });

    it('should include metadata in logs', async () => {
      const logger = new MCPLogger({
        logFile: TEST_LOG_FILE,
        level: 'info',
        serverName: 'test-server',
      });

      logger.info('Test with metadata', { userId: '123', action: 'login' });
      await logger.flush();

      const content = await readFile(TEST_LOG_FILE, 'utf8');
      expect(content).toContain('userId');
      expect(content).toContain('123');
      expect(content).toContain('action');
      expect(content).toContain('login');
    });

    it('should format logs as JSON when enabled', async () => {
      const logger = new MCPLogger({
        logFile: TEST_LOG_FILE,
        level: 'info',
        serverName: 'test-server',
        jsonFormat: true,
      });

      logger.info('JSON test');
      await logger.flush();

      const content = await readFile(TEST_LOG_FILE, 'utf8');
      const parsed = JSON.parse(content.trim());
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('JSON test');
      expect(parsed.serverName).toBe('test-server');
    });

    it('should include timestamp by default', async () => {
      const logger = new MCPLogger({
        logFile: TEST_LOG_FILE,
        level: 'info',
        serverName: 'test-server',
      });

      logger.info('Timestamp test');
      await logger.flush();

      const content = await readFile(TEST_LOG_FILE, 'utf8');
      expect(content).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it('should omit timestamp when disabled', async () => {
      const logger = new MCPLogger({
        logFile: TEST_LOG_FILE,
        level: 'info',
        serverName: 'test-server',
        includeTimestamp: false,
      });

      logger.info('No timestamp test');
      await logger.flush();

      const content = await readFile(TEST_LOG_FILE, 'utf8');
      expect(content).not.toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      expect(content).toContain('[test-server] INFO: No timestamp test');
    });
  });

  describe('log rotation', () => {
    it('should rotate log when max size is reached', async () => {
      const logger = new MCPLogger({
        logFile: TEST_LOG_FILE,
        level: 'info',
        serverName: 'test-server',
        maxSize: 100, // Very small size to trigger rotation
        maxFiles: 3,
      });

      // Write enough logs to trigger rotation
      for (let i = 0; i < 10; i++) {
        logger.info(`Log message ${i}`);
      }
      await logger.flush();

      // Check that rotated files exist
      const rotatedFile = `${TEST_LOG_FILE}.1`;
      expect(existsSync(rotatedFile)).toBe(true);
    });

    it('should keep only maxFiles rotated logs', async () => {
      const logger = new MCPLogger({
        logFile: TEST_LOG_FILE,
        level: 'info',
        serverName: 'test-server',
        maxSize: 50,
        maxFiles: 2,
      });

      // Write many logs to trigger multiple rotations
      for (let i = 0; i < 50; i++) {
        logger.info(`Log message ${i}`);
      }
      await logger.flush();

      // Should have at most maxFiles + 1 (current + rotated)
      expect(existsSync(TEST_LOG_FILE)).toBe(true);
      expect(existsSync(`${TEST_LOG_FILE}.1`)).toBe(true);
      expect(existsSync(`${TEST_LOG_FILE}.2`)).toBe(true);
      expect(existsSync(`${TEST_LOG_FILE}.3`)).toBe(false);
    });
  });

  describe('child logger', () => {
    it('should create child logger with different server name', async () => {
      const parentLogger = new MCPLogger({
        logFile: TEST_LOG_FILE,
        level: 'info',
        serverName: 'parent-server',
      });

      const childLogger = parentLogger.child({ serverName: 'child-server' });

      parentLogger.info('Parent message');
      childLogger.info('Child message');
      await parentLogger.flush();
      await childLogger.flush();

      const content = await readFile(TEST_LOG_FILE, 'utf8');
      expect(content).toContain('[parent-server]');
      expect(content).toContain('[child-server]');
    });
  });

  describe('error handling', () => {
    it('should handle missing log directory', async () => {
      const nonExistentDir = resolve(TEST_LOG_DIR, 'nested', 'deep', 'test.log');
      const logger = new MCPLogger({
        logFile: nonExistentDir,
        level: 'info',
        serverName: 'test-server',
      });

      logger.info('Test message');
      await logger.flush();

      expect(existsSync(nonExistentDir)).toBe(true);
      const content = await readFile(nonExistentDir, 'utf8');
      expect(content).toContain('Test message');
    });
  });
});
