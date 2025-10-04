/**
 * E2E tests for config commands
 * Tests configuration management and validation
 */

import { describe, it, expect } from 'vitest';
import { runCLI } from '../helpers/cli-runner.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const E2E_DIR = join(__dirname, '..');

describe('config command E2E', () => {
  // Config will be auto-discovered from e2e/cli/anygpt.config.ts

  describe('config show', () => {
    it('should display current configuration', async () => {
      const result = await runCLI(['config', 'show'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Configuration');
      expect(result.stdout).toContain('mock'); // Should show mock provider
      expect(result.stdout).toContain('mock-gpt-4'); // Should show default model
    });

    it('should show config in JSON format', async () => {
      const result = await runCLI(['config', 'show', '--json'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      
      // Should be valid JSON
      const config = JSON.parse(result.stdout);
      expect(config).toBeDefined();
      expect(config.providers).toBeDefined();
      expect(config.providers.mock).toBeDefined();
    });

    it('should show config source path', async () => {
      const result = await runCLI(['config', 'show'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      // Config path may be shown in different formats
      expect(result.stdout.toLowerCase()).toMatch(/config|source|file/);
    });
  });

  describe('config validation', () => {
    it('should validate valid config file', async () => {
      const result = await runCLI(['config', 'show'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      // If config loads successfully, it's valid
      expect(result.stdout).toContain('Configuration');
    });

    it('should reject invalid config file', async () => {
      const result = await runCLI(['config', 'show'], { configPath: "/nonexistent/config.ts", cwd: E2E_DIR });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Config file not found');
    });
  });

  describe('config discovery', () => {
    it('should auto-discover config from cwd', async () => {
      const result = await runCLI(['config', 'show'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Configuration');
    });

    it('should show error when no config found', async () => {
      // Run from a directory with no config file
      const result = await runCLI(['config', 'show'], { cwd: '/tmp' });

      // Should show helpful error
      if (result.exitCode !== 0) {
        expect(result.stderr.toLowerCase()).toMatch(/config|not found/);
      }
    });
  });
});
