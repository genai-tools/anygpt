/**
 * Unit tests for base types and interfaces
 */

import { describe, it, expect } from 'vitest';
import type { Logger, ModelInfo, ModelCapabilities } from './base.js';

describe('Logger Interface', () => {
  it('should implement all required methods', () => {
    const mockLogger: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };

    expect(typeof mockLogger.debug).toBe('function');
    expect(typeof mockLogger.info).toBe('function');
    expect(typeof mockLogger.warn).toBe('function');
    expect(typeof mockLogger.error).toBe('function');
  });

  it('should accept message and additional arguments', () => {
    const mockLogger: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };

    mockLogger.info('test message', { key: 'value' }, 123);
    expect(mockLogger.info).toHaveBeenCalledWith('test message', { key: 'value' }, 123);
  });
});

describe('ModelCapabilities', () => {
  it('should define input capabilities correctly', () => {
    const capabilities: ModelCapabilities = {
      input: {
        text: true,
        image: true,
        audio: false
      },
      output: {
        text: true,
        structured: true,
        function_calling: true,
        streaming: true,
        verbosity_control: true
      },
      reasoning: {
        enabled: true,
        effort_control: true
      }
    };

    expect(capabilities.input.text).toBe(true);
    expect(capabilities.input.image).toBe(true);
    expect(capabilities.input.audio).toBe(false);
  });

  it('should define output capabilities correctly', () => {
    const capabilities: ModelCapabilities = {
      input: { text: true },
      output: {
        text: true,
        structured: false,
        function_calling: false,
        streaming: true
      }
    };

    expect(capabilities.output.text).toBe(true);
    expect(capabilities.output.structured).toBe(false);
    expect(capabilities.output.function_calling).toBe(false);
    expect(capabilities.output.streaming).toBe(true);
  });

  it('should handle optional reasoning capabilities', () => {
    const withReasoning: ModelCapabilities = {
      input: { text: true },
      output: { text: true },
      reasoning: {
        enabled: true,
        effort_control: true
      }
    };

    const withoutReasoning: ModelCapabilities = {
      input: { text: true },
      output: { text: true }
    };

    expect(withReasoning.reasoning?.enabled).toBe(true);
    expect(withReasoning.reasoning?.effort_control).toBe(true);
    expect(withoutReasoning.reasoning).toBeUndefined();
  });
});

describe('ModelInfo', () => {
  it('should create valid model info', () => {
    const modelInfo: ModelInfo = {
      id: 'gpt-4o',
      provider: 'openai',
      display_name: 'GPT-4o',
      capabilities: {
        input: { text: true, image: true },
        output: { text: true, structured: true, function_calling: true, streaming: true },
        reasoning: { enabled: true, effort_control: false }
      }
    };

    expect(modelInfo.id).toBe('gpt-4o');
    expect(modelInfo.provider).toBe('openai');
    expect(modelInfo.display_name).toBe('GPT-4o');
    expect(modelInfo.capabilities.input.text).toBe(true);
    expect(modelInfo.capabilities.output.function_calling).toBe(true);
    expect(modelInfo.capabilities.reasoning?.enabled).toBe(true);
  });

  it('should handle minimal model configuration', () => {
    const minimalModel: ModelInfo = {
      id: 'simple-model',
      provider: 'local',
      display_name: 'Simple Model',
      capabilities: {
        input: { text: true },
        output: { text: true }
      }
    };

    expect(minimalModel.capabilities.input.image).toBeUndefined();
    expect(minimalModel.capabilities.output.structured).toBeUndefined();
    expect(minimalModel.capabilities.reasoning).toBeUndefined();
  });
});
