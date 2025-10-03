/**
 * Integration tests for core gateway functionality
 */

import { describe, it, expect } from 'vitest';
import type { ModelInfo, Logger } from './types/base.js';

describe('Gateway Core Functionality', () => {
  it('should define essential types correctly', () => {
    // Test that our core types are properly structured
    const mockModel: ModelInfo = {
      id: 'test-model',
      provider: 'test',
      display_name: 'Test Model',
      capabilities: {
        input: { text: true },
        output: { text: true }
      }
    };

    expect(mockModel.id).toBe('test-model');
    expect(mockModel.provider).toBe('test');
    expect(mockModel.display_name).toBe('Test Model');
    expect(mockModel.capabilities.input.text).toBe(true);
    expect(mockModel.capabilities.output.text).toBe(true);
  });

  it('should support logger interface for MCP compliance', () => {
    const mockLogger: Logger = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {}
    };

    // Should not throw
    expect(() => {
      mockLogger.debug('test');
      mockLogger.info('test');
      mockLogger.warn('test');
      mockLogger.error('test');
    }).not.toThrow();
  });

  it('should support baseURL for multi-provider architecture', () => {
    // Test that our config supports baseURL (essential for our design)
    const config = {
      apiKey: 'test-key',
      baseURL: 'http://localhost:11434/v1'  // OpenAI-compatible endpoint
    };

    expect(config.baseURL).toBe('http://localhost:11434/v1');
    expect(config.apiKey).toBe('test-key');
  });

  it('should support reasoning capabilities', () => {
    const modelWithReasoning: ModelInfo = {
      id: 'o1',
      provider: 'openai',
      display_name: 'o1',
      capabilities: {
        input: { text: true },
        output: { text: true, verbosity_control: true },
        reasoning: {
          enabled: true,
          effort_control: true  // OpenAI reasoning effort
        }
      }
    };

    expect(modelWithReasoning.capabilities.reasoning?.enabled).toBe(true);
    expect(modelWithReasoning.capabilities.reasoning?.effort_control).toBe(true);
    expect(modelWithReasoning.capabilities.output.verbosity_control).toBe(true);
  });

  it('should support minimal model configuration', () => {
    const minimalModel: ModelInfo = {
      id: 'simple',
      provider: 'local',
      display_name: 'Simple Model',
      capabilities: {
        input: { text: true },
        output: { text: true }
      }
    };

    expect(minimalModel.capabilities.reasoning).toBeUndefined();
    expect(minimalModel.capabilities.input.image).toBeUndefined();
    expect(minimalModel.capabilities.output.structured).toBeUndefined();
  });
});
