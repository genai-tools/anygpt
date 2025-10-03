/**
 * Tests for the Gateway Configuration System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigLoader } from './loader.js';
import { getPreset, createCustomPreset, listPresets } from './presets.js';
// import type { GatewayProfile } from './types.js';

describe('Gateway Configuration System', () => {
  describe('Built-in Presets', () => {
    it('should have essential OpenAI presets available', () => {
      expect(getPreset('openai-gpt-4o')).toBeDefined();
      expect(getPreset('openai-o1')).toBeDefined();
      expect(getPreset('openai-gpt-4o-mini')).toBeDefined();
      expect(getPreset('openai-coding-assistant')).toBeDefined();
    });

    it('should have valid preset structure', () => {
      const preset = getPreset('openai-gpt-4o');
      expect(preset).toBeDefined();
      expect(preset!.slug).toBe('openai-gpt-4o');
      expect(preset!.name).toBeDefined();
      expect(preset!.provider.type).toBe('openai');
      expect(preset!.model.id).toBe('gpt-4o');
      expect(preset!.parameters).toBeDefined();
    });

    it('should only have OpenAI presets (minimal scope)', () => {
      const allPresets = listPresets();
      
      // Should only have OpenAI models
      const openaiPresets = allPresets.filter(p => p.provider.type === 'openai');
      expect(openaiPresets.length).toBe(allPresets.length); // All presets should be OpenAI
      expect(openaiPresets.length).toBeGreaterThan(5); // Should have multiple OpenAI presets
      
      // Should not have other providers
      const nonOpenAIPresets = allPresets.filter(p => p.provider.type !== 'openai');
      expect(nonOpenAIPresets.length).toBe(0);
    });

    it('should have specialized OpenAI presets', () => {
      const codingPreset = getPreset('openai-coding-assistant');
      const creativePreset = getPreset('openai-creative-writer');
      const reasoningPreset = getPreset('openai-reasoning-expert');

      expect(codingPreset).toBeDefined();
      expect(creativePreset).toBeDefined();
      expect(reasoningPreset).toBeDefined();

      // Coding preset should have low temperature
      expect(codingPreset!.parameters!.temperature).toBe(0.2);
      
      // Creative preset should have high temperature
      expect(creativePreset!.parameters!.temperature).toBe(0.9);
      
      // Reasoning preset should use o1 model
      expect(reasoningPreset!.model.id).toBe('o1');
    });
  });

  describe('Custom Preset Creation', () => {
    it('should create custom preset from base preset', () => {
      const custom = createCustomPreset('openai-gpt-4o', {
        slug: 'custom-gpt4o',
        name: 'Custom GPT-4o',
        provider: {
          type: 'openai',
          baseURL: 'https://custom.api.com/v1'
        },
        parameters: {
          temperature: 0.3
        }
      });

      expect(custom.slug).toBe('custom-gpt4o');
      expect(custom.name).toBe('Custom GPT-4o');
      expect(custom.provider.baseURL).toBe('https://custom.api.com/v1');
      expect(custom.parameters!.temperature).toBe(0.3);
      // Should inherit other properties from base
      expect(custom.model.id).toBe('gpt-4o');
      expect(custom.provider.type).toBe('openai');
    });

    it('should throw error for non-existent base preset', () => {
      expect(() => {
        createCustomPreset('non-existent', {
          slug: 'test'
        });
      }).toThrow('Base preset \'non-existent\' not found');
    });
  });

  describe('ConfigLoader', () => {
    beforeEach(() => {
      // Clear environment variables
      delete process.env.GATEWAY_PRESET;
      delete process.env.GATEWAY_BASE_URL;
      delete process.env.GATEWAY_MODEL;
      delete process.env.GATEWAY_API_KEY;
    });

    it('should create custom config with baseURL and model changes', () => {
      const custom = ConfigLoader.createCustomConfig('openai-gpt-4o', {
        baseURL: 'http://localhost:11434/v1',
        modelId: 'llama3.1:8b',
        parameters: {
          temperature: 0.8,
          streaming: true
        }
      });

      expect(custom.provider.baseURL).toBe('http://localhost:11434/v1');
      expect(custom.model.id).toBe('llama3.1:8b');
      expect(custom.parameters!.temperature).toBe(0.8);
      expect(custom.parameters!.streaming).toBe(true);
    });

    it('should create custom config with model prefix', () => {
      const custom = ConfigLoader.createCustomConfig('openai-gpt-4o', {
        modelPrefix: 'company-'
      });

      expect(custom.model.id).toBe('company-gpt-4o');
    });

    it('should load from environment variables', () => {
      process.env.GATEWAY_PRESET = 'openai-gpt-4o';
      process.env.OPENAI_API_KEY = 'sk-test-key';

      const config = ConfigLoader.loadFromEnv();

      expect(config.profiles).toHaveLength(1);
      expect(config.profiles[0].slug).toBe('openai-gpt-4o');
      expect(config.profiles[0].provider.apiKey).toBe('sk-test-key');
    });

    it('should create profile from environment variables', () => {
      process.env.GATEWAY_BASE_URL = 'https://api.openai.com/v1';
      process.env.GATEWAY_MODEL = 'gpt-4o';
      process.env.GATEWAY_API_KEY = 'sk-test-key';
      process.env.GATEWAY_TEMPERATURE = '0.5';

      const config = ConfigLoader.loadFromEnv();

      expect(config.profiles).toHaveLength(1);
      const profile = config.profiles[0];
      expect(profile.slug).toBe('env-config');
      expect(profile.provider.baseURL).toBe('https://api.openai.com/v1');
      expect(profile.model.id).toBe('gpt-4o');
      expect(profile.provider.apiKey).toBe('sk-test-key');
      expect(profile.parameters!.temperature).toBe(0.5);
    });

    it('should generate valid example config', () => {
      const example = ConfigLoader.generateExampleConfig();

      expect(example.version).toBe('1.0');
      expect(example.profiles).toHaveLength(3);
      expect(example.defaultProfile).toBe('openai-gpt-4o');
      expect(example.global).toBeDefined();
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should support company proxy setup', () => {
      const companySetup = createCustomPreset('openai-gpt-4o', {
        slug: 'company-proxy',
        name: 'Company Proxy',
        provider: {
          type: 'openai',
          baseURL: 'https://api.company.com/openai/v1',
          apiKey: '${COMPANY_API_KEY}',
          headers: {
            'X-Company-ID': 'engineering'
          }
        },
        parameters: {
          temperature: 0.2,
          maxTokens: 8192
        }
      });

      expect(companySetup.provider.baseURL).toBe('https://api.company.com/openai/v1');
      expect(companySetup.provider.headers!['X-Company-ID']).toBe('engineering');
      expect(companySetup.parameters!.temperature).toBe(0.2);
    });

    it('should support Azure OpenAI configuration', () => {
      const azureSetup = createCustomPreset('openai-gpt-4o', {
        slug: 'azure-openai',
        name: 'Azure OpenAI',
        provider: {
          type: 'openai',
          baseURL: 'https://your-resource.openai.azure.com/openai/deployments/gpt-4o',
          apiKey: '${AZURE_OPENAI_KEY}',
          headers: {
            'api-version': '2024-02-15-preview'
          }
        }
      });

      expect(azureSetup.provider.baseURL).toContain('azure.com');
      expect(azureSetup.provider.headers!['api-version']).toBe('2024-02-15-preview');
    });

    it('should support different OpenAI model configurations', () => {
      const reasoningSetup = createCustomPreset('openai-o1', {
        slug: 'custom-reasoning',
        name: 'Custom Reasoning',
        parameters: {
          reasoningEffort: 'high',
          maxTokens: 32768
        },
        context: {
          systemPrompt: 'Think carefully and show your reasoning.'
        }
      });

      expect(reasoningSetup.model.id).toBe('o1');
      expect(reasoningSetup.parameters!.reasoningEffort).toBe('high');
      expect(reasoningSetup.parameters!.maxTokens).toBe(32768);
      expect(reasoningSetup.context!.systemPrompt).toBe('Think carefully and show your reasoning.');
    });
  });
});
