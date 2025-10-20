import type {
  IAIProvider,
  ChatRequest,
  ChatResponse,
  ChatChunk,
  ProviderConfig,
  Message,
  ToolCall,
} from './types.js';

/**
 * AI Provider wrapper that uses @anygpt/router for provider-agnostic AI interactions
 */
export class AIProvider implements IAIProvider {
  private router: any;
  public config: ProviderConfig;

  constructor(router: any, config: ProviderConfig) {
    this.router = router;
    this.config = config;
  }

  /**
   * Send a chat request and get a response
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Convert our format to router format
    const routerRequest = {
      provider: this.config.provider,
      model: request.model || this.config.model,
      messages: this.convertMessages(request.messages),
      ...(request.tools && { tools: this.convertTools(request.tools) }),
      ...(request.tool_executor && { tool_executor: request.tool_executor }),
      ...(request.temperature !== undefined && {
        temperature: request.temperature,
      }),
      ...(request.maxTokens && { max_tokens: request.maxTokens }),
    };

    // Call router
    const response = await this.router.chatCompletion(routerRequest);

    // Convert router response to our format
    return this.convertResponse(response);
  }

  /**
   * Stream a chat response
   */
  async *stream(request: ChatRequest): AsyncIterator<ChatChunk> {
    // TODO: Implement streaming in future iteration
    throw new Error('Streaming not yet implemented');
  }

  /**
   * Convert messages to router format
   */
  private convertMessages(messages: Message[]): any[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      ...(msg.name && { name: msg.name }),
      ...(msg.toolCallId && { tool_call_id: msg.toolCallId }),
      ...(msg.toolCalls && { tool_calls: msg.toolCalls }),
    }));
  }

  /**
   * Convert tools to router format
   */
  private convertTools(tools: any[]): any[] {
    // Router uses same format as OpenAI, so pass through
    return tools;
  }

  /**
   * Convert router response to our format
   */
  private convertResponse(response: any): ChatResponse {
    const choice = response.choices[0];
    const message = choice.message;

    // Extract tool calls if present
    const toolCalls: ToolCall[] | undefined = message.tool_calls?.map(
      (tc: any) => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })
    );

    return {
      message: message.content || '',
      toolCalls,
      finishReason: this.normalizeFinishReason(choice.finish_reason),
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: response.model,
    };
  }

  /**
   * Normalize finish reason across providers
   */
  private normalizeFinishReason(
    reason: string
  ): 'stop' | 'tool_calls' | 'length' | 'content_filter' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'tool_calls':
      case 'function_call':
        return 'tool_calls';
      case 'length':
      case 'max_tokens':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}
