import Anthropic from '@anthropic-ai/sdk';
import {
  BaseConnector,
  type ConnectorConfig,
  type ModelInfo,
  type BaseChatCompletionRequest,
  type BaseChatCompletionResponse,
  type ConnectorFactory,
  type ResponseRequest,
  type ResponseResponse,
} from '@anygpt/router';

export interface AnthropicConnectorConfig extends ConnectorConfig {
  apiKey?: string;
  baseURL?: string; // Essential for corporate gateways
  defaultHeaders?: Record<string, string>; // Custom headers for API requests
}

export class AnthropicConnector extends BaseConnector {
  static override readonly packageName = '@anygpt/anthropic';
  private client: Anthropic;

  constructor(config: AnthropicConnectorConfig = {}) {
    super('anthropic', config);

    // Create Anthropic client with configuration
    this.client = new Anthropic({
      apiKey: config.apiKey || 'dummy-key', // Some corporate gateways use static keys
      baseURL: config.baseURL, // Support custom endpoints
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      defaultHeaders: config.defaultHeaders, // Support custom headers
    });
  }

  override async chatCompletion(
    request: BaseChatCompletionRequest
  ): Promise<BaseChatCompletionResponse> {
    const validatedRequest = this.validateRequest(request);

    if (!validatedRequest.model) {
      throw new Error('Model is required for chat completion');
    }

    try {
      // Build request parameters using Anthropic SDK types
      const requestParams: Anthropic.MessageCreateParamsNonStreaming = {
        model: validatedRequest.model,
        messages: validatedRequest.messages.map((msg) => ({
          role: msg.role === 'system' ? 'user' : msg.role, // Anthropic doesn't have system role in messages
          content: msg.content,
        })),
        max_tokens: validatedRequest.max_tokens || 4096, // Required by Anthropic
        temperature: validatedRequest.temperature,
        top_p: validatedRequest.top_p,
        stream: false,
      };

      // Add system prompt if present (Anthropic uses separate system parameter)
      const systemMessage = validatedRequest.messages.find(
        (msg) => msg.role === 'system'
      );
      if (systemMessage) {
        requestParams.system = systemMessage.content;
        // Remove system message from messages array (filter before type narrowing)
        const filteredMessages = validatedRequest.messages.filter(
          (msg) => msg.role !== 'system'
        );
        requestParams.messages = filteredMessages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));
      }

      // Add extended thinking support if configured
      if (validatedRequest.extra_body?.thinking) {
        const thinking = validatedRequest.extra_body.thinking;
        if (typeof thinking === 'object' && thinking.type === 'enabled') {
          requestParams.thinking = {
            type: 'enabled',
            budget_tokens: thinking.budget_tokens || 1024,
          };
        }
      }

      // Remove undefined values
      Object.keys(requestParams).forEach((key) => {
        if (requestParams[key as keyof typeof requestParams] === undefined) {
          delete requestParams[key as keyof typeof requestParams];
        }
      });

      // Debug: Log request
      this.logger.debug('[Anthropic Connector] Request:', {
        model: requestParams.model,
        max_tokens: requestParams.max_tokens,
        has_thinking: !!requestParams.thinking,
      });

      let response;
      try {
        response = await this.client.messages.create(requestParams);

        // Debug: Log response
        this.logger.debug('[Anthropic Connector] Response:', {
          stop_reason: response.stop_reason,
          content_length:
            response.content[0]?.type === 'text'
              ? response.content[0].text.length
              : 0,
          usage: response.usage,
        });
      } catch (error) {
        // Only log full error details in debug mode
        this.logger.debug(`[${this.providerId}] Request failed:`, error);
        throw error;
      }

      // Extract text content from response
      const textContent = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as Anthropic.TextBlock).text)
        .join('\n');

      return {
        id: response.id,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: response.model,
        provider: this.getProviderId(),
        choices: [
          {
            index: 0,
            message: {
              role: response.role,
              content: textContent,
            },
            finish_reason: response.stop_reason || 'stop',
          },
        ],
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens:
            response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      // Only log full error stack trace in debug mode
      this.logger.debug(`[${this.providerId}] Chat completion error:`, error);

      if (error instanceof Anthropic.APIError) {
        // Extract more helpful error message
        let errorMessage = error.message || `${error.status} status code`;

        // Check for model not found errors
        if (
          error.status === 422 &&
          error.message?.includes('Could not find asset')
        ) {
          errorMessage = `Model '${validatedRequest.model}' not found. The gateway may use different model names. Try listing available models or check the gateway documentation.`;
        }

        throw new Error(
          `${this.providerId} chat completion failed: ${errorMessage}`
        );
      }

      this.handleError(error, 'chat completion');
    }
  }

  override async listModels(): Promise<ModelInfo[]> {
    try {
      // Call Anthropic's /v1/models API endpoint
      // https://docs.claude.com/en/api/models-list
      this.logger.debug(`[${this.providerId}] Fetching models from API...`);

      const response = await this.client.models.list();
      const models: ModelInfo[] = [];

      // Iterate through paginated results
      for await (const model of response) {
        models.push({
          id: model.id,
          provider: this.getProviderId(),
          display_name: model.display_name,
          capabilities: {
            input: { text: true },
            output: { text: true, streaming: true },
          },
        });
      }

      this.logger.debug(
        `[${this.providerId}] Fetched ${models.length} models from API`
      );
      return models;
    } catch (error) {
      // If API call fails (e.g., corporate gateway doesn't support it),
      // return empty array to fallback to config-defined models
      this.logger.debug(
        `[${this.providerId}] Failed to fetch models from API: ${
          error instanceof Error ? error.message : String(error)
        }. Will use config-defined models.`
      );
      return [];
    }
  }

  override isInitialized(): boolean {
    return true; // Client is always initialized
  }

  override validateRequest(
    request: BaseChatCompletionRequest
  ): BaseChatCompletionRequest {
    // Apply base validation
    return super.validateRequest(request);
  }

  // Anthropic doesn't support Response API
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async response(_request: ResponseRequest): Promise<ResponseResponse> {
    throw new Error(
      `${this.providerId}: Response API is not supported by Anthropic. Use chatCompletion() instead.`
    );
  }
}

// Factory for the connector registry
export class AnthropicConnectorFactory implements ConnectorFactory {
  getProviderId(): string {
    return 'anthropic';
  }

  create(config: ConnectorConfig): AnthropicConnector {
    return new AnthropicConnector(config as AnthropicConnectorConfig);
  }
}

export default AnthropicConnectorFactory;

/**
 * Factory function for cleaner syntax
 * Supports both object config and string baseURL shorthand
 */
export function anthropic(
  config: AnthropicConnectorConfig | string = {},
  providerId?: string
): AnthropicConnector {
  // If string is passed, treat it as baseURL
  const finalConfig = typeof config === 'string' ? { baseURL: config } : config;

  const connector = new AnthropicConnector(finalConfig);

  // Override provider ID if specified (for custom gateways)
  if (providerId) {
    Object.defineProperty(connector, 'providerId', {
      value: providerId,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }

  return connector;
}
