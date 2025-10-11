/**
 * E2E tests for benchmark command
 * Tests model performance comparison across providers
 */

import { describe, it, expect } from 'vitest';
import { runCLI } from '../helpers/cli-runner.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, rmSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const E2E_DIR = join(__dirname, '..');

describe('benchmark command E2E', () => {
  describe('basic benchmarking', () => {
    it('should benchmark default model with table output', async () => {
      const result = await runCLI(['benchmark'], {
        configPath: join(E2E_DIR, 'anygpt.config.ts'),
        cwd: E2E_DIR,
      });

      // Benchmark uses default prompt, should succeed
      if (result.exitCode !== 0) {
        console.error('STDERR:', result.stderr);
        console.error('STDOUT:', result.stdout);
      }
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('mock');
    });

    it('should benchmark specific provider', async () => {
      const result = await runCLI(['benchmark', '--provider', 'mock'], {
        configPath: join(E2E_DIR, 'anygpt.config.ts'),
        cwd: E2E_DIR,
      });

      if (result.exitCode !== 0) {
        console.error('STDERR:', result.stderr);
      }
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('mock');
    });

    it('should benchmark specific model', async () => {
      const result = await runCLI(
        ['benchmark', '--provider', 'mock', '--model', 'test-model'],
        {
          configPath: join(E2E_DIR, 'anygpt.config.ts'),
          cwd: E2E_DIR,
        }
      );

      if (result.exitCode !== 0) {
        console.error('STDERR:', result.stderr);
      }
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('mock');
      expect(result.stdout).toContain('test-model');
    });
  });

  describe('output formats', () => {
    it('should output JSON format with --json flag', async () => {
      const result = await runCLI(['benchmark', '--json'], {
        configPath: join(E2E_DIR, 'anygpt.config.ts'),
        cwd: E2E_DIR,
      });

      expect(result.exitCode).toBe(0);

      // Parse JSON output
      const jsonOutput = JSON.parse(result.stdout);
      expect(jsonOutput).toBeInstanceOf(Array);
      expect(jsonOutput.length).toBeGreaterThan(0);

      const firstResult = jsonOutput[0];
      expect(firstResult).toHaveProperty('provider');
      expect(firstResult).toHaveProperty('model');
      expect(firstResult).toHaveProperty('status');
      expect(firstResult).toHaveProperty('responseTime');
      expect(firstResult).toHaveProperty('responseSize');
    });

    it('should save responses to output directory', async () => {
      const outputDir = join(E2E_DIR, 'test-output-benchmark');
      // Clean up if exists
      if (existsSync(outputDir)) {
        rmSync(outputDir, { recursive: true, force: true });
      }

      const result = await runCLI(['benchmark', '--output', outputDir], {
        configPath: join(E2E_DIR, 'anygpt.config.ts'),
        cwd: E2E_DIR,
      });

      expect(result.exitCode).toBe(0);
      expect(existsSync(outputDir)).toBe(true);

      // Check that files were created
      const files = readdirSync(outputDir);
      expect(files.length).toBeGreaterThan(0);

      // Clean up
      rmSync(outputDir, { recursive: true, force: true });
    });
  });

  describe('multiple iterations', () => {
    it('should run multiple iterations and show statistics', async () => {
      const result = await runCLI(['benchmark', '--iterations', '3'], {
        configPath: join(E2E_DIR, 'anygpt.config.ts'),
        cwd: E2E_DIR,
      });

      expect(result.exitCode).toBe(0);
      // Should show avg/min/max statistics for multiple iterations
      expect(result.stdout).toMatch(/avg|min|max/i);
    });
  });

  describe('model selection modes', () => {
    it('should benchmark all models from provider with --provider only', async () => {
      const result = await runCLI(['benchmark', '--provider', 'mock'], {
        configPath: join(E2E_DIR, 'anygpt.config.ts'),
        cwd: E2E_DIR,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('mock');
    });

    it('should benchmark specific models with --models flag', async () => {
      const result = await runCLI(
        ['benchmark', '--models', 'mock:test-model'],
        {
          configPath: join(E2E_DIR, 'anygpt.config.ts'),
          cwd: E2E_DIR,
        }
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('mock');
      expect(result.stdout).toContain('test-model');
    });
  });

  describe('stdin support', () => {
    it('should read prompt from stdin with --stdin flag', async () => {
      const result = await runCLI(['benchmark', '--stdin'], {
        configPath: join(E2E_DIR, 'anygpt.config.ts'),
        cwd: E2E_DIR,
        stdin: 'Test prompt from stdin',
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('mock');
    });
  });

  describe('error handling', () => {
    it.skip('should show error when no prompt provided', async () => {
      // Skipped: benchmark has a default prompt, so this test is not applicable
      const result = await runCLI(['benchmark'], {
        configPath: join(E2E_DIR, 'anygpt.config.ts'),
        cwd: E2E_DIR,
      });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toMatch(/prompt.*required/i);
    });

    it('should handle invalid provider gracefully', async () => {
      const result = await runCLI(['benchmark', '--provider', 'nonexistent'], {
        configPath: join(E2E_DIR, 'anygpt.config.ts'),
        cwd: E2E_DIR,
      });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toMatch(/provider.*not.*configured/i);
    });
  });

  describe('metrics collection', () => {
    it('should collect response time metrics', async () => {
      const result = await runCLI(['benchmark', '--json'], {
        configPath: join(E2E_DIR, 'anygpt.config.ts'),
        cwd: E2E_DIR,
      });

      expect(result.exitCode).toBe(0);
      const jsonOutput = JSON.parse(result.stdout);
      const firstResult = jsonOutput[0];

      expect(firstResult.responseTime).toBeGreaterThan(0);
      expect(typeof firstResult.responseTime).toBe('number');
    });

    it('should collect token usage metrics', async () => {
      const result = await runCLI(['benchmark', '--json'], {
        configPath: join(E2E_DIR, 'anygpt.config.ts'),
        cwd: E2E_DIR,
      });

      expect(result.exitCode).toBe(0);
      const jsonOutput = JSON.parse(result.stdout);
      const firstResult = jsonOutput[0];

      if (firstResult.tokenUsage) {
        expect(firstResult.tokenUsage).toHaveProperty('prompt');
        expect(firstResult.tokenUsage).toHaveProperty('completion');
        expect(firstResult.tokenUsage).toHaveProperty('total');
      }
    });

    it('should collect response size metrics', async () => {
      const result = await runCLI(['benchmark', '--json'], {
        configPath: join(E2E_DIR, 'anygpt.config.ts'),
        cwd: E2E_DIR,
      });

      expect(result.exitCode).toBe(0);
      const jsonOutput = JSON.parse(result.stdout);
      const firstResult = jsonOutput[0];

      expect(firstResult.responseSize).toBeGreaterThanOrEqual(0);
      expect(typeof firstResult.responseSize).toBe('number');
    });
  });

  describe('max tokens option', () => {
    it('should respect --max-tokens option', async () => {
      const result = await runCLI(['benchmark', '--max-tokens', '50'], {
        configPath: join(E2E_DIR, 'anygpt.config.ts'),
        cwd: E2E_DIR,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('mock');
    });
  });
});
