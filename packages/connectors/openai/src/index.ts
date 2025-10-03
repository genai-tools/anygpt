import OpenAI from 'openai';
import { 
  BaseConnector, 
  type ConnectorConfig, 
  type ModelInfo,
  type BaseChatCompletionRequest,
  type BaseChatCompletionResponse,
  type ChatMessage,
  type ResponseRequest,
  type ResponseResponse
} from '@anygpt/router';
import type { ConnectorFactory } from '@anygpt/router';
import { getModelInfo, getChatModels, type OpenAIModelInfo } from './models.js';

export interface OpenAIConnectorConfig extends ConnectorConfig {
  apiKey?: string;
  baseURL?: string;  // Essential for OpenAI-compatible APIs
}

export class OpenAIConnector extends BaseConnector {
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
    });
  }

  override async chatCompletion(request: BaseChatCompletionRequest): Promise<BaseChatCompletionResponse> {

    // Allow any model name - let the API endpoint validate
    const validatedRequest = this.validateRequest(request);

    try {
      // Use the new Responses API pattern
      const response = await this.client.chat.completions.create({
        model: validatedRequest.model!,
        messages: validatedRequest.messages,
        temperature: validatedRequest.temperature,
        max_tokens: validatedRequest.max_tokens,
        top_p: validatedRequest.top_p,
        presence_penalty: validatedRequest.presence_penalty,
        stream: false, // For now, we'll handle streaming separately
      });

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
      this.handleError(error, 'chat completion');
    }
  }

  override async listModels(): Promise<ModelInfo[]> {
    try {
      return getChatModels();
    } catch (error) {
      this.handleError(error, 'list models');
      return [];
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

  private validateRequestWithModel(request: BaseChatCompletionRequest, _modelInfo: OpenAIModelInfo): BaseChatCompletionRequest {
    const validated = { ...request };
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
      let input: any;
      if (typeof request.input === 'string') {
        input = request.input;
      } else {
        input = request.input.map(msg => ({
          type: 'message',
          role: msg.role,
          content: msg.content
        }));
      }

      const responseParams: any = {
        model: request.model,
        input: input,
        temperature: request.temperature,
        max_output_tokens: request.max_output_tokens,
        top_p: request.top_p,
      };

      // Add previous_response_id if provided for conversation continuity
      if (request.previous_response_id) {
        responseParams.previous_response_id = request.previous_response_id;
      }

      // Add tools if provided
      if (request.tools) {
        responseParams.tools = request.tools;
      }
      if (request.tool_choice) {
        responseParams.tool_choice = request.tool_choice;
      }

      const response = await this.client.responses.create(responseParams);

      return {
        id: response.id,
        object: response.object,
        created_at: response.created_at,
        model: response.model,
        provider: this.getProviderId(),
        status: response.status as 'in_progress' | 'completed' | 'failed',
        output: response.output.map((item: any) => ({
          id: item.id,
          type: item.type,
          role: item.role,
          content: item.content?.map((content: any) => ({
            type: content.type,
            text: content.text,
            annotations: content.annotations || []
          })) || [],
          status: item.status
        })),
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

  create(config: ConnectorConfig): BaseConnector {
    return new OpenAIConnector(config as OpenAIConnectorConfig);
  }
}

export default OpenAIConnectorFactory;
