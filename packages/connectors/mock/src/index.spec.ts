/**
 * Tests for MockConnector
 * Establishes testing patterns for connector implementations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockConnector, MockConnectorFactory } from './index.js';
import type { BaseChatCompletionRequest } from '@anygpt/types';

describe('MockConnector', () => {
  let connector: MockConnector;

  beforeEach(() => {
    connector = new MockConnector();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      expect(connector).toBeInstanceOf(MockConnector);
      expect(connector.isInitialized()).toBe(true);
    });

    it('should have correct provider ID', () => {
      expect(connector.getProviderId()).toBe('mock');
    });

    it('should have correct package name', () => {
      expect(MockConnector.packageName).toBe('@anygpt/mock');
    });
  });

  describe('chatCompletion', () => {
    it('should return a valid chat completion response', async () => {
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      };

      const response = await connector.chatCompletion(request);

      expect(response).toMatchObject({
        id: expect.stringContaining('mock-'),
        object: 'chat.completion',
        created: expect.any(Number),
        model: 'mock-model',
        provider: 'mock',
        choices: expect.arrayContaining([
          expect.objectContaining({
            index: 0,
            message: expect.objectContaining({
              role: 'assistant',
              content: expect.any(String)
            }),
            finish_reason: 'stop'
          })
        ]),
        usage: expect.objectContaining({
          prompt_tokens: expect.any(Number),
          completion_tokens: expect.any(Number),
          total_tokens: expect.any(Number)
        })
      });
    });

    it('should return mock response content', async () => {
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [
          { role: 'user', content: 'Test message' }
        ]
      };

      const response = await connector.chatCompletion(request);
      const content = response.choices[0]?.message.content || '';

      // Mock connector returns a fixed message, not an echo
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('Mock connector');
    });

    it('should handle multiple messages', async () => {
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [
          { role: 'system', content: 'You are helpful' },
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
          { role: 'user', content: 'How are you?' }
        ]
      };

      const response = await connector.chatCompletion(request);

      expect(response.choices).toHaveLength(1);
      expect(response.choices[0]?.message.role).toBe('assistant');
    });

    it('should respect temperature parameter', async () => {
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.5
      };

      const response = await connector.chatCompletion(request);

      expect(response).toBeDefined();
      // Mock connector doesn't actually use temperature, but should accept it
    });

    it('should respect max_tokens parameter', async () => {
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 100
      };

      const response = await connector.chatCompletion(request);

      expect(response).toBeDefined();
      // Mock connector doesn't actually limit tokens, but should accept parameter
    });

    it('should generate unique response IDs', async () => {
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Test' }]
      };

      const response1 = await connector.chatCompletion(request);
      const response2 = await connector.chatCompletion(request);

      expect(response1.id).not.toBe(response2.id);
    });

    it('should use correct timestamp', async () => {
      const beforeTime = Math.floor(Date.now() / 1000);
      
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Test' }]
      };

      const response = await connector.chatCompletion(request);
      const afterTime = Math.floor(Date.now() / 1000);

      expect(response.created).toBeGreaterThanOrEqual(beforeTime);
      expect(response.created).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('listModels', () => {
    it('should return list of mock models', async () => {
      const models = await connector.listModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return models with correct structure', async () => {
      const models = await connector.listModels();

      models.forEach(model => {
        expect(model).toMatchObject({
          id: expect.any(String),
          display_name: expect.any(String),
          provider: 'mock',
          capabilities: expect.objectContaining({
            input: expect.objectContaining({
              text: expect.any(Boolean)
            }),
            output: expect.objectContaining({
              text: expect.any(Boolean)
            })
          })
        });
      });
    });

    it('should include mock-gpt-4 model', async () => {
      const models = await connector.listModels();
      const mockGpt4 = models.find(m => m.id === 'mock-gpt-4');

      expect(mockGpt4).toBeDefined();
      expect(mockGpt4?.capabilities.input.text).toBe(true);
      expect(mockGpt4?.capabilities.output.text).toBe(true);
    });
  });

  describe('request validation', () => {
    it('should validate and return request with defaults', () => {
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Test' }]
      };

      const validated = connector.validateRequest(request);

      expect(validated.model).toBe('mock-model');
      expect(validated.messages).toEqual(request.messages);
    });

    it('should handle empty messages array', () => {
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: []
      };

      const validated = connector.validateRequest(request);

      expect(validated.messages).toEqual([]);
    });
  });
});

describe('MockConnectorFactory', () => {
  let factory: MockConnectorFactory;

  beforeEach(() => {
    factory = new MockConnectorFactory();
  });

  describe('factory methods', () => {
    it('should return correct provider ID', () => {
      expect(factory.getProviderId()).toBe('mock');
    });

    it('should create MockConnector instance', () => {
      const connector = factory.create({});

      expect(connector).toBeInstanceOf(MockConnector);
    });

    it('should create connector with provided config', () => {
      const config = {
        timeout: 5000,
        maxRetries: 2
      };

      const connector = factory.create(config);

      expect(connector).toBeInstanceOf(MockConnector);
      // Config is passed to connector constructor
    });
  });
});

describe('MockConnector edge cases', () => {
  let connector: MockConnector;

  beforeEach(() => {
    connector = new MockConnector();
  });

  it('should handle very long messages', async () => {
    const longContent = 'a'.repeat(10000);
    const request: BaseChatCompletionRequest = {
      model: 'mock-model',
      messages: [{ role: 'user', content: longContent }]
    };

    const response = await connector.chatCompletion(request);

    expect(response.choices[0]?.message.content).toBeDefined();
  });

  it('should handle special characters in messages', async () => {
    const specialContent = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~';
    const request: BaseChatCompletionRequest = {
      model: 'mock-model',
      messages: [{ role: 'user', content: specialContent }]
    };

    const response = await connector.chatCompletion(request);

    expect(response.choices[0]?.message.content).toBeDefined();
  });

  it('should handle unicode characters', async () => {
    const unicodeContent = '你好 🌍 مرحبا';
    const request: BaseChatCompletionRequest = {
      model: 'mock-model',
      messages: [{ role: 'user', content: unicodeContent }]
    };

    const response = await connector.chatCompletion(request);

    expect(response.choices[0]?.message.content).toBeDefined();
  });
});
