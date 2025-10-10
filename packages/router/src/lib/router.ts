import { ConnectorRegistry } from '../connectors/registry.js';
import { ErrorHandler, createErrorHandler } from '../error-handler.js';
import type {
  RouterConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ResponseRequest,
  ResponseResponse,
  IRouter,
} from '../types/router.js';
import type {
  ModelInfo,
  ChatCompletionRequest as BaseRequest,
  ConnectorConfig,
} from '../types/base.js';
import type { IConnector, ConnectorFactory } from '../types/connector.js';

export class GenAIRouter implements IRouter {
  private config: RouterConfig;
  private registry: ConnectorRegistry;
  private errorHandler: ErrorHandler;

  constructor(config: RouterConfig) {
    this.config = config;

    // Initialize registry - connectors will be registered externally
    this.registry = new ConnectorRegistry();

    // Initialize error handler with retry configuration
    this.errorHandler = createErrorHandler({
      maxRetries: config.maxRetries ?? 3,
      backoffType: 'exponential',
      baseDelay: 1000,
      jitter: true,
    });
  }

  async chatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const { config: normalizedConfig, type } = this.normalizeProviderConfig(
      request.provider
    );

    // Get connector from registry based on provider type
    const connector = this.getConnector(type, normalizedConfig);

    // Convert router request to base connector request
    const baseRequest: BaseRequest = {
      messages: request.messages,
      model: request.model,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      useLegacyMaxTokens: request.useLegacyMaxTokens,
      top_p: request.top_p,
      frequency_penalty: request.frequency_penalty,
      presence_penalty: request.presence_penalty,
      reasoning: request.reasoning,
      extra_body: request.extra_body,
    };

    // Execute with automatic retry logic
    const response = await this.errorHandler.executeWithRetry(
      () => connector.chatCompletion(baseRequest),
      {
        providerId: request.provider,
        operation: 'chatCompletion',
        metadata: { model: request.model },
      }
    );

    // Convert base response to router response
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: connector.getProviderId(),
      choices: response.choices.map((choice) => ({
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
  }

  async response(request: ResponseRequest): Promise<ResponseResponse> {
    const { config: normalizedConfig, type } = this.normalizeProviderConfig(
      request.provider
    );

    // Get connector from registry based on provider type
    const connector = this.getConnector(type, normalizedConfig);

    // Execute with automatic retry logic
    const response = await this.errorHandler.executeWithRetry(
      () => connector.response(request),
      {
        providerId: request.provider,
        operation: 'response',
        metadata: { model: request.model },
      }
    );

    // Add provider to response
    return {
      ...response,
      provider: connector.getProviderId(),
    };
  }

  async listModels(provider: string): Promise<ModelInfo[]> {
    const { config: normalizedConfig, type } =
      this.normalizeProviderConfig(provider);

    // Get connector from registry based on provider type
    const connector = this.getConnector(type, normalizedConfig);

    // Execute with automatic retry logic
    return await this.errorHandler.executeWithRetry(
      () => connector.listModels(),
      {
        providerId: provider,
        operation: 'listModels',
      }
    );
  }

  private normalizeProviderConfig(provider: string): {
    config: ConnectorConfig;
    type: string;
  } {
    if (!this.config.providers?.[provider]) {
      throw new Error(`Provider '${provider}' not configured`);
    }

    const providerConfig = this.config.providers[provider];

    return {
      config: {
        baseURL: providerConfig.api.url,
        apiKey: providerConfig.api.token,
        headers: providerConfig.api.headers,
        timeout: providerConfig.timeout || this.config.timeout,
        maxRetries: providerConfig.maxRetries || this.config.maxRetries,
      },
      type: providerConfig.type,
    };
  }

  private getConnector(
    providerId: string,
    config: ConnectorConfig
  ): IConnector {
    if (!this.registry.hasConnector(providerId)) {
      throw new Error(`No connector registered for provider: ${providerId}`);
    }

    return this.registry.getConnector(providerId, config);
  }

  // Registry management methods
  registerConnector(factory: ConnectorFactory): void {
    this.registry.registerConnector(factory);
  }

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
