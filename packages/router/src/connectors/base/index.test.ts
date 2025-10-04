/**
 * Unit tests for BaseConnector
 */

import { describe, it, expect } from 'vitest';
import { BaseConnector } from './index.js';
import type { ChatCompletionRequest, ChatCompletionResponse, ModelInfo, ConnectorConfig } from '../../types/base.js';
import type { ResponseRequest, ResponseResponse } from '../../types/router.js';

// Create a concrete implementation for testing
class TestConnector extends BaseConnector {
  constructor(config: ConnectorConfig = {}) {
    super('test', config);
  }
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return {
      id: 'test-completion',
      object: 'chat.completion',
      created: Date.now(),
      model: request.model || 'test-model',
      provider: 'test',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: 'Test response' },
        finish_reason: 'stop'
      }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
    };
  }

  async response(request: ResponseRequest): Promise<ResponseResponse> {
    return {
      id: 'test-response',
      object: 'response',
      created_at: Math.floor(Date.now() / 1000),
      model: request.model,
      provider: 'test',
      status: 'completed',
      output: [{
        id: 'test-output',
        type: 'message',
        role: 'assistant',
        content: [{
          type: 'output_text',
          text: 'Test response',
          annotations: []
        }],
        status: 'completed'
      }],
      usage: {
        input_tokens: 10,
        output_tokens: 5,
        total_tokens: 15
      }
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    return [{
      id: 'test-model',
      provider: 'test',
      display_name: 'Test Model',
      capabilities: {
        input: { text: true },
        output: { text: true }
      }
    }];
  }
}

describe('BaseConnector', () => {
  it('should work with basic functionality', async () => {
    const connector = new TestConnector({});
    
    expect(connector.getProviderId()).toBe('test');
    
    const request: ChatCompletionRequest = {
      messages: [{ role: 'user', content: 'Hello' }]
    };
    
    const response = await connector.chatCompletion(request);
    expect(response.id).toBe('test-completion');
    expect(response.provider).toBe('test');
    
    const models = await connector.listModels();
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe('test-model');
  });
});
