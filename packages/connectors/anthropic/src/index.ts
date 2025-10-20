import Anthropic from '@anthropic-ai/sdk';
import type { BetaRunnableTool } from '@anthropic-ai/sdk/lib/tools/BetaRunnableTool';
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
    // Debug: Log incoming request
    this.logger.debug('[Anthropic Connector] Incoming request:', {
      has_tools: !!request.tools,
      tool_count: request.tools?.length || 0,
      has_tool_executor: !!request.tool_executor,
    });
    
    const validatedRequest = this.validateRequest(request);

    if (!validatedRequest.model) {
      throw new Error('Model is required for chat completion');
    }

    // If tools are provided and there's a tool executor, use agentic loop
    this.logger.debug('[Anthropic Connector] Checking for tools:', {
      has_tools: !!validatedRequest.tools,
      tool_count: validatedRequest.tools?.length || 0,
      has_executor: !!validatedRequest.tool_executor,
    });
    
    if (validatedRequest.tools && validatedRequest.tools.length > 0 && validatedRequest.tool_executor) {
      this.logger.debug('[Anthropic Connector] Using chatCompletionWithTools');
      return this.chatCompletionWithTools(validatedRequest);
    }
    
    this.logger.debug('[Anthropic Connector] Using regular chatCompletion');

    try {
      // Build request parameters using Anthropic SDK types
      const requestParams: Anthropic.MessageCreateParamsNonStreaming = {
        model: validatedRequest.model,
        messages: validatedRequest.messages
          .filter((msg) => msg.role !== 'system') // System handled separately
          .map((msg): Anthropic.MessageParam => {
            // Convert tool role to user with tool_result content
            if (msg.role === 'tool') {
              const toolCallId = 'toolCallId' in msg ? msg.toolCallId : undefined;
              return {
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolCallId || 'unknown',
                    content: msg.content,
                  },
                ],
              };
            }
            
            // Assistant messages with tool_calls need special handling
            if (msg.role === 'assistant') {
              const hasToolCalls = 'tool_calls' in msg;
              const toolCalls = hasToolCalls ? msg.tool_calls : undefined;
              
              this.logger.debug('[Anthropic Connector] Assistant message:', {
                hasToolCalls,
                toolCallsType: typeof toolCalls,
                isArray: Array.isArray(toolCalls),
                length: toolCalls?.length,
              });
              
              if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
                const content: Anthropic.MessageParam['content'] = [];
                
                // Add text content if present
                if (msg.content) {
                  content.push({
                    type: 'text',
                    text: msg.content,
                  });
                }
                
                // Add tool_use blocks
                toolCalls.forEach((tc) => {
                  content.push({
                    type: 'tool_use',
                    id: tc.id,
                    name: tc.function.name,
                    input: JSON.parse(tc.function.arguments),
                  });
                });
                
                return {
                  role: 'assistant',
                  content,
                };
              }
            }
            
            // Regular user/assistant messages
            return {
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            };
          }),
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
        // Note: system messages already filtered out in the messages mapping above
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

      // Add tools if provided (convert from OpenAI format to Anthropic format)
      if (validatedRequest.tools && validatedRequest.tools.length > 0) {
        requestParams.tools = validatedRequest.tools.map((tool) => {
          const schema = tool.function.parameters || { properties: {} };
          return {
            name: tool.function.name,
            description: tool.function.description || '',
            input_schema: {
              type: 'object' as const,
              ...schema,
            },
          };
        });
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
        has_tools: !!requestParams.tools,
        tool_count: requestParams.tools?.length || 0,
        message_count: requestParams.messages.length,
      });
      
      // Debug: Log messages
      this.logger.debug('[Anthropic Connector] Messages:', JSON.stringify(requestParams.messages, null, 2));
      
      // Debug: Log tools if present
      if (requestParams.tools && requestParams.tools.length > 0) {
        this.logger.debug('[Anthropic Connector] Tools:', JSON.stringify(requestParams.tools, null, 2));
      }

      let response;
      try {
        response = await this.client.messages.create(requestParams);

        // Debug: Log response
        this.logger.debug('[Anthropic Connector] Response:', {
          stop_reason: response.stop_reason,
          content_types: response.content.map(c => c.type),
          content_length:
            response.content[0]?.type === 'text'
              ? (response.content[0] as Anthropic.TextBlock).text.length
              : 0,
          usage: response.usage,
        });
        
        // Debug: Log content blocks
        this.logger.debug('[Anthropic Connector] Content blocks:', JSON.stringify(response.content, null, 2));

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

      // Extract tool use blocks and convert to OpenAI format
      const toolCalls = response.content
        .filter((block) => block.type === 'tool_use')
        .map((block) => {
          const toolBlock = block as Anthropic.ToolUseBlock;
          return {
            id: toolBlock.id,
            type: 'function' as const,
            function: {
              name: toolBlock.name,
              arguments: JSON.stringify(toolBlock.input),
            },
          };
        });
      
      // Debug: Log tool calls
      this.logger.debug('[Anthropic Connector] Extracted tool calls:', {
        count: toolCalls.length,
        calls: toolCalls.map(tc => ({ id: tc.id, name: tc.function.name })),
      });

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
              ...(toolCalls.length > 0 && { tool_calls: toolCalls }),
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

  /**
   * Chat completion with agentic tool loop using Anthropic's toolRunner
   */
  private async chatCompletionWithTools(
    request: BaseChatCompletionRequest
  ): Promise<BaseChatCompletionResponse> {
    const { tool_executor, tools, model, max_tokens, messages } = request;
    
    if (!tool_executor) {
      throw new Error('tool_executor is required for agentic tool loop');
    }
    
    if (!tools || tools.length === 0) {
      throw new Error('tools array is required for agentic tool loop');
    }
    
    if (!model) {
      throw new Error('model is required');
    }

    this.logger.debug('[Anthropic Connector] Starting toolRunner with tools:', {
      tool_count: tools.length,
      tool_names: tools.map(t => t.function.name),
    });

    // Convert OpenAI tools to Anthropic BetaRunnableTool format
    const anthropicTools: BetaRunnableTool[] = tools.map((tool) => {
      this.logger.debug('[Anthropic Connector] Converting tool:', tool.function.name);
      
      const params = tool.function.parameters;
      const required = Array.isArray(params?.['required']) ? params['required'] : [];
      
      return {
        type: 'custom' as const,
        name: tool.function.name,
        description: tool.function.description || '',
        input_schema: {
          type: 'object' as const,
          properties: params?.['properties'] || {},
          ...(required.length > 0 && { required }),
        },
        run: async (input: Record<string, unknown>) => {
          this.logger.debug('[Anthropic Connector] Tool run called:', {
            name: tool.function.name,
            input,
          });
          
          const result = await tool_executor({
            id: `tool_${Date.now()}`,
            name: tool.function.name,
            arguments: input,
          });
          
          this.logger.debug('[Anthropic Connector] Tool result:', result);
          return result;
        },
        parse: (content: unknown) => content as Record<string, unknown>,
      };
    });

    // Extract system message
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((msg) => msg.role !== 'system');

    this.logger.debug('[Anthropic Connector] Calling toolRunner...');
    
    const finalMessage = await this.client.beta.messages.toolRunner({
      model,
      max_tokens: max_tokens || 4096,
      messages: userMessages.map((msg): Anthropic.MessageParam => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      tools: anthropicTools,
      ...(systemMessage && { system: systemMessage.content }),
    });
    
    this.logger.debug('[Anthropic Connector] toolRunner completed:', {
      id: finalMessage.id,
      role: finalMessage.role,
      stop_reason: finalMessage.stop_reason,
      content_blocks: finalMessage.content.length,
    });

    // Convert Anthropic response to OpenAI format
    const textContent = finalMessage.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.TextBlock).text)
      .join('\n');

    return {
      id: finalMessage.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: finalMessage.model,
      provider: this.getProviderId(),
      choices: [
        {
          index: 0,
          message: {
            role: finalMessage.role,
            content: textContent,
          },
          finish_reason: finalMessage.stop_reason || 'stop',
        },
      ],
      usage: {
        prompt_tokens: finalMessage.usage.input_tokens,
        completion_tokens: finalMessage.usage.output_tokens,
        total_tokens:
          finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
      },
    };
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
