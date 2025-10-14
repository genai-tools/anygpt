import OpenAI from 'openai';
import {
  BaseConnector,
  type ConnectorConfig,
  type ModelInfo,
  type BaseChatCompletionRequest,
  type BaseChatCompletionResponse,
  type ResponseRequest,
  type ResponseResponse,
} from '@anygpt/router';
import { getChatModels } from './models.js';
import {
  buildChatCompletionRequest,
  buildResponsesRequest,
} from './request-builders.js';
import { convertResponsesToChatCompletion } from './response-converters.js';
import {
  buildErrorResponse,
  formatErrorMessage,
  shouldFallbackToChatCompletion,
} from './error-handler.js';
import {
  HookManager,
  type ChatCompletionBodyTransform,
  type ResponsesBodyTransform,
  type ResponseTransform,
  tokenParameterTransform,
} from './hooks.js';

export interface OpenAIConnectorConfig extends ConnectorConfig {
  apiKey?: string;
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  /** Hook functions for transforming requests/responses */
  hooks?: {
    /** Transform Chat Completions API request body */
    'chat:request'?:
      | ChatCompletionBodyTransform
      | ChatCompletionBodyTransform[];
    /** Transform Responses API request body */
    'responses:request'?: ResponsesBodyTransform | ResponsesBodyTransform[];
    /** Transform response before returning */
    response?: ResponseTransform | ResponseTransform[];
  };
}

export class OpenAIConnector extends BaseConnector {
  static override readonly packageName = '@anygpt/openai';
  private client: OpenAI;
  private lastErrorBody: unknown = null;
  private hooks: HookManager;

  constructor(config: OpenAIConnectorConfig = {}) {
    super('openai', config);

    // Initialize hook manager
    this.hooks = new HookManager();

    // Register built-in token parameter transform
    this.hooks.on('chat:request', tokenParameterTransform);

    // Register user-provided hooks
    if (config.hooks) {
      if (config.hooks['chat:request']) {
        const hooks = Array.isArray(config.hooks['chat:request'])
          ? config.hooks['chat:request']
          : [config.hooks['chat:request']];
        hooks.forEach((hook) => this.hooks.on('chat:request', hook));
      }
      if (config.hooks['responses:request']) {
        const hooks = Array.isArray(config.hooks['responses:request'])
          ? config.hooks['responses:request']
          : [config.hooks['responses:request']];
        hooks.forEach((hook) => this.hooks.on('responses:request', hook));
      }
      if (config.hooks['response']) {
        const hooks = Array.isArray(config.hooks['response'])
          ? config.hooks['response']
          : [config.hooks['response']];
        hooks.forEach((hook) => this.hooks.on('response', hook));
      }
    }

    this.client = new OpenAI({
      apiKey: config.apiKey || '',
      baseURL: config.baseURL,
      defaultHeaders: config.defaultHeaders,
      timeout: config.timeout,
      maxRetries: config.maxRetries ?? 2,
      fetch: async (url: Request | URL | string, init?: RequestInit) => {
        // Custom fetch to log requests/responses
        this.logger.debug(`[${this.providerId}] HTTP Request:`, {
          method: init?.method || 'GET',
          url: url.toString(),
          headers: init?.headers,
          body: init?.body ? JSON.parse(init.body as string) : undefined,
        });

        const response = await fetch(url, init);
        const responseText = await response.text();

        let parsedResponse;
        if (responseText) {
          try {
            parsedResponse = JSON.parse(responseText);
          } catch {
            parsedResponse = responseText;
          }
        }

        this.logger.debug(`[${this.providerId}] HTTP Response:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: parsedResponse,
        });

        // Store error body for later use
        if (!response.ok && parsedResponse) {
          this.lastErrorBody = parsedResponse;
        }

        return new Response(responseText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      },
    });
  }

  override async chatCompletion(
    request: BaseChatCompletionRequest
  ): Promise<BaseChatCompletionResponse> {
    this.logger.debug('[OpenAI Connector] Incoming request flags:', {
      useLegacyMaxTokens: request.useLegacyMaxTokens,
      useLegacyCompletionAPI: request.useLegacyCompletionAPI,
    });

    const validatedRequest = this.validateRequest(request);

    if (!validatedRequest.model) {
      throw new Error('Model is required for chat completion');
    }

    try {
      const useLegacyAPI = validatedRequest.useLegacyCompletionAPI === true;
      const allowFallback = validatedRequest.fallbackToChatCompletion === true;

      try {
        if (useLegacyAPI) {
          return await this.executeChatCompletion(validatedRequest, 'direct');
        } else {
          return await this.executeResponsesAPI(validatedRequest);
        }
      } catch (error) {
        if (shouldFallbackToChatCompletion(error, allowFallback)) {
          this.logger.info(
            `[${this.providerId}] Responses API not available (${
              (error as { status?: number }).status
            }), falling back to Chat Completions API`
          );
          return await this.executeChatCompletion(validatedRequest, 'fallback');
        }
        throw error;
      }
    } catch (error) {
      const errorResponse = buildErrorResponse(
        error,
        validatedRequest.model,
        this.lastErrorBody
      );
      const errorMessage = formatErrorMessage(
        errorResponse,
        this.providerId,
        this.logger
      );
      throw new Error(errorMessage);
    }
  }

  /**
   * Execute Chat Completions API request
   */
  private async executeChatCompletion(
    request: BaseChatCompletionRequest,
    context: 'direct' | 'fallback'
  ): Promise<BaseChatCompletionResponse> {
    let chatRequest = buildChatCompletionRequest(request);

    // Apply hooks to transform the request
    chatRequest = await this.hooks.execute('chat:request', chatRequest, {
      request,
      providerId: this.providerId,
      apiType: 'chat',
    });

    this.logger.debug(
      `[OpenAI Connector] Chat Completions API Request (${context}):`,
      {
        model: chatRequest.model,
        max_tokens: chatRequest.max_tokens,
        max_completion_tokens: chatRequest.max_completion_tokens,
        max_output_tokens: (chatRequest as any).max_output_tokens,
      }
    );

    let response = await this.client.chat.completions.create(chatRequest);

    // Apply response hooks
    if (this.hooks.has('response')) {
      response = await this.hooks.execute('response', response, {
        request,
        providerId: this.providerId,
        apiType: 'chat',
      });
    }

    // Add provider field and ensure content is never null
    return {
      ...response,
      provider: this.providerId,
      choices: response.choices.map(choice => ({
        ...choice,
        message: {
          ...choice.message,
          content: choice.message.content || '',
        },
      })),
    } as BaseChatCompletionResponse;
  }

  /**
   * Execute Responses API request
   */
  private async executeResponsesAPI(
    request: BaseChatCompletionRequest
  ): Promise<BaseChatCompletionResponse> {
    const responsesRequest = buildResponsesRequest(request);

    this.logger.debug('[OpenAI Connector] Responses API Request:', {
      model: responsesRequest.model,
      max_output_tokens: responsesRequest.max_output_tokens,
    });

    const responsesResponse = await this.client.responses.create(
      responsesRequest
    );
    return convertResponsesToChatCompletion(responsesResponse, this.providerId);
  }

  override async response(request: ResponseRequest): Promise<ResponseResponse> {
    // Map router's ResponseRequest to OpenAI's Responses API
    const messages = Array.isArray(request.input)
      ? request.input
      : [{ role: 'user' as const, content: request.input }];

    const chatRequest: BaseChatCompletionRequest = {
      model: request.model,
      messages,
      temperature: request.temperature,
      max_tokens: request.max_output_tokens,
      top_p: request.top_p,
    };

    // Build Responses API request
    let responsesRequest = buildResponsesRequest(chatRequest);

    // Apply hooks to transform the request
    if (this.hooks.has('responses:request')) {
      responsesRequest = await this.hooks.execute(
        'responses:request',
        responsesRequest,
        {
          request: chatRequest,
          providerId: this.providerId,
          apiType: 'responses',
        }
      );
    }

    this.logger.debug(
      '[OpenAI Connector] Responses API Request (response method):',
      {
        model: responsesRequest.model,
        max_output_tokens: responsesRequest.max_output_tokens,
      }
    );

    // Execute API call
    let responsesResponse = await this.client.responses.create(
      responsesRequest
    );

    // Apply response hooks
    if (this.hooks.has('response')) {
      responsesResponse = await this.hooks.execute(
        'response',
        responsesResponse,
        {
          request: chatRequest,
          providerId: this.providerId,
          apiType: 'responses',
        }
      );
    }

    // Convert to router's ResponseResponse format
    return {
      id: responsesResponse.id,
      object: responsesResponse.object,
      created_at: responsesResponse.created_at,
      model: responsesResponse.model,
      provider: this.providerId,
      status: (responsesResponse.status || 'completed') as 'in_progress' | 'completed' | 'failed',
      output: responsesResponse.output.map((item, index) => ({
        id: `${responsesResponse.id}-${index}`,
        type: item.type as 'message' | 'function_call' | 'reasoning',
        role: ('role' in item ? item.role : 'assistant') as 'assistant' | 'user',
        content: ('content' in item ? item.content : []) as any,
      })),
      usage: {
        input_tokens: responsesResponse.usage?.input_tokens || 0,
        output_tokens: responsesResponse.usage?.output_tokens || 0,
        total_tokens: responsesResponse.usage?.total_tokens || 0,
      },
      ...(request.previous_response_id && {
        previous_response_id: request.previous_response_id,
      }),
    };
  }

  override async listModels(): Promise<ModelInfo[]> {
    try {
      // Try to fetch models from the remote API
      const response = await this.client.models.list();
      const models: ModelInfo[] = [];

      for await (const model of response) {
        // Create a more readable display name from the model ID
        const displayName = model.id
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        
        models.push({
          id: model.id,
          display_name: displayName,
          provider: this.providerId,
          capabilities: {
            input: { text: true },
            output: { text: true, streaming: true, function_calling: true },
          },
        });
      }

      return models;
    } catch (error) {
      // If remote listing fails, return empty array
      this.logger.debug(`[${this.providerId}] Failed to list models:`, error);
      return getChatModels(); // Returns empty array
    }
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    try {
      // Try to fetch model info from the remote API
      const model = await this.client.models.retrieve(modelId);

      // Create a more readable display name from the model ID
      const displayName = model.id
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      
      return {
        id: model.id,
        display_name: displayName,
        provider: this.providerId,
        capabilities: {
          input: { text: true },
          output: { text: true, streaming: true, function_calling: true },
        },
      };
    } catch (error) {
      // If remote retrieval fails, return null
      this.logger.debug(
        `[${this.providerId}] Failed to retrieve model ${modelId}:`,
        error
      );
      return null;
    }
  }
}

/**
 * Factory function for creating OpenAI connector instances
 * Supports both object config and string baseURL shorthand
 */
export function openai(
  config: OpenAIConnectorConfig | string = {},
  providerId?: string
): OpenAIConnector {
  // If string is passed, treat it as baseURL
  const finalConfig = typeof config === 'string' ? { baseURL: config } : config;

  const connector = new OpenAIConnector(finalConfig);

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

export default openai;

// Export hooks and types for users
export {
  type ConnectorHooks,
  type ChatCompletionBodyTransform,
  type ResponsesBodyTransform,
  type ResponseTransform,
  type TransformContext,
  tokenParameterTransform,
  customCodexTransform,
} from './hooks.js';
