/**
 * Tests for MockConnector advanced features
 * - Delay simulation
 * - Failure simulation  
 * - Custom responses
 * - Response API
 * - Utility methods
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockConnector, MockConnectorFactory, mock } from './index.js';
import type { BaseChatCompletionRequest, ResponseRequest } from '@anygpt/types';

describe('MockConnector - Advanced Features', () => {
  describe('Delay Simulation', () => {
    it('should simulate API delay', async () => {
      const connector = new MockConnector({ delay: 50 });
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Test' }]
      };

      const start = Date.now();
      await connector.chatCompletion(request);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow small variance
    });

    it('should apply delay to listModels', async () => {
      const connector = new MockConnector({ delay: 50 });

      const start = Date.now();
      await connector.listModels();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    it('should allow zero delay', async () => {
      const connector = new MockConnector({ delay: 0 });
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Test' }]
      };

      const start = Date.now();
      await connector.chatCompletion(request);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(20); // Should be very fast
    });

    it('should update delay via setDelay', async () => {
      const connector = new MockConnector({ delay: 0 });
      connector.setDelay(50);

      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Test' }]
      };

      const start = Date.now();
      await connector.chatCompletion(request);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    it('should not allow negative delay', () => {
      const connector = new MockConnector();
      connector.setDelay(-100);

      const config = connector.getConfig();
      expect(config.delay).toBe(0);
    });
  });

  describe('Failure Simulation', () => {
    it('should simulate failures based on failure rate', async () => {
      const connector = new MockConnector({ failureRate: 1.0 }); // Always fail
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Test' }]
      };

      await expect(connector.chatCompletion(request)).rejects.toThrow('Mock API failure simulation');
    });

    it('should not fail when failure rate is 0', async () => {
      const connector = new MockConnector({ failureRate: 0 });
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Test' }]
      };

      const response = await connector.chatCompletion(request);
      expect(response).toBeDefined();
    });

    it('should apply failure rate to listModels', async () => {
      const connector = new MockConnector({ failureRate: 1.0 });

      await expect(connector.listModels()).rejects.toThrow('Mock API failure simulation');
    });

    it('should update failure rate via setFailureRate', async () => {
      const connector = new MockConnector({ failureRate: 0 });
      connector.setFailureRate(1.0);

      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Test' }]
      };

      await expect(connector.chatCompletion(request)).rejects.toThrow('Mock API failure simulation');
    });

    it('should clamp failure rate between 0 and 1', () => {
      const connector = new MockConnector();
      
      connector.setFailureRate(-0.5);
      expect(connector.getConfig().failureRate).toBe(0);

      connector.setFailureRate(1.5);
      expect(connector.getConfig().failureRate).toBe(1);
    });
  });

  describe('Custom Responses', () => {
    it('should use custom response when provided', async () => {
      const customResponse = {
        id: 'custom-123',
        object: 'chat.completion' as const,
        created: 1234567890,
        model: 'custom-model',
        provider: 'custom',
        choices: [{
          index: 0,
          message: { role: 'assistant' as const, content: 'Custom response content' },
          finish_reason: 'stop' as const
        }],
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 }
      };

      const connector = new MockConnector({
        customResponses: {
          'chat_test-model': customResponse
        }
      });

      const request: BaseChatCompletionRequest = {
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }]
      };

      const response = await connector.chatCompletion(request);
      expect(response).toEqual(customResponse);
    });

    it('should set custom response via setCustomResponse', async () => {
      const connector = new MockConnector();
      
      const customResponse = {
        id: 'custom-456',
        object: 'chat.completion' as const,
        created: 1234567890,
        model: 'test-model',
        provider: 'mock',
        choices: [{
          index: 0,
          message: { role: 'assistant' as const, content: 'Dynamic custom response' },
          finish_reason: 'stop' as const
        }],
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 }
      };

      connector.setCustomResponse('chat_test-model', customResponse);

      const request: BaseChatCompletionRequest = {
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }]
      };

      const response = await connector.chatCompletion(request);
      expect(response).toEqual(customResponse);
    });

    it('should fall back to default response when no custom response matches', async () => {
      const connector = new MockConnector({
        customResponses: {
          'chat_other-model': {} as any
        }
      });

      const request: BaseChatCompletionRequest = {
        model: 'test-model',
        messages: [{ role: 'user', content: 'Test' }]
      };

      const response = await connector.chatCompletion(request);
      expect(response.choices[0]?.message.content).toBeDefined();
      expect(response.choices[0]?.message.content.length).toBeGreaterThan(0);
    });
  });

  describe('Response API', () => {
    it('should handle response() with string input', async () => {
      const connector = new MockConnector({ delay: 0 });
      
      const request: ResponseRequest = {
        model: 'mock-model',
        input: 'Test message'
      };

      const response = await connector.response(request);

      expect(response).toMatchObject({
        id: expect.stringContaining('mock-'),
        object: 'response',
        created_at: expect.any(Number),
        model: 'mock-model',
        provider: 'mock',
        status: 'completed',
        output: expect.arrayContaining([
          expect.objectContaining({
            type: 'message',
            role: 'assistant',
            content: expect.arrayContaining([
              expect.objectContaining({
                type: 'output_text',
                text: expect.any(String)
              })
            ])
          })
        ]),
        usage: expect.objectContaining({
          input_tokens: expect.any(Number),
          output_tokens: expect.any(Number),
          total_tokens: expect.any(Number)
        })
      });
    });

    it('should handle response() with message array input', async () => {
      const connector = new MockConnector({ delay: 0 });
      
      const request: ResponseRequest = {
        model: 'mock-model',
        input: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi' },
          { role: 'user', content: 'How are you?' }
        ]
      };

      const response = await connector.response(request);

      expect(response.status).toBe('completed');
      expect(response.output).toHaveLength(1);
      expect(response.output[0]?.content[0]?.text).toBeDefined();
    });

    it('should preserve previous_response_id', async () => {
      const connector = new MockConnector({ delay: 0 });
      
      const request: ResponseRequest = {
        model: 'mock-model',
        input: 'Test',
        previous_response_id: 'prev-123'
      };

      const response = await connector.response(request);

      expect(response.previous_response_id).toBe('prev-123');
    });

    it('should respect temperature parameter', async () => {
      const connector = new MockConnector({ delay: 0 });
      
      const request: ResponseRequest = {
        model: 'mock-model',
        input: 'Test',
        temperature: 0.7
      };

      const response = await connector.response(request);
      expect(response).toBeDefined();
    });

    it('should throw error if no response message', async () => {
      const connector = new MockConnector({ delay: 0 });
      
      // Mock chatCompletion to return empty choices
      const originalMethod = connector.chatCompletion.bind(connector);
      connector.chatCompletion = vi.fn().mockResolvedValue({
        id: 'test',
        object: 'chat.completion',
        created: Date.now(),
        model: 'test',
        provider: 'mock',
        choices: [],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      });

      const request: ResponseRequest = {
        model: 'mock-model',
        input: 'Test'
      };

      await expect(connector.response(request)).rejects.toThrow('No response from mock chat completion');
    });
  });

  describe('Mock Response Generation', () => {
    it('should generate contextual response for "hello"', async () => {
      const connector = new MockConnector({ delay: 0 });
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'hello' }]
      };

      const response = await connector.chatCompletion(request);
      expect(response.choices[0]?.message.content.toLowerCase()).toContain('hello');
    });

    it('should generate contextual response for "test"', async () => {
      const connector = new MockConnector({ delay: 0 });
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'test' }]
      };

      const response = await connector.chatCompletion(request);
      expect(response.choices[0]?.message.content.toLowerCase()).toContain('test');
    });

    it('should generate contextual response for "error"', async () => {
      const connector = new MockConnector({ delay: 0 });
      const request: BaseChatCompletionRequest = {
        model: 'mock-model',
        messages: [{ role: 'user', content: 'error' }]
      };

      const response = await connector.chatCompletion(request);
      expect(response.choices[0]?.message.content.toLowerCase()).toContain('error');
    });
  });

  describe('Factory Pattern', () => {
    it('should create connector via factory', () => {
      const factory = new MockConnectorFactory();
      const connector = factory.create({});

      expect(connector).toBeInstanceOf(MockConnector);
      expect(connector.getProviderId()).toBe('mock');
    });

    it('should pass config through factory', () => {
      const factory = new MockConnectorFactory();
      const connector = factory.create({ delay: 200 });

      expect(connector.getConfig().delay).toBe(200);
    });

    it('should create connector via mock() helper', () => {
      const connector = mock({ delay: 100 });

      expect(connector).toBeInstanceOf(MockConnector);
      expect(connector.getConfig().delay).toBe(100);
    });

    it('should create connector with default config via mock()', () => {
      const connector = mock();

      expect(connector).toBeInstanceOf(MockConnector);
      expect(connector.isInitialized()).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should return config copy via getConfig', () => {
      const connector = new MockConnector({ delay: 100 });
      const config1 = connector.getConfig();
      const config2 = connector.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different objects
    });

    it('should merge config with defaults', () => {
      const connector = new MockConnector({ delay: 200 });
      const config = connector.getConfig();

      expect(config.delay).toBe(200);
      expect(config.timeout).toBe(30000); // Default
      expect(config.maxRetries).toBe(3); // Default
    });
  });
});
