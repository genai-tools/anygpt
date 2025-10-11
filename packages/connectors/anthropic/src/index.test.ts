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
    it('should return static model list', async () => {
      const models = await connector.listModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('id');
      expect(models[0]).toHaveProperty('provider');
      expect(models[0].provider).toBe('anthropic');
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
