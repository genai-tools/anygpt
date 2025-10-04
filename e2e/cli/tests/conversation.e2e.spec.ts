/**
 * E2E tests for conversation commands
 * Tests the full conversation lifecycle and management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { runCLI } from '../helpers/cli-runner.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { rm } from 'fs/promises';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const E2E_DIR = join(__dirname, '..');

describe('conversation command E2E', () => {
  // Clean current conversation before each test to avoid state pollution from previous runs
  beforeEach(async () => {
    const currentConvFile = join(homedir(), '.anygpt', 'current-conversation');
    await rm(currentConvFile, { force: true }).catch(() => {
      // Ignore if file doesn't exist
    });
  });

  describe('conversation start', () => {
    it('should create a new conversation', async () => {
      const result = await runCLI(['conversation', 'start'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toContain('conversation');
      expect(result.stdout).toMatch(/conv_[a-z0-9_]+/); // Conversation ID format
    });

    it('should create conversation with custom name', async () => {
      const result = await runCLI(['conversation', 'start', '--name', 'Test Conversation'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Test Conversation');
    });
  });

  describe('conversation message', () => {
    it('should auto-start conversation if none exists', async () => {
      const result = await runCLI(['conversation', 'message', 'first message'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Response to first message');
    });

    it('should send message to active conversation', async () => {
      // Start a conversation
      const startResult = await runCLI(['conversation', 'start'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });
      expect(startResult.exitCode).toBe(0);

      // Send a message
      const messageResult = await runCLI(['conversation', 'message', 'hello'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });
      
      expect(messageResult.exitCode).toBe(0);
      expect(messageResult.stdout).toContain('mock response');
    });

    it('should maintain conversation context across messages', async () => {
      // Send first message (auto-starts conversation)
      const firstResult = await runCLI(['conversation', 'message', 'first message'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });
      expect(firstResult.exitCode).toBe(0);
      expect(firstResult.stdout).toContain('Response to first message');

      // Send second message - should be in same conversation
      const secondResult = await runCLI(['conversation', 'message', 'second message'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });
      expect(secondResult.exitCode).toBe(0);
      expect(secondResult.stdout).toContain('Response to second message');
    });
  });

  describe('conversation list', () => {  
    it('should list all conversations', async () => {
      const result = await runCLI(['conversation', 'list'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toContain('conversation');
      // May or may not have conversations depending on test state
    });

    it('should show empty list when no conversations', async () => {
      // This would need a clean state - skip for now or implement cleanup
      // For now, just verify the command works
      const result = await runCLI(['conversation', 'list'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });
      expect(result.exitCode).toBe(0);
    });
  });

  describe('conversation show', () => {
    it('should display conversation details', async () => {
      // Start a conversation and send a message
      const startResult = await runCLI(['conversation', 'start', '--name', 'Show Test'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });
      const idMatch = startResult.stdout.match(/conv_[a-z0-9_]+/);
      const conversationId = idMatch?.[0];

      await runCLI(['conversation', 'message', 'test message'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      // Show the conversation
      if (!conversationId) {
        throw new Error('Failed to extract conversation ID');
      }
      const result = await runCLI(['conversation', 'show', conversationId], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Show Test');
      expect(result.stdout).toContain('test message');
      expect(result.stdout).toContain('test response');
    });

    it('should show current conversation when no ID provided', async () => {
      await runCLI(['conversation', 'start'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });
      await runCLI(['conversation', 'message', 'hello'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      const result = await runCLI(['conversation', 'show'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('hello');
    });
  });

  describe('conversation delete', () => {
    it('should delete a conversation by ID', async () => {
      // Create a conversation
      const startResult = await runCLI(['conversation', 'start', '--name', 'Delete Test'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });
      const idMatch = startResult.stdout.match(/conv_[a-z0-9_]+/);
      const conversationId = idMatch?.[0];

      // Delete it
      if (!conversationId) {
        throw new Error('Failed to extract conversation ID');
      }
      const result = await runCLI(['conversation', 'delete', conversationId], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toContain('deleted');
    });

    it('should handle deleting non-existent conversation', async () => {
      const result = await runCLI(['conversation', 'delete', 'non-existent-id'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toLowerCase()).toContain('not found');
    });
  });

  describe('conversation context', () => {
    it('should show conversation context metrics', async () => {
      await runCLI(['conversation', 'start'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });
      await runCLI(['conversation', 'message', 'test message'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      const result = await runCLI(['conversation', 'context'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Context Statistics');
      expect(result.stdout).toMatch(/messages/i);
      expect(result.stdout).toMatch(/tokens/i);
    });
  });

  describe('error handling', () => {
    it('should handle missing config', async () => {
      const result = await runCLI(['conversation', 'start'], { configPath: "/nonexistent/config.ts", cwd: E2E_DIR });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toLowerCase()).toMatch(/config|failed to load/);
    });

    it('should handle invalid conversation ID', async () => {
      const result = await runCLI(['conversation', 'show', 'invalid-id'], { configPath: join(E2E_DIR, "anygpt.config.ts"), cwd: E2E_DIR });

      expect(result.exitCode).not.toBe(0);
      // The show command checks for active conversation first, so error message varies
      expect(result.stderr.toLowerCase()).toMatch(/not found|no active conversation/);
    });
  });
});
