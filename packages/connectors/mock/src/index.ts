import type { 
  IConnector,
  ConnectorFactory,
  BaseConnectorConfig,
  BaseChatCompletionRequest,
  BaseChatCompletionResponse,
  ChatMessage,
  ModelInfo,
  ResponseRequest,
  ResponseResponse
} from '@anygpt/types';

export interface MockConnectorConfig extends BaseConnectorConfig {
  delay?: number; // Simulate API delay in ms
  failureRate?: number; // 0-1, probability of failure
  customResponses?: Record<string, any>;
}

export class MockConnector implements IConnector {
  public readonly providerId = 'mock';
  private config: MockConnectorConfig;

  constructor(config: MockConnectorConfig = {}) {
    this.config = {
      delay: 100,
      failureRate: 0,
      customResponses: {},
      timeout: 30000,
      maxRetries: 3,
      ...config
    };
  }

  async chatCompletion(request: BaseChatCompletionRequest): Promise<BaseChatCompletionResponse> {
    // Simulate API delay
    if (this.config.delay && this.config.delay > 0) {
      await this.sleep(this.config.delay);
    }

    // Simulate random failures
    if (this.config.failureRate && Math.random() < this.config.failureRate) {
      throw new Error('Mock API failure simulation');
    }

    // Check for custom responses
    const customKey = `chat_${request.model}`;
    if (this.config.customResponses?.[customKey]) {
      return this.config.customResponses[customKey];
    }

    // Generate mock response
    const lastMessage = request.messages[request.messages.length - 1];
    const mockContent = this.generateMockResponse(lastMessage.content, request.model);

    const response: BaseChatCompletionResponse = {
      id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model || 'mock-model',
      provider: 'mock',
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

  async response(request: ResponseRequest): Promise<ResponseResponse> {
    // Convert to chat completion format
    let messages: ChatMessage[];
    
    if (typeof request.input === 'string') {
      messages = [{ role: 'user', content: request.input }];
    } else {
      messages = request.input;
    }

    const chatRequest: BaseChatCompletionRequest = {
      model: request.model,
      messages,
      temperature: request.temperature,
      max_tokens: request.max_output_tokens,
      top_p: request.top_p
    };

    const chatResponse = await this.chatCompletion(chatRequest);
    const message = chatResponse.choices[0]?.message;
    
    if (!message) {
      throw new Error('No response from mock chat completion');
    }

    return {
      id: chatResponse.id,
      object: 'response',
      created_at: Math.floor(Date.now() / 1000),
      model: chatResponse.model,
      provider: 'mock',
      status: 'completed',
      output: [{
        id: `msg_${Date.now()}`,
        type: 'message',
        role: message.role as 'assistant' | 'user',
        content: [{
          type: 'output_text',
          text: message.content || '',
          annotations: []
        }],
        status: 'completed'
      }],
      usage: {
        input_tokens: chatResponse.usage.prompt_tokens,
        output_tokens: chatResponse.usage.completion_tokens,
        total_tokens: chatResponse.usage.total_tokens,
      },
      previous_response_id: request.previous_response_id
    };
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
        display_name: 'Mock GPT-4',
        description: 'Mock GPT-4 model for testing',
        capabilities: {
          input: { text: true },
          output: { text: true, function_calling: true },
          context_length: 8192,
          max_output_tokens: 4096
        }
      },
      {
        id: 'mock-gpt-3.5-turbo',
        provider: 'mock',
        display_name: 'Mock GPT-3.5 Turbo',
        description: 'Mock GPT-3.5 Turbo model for testing',
        capabilities: {
          input: { text: true },
          output: { text: true, function_calling: true },
          context_length: 4096,
          max_output_tokens: 2048
        }
      },
      {
        id: 'mock-claude-3',
        provider: 'mock',
        display_name: 'Mock Claude-3',
        description: 'Mock Claude-3 model for testing',
        capabilities: {
          input: { text: true, image: true },
          output: { text: true, function_calling: true },
          context_length: 100000,
          max_output_tokens: 4096
        }
      }
    ];
  }

  validateRequest(request: BaseChatCompletionRequest): BaseChatCompletionRequest {
    const validated = { ...request };

    // Basic validation
    if (validated.temperature !== undefined) {
      validated.temperature = Math.max(0, Math.min(2, validated.temperature));
    }

    if (validated.top_p !== undefined) {
      validated.top_p = Math.max(0, Math.min(1, validated.top_p));
    }

    return validated;
  }

  isInitialized(): boolean {
    return true; // Mock is always "initialized"
  }

  getProviderId(): string {
    return this.providerId;
  }

  getConfig(): BaseConnectorConfig {
    return { ...this.config };
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

// Factory for the connector registry
export class MockConnectorFactory implements ConnectorFactory {
  getProviderId(): string {
    return 'mock';
  }

  create(config: BaseConnectorConfig): IConnector {
    return new MockConnector(config as MockConnectorConfig);
  }
}

export default MockConnectorFactory;
