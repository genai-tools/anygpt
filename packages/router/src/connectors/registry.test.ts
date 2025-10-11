/**
 * Unit tests for ConnectorRegistry
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConnectorRegistry } from './registry.js';
import type { ConnectorFactory } from '../types/connector.js';
import type { IConnector } from '../types/connector.js';
import type { ConnectorConfig } from '../types/base.js';

// Mock connector for testing
class MockConnector implements IConnector {
  readonly providerId: string;
  private config: ConnectorConfig;

  constructor(providerId: string, config: ConnectorConfig = {}) {
    this.providerId = providerId;
    this.config = config;
  }

  async chatCompletion(request: any): Promise<any> {
    return {
      id: 'test',
      object: 'chat.completion',
      created: Date.now(),
      model: request.model || 'test-model',
      provider: this.providerId,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'Test response' },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    };
  }

  async response(request: any): Promise<any> {
    return {
      id: 'test',
      object: 'response',
      created_at: Date.now(),
      model: request.model,
      provider: this.providerId,
      status: 'completed',
      output: [],
      usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
    };
  }

  async listModels(): Promise<any[]> {
    return [
      {
        id: `${this.providerId}-model`,
        provider: this.providerId,
        display_name: `${this.providerId} Model`,
        capabilities: {
          input: { text: true },
          output: { text: true },
        },
      },
    ];
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

  getConfig(): ConnectorConfig {
    return this.config;
  }
}

// Mock connector factory
class MockConnectorFactory implements ConnectorFactory {
  constructor(private providerId: string) {}

  create(config: ConnectorConfig): IConnector {
    return new MockConnector(this.providerId, config);
  }

  getProviderId(): string {
    return this.providerId;
  }
}

describe('ConnectorRegistry', () => {
  let registry: ConnectorRegistry;

  beforeEach(() => {
    registry = new ConnectorRegistry();
  });

  describe('registerConnector', () => {
    it('should register a connector factory', () => {
      const factory = new MockConnectorFactory('openai');

      registry.registerConnector(factory);

      expect(registry.hasConnector('openai')).toBe(true);
    });

    it('should not register duplicate connector types', () => {
      const factory1 = new MockConnectorFactory('openai');
      const factory2 = new MockConnectorFactory('openai');

      registry.registerConnector(factory1);
      registry.registerConnector(factory2);

      // Should still have only one
      expect(registry.getAvailableProviders()).toHaveLength(1);
    });

    it('should register multiple different connectors', () => {
      const openaiFactory = new MockConnectorFactory('openai');
      const anthropicFactory = new MockConnectorFactory('anthropic');

      registry.registerConnector(openaiFactory);
      registry.registerConnector(anthropicFactory);

      expect(registry.hasConnector('openai')).toBe(true);
      expect(registry.hasConnector('anthropic')).toBe(true);
      expect(registry.getAvailableProviders()).toHaveLength(2);
    });
  });

  describe('createConnector', () => {
    it('should create a connector instance', () => {
      const factory = new MockConnectorFactory('openai');
      registry.registerConnector(factory);

      const connector = registry.createConnector('openai');

      expect(connector).toBeDefined();
      expect(connector.getProviderId()).toBe('openai');
    });

    it('should pass config to connector', () => {
      const factory = new MockConnectorFactory('openai');
      registry.registerConnector(factory);

      const config: ConnectorConfig = {
        timeout: 5000,
        maxRetries: 3,
      };

      const connector = registry.createConnector('openai', config);

      expect(connector.getConfig()).toEqual(config);
    });

    it('should throw error for unregistered connector', () => {
      expect(() => {
        registry.createConnector('invalid');
      }).toThrow('No connector registered for provider: invalid');
    });

    it('should create connector with empty config', () => {
      const factory = new MockConnectorFactory('openai');
      registry.registerConnector(factory);

      const connector = registry.createConnector('openai');

      expect(connector.getConfig()).toEqual({});
    });
  });

  describe('getConnector', () => {
    it('should get a connector instance', () => {
      const factory = new MockConnectorFactory('openai');
      registry.registerConnector(factory);

      const connector = registry.getConnector('openai');

      expect(connector).toBeDefined();
      expect(connector.getProviderId()).toBe('openai');
    });

    it('should create new instance each time (stateless)', () => {
      const factory = new MockConnectorFactory('openai');
      registry.registerConnector(factory);

      const connector1 = registry.getConnector('openai');
      const connector2 = registry.getConnector('openai');

      // Should be different instances
      expect(connector1).not.toBe(connector2);
    });

    it('should pass config to connector', () => {
      const factory = new MockConnectorFactory('openai');
      registry.registerConnector(factory);

      const config: ConnectorConfig = { timeout: 3000 };
      const connector = registry.getConnector('openai', config);

      expect(connector.getConfig()).toEqual(config);
    });
  });

  describe('hasConnector', () => {
    it('should return true for registered connector', () => {
      const factory = new MockConnectorFactory('openai');
      registry.registerConnector(factory);

      expect(registry.hasConnector('openai')).toBe(true);
    });

    it('should return false for unregistered connector', () => {
      expect(registry.hasConnector('invalid')).toBe(false);
    });

    it('should return false after unregistering', () => {
      const factory = new MockConnectorFactory('openai');
      registry.registerConnector(factory);

      registry.unregisterConnector('openai');

      expect(registry.hasConnector('openai')).toBe(false);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return empty array when no connectors registered', () => {
      expect(registry.getAvailableProviders()).toEqual([]);
    });

    it('should return list of registered providers', () => {
      const openaiFactory = new MockConnectorFactory('openai');
      const anthropicFactory = new MockConnectorFactory('anthropic');

      registry.registerConnector(openaiFactory);
      registry.registerConnector(anthropicFactory);

      const providers = registry.getAvailableProviders();

      expect(providers).toHaveLength(2);
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
    });

    it('should return updated list after unregistering', () => {
      const openaiFactory = new MockConnectorFactory('openai');
      const anthropicFactory = new MockConnectorFactory('anthropic');

      registry.registerConnector(openaiFactory);
      registry.registerConnector(anthropicFactory);
      registry.unregisterConnector('openai');

      const providers = registry.getAvailableProviders();

      expect(providers).toHaveLength(1);
      expect(providers).toContain('anthropic');
      expect(providers).not.toContain('openai');
    });
  });

  describe('unregisterConnector', () => {
    it('should unregister a connector', () => {
      const factory = new MockConnectorFactory('openai');
      registry.registerConnector(factory);

      const result = registry.unregisterConnector('openai');

      expect(result).toBe(true);
      expect(registry.hasConnector('openai')).toBe(false);
    });

    it('should return false for non-existent connector', () => {
      const result = registry.unregisterConnector('invalid');

      expect(result).toBe(false);
    });

    it('should allow re-registering after unregister', () => {
      const factory = new MockConnectorFactory('openai');

      registry.registerConnector(factory);
      registry.unregisterConnector('openai');
      registry.registerConnector(factory);

      expect(registry.hasConnector('openai')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all connectors', () => {
      const openaiFactory = new MockConnectorFactory('openai');
      const anthropicFactory = new MockConnectorFactory('anthropic');

      registry.registerConnector(openaiFactory);
      registry.registerConnector(anthropicFactory);

      registry.clear();

      expect(registry.getAvailableProviders()).toEqual([]);
      expect(registry.hasConnector('openai')).toBe(false);
      expect(registry.hasConnector('anthropic')).toBe(false);
    });

    it('should allow registering after clear', () => {
      const factory = new MockConnectorFactory('openai');

      registry.registerConnector(factory);
      registry.clear();
      registry.registerConnector(factory);

      expect(registry.hasConnector('openai')).toBe(true);
    });
  });

  describe('getAllModels', () => {
    it('should return models from all registered providers', async () => {
      const openaiFactory = new MockConnectorFactory('openai');
      const anthropicFactory = new MockConnectorFactory('anthropic');

      registry.registerConnector(openaiFactory);
      registry.registerConnector(anthropicFactory);

      const results = await registry.getAllModels();

      expect(results).toHaveLength(2);
      expect(results[0].provider).toBe('openai');
      expect(results[0].models).toHaveLength(1);
      expect(results[1].provider).toBe('anthropic');
      expect(results[1].models).toHaveLength(1);
    });

    it('should return empty array when no connectors registered', async () => {
      const results = await registry.getAllModels();

      expect(results).toEqual([]);
    });

    it('should handle connector errors gracefully', async () => {
      // Create a factory that returns a connector that throws
      class FailingConnectorFactory implements ConnectorFactory {
        create(config: ConnectorConfig): IConnector {
          const connector = new MockConnector('failing', config);
          // Override listModels to throw
          connector.listModels = vi
            .fn()
            .mockRejectedValue(new Error('API error'));
          return connector;
        }

        getProviderId(): string {
          return 'failing';
        }
      }

      const factory = new FailingConnectorFactory();
      registry.registerConnector(factory);

      // Mock console.warn to verify it's called
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
        // Intentionally empty - suppressing console output in tests
      });

      const results = await registry.getAllModels();

      // Should return empty results but not throw
      expect(results).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});
