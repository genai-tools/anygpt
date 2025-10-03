import { BaseConnector, type ConnectorConfig, type ChatCompletionRequest, type ChatCompletionResponse, type ModelInfo } from '../base/index.js';
import type { ConnectorFactory } from '../registry.js';

export interface MockConnectorConfig extends ConnectorConfig {
  delay?: number; // Simulate API delay in ms
  failureRate?: number; // 0-1, probability of failure
  customResponses?: Record<string, any>;
}

export class MockConnector extends BaseConnector {
  private mockConfig: MockConnectorConfig;

  constructor(config: MockConnectorConfig = {}) {
    super('mock', config);
    
    this.mockConfig = {
      delay: 100,
      failureRate: 0,
      customResponses: {},
      ...config
    };
  }

  override async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Simulate API delay
    if (this.mockConfig.delay && this.mockConfig.delay > 0) {
      await this.sleep(this.mockConfig.delay);
    }

    // Simulate random failures
    if (this.mockConfig.failureRate && Math.random() < this.mockConfig.failureRate) {
      this.handleError(new Error('Mock API failure simulation'), 'chat completion');
    }

    // Check for custom responses
    const customKey = `chat_${request.model}`;
    if (this.config.customResponses?.[customKey]) {
      return this.config.customResponses[customKey];
    }

    // Generate mock response
    const lastMessage = request.messages[request.messages.length - 1];
    const mockContent = this.generateMockResponse(lastMessage.content, request.model);

    const response: ChatCompletionResponse = {
      id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model || 'mock-model',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: mockContent,
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: this.estimateTokens(request.messages),
        completion_tokens: this.estimateTokens([{ role: 'assistant', content: mockContent }]),
        total_tokens: 0, // Will be calculated
      },
    };

    response.usage.total_tokens = response.usage.prompt_tokens + response.usage.completion_tokens;

    return response;
  }

  async listModels(): Promise<ModelInfo[]> {
    // Simulate API delay
    if (this.config.delay && this.config.delay > 0) {
      await this.sleep(this.config.delay);
    }

    // Simulate random failures
    if (this.config.failureRate && Math.random() < this.config.failureRate) {
      throw new Error('Mock API failure simulation');
    }

    return [
      {
        id: 'mock-gpt-4',
        provider: 'mock',
        description: 'Mock GPT-4 model for testing',
        context_length: 8192,
        max_output_tokens: 4096,
        input_pricing: 0.01,
        output_pricing: 0.02,
        capabilities: ['text', 'function_calling'],
        family: 'mock'
      },
      {
        id: 'mock-gpt-3.5-turbo',
        provider: 'mock',
        description: 'Mock GPT-3.5 Turbo model for testing',
        context_length: 4096,
        max_output_tokens: 2048,
        input_pricing: 0.001,
        output_pricing: 0.002,
        capabilities: ['text', 'function_calling'],
        family: 'mock'
      },
      {
        id: 'mock-claude-3',
        provider: 'mock',
        description: 'Mock Claude-3 model for testing',
        context_length: 100000,
        max_output_tokens: 4096,
        input_pricing: 0.015,
        output_pricing: 0.075,
        capabilities: ['text', 'vision', 'function_calling'],
        family: 'mock'
      }
    ];
  }

  private generateMockResponse(userMessage: string, model?: string): string {
    const responses = [
      `This is a mock response to: "${userMessage}"`,
      `Mock ${model || 'AI'} model received your message: "${userMessage}". Here's a simulated response.`,
      `I'm a mock connector simulating a response to your query about: ${userMessage}`,
      `Mock AI processing complete. Your input "${userMessage}" has been processed by the ${model || 'mock'} model.`,
    ];

    // Add some variation based on message content
    if (userMessage.toLowerCase().includes('hello')) {
      return `Hello! This is a mock response from the ${model || 'mock'} model.`;
    }
    
    if (userMessage.toLowerCase().includes('test')) {
      return `Test confirmed! Mock connector is working properly with model ${model || 'mock'}.`;
    }

    if (userMessage.toLowerCase().includes('error')) {
      return `Mock error handling: No actual errors occurred, this is just a simulation.`;
    }

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private estimateTokens(messages: ChatMessage[]): number {
    // Simple token estimation: ~4 characters per token
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalChars / 4);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isInitialized(): boolean {
    return true; // Mock is always "initialized"
  }

  // Utility methods for testing
  setCustomResponse(key: string, response: any): void {
    if (!this.config.customResponses) {
      this.config.customResponses = {};
    }
    this.config.customResponses[key] = response;
  }

  setFailureRate(rate: number): void {
    this.config.failureRate = Math.max(0, Math.min(1, rate));
  }

  setDelay(ms: number): void {
    this.config.delay = Math.max(0, ms);
  }
}

export default MockConnector;
