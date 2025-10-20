import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIProvider } from './ai-provider.js';
import type { ChatRequest } from './types.js';

describe('AIProvider', () => {
  let provider: AIProvider;
  let mockRouter: any;

  beforeEach(() => {
    // Mock router
    mockRouter = {
      chatCompletion: vi.fn(),
    };

    provider = new AIProvider(mockRouter, {
      provider: 'openai',
      model: 'gpt-4',
    });
  });

  describe('constructor', () => {
    it('should create an AI provider instance', () => {
      expect(provider).toBeDefined();
    });

    it('should store configuration', () => {
      expect(provider).toHaveProperty('config');
    });
  });

  describe('chat', () => {
    it('should send a simple message', async () => {
      mockRouter.chatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello! How can I help you?',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 8,
          total_tokens: 18,
        },
        model: 'gpt-4',
      });

      const request: ChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await provider.chat(request);

      expect(response.message).toBe('Hello! How can I help you?');
      expect(response.finishReason).toBe('stop');
      expect(response.usage.totalTokens).toBe(18);
      expect(mockRouter.chatCompletion).toHaveBeenCalledTimes(1);
    });

    it('should handle function calling', async () => {
      mockRouter.chatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_123',
                  type: 'function',
                  function: {
                    name: 'get_weather',
                    arguments: '{"location":"San Francisco"}',
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 20,
          total_tokens: 70,
        },
      });

      const request: ChatRequest = {
        messages: [{ role: 'user', content: 'What is the weather in SF?' }],
        tools: [
          {
            type: 'function',
            function: {
              name: 'get_weather',
              description: 'Get weather for a location',
              parameters: {
                type: 'object',
                properties: {
                  location: { type: 'string' },
                },
                required: ['location'],
              },
            },
          },
        ],
      };

      const response = await provider.chat(request);

      expect(response.finishReason).toBe('tool_calls');
      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls?.[0].function.name).toBe('get_weather');
      expect(response.toolCalls?.[0].function.arguments).toBe(
        '{"location":"San Francisco"}'
      );
    });

    it('should use configured model', async () => {
      mockRouter.chatCompletion.mockResolvedValue({
        choices: [
          {
            message: { role: 'assistant', content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
      });

      await provider.chat({
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(mockRouter.chatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'openai',
          model: 'gpt-4',
        })
      );
    });

    it('should handle errors', async () => {
      mockRouter.chatCompletion.mockRejectedValue(
        new Error('API error')
      );

      const request: ChatRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      };

      await expect(provider.chat(request)).rejects.toThrow('API error');
    });
  });
});
