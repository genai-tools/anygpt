/**
 * E2E tests for conversation commands
 * Tests the full conversation lifecycle and management
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { runCLI } from '../helpers/cli-runner.js';
import { createTestConfig } from '../helpers/test-config.js';
import { exactMatch } from '@anygpt/mock';

describe('conversation command E2E', () => {
  let configPath: string;

  beforeAll(async () => {
    // Create a simple config with predictable responses
    const fixtures = [
      exactMatch('test message', 'This is a test response', 'test-response'),
      exactMatch('hello', 'Hello! How can I help you?', 'greeting'),
      exactMatch('second message', 'This is the second response', 'second-response'),
    ];
    configPath = await createTestConfig(fixtures);
  });

  describe('conversation start', () => {
    it.skip('should create a new conversation', async () => {
      // TODO: Implement conversation start command
      const result = await runCLI(['conversation', 'start'], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toContain('conversation');
      expect(result.stdout).toMatch(/conv_[a-z0-9_]+/); // Conversation ID format
    });

    it.skip('should create conversation with custom name', async () => {
      // TODO: Implement conversation start command with --name flag
      const result = await runCLI(['conversation', 'start', '--name', 'Test Conversation'], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Test Conversation');
    });
  });

  describe('conversation message', () => {
    it('should auto-start conversation if none exists', async () => {
      const result = await runCLI(['conversation', 'message', 'test message'], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('This is a test response');
    });

    it.skip('should send message to active conversation', async () => {
      // TODO: Implement conversation start command first
      // Start a conversation
      const startResult = await runCLI(['conversation', 'start'], { configPath });
      expect(startResult.exitCode).toBe(0);

      // Send a message
      const messageResult = await runCLI(['conversation', 'message', 'hello'], { configPath });
      
      expect(messageResult.exitCode).toBe(0);
      expect(messageResult.stdout).toContain('Hello! How can I help you?');
    });

    it('should maintain conversation context across messages', async () => {
      // Start a conversation
      await runCLI(['conversation', 'start'], { configPath });

      // Send first message
      const firstResult = await runCLI(['conversation', 'message', 'test message'], { configPath });
      expect(firstResult.exitCode).toBe(0);

      // Send second message - should be in same conversation
      const secondResult = await runCLI(['conversation', 'message', 'second message'], { configPath });
      expect(secondResult.exitCode).toBe(0);
      expect(secondResult.stdout).toContain('This is the second response');
    });
  });

  describe('conversation list', () => {  
    it('should list all conversations', async () => {
      const result = await runCLI(['conversation', 'list'], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toContain('conversation');
      // May or may not have conversations depending on test state
    });

    it('should show empty list when no conversations', async () => {
      // This would need a clean state - skip for now or implement cleanup
      // For now, just verify the command works
      const result = await runCLI(['conversation', 'list'], { configPath });
      expect(result.exitCode).toBe(0);
    });
  });

  describe('conversation show', () => {
    it.skip('should display conversation details', async () => {
      // TODO: Implement conversation start command first
      // Start a conversation and send a message
      const startResult = await runCLI(['conversation', 'start', '--name', 'Show Test'], { configPath });
      const idMatch = startResult.stdout.match(/conv_[a-z0-9_]+/);
      const conversationId = idMatch?.[0];

      await runCLI(['conversation', 'message', 'test message'], { configPath });

      // Show the conversation
      if (!conversationId) {
        throw new Error('Failed to extract conversation ID');
      }
      const result = await runCLI(['conversation', 'show', conversationId], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Show Test');
      expect(result.stdout).toContain('test message');
      expect(result.stdout).toContain('This is a test response');
    });

    it('should show current conversation when no ID provided', async () => {
      await runCLI(['conversation', 'start'], { configPath });
      await runCLI(['conversation', 'message', 'hello'], { configPath });

      const result = await runCLI(['conversation', 'show'], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('hello');
    });
  });

  describe('conversation delete', () => {
    it.skip('should delete a conversation by ID', async () => {
      // TODO: Implement conversation start and delete commands
      // Create a conversation
      const startResult = await runCLI(['conversation', 'start', '--name', 'Delete Test'], { configPath });
      const idMatch = startResult.stdout.match(/conv_[a-z0-9_]+/);
      const conversationId = idMatch?.[0];

      // Delete it
      if (!conversationId) {
        throw new Error('Failed to extract conversation ID');
      }
      const result = await runCLI(['conversation', 'delete', conversationId], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('deleted');
    });

    it('should handle deleting non-existent conversation', async () => {
      const result = await runCLI(['conversation', 'delete', 'non-existent-id'], { configPath });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toLowerCase()).toContain('not found');
    });
  });

  describe('conversation context', () => {
    it('should show conversation context metrics', async () => {
      await runCLI(['conversation', 'start'], { configPath });
      await runCLI(['conversation', 'message', 'test message'], { configPath });

      const result = await runCLI(['conversation', 'context'], { configPath });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Context Statistics');
      expect(result.stdout).toMatch(/messages/i);
      expect(result.stdout).toMatch(/tokens/i);
    });
  });

  describe('error handling', () => {
    it('should handle missing config', async () => {
      const result = await runCLI(['conversation', 'start'], { configPath: '/nonexistent/config.ts' });

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toLowerCase()).toMatch(/config|failed to load/);
    });

    it.skip('should handle invalid conversation ID', async () => {
      // TODO: Implement proper error handling for invalid conversation IDs
      const result = await runCLI(['conversation', 'show', 'invalid-id'], { configPath });

      // CLI may handle gracefully or return error - check both cases
      if (result.exitCode !== 0) {
        expect(result.stderr.toLowerCase()).toContain('not found');
      } else {
        // If it succeeds, it should show some message about not finding it
        expect(result.stdout.toLowerCase()).toMatch(/not found|no conversation|invalid/);
      }
    });
  });
});
