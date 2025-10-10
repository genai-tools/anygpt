/**
 * Integration tests for GenAIRouter with retry logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenAIRouter, createRouter } from './router.js';
import type { RouterConfig, ChatCompletionRequest } from '../types/router.js';
import type { IConnector, ConnectorFactory } from '../types/connector.js';
import type { ChatCompletionResponse, ModelInfo } from '../types/base.js';

// Mock connector for testing
class MockConnector implements IConnector {
  readonly providerId = 'mock';
  private callCount = 0;
  private shouldFail = false;
  private failureCount = 0;
  private failureType: 'rate-limit' | 'auth' | 'network' | null = null;

  constructor(private config: any = {}) {}

  setFailure(type: 'rate-limit' | 'auth' | 'network', count: number) {
    this.shouldFail = true;
    this.failureType = type;
    this.failureCount = count;
  }

  async chatCompletion(request: any): Promise<ChatCompletionResponse> {
    this.callCount++;

    if (this.shouldFail && this.callCount <= this.failureCount) {
      const error: any = new Error('Mock error');
      
      if (this.failureType === 'rate-limit') {
        error.status = 429;
        error.message = 'Rate limit exceeded';
      } else if (this.failureType === 'auth') {
        error.status = 401;
        error.message = 'Unauthorized';
      } else if (this.failureType === 'network') {
        error.code = 'ECONNRESET';
        error.message = 'Connection reset';
      }
      
      throw error;
    }

    return {
      id: 'mock-response',
      object: 'chat.completion',
      created: Date.now(),
      model: request.model || 'mock-model',
      provider: 'mock',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Mock response',
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    };
  }

  async response(request: any): Promise<any> {
    return {
      id: 'mock-response',
      object: 'response',
      created_at: Date.now(),
      model: request.model,
      provider: 'mock',
      status: 'completed',
      output: [],
      usage: {
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30,
      },
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    return [{
      id: 'mock-model',
      provider: 'mock',
      display_name: 'Mock Model',
      capabilities: {
        input: { text: true },
        output: { text: true },
      },
    }];
  }

  isInitialized(): boolean {
    return true;
  }

  validateRequest(request: any): any {
    return request;
  }

  getProviderId(): string {
    return this.providerId;
  }

  getConfig(): any {
    return this.config;
  }

  getCallCount(): number {
    return this.callCount;
  }

  reset() {
    this.callCount = 0;
    this.shouldFail = false;
    this.failureCount = 0;
    this.failureType = null;
  }
}

// Mock connector factory
class MockConnectorFactory implements ConnectorFactory {
  private connector: MockConnector;

  constructor() {
    this.connector = new MockConnector();
  }

  create(config: any): IConnector {
    return this.connector;
  }

  getProviderId(): string {
    return 'mock';
  }

  getConnector(): MockConnector {
    return this.connector;
  }
}

describe('GenAIRouter - Integration Tests', () => {
  let router: GenAIRouter;
  let mockFactory: MockConnectorFactory;
  let mockConnector: MockConnector;
  let config: RouterConfig;

  beforeEach(() => {
    config = {
      providers: {
        mock: {
          type: 'mock',
          api: {
            url: 'http://localhost:8080',
            token: 'mock-token',
          },
        },
      },
      timeout: 5000,
      maxRetries: 3,
    };

    mockFactory = new MockConnectorFactory();
    mockConnector = mockFactory.getConnector();
    
    router = new GenAIRouter(config);
    router.registerConnector(mockFactory);
  });

  describe('Basic Routing', () => {
    it('should route request to correct provider', async () => {
      const request: ChatCompletionRequest = {
        provider: 'mock',
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await router.chatCompletion(request);

      expect(response.provider).toBe('mock');
      expect(response.model).toBe('mock-model');
      expect(response.choices[0].message.content).toBe('Mock response');
      expect(mockConnector.getCallCount()).toBe(1);
    });

    it('should throw error for unconfigured provider', async () => {
      const request: ChatCompletionRequest = {
        provider: 'invalid',
        model: 'test',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await expect(router.chatCompletion(request)).rejects.toThrow(
        "Provider 'invalid' not configured"
      );
    });

    it('should throw error for unregistered connector', async () => {
      const configWithUnregistered: RouterConfig = {
        providers: {
          unregistered: {
            type: 'unregistered',
            api: { url: 'http://test' },
          },
        },
      };

      const routerWithUnregistered = new GenAIRouter(configWithUnregistered);

      const request: ChatCompletionRequest = {
        provider: 'unregistered',
        model: 'test',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await expect(routerWithUnregistered.chatCompletion(request)).rejects.toThrow(
        'No connector registered for provider: unregistered'
      );
    });
  });

  describe('Retry Logic', () => {
    it('should retry on rate limit error and succeed', async () => {
      // Fail once with rate limit, then succeed
      mockConnector.setFailure('rate-limit', 1);

      const request: ChatCompletionRequest = {
        provider: 'mock',
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await router.chatCompletion(request);

      expect(response.provider).toBe('mock');
      expect(mockConnector.getCallCount()).toBe(2); // Initial + 1 retry
    });

    it('should retry on network error and succeed', async () => {
      // Fail twice with network error, then succeed
      mockConnector.setFailure('network', 2);

      const request: ChatCompletionRequest = {
        provider: 'mock',
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await router.chatCompletion(request);

      expect(response.provider).toBe('mock');
      expect(mockConnector.getCallCount()).toBe(3); // Initial + 2 retries
    });

    it('should throw MaxRetriesExceededError after max retries', async () => {
      // Create router with faster retry config for testing
      const fastConfig: RouterConfig = {
        providers: {
          mock: {
            type: 'mock',
            api: {
              url: 'http://localhost:8080',
              token: 'mock-token',
            },
          },
        },
        timeout: 5000,
        maxRetries: 2, // Reduce retries for faster test
      };

      const fastRouter = new GenAIRouter(fastConfig);
      fastRouter.registerConnector(mockFactory);
      
      mockConnector.reset();
      // Fail 3 times (more than maxRetries=2)
      mockConnector.setFailure('rate-limit', 3);

      const request: ChatCompletionRequest = {
        provider: 'mock',
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await expect(fastRouter.chatCompletion(request)).rejects.toThrow(
        'Max retries (2) exceeded'
      );

      expect(mockConnector.getCallCount()).toBe(3); // Initial + 2 retries
    }, 10000); // Increase timeout for this test

    it('should NOT retry on authentication error', async () => {
      mockConnector.setFailure('auth', 10); // Set high count

      const request: ChatCompletionRequest = {
        provider: 'mock',
        model: 'mock-model',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await expect(router.chatCompletion(request)).rejects.toThrow('Unauthorized');

      expect(mockConnector.getCallCount()).toBe(1); // No retries
    });
  });

  describe('Registry Management', () => {
    it('should list available providers', () => {
      const providers = router.getAvailableProviders();
      expect(providers).toContain('mock');
    });

    it('should check if provider exists', () => {
      expect(router.hasProvider('mock')).toBe(true);
      expect(router.hasProvider('invalid')).toBe(false);
    });
  });

  describe('Model Listing', () => {
    it('should list models from provider', async () => {
      const models = await router.listModels('mock');
      
      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('mock-model');
      expect(models[0].provider).toBe('mock');
    });

    it('should throw error for unconfigured provider', async () => {
      await expect(router.listModels('invalid')).rejects.toThrow(
        "Provider 'invalid' not configured"
      );
    });
  });

  describe('Factory Function', () => {
    it('should create router with factory function', () => {
      const routerFromFactory = createRouter(config);
      expect(routerFromFactory).toBeInstanceOf(GenAIRouter);
    });

    it('should create router with empty config', () => {
      const routerFromFactory = createRouter();
      expect(routerFromFactory).toBeInstanceOf(GenAIRouter);
    });
  });
});
