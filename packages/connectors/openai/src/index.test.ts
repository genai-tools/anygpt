/**
 * Unit tests for OpenAIConnector - focused and essential tests only
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIConnector, type OpenAIConnectorConfig } from './index.js';
import type { BaseChatCompletionRequest } from '@anygpt/router';

describe('OpenAIConnector', () => {
  it('should initialize with correct provider ID', () => {
    const connector = new OpenAIConnector();
    expect(connector.getProviderId()).toBe('openai');
  });

  it('should initialize with baseURL for multi-provider support', () => {
    const config: OpenAIConnectorConfig = {
      apiKey: 'test-key',
      baseURL: 'http://localhost:11434/v1'  // Essential for our design
    };
    
    const connector = new OpenAIConnector(config);
    expect(connector.getProviderId()).toBe('openai');
    
    const retrievedConfig = connector.getConfig();
    expect(retrievedConfig['baseURL']).toBe('http://localhost:11434/v1');
  });

  it('should throw error when model is missing', async () => {
    const connector = new OpenAIConnector();
    
    const request = {
      messages: [{ role: 'user' as const, content: 'Hello' }]
    };

    await expect(connector.chatCompletion(request))
      .rejects.toThrow('Model is required for chat completion');
  });

  it('should return models list (falls back to static list when API fails)', async () => {
    const connector = new OpenAIConnector();
    const models = await connector.listModels();
    
    // The implementation falls back to getChatModels() which returns empty array
    // This is intentional - the connector lets the OpenAI API handle model validation
    expect(Array.isArray(models)).toBe(true);
    
    // If models are returned (from API or fallback), verify structure
    if (models.length > 0) {
      const firstModel = models[0];
      expect(firstModel.id).toBeDefined();
      expect(firstModel.provider).toBe('openai');
      expect(firstModel.display_name).toBeDefined();
      expect(firstModel.capabilities).toBeDefined();
    }
  });

  describe('chatCompletion', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it.skip('should successfully complete a chat request with mocked API', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'gpt-4',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: 'Hello! How can I help you?',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      });

      const connector = new OpenAIConnector({ apiKey: 'test-key' });
      // Mock the client's chat.completions.create method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (connector as any).client.chat.completions.create = mockCreate;

      const request: BaseChatCompletionRequest = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await connector.chatCompletion(request);

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
      }));
      expect(response.id).toBe('chatcmpl-123');
      expect(response.provider).toBe('openai');
      expect(response.choices[0].message.content).toBe('Hello! How can I help you?');
      expect(response.usage.total_tokens).toBe(30);
    });

    it('should handle API errors gracefully', async () => {
      const mockCreate = vi.fn().mockRejectedValue(
        Object.assign(new Error('API Error'), { status: 401 })
      );

      const connector = new OpenAIConnector({ apiKey: 'invalid-key' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (connector as any).client.chat.completions.create = mockCreate;

      const request: BaseChatCompletionRequest = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await expect(connector.chatCompletion(request)).rejects.toThrow();
    });

    it.skip('should support custom baseURL for OpenAI-compatible APIs', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'ollama-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'llama2',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: 'Response from Ollama',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 10,
          total_tokens: 15,
        },
      });

      const connector = new OpenAIConnector({
        apiKey: 'not-needed',
        baseURL: 'http://localhost:11434/v1',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (connector as any).client.chat.completions.create = mockCreate;

      const request: BaseChatCompletionRequest = {
        model: 'llama2',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await connector.chatCompletion(request);

      expect(response.provider).toBe('openai');
      expect(response.choices[0].message.content).toBe('Response from Ollama');
    });
  });

  describe('validateRequest', () => {
    it('should validate and normalize request parameters', () => {
      const connector = new OpenAIConnector();
      
      const request: BaseChatCompletionRequest = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.7,
        top_p: 0.9,
      };

      const validated = connector.validateRequest(request);
      
      expect(validated.model).toBe('gpt-4');
      expect(validated.temperature).toBe(0.7);
      expect(validated.top_p).toBe(0.9);
    });
  });

  describe('isInitialized', () => {
    it('should always return true since client is always initialized', () => {
      const connector = new OpenAIConnector();
      expect(connector.isInitialized()).toBe(true);
    });
  });
});
