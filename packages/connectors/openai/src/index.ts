import OpenAI from 'openai';
import { 
  BaseConnector, 
  type ConnectorConfig, 
  type ModelInfo,
  type BaseChatCompletionRequest,
  type BaseChatCompletionResponse,
  type ChatMessage,
  type ResponseRequest,
  type ResponseResponse,
  type ResponseOutput,
  type ResponseContent,
  type ResponseAnnotation
} from '@anygpt/router';
import type { ConnectorFactory } from '@anygpt/router';
import { getModelInfo, getChatModels, type OpenAIModelInfo } from './models.js';

export interface OpenAIConnectorConfig extends ConnectorConfig {
  apiKey?: string;
  baseURL?: string;  // Essential for OpenAI-compatible APIs
  defaultHeaders?: Record<string, string>;  // Custom headers for API requests
}

type ResponseInputMessage = {
  type: 'message';
  role: string;
  content: string;
};

type OpenAIResponseOutput = {
  id: string;
  type: string;
  role?: string;
  content?: Array<{
    type: string;
    text?: string;
    annotations?: unknown[];
  }>;
  status?: string;
};

export class OpenAIConnector extends BaseConnector {
  static override readonly packageName = '@anygpt/openai';
  private client: OpenAI;

  constructor(config: OpenAIConnectorConfig = {}) {
    super('openai', config);

    // Always create a client, use empty string if no API key provided
    // Some APIs might not require authentication or handle it differently
    this.client = new OpenAI({
      apiKey: config.apiKey || '',
      baseURL: config.baseURL,  // Support custom endpoints
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      defaultHeaders: config.defaultHeaders,  // Support custom headers
    });
  }

  override async chatCompletion(request: BaseChatCompletionRequest): Promise<BaseChatCompletionResponse> {

    // Allow any model name - let the API endpoint validate
    const validatedRequest = this.validateRequest(request);

    if (!validatedRequest.model) {
      throw new Error('Model is required for chat completion');
    }

    try {
      // Build request parameters using proper OpenAI SDK types
      // max_completion_tokens is the newer parameter that should work for all models
      const requestParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model: validatedRequest.model,
        messages: validatedRequest.messages,
        temperature: validatedRequest.temperature,
        max_completion_tokens: validatedRequest.max_tokens,
        top_p: validatedRequest.top_p,
        presence_penalty: validatedRequest.presence_penalty,
        stream: false, // For now, we'll handle streaming separately
        // Add reasoning_effort if provided (for o1/o3 models)
        reasoning_effort: validatedRequest.reasoning?.effort,
      };

      // Use the new Responses API pattern
      const response = await this.client.chat.completions.create(requestParams);

      return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      provider: this.getProviderId(),
      choices: response.choices.map(choice => ({
          index: choice.index,
          message: {
            role: choice.message.role,
            content: choice.message.content || '',
          },
          finish_reason: choice.finish_reason || 'unknown',
        })),
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      // Check for 500/400 errors which may indicate reasoning parameter mismatch
      if (error && typeof error === 'object' && 'status' in error) {
        const errorStatus = (error as { status?: number }).status;
        if (errorStatus === 500 || errorStatus === 400) {
          const hasReasoning = validatedRequest.reasoning?.effort;
          const hint = hasReasoning
            ? `This model may not support reasoning parameters. Try removing reasoning config.`
            : `This model may require reasoning configuration. Try adding reasoning: { effort: 'medium' } to your model config.`;
          
          // Check if we have a message already
          const errorMessage = (error as { message?: string }).message;
          if (errorMessage && !errorMessage.includes('no body')) {
            // We have a real error message, don't add hint
            throw new Error(`${this.providerId} chat completion failed: ${errorMessage}`);
          }
          
          throw new Error(
            `${this.providerId} chat completion failed: ${errorStatus} status code (no body). ${hint}`
          );
        }
      }
      
      // Log detailed error information for debugging
      this.logger.error(`Chat completion error for model ${validatedRequest.model}:`, error);
      
      // Try to extract error details from various error formats
      if (error instanceof OpenAI.APIError) {
        // OpenAI SDK error
        const errorMessage = error.message || `${error.status} status code`;
        
        // Log for debugging
        this.logger.error(`API Status: ${error.status}`);
        this.logger.error(`API Message: ${error.message}`);
        this.logger.error(`API Error:`, error.error);
        
        throw new Error(`${this.providerId} chat completion failed: ${errorMessage}`);
      } else if (error && typeof error === 'object' && 'status' in error) {
        // Generic error with status
        const genericError = error as { status?: number; message?: string; body?: unknown };
        let errorMessage = genericError.message || `${genericError.status} status code`;
        
        // Try to extract from body
        if (genericError.body) {
          try {
            const bodyStr = typeof genericError.body === 'string' 
              ? genericError.body 
              : JSON.stringify(genericError.body);
            errorMessage += ` - ${bodyStr}`;
          } catch {
            // Ignore JSON stringify errors
          }
        }
        
        throw new Error(`${this.providerId} chat completion failed: ${errorMessage}`);
      }
      
      this.handleError(error, 'chat completion');
    }
  }

  override async listModels(): Promise<ModelInfo[]> {
    try {
      // Try to fetch models from the API
      const response = await this.client.models.list();
      const models: ModelInfo[] = [];
      
      for await (const model of response) {
        // Log the full model object to see what fields are available
        this.logger.debug(`Model data: ${JSON.stringify(model)}`);
        
        models.push({
          id: model.id,
          provider: this.getProviderId(),
          display_name: model.id,
          capabilities: {
            input: { text: true },
            output: { text: true, streaming: true },
          },
        });
      }
      
      // If no models returned from API, fall back to static list
      if (models.length === 0) {
        return getChatModels();
      }
      
      return models;
    } catch (error) {
      // If API call fails, fall back to static model list
      this.logger.debug(`Failed to fetch models from API, using static list: ${error}`);
      return getChatModels();
    }
  }

  override isInitialized(): boolean {
    return true; // Client is always initialized now
  }

  override validateRequest(request: BaseChatCompletionRequest): BaseChatCompletionRequest {
    // First apply base validation
    const baseValidated = super.validateRequest(request);
    
    // Then apply OpenAI-specific validation if model info is available
    const modelInfo = getModelInfo(baseValidated.model || 'gpt-3.5-turbo');
    if (modelInfo) {
      return this.validateRequestWithModel(baseValidated, modelInfo);
    }
    
    return baseValidated;
  }

  private validateRequestWithModel(request: BaseChatCompletionRequest, modelInfo: OpenAIModelInfo): BaseChatCompletionRequest {
    const validated = { ...request };
    void modelInfo;
    // Set default model if not provided
    if (!validated.model) {
      validated.model = 'gpt-3.5-turbo';
    }

    // TODO: Add token estimation and context validation
    // const estimatedTokens = this.estimateTokens(validated.messages);
    // if (estimatedTokens > modelInfo.contextLength * 0.8) {
    //   console.warn(`Message length may exceed context window for model ${modelInfo.id}`);
    // }

    return validated;
  }

  async response(request: ResponseRequest): Promise<ResponseResponse> {
    try {
      // Convert input to proper format
      let input: ResponseRequest['input'] | ResponseInputMessage[];
      if (typeof request.input === 'string') {
        input = request.input;
      } else {
        input = request.input.map(message => ({
          type: 'message',
          role: message.role,
          content: message.content,
        }));
      }

      const responseParams: Record<string, unknown> = {
        model: request.model,
        input,
        temperature: request.temperature,
        max_output_tokens: request.max_output_tokens,
        top_p: request.top_p,
      };

      // Add previous_response_id if provided for conversation continuity
      if (request.previous_response_id) {
        responseParams['previous_response_id'] = request.previous_response_id;
      }

      // Add tools if provided
      if (request.tools) {
        responseParams['tools'] = request.tools;
      }
      if (request.tool_choice) {
        responseParams['tool_choice'] = request.tool_choice;
      }

      const response = await this.client.responses.create(responseParams);

      const responseOutputs = (response.output ?? []) as OpenAIResponseOutput[];
      const normalizedOutput: ResponseOutput[] = responseOutputs.map(item => ({
        id: item.id,
        type: item.type as ResponseOutput['type'],
        role: item.role as ResponseOutput['role'],
        content: (item.content ?? []).map<ResponseContent>(contentItem => ({
          type: contentItem.type as ResponseContent['type'],
          text: contentItem.text ?? '',
          annotations: [] as ResponseAnnotation[],
        })),
        status: item.status,
      }));

      return {
        id: response.id,
        object: response.object,
        created_at: response.created_at,
        model: response.model,
        provider: this.getProviderId(),
        status: response.status as 'in_progress' | 'completed' | 'failed',
        output: normalizedOutput,
        usage: {
          input_tokens: response.usage?.input_tokens || 0,
          output_tokens: response.usage?.output_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
        previous_response_id: request.previous_response_id
      };
    } catch (error) {
      // Log the error for debugging
      this.logger.info(`Response API error: ${error}`);
      
      // Check if it's a 404 error (Responses API not supported)
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        this.logger.info('Responses API not supported, falling back to Chat Completions API');
        return await this.fallbackToChatCompletion(request);
      }
      
      // Also check for other common "not found" patterns
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = String(error.message).toLowerCase();
        if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('no such endpoint')) {
          this.logger.info('Responses API not found, falling back to Chat Completions API');
          return await this.fallbackToChatCompletion(request);
        }
      }
      
      this.handleError(error, 'response');
    }
  }

  /**
   * Fallback method to convert ResponseRequest to ChatCompletionRequest and use Chat API
   */
  private async fallbackToChatCompletion(request: ResponseRequest): Promise<ResponseResponse> {
    // Convert ResponseRequest to ChatCompletionRequest
    let messages: ChatMessage[];
    
    if (typeof request.input === 'string') {
      messages = [{ role: 'user', content: request.input }];
    } else {
      messages = request.input.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }));
    }

    const chatRequest: BaseChatCompletionRequest = {
      model: request.model,
      messages,
      temperature: request.temperature,
      max_tokens: request.max_output_tokens,
      top_p: request.top_p
    };

    // Use the existing chatCompletion method
    const chatResponse = await this.chatCompletion(chatRequest);

    // Convert ChatCompletionResponse to ResponseResponse format
    const message = chatResponse.choices[0]?.message;
    if (!message) {
      throw new Error('No response from chat completion');
    }

    return {
      id: chatResponse.id,
      object: 'response',
      created_at: Math.floor(Date.now() / 1000),
      model: chatResponse.model,
      provider: this.getProviderId(),
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
        input_tokens: chatResponse.usage?.prompt_tokens || 0,
        output_tokens: chatResponse.usage?.completion_tokens || 0,
        total_tokens: chatResponse.usage?.total_tokens || 0,
      },
      previous_response_id: request.previous_response_id
    };
  }

  getModelInfo(modelId: string): OpenAIModelInfo | undefined {
    return getModelInfo(modelId);
  }
}

// Factory for the connector registry
export class OpenAIConnectorFactory implements ConnectorFactory {
  getProviderId(): string {
    return 'openai';
  }

  create(config: ConnectorConfig): OpenAIConnector {
    return new OpenAIConnector(config as OpenAIConnectorConfig);
  }
}

export default OpenAIConnectorFactory;

/**
 * Factory function for cleaner syntax
 * Supports both object config and string baseURL shorthand
 */
export function openai(config: OpenAIConnectorConfig | string = {}, providerId?: string): OpenAIConnector {
  // If string is passed, treat it as baseURL
  const finalConfig = typeof config === 'string' 
    ? { baseURL: config }
    : config;
    
  const connector = new OpenAIConnector(finalConfig);
  
  // Override provider ID if specified (for custom gateways)
  if (providerId) {
    // Note: providerId is readonly, so we need to use Object.defineProperty
    Object.defineProperty(connector, 'providerId', {
      value: providerId,
      writable: false,
      enumerable: true,
      configurable: false
    });
  }
    
  return connector;
}
