/**
 * AI Provider types for function calling and agentic capabilities
 */

/**
 * Message in a conversation
 */
export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

/**
 * Tool call from AI
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

/**
 * Tool definition for AI
 */
export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>; // JSON Schema
  };
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Chat request
 */
export interface ChatRequest {
  messages: Message[];
  tools?: Tool[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Chat response
 */
export interface ChatResponse {
  message: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  usage: TokenUsage;
  model?: string;
}

/**
 * Streaming chunk
 */
export interface ChatChunk {
  delta: string;
  toolCalls?: Partial<ToolCall>[];
  finishReason?: 'stop' | 'tool_calls' | 'length' | 'content_filter';
}

/**
 * AI Provider interface
 */
export interface IAIProvider {
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
export interface ProviderConfig {
  provider: string;
  model?: string;
  apiKey?: string;
  baseURL?: string;
}
