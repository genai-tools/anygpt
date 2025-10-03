import { ConnectorRegistry } from '../connectors/registry.js';
import { OpenAIConnectorFactory } from '../connectors/openai/index.js';
import type { 
  RouterConfig, 
  ChatCompletionRequest, 
  ChatCompletionResponse, 
  ResponseRequest,
  ResponseResponse,
  IRouter 
} from '../types/router.js';
import type { 
  ModelInfo, 
  ChatCompletionRequest as BaseRequest 
} from '../types/base.js';
import type { IConnector } from '../types/connector.js';

export class GenAIRouter implements IRouter {
  private registry: ConnectorRegistry;
  private config: RouterConfig;

  constructor(config: RouterConfig = {}) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      ...config
    };

    // Initialize registry and register connectors
    this.registry = new ConnectorRegistry();
    
    // Register OpenAI connector
    this.registry.registerConnector(new OpenAIConnectorFactory());
    
    // TODO: Register other connectors as they're implemented
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // Validate provider exists in config
    if (!this.config.providers?.[request.provider]) {
      throw new Error(`Provider '${request.provider}' not configured`);
    }

    const providerConfig = this.config.providers[request.provider];
    
    // Normalize config
    const normalizedConfig = {
      baseURL: providerConfig.api.url,
      apiKey: providerConfig.api.token,
      headers: providerConfig.api.headers,
      timeout: providerConfig.timeout || this.config.timeout,
      maxRetries: providerConfig.maxRetries || this.config.maxRetries,
    };
    
    // Get connector from registry based on provider type
    const connector = this.getConnector(providerConfig.type, normalizedConfig);

    // Convert router request to base connector request
    const baseRequest: BaseRequest = {
      messages: request.messages,
      model: request.model,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      frequency_penalty: request.frequency_penalty,
      presence_penalty: request.presence_penalty,
    };

    try {
      const response = await connector.chatCompletion(baseRequest);
      
      // Convert base response to router response
      return {
        id: response.id,
        object: response.object,
        created: response.created,
        model: response.model,
        provider: connector.getProviderId(),
        choices: response.choices.map((choice: any) => ({
          index: choice.index,
          message: {
            role: choice.message.role,
            content: choice.message.content,
          },
          finish_reason: choice.finish_reason,
        })),
        usage: {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Chat completion failed for provider ${request.provider}: ${error.message}`);
      }
      throw new Error(`Unknown chat completion error for provider ${request.provider}`);
    }
  }

  async response(request: ResponseRequest): Promise<ResponseResponse> {
    // Validate provider exists in config
    if (!this.config.providers?.[request.provider]) {
      throw new Error(`Provider '${request.provider}' not configured`);
    }

    const providerConfig = this.config.providers[request.provider];
    
    // Normalize config
    const normalizedConfig = {
      baseURL: providerConfig.api.url,
      apiKey: providerConfig.api.token,
      headers: providerConfig.api.headers,
      timeout: providerConfig.timeout || this.config.timeout,
      maxRetries: providerConfig.maxRetries || this.config.maxRetries,
    };
    
    // Get connector from registry based on provider type
    const connector = this.getConnector(providerConfig.type, normalizedConfig);

    try {
      const response = await connector.response(request);
      
      // Add provider to response
      return {
        ...response,
        provider: connector.getProviderId(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Response failed for provider ${request.provider}: ${error.message}`);
      }
      throw new Error(`Unknown response error for provider ${request.provider}`);
    }
  }

  async listModels(provider: string): Promise<ModelInfo[]> {
    
    const connector = this.getConnector(provider, {
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
    });

    try {
      return await connector.listModels();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list models for provider ${provider}: ${error.message}`);
      }
      throw new Error(`Unknown error listing models for provider ${provider}`);
    }
  }

  private getConnector(providerId: string, config: any): IConnector {
    if (!this.registry.hasConnector(providerId)) {
      throw new Error(`No connector registered for provider: ${providerId}`);
    }
    
    return this.registry.getConnector(providerId, config);
  }

  // Registry management methods
  getAvailableProviders(): string[] {
    return this.registry.getAvailableProviders();
  }

  hasProvider(providerId: string): boolean {
    return this.registry.hasConnector(providerId);
  }
}

// Factory function for creating router instances
export function createRouter(config: RouterConfig = {}): GenAIRouter {
  return new GenAIRouter(config);
}

// Keep old factory function for backward compatibility
export function createGateway(config: RouterConfig = {}): GenAIRouter {
  return new GenAIRouter(config);
}

// Default export
export default GenAIRouter;
