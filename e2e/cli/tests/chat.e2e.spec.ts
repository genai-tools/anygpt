/**
 * E2E tests for chat command
 * Tests stateless chat interactions with different options
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { runCLI } from '../helpers/cli-runner.js';
import { createTestConfig, createCustomConfig } from '../helpers/test-config.js';
import { exactMatch } from '@anygpt/mock';

describe('chat command E2E', () => {
  let configPath: string;

  beforeAll(async () => {
    const fixtures = [
      exactMatch('test message', 'This is a test response', 'test-response'),
    ];
    configPath = await createTestConfig(fixtures);
  });

  describe('basic chat', () => {
    it('should send a chat message and get response', async () => {
      const result = await runCLI(['chat', 'test message'], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('This is a test response');
      expect(result.stdout).toContain('Usage:'); // Token usage info
    });

    it('should handle multi-word messages', async () => {
      const result = await runCLI(['chat', 'test message'], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('This is a test response');
    });

    it('should display token usage information', async () => {
      const result = await runCLI(['chat', 'test message'], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Usage:.*\d+.*input.*\d+.*output/i);
      expect(result.stdout).toMatch(/\d+.*tokens/i);
    });
  });

  describe('provider and model options', () => {
    it('should use default provider from config', async () => {
      const result = await runCLI(['chat', 'test message'], { configPath });

      expect(result.exitCode).toBe(0);
      // Should work with default mock provider
      expect(result.stdout).toContain('This is a test response');
    });

    it('should accept --model flag', async () => {
      const result = await runCLI(['chat', 'test message', '--model', 'mock-gpt-3.5-turbo'], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('This is a test response');
    });

    it('should accept --provider flag', async () => {
      const result = await runCLI(['chat', 'test message', '--provider', 'mock'], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('This is a test response');
    });
  });

  describe('output formats', () => {
    it('should output in default format', async () => {
      const result = await runCLI(['chat', 'test message'], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('This is a test response');
      expect(result.stdout).toContain('Usage:');
    });

    it.skip('should support JSON output format', async () => {
      // TODO: Implement --json flag for chat command
      const result = await runCLI(['chat', 'test message', '--json'], { configPath });

      expect(result.exitCode).toBe(0);
      
      // Should be valid JSON
      const response = JSON.parse(result.stdout);
      expect(response).toBeDefined();
      expect(response.choices).toBeDefined();
      expect(response.usage).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle missing config', async () => {
      const result = await runCLI(['chat', 'hello'], { configPath: '/nonexistent/config.ts' });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Config file not found');
    });

    it('should handle missing message argument', async () => {
      const result = await runCLI(['chat'], { configPath });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toLowerCase()).toMatch(/message|required/);
    });

    it('should handle invalid provider', async () => {
      const result = await runCLI(['chat', 'test message', '--provider', 'nonexistent'], { configPath });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toLowerCase()).toMatch(/provider.*not.*configured|not found/);
    });
  });

  describe('stateless behavior', () => {
    it('should not maintain context between calls', async () => {
      // First chat
      const result1 = await runCLI(['chat', 'test message'], { configPath });
      expect(result1.exitCode).toBe(0);

      // Second chat - should be independent
      const result2 = await runCLI(['chat', 'test message'], { configPath });
      expect(result2.exitCode).toBe(0);
      
      // Both should get the same response (no context)
      expect(result1.stdout).toContain('This is a test response');
      expect(result2.stdout).toContain('This is a test response');
    });
  });

  describe('performance', () => {
    it('should handle simulated delays', async () => {
      const delayedConfig = await createCustomConfig({ 
        fixtures: [exactMatch('test', 'response', 'test')],
        delay: 100 
      });

      const startTime = Date.now();
      const result = await runCLI(['chat', 'test'], { configPath: delayedConfig });
      const duration = Date.now() - startTime;

      expect(result.exitCode).toBe(0);
      expect(duration).toBeGreaterThanOrEqual(100); // Should respect delay
    });
  });
});
