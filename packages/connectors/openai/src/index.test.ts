/**
 * Unit tests for OpenAIConnector - focused and essential tests only
 */

import { describe, it, expect } from 'vitest';
import { OpenAIConnector, type OpenAIConnectorConfig } from './index.js';

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

  it('should throw error when client not initialized', async () => {
    const connector = new OpenAIConnector();
    
    const request = {
      messages: [{ role: 'user' as const, content: 'Hello' }]
    };

    await expect(connector.chatCompletion(request))
      .rejects.toThrow('openai chat completion failed: OpenAI client not initialized');
  });

  it('should return models list', async () => {
    const connector = new OpenAIConnector();
    const models = await connector.listModels();
    
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    
    // Verify essential model structure
    const firstModel = models[0];
    expect(firstModel.id).toBeDefined();
    expect(firstModel.provider).toBe('openai');
    expect(firstModel.display_name).toBeDefined();
    expect(firstModel.capabilities).toBeDefined();
  });
});
