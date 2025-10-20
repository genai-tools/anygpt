//#region src/types.d.ts
/**
 * AI Provider types for function calling and agentic capabilities
 */
/**
 * Message in a conversation
 */
interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}
/**
 * Tool call from AI
 */
interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}
/**
 * Tool definition for AI
 */
interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}
/**
 * Token usage statistics
 */
interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
/**
 * Chat request
 */
interface ChatRequest {
  messages: Message[];
  tools?: Tool[];
  tool_executor?: (call: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }) => Promise<string>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
/**
 * Chat response
 */
interface ChatResponse {
  message: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  usage: TokenUsage;
  model?: string;
}
/**
 * Streaming chunk
 */
interface ChatChunk {
  delta: string;
  toolCalls?: Partial<ToolCall>[];
  finishReason?: 'stop' | 'tool_calls' | 'length' | 'content_filter';
}
/**
 * AI Provider interface
 */
interface IAIProvider {
  /**
   * Send a chat request and get a response
   */
  chat(request: ChatRequest): Promise<ChatResponse>;
  /**
   * Stream a chat response
   */
  stream(request: ChatRequest): AsyncIterator<ChatChunk>;
}
/**
 * Provider configuration
 */
interface ProviderConfig {
  provider: string;
  model?: string;
  apiKey?: string;
  baseURL?: string;
}
//#endregion
//#region src/ai-provider.d.ts
/**
 * AI Provider wrapper that uses @anygpt/router for provider-agnostic AI interactions
 */
declare class AIProvider implements IAIProvider {
  private router;
  config: ProviderConfig;
  constructor(router: any, config: ProviderConfig);
  /**
   * Send a chat request and get a response
   */
  chat(request: ChatRequest): Promise<ChatResponse>;
  /**
   * Stream a chat response
   */
  stream(request: ChatRequest): AsyncIterator<ChatChunk>;
  /**
   * Convert messages to router format
   */
  private convertMessages;
  /**
   * Convert tools to router format
   */
  private convertTools;
  /**
   * Convert router response to our format
   */
  private convertResponse;
  /**
   * Normalize finish reason across providers
   */
  private normalizeFinishReason;
}
//#endregion
export { AIProvider, type ChatChunk, type ChatRequest, type ChatResponse, type IAIProvider, type Message, type ProviderConfig, type TokenUsage, type Tool, type ToolCall };
//# sourceMappingURL=index.d.ts.map