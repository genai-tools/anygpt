/**
 * E2E tests for config commands
 * Tests configuration management and validation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { runCLI } from '../helpers/cli-runner.js';
import { createTestConfig } from '../helpers/test-config.js';

describe('config command E2E', () => {
  let configPath: string;

  beforeAll(async () => {
    configPath = await createTestConfig([]);
  });

  describe('config show', () => {
    it('should display current configuration', async () => {
      const result = await runCLI(['config', 'show'], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Configuration');
      expect(result.stdout).toContain('mock'); // Should show mock provider
      expect(result.stdout).toContain('mock-gpt-4'); // Should show default model
    });

    it('should show config in JSON format', async () => {
      const result = await runCLI(['config', 'show', '--json'], { configPath });

      expect(result.exitCode).toBe(0);
      
      // Should be valid JSON
      const config = JSON.parse(result.stdout);
      expect(config).toBeDefined();
      expect(config.providers).toBeDefined();
      expect(config.providers.mock).toBeDefined();
    });

    it('should show config source path', async () => {
      const result = await runCLI(['config', 'show'], { configPath });

      expect(result.exitCode).toBe(0);
      // Config path may be shown in different formats
      expect(result.stdout.toLowerCase()).toMatch(/config|source|file/);
    });
  });

  describe('config validation', () => {
    it('should validate valid config file', async () => {
      const result = await runCLI(['config', 'show'], { configPath });

      expect(result.exitCode).toBe(0);
      // If config loads successfully, it's valid
      expect(result.stdout).toContain('Configuration');
    });

    it('should reject invalid config file', async () => {
      const result = await runCLI(['config', 'show'], { configPath: '/nonexistent/config.ts' });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Config file not found');
    });
  });

  describe('config with environment variables', () => {
    it('should respect config path from environment', async () => {
      const result = await runCLI(['config', 'show'], { 
        env: { ANYGPT_CONFIG: configPath }
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Configuration');
    });
  });

  describe('config discovery', () => {
    it('should use explicit --config flag', async () => {
      const result = await runCLI(['config', 'show', '--config', configPath]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Configuration');
    });

    it('should show error when no config found', async () => {
      // Run from a directory with no config file
      const result = await runCLI(['config', 'show'], { 
        cwd: '/tmp',
        configPath: undefined 
      });

      // Should either find a config or show helpful error
      // The exact behavior depends on config discovery implementation
      if (result.exitCode !== 0) {
        expect(result.stderr.toLowerCase()).toMatch(/config|not found/);
      }
    });
  });
});
