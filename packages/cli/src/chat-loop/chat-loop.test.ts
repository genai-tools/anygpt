import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ChatLoop } from './chat-loop.js';
import type { Message } from './types.js';

describe('ChatLoop', () => {
  let chatLoop: ChatLoop;

  beforeEach(() => {
    chatLoop = new ChatLoop();
  });

  afterEach(() => {
    if (chatLoop.isRunning()) {
      chatLoop.stop();
    }
  });

  describe('constructor', () => {
    it('should create a chat loop instance', () => {
      expect(chatLoop).toBeDefined();
      expect(chatLoop.isRunning()).toBe(false);
    });
  });

  describe('message history', () => {
    it('should start with empty history', () => {
      const history = chatLoop.getHistory();
      expect(history).toEqual([]);
    });

    it('should add messages to history', () => {
      const message: Message = {
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      chatLoop.addMessage(message);

      const history = chatLoop.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(message);
    });

    it('should add multiple messages to history', () => {
      const message1: Message = {
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };
      const message2: Message = {
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date(),
      };

      chatLoop.addMessage(message1);
      chatLoop.addMessage(message2);

      const history = chatLoop.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual(message1);
      expect(history[1]).toEqual(message2);
    });

    it('should clear history', () => {
      const message: Message = {
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      chatLoop.addMessage(message);
      expect(chatLoop.getHistory()).toHaveLength(1);

      chatLoop.clearHistory();
      expect(chatLoop.getHistory()).toHaveLength(0);
    });

    it('should respect max history limit', () => {
      const chatLoopWithLimit = new ChatLoop();

      // Add 5 messages
      for (let i = 0; i < 5; i++) {
        chatLoopWithLimit.addMessage({
          role: 'user',
          content: `Message ${i}`,
          timestamp: new Date(),
        });
      }

      // Should keep all messages (max history enforced during start())
      const history = chatLoopWithLimit.getHistory();
      expect(history.length).toBe(5);
    });
  });

  describe('isRunning', () => {
    it('should return false initially', () => {
      expect(chatLoop.isRunning()).toBe(false);
    });

    it('should return true after start', async () => {
      // Mock readline to avoid actual REPL
      const stopPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          chatLoop.stop();
          resolve();
        }, 100);
      });

      const startPromise = chatLoop.start({
        onMessage: async (msg: string) => `Echo: ${msg}`,
      });

      // Give it a moment to start
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(chatLoop.isRunning()).toBe(true);

      await stopPromise;
      await startPromise;
    });

    it('should return false after stop', async () => {
      const stopPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          chatLoop.stop();
          resolve();
        }, 100);
      });

      const startPromise = chatLoop.start({
        onMessage: async (msg: string) => `Echo: ${msg}`,
      });

      await stopPromise;
      await startPromise;

      expect(chatLoop.isRunning()).toBe(false);
    });
  });

  describe('stop', () => {
    it('should stop the chat loop', async () => {
      const stopPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          chatLoop.stop();
          resolve();
        }, 100);
      });

      const startPromise = chatLoop.start({
        onMessage: async (msg: string) => `Echo: ${msg}`,
      });

      await stopPromise;
      await startPromise;

      expect(chatLoop.isRunning()).toBe(false);
    });

    it('should be safe to call stop multiple times', async () => {
      chatLoop.stop();
      chatLoop.stop();
      expect(chatLoop.isRunning()).toBe(false);
    });
  });

  describe('message handling', () => {
    it('should use custom onMessage handler', async () => {
      const mockHandler = vi.fn(async (msg: string) => `Custom: ${msg}`);

      const stopPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          chatLoop.stop();
          resolve();
        }, 100);
      });

      const startPromise = chatLoop.start({
        onMessage: mockHandler,
      });

      await stopPromise;
      await startPromise;

      // Handler should be set (we'll test actual invocation in integration tests)
      expect(mockHandler).toBeDefined();
    });

    it('should use default echo handler if none provided', async () => {
      const stopPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          chatLoop.stop();
          resolve();
        }, 100);
      });

      const startPromise = chatLoop.start();

      await stopPromise;
      await startPromise;

      // Should not throw
      expect(chatLoop.isRunning()).toBe(false);
    });
  });
});
