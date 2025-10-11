import { describe, it, expect, beforeEach } from 'vitest';
import { AnthropicConnector, AnthropicConnectorFactory } from './index.js';

describe('AnthropicConnector', () => {
  let connector: AnthropicConnector;

  beforeEach(() => {
    connector = new AnthropicConnector({
      apiKey: 'test-key',
      baseURL: 'https://api.anthropic.com',
    });
  });

  describe('initialization', () => {
    it('should create connector with config', () => {
      expect(connector).toBeDefined();
      expect(connector.getProviderId()).toBe('anthropic');
    });

    it('should be initialized', () => {
      expect(connector.isInitialized()).toBe(true);
    });
  });

  describe('listModels', () => {
    it('should return empty array when API call fails with dummy key', async () => {
      const models = await connector.listModels();
      // With a dummy API key, the API call will fail and return empty array
      // This allows fallback to config-defined models
      expect(models).toEqual([]);
    });
  });
});

describe('AnthropicConnectorFactory', () => {
  it('should create connector', () => {
    const factory = new AnthropicConnectorFactory();
    expect(factory.getProviderId()).toBe('anthropic');

    const connector = factory.create({ apiKey: 'test-key' });
    expect(connector).toBeInstanceOf(AnthropicConnector);
  });
});
