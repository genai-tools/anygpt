/**
 * E2E tests for chat command
 * Tests stateless chat interactions with different options
 */

import { describe, it, expect } from 'vitest';
import { runCLI } from '../helpers/cli-runner.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const E2E_DIR = join(__dirname, '..');

describe('chat command E2E', () => {
  // Config will be auto-discovered from e2e/cli/anygpt.config.ts when running from e2e/cli directory

  describe('basic chat', () => {
    it('should send a chat message and get response', async () => {
      const result = await runCLI(['chat', 'test message'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('This is a test response');
      expect(result.stdout).toContain('Usage:'); // Token usage info
    });

    it('should display token usage information', async () => {
      const result = await runCLI(['chat', 'test message'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Usage:.*\d+.*input.*\d+.*output/i);
      expect(result.stdout).toMatch(/\d+.*tokens/i);
    });
  });

  describe('provider and model options', () => {
    it('should use default provider from config', async () => {
      const result = await runCLI(['chat', 'test message'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('This is a test response');
    });

    it('should accept --model flag', async () => {
      const result = await runCLI(['chat', 'test message', '--model', 'mock-gpt-3.5-turbo'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('This is a test response');
    });

    it('should accept --provider flag', async () => {
      const result = await runCLI(['chat', 'test message', '--provider', 'mock'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('This is a test response');
    });
  });

  describe('error handling', () => {
    it('should handle missing config', async () => {
      const result = await runCLI(['chat', 'hello'], { configPath: '/nonexistent/config.ts', cwd: E2E_DIR });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Config file not found');
    });

    it('should handle missing message argument', async () => {
      const result = await runCLI(['chat'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toLowerCase()).toMatch(/message|required/);
    });

    it('should handle invalid provider', async () => {
      const result = await runCLI(['chat', 'test message', '--provider', 'nonexistent'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toLowerCase()).toMatch(/provider.*not.*configured|not found/);
    });
  });

  describe('stateless behavior', () => {
    it('should not maintain context between calls', async () => {
      // First chat
      const result1 = await runCLI(['chat', 'test message'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });
      expect(result1.exitCode).toBe(0);

      // Second chat - should be independent
      const result2 = await runCLI(['chat', 'test message'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });
      expect(result2.exitCode).toBe(0);
      
      // Both should get the same response (no context)
      expect(result1.stdout).toContain('This is a test response');
      expect(result2.stdout).toContain('This is a test response');
    });
  });
});
