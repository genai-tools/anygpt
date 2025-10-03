/**
 * Router-specific types and interfaces
 */

import type { 
  ChatMessage, 
  ChatCompletionRequest as BaseChatRequest,
  ChatCompletionResponse as BaseChatResponse,
  ModelInfo 
} from './base.js';

/**
 * API configuration for provider
 */
export interface ApiConfig {
  url: string;
  token?: string;
  headers?: Record<string, string>;
}

/**
 * Provider configuration - simplified
 */
export interface ProviderConfig {
  type: 'openai' | 'anthropic' | 'google' | 'custom';
  api: ApiConfig;
  timeout?: number;
  maxRetries?: number;
  wireApi?: 'chat' | 'responses';
}

/**
 * Router configuration interface
 */
export interface RouterConfig {
  providers?: Record<string, ProviderConfig>;
  timeout?: number;
  maxRetries?: number;
}

// Keep GatewayConfig as alias for backward compatibility
export type GatewayConfig = RouterConfig;

/**
 * Router-specific chat completion request (extends base with provider)
 */
export interface ChatCompletionRequest extends Omit<BaseChatRequest, 'messages'> {
  messages: ChatMessage[];
  provider: string;  // Required now
}

/**
 * Router-specific chat completion response (extends base with provider)
 */
export interface ChatCompletionResponse extends BaseChatResponse {
  provider: string;
}

/**
 * Tool definition for function calling
 */
export interface Tool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

/**
 * Tool choice configuration
 */
export type ToolChoice = 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };

/**
 * Response API request interface
 */
export interface ResponseRequest {
  provider: string;
  model: string;
  input: string | ChatMessage[];
  previous_response_id?: string;
  temperature?: number;
  max_output_tokens?: number;
  top_p?: number;
  tools?: Tool[];
  tool_choice?: ToolChoice;
}

/**
 * Response API response interface
 */
export interface ResponseResponse {
  id: string;
  object: string;
  created_at: number;
  model: string;
  provider: string;
  status: 'in_progress' | 'completed' | 'failed';
  output: ResponseOutput[];
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  previous_response_id?: string;
}

/**
 * Response output item
 */
export interface ResponseOutput {
  id: string;
  type: 'message' | 'function_call' | 'reasoning';
  role?: 'assistant' | 'user';
  content?: ResponseContent[];
  status?: string;
}

/**
 * Response content annotation
 */
export interface ResponseAnnotation {
  type: string;
  text?: string;
  [key: string]: unknown;
}

/**
 * Response content item
 */
export interface ResponseContent {
  type: 'output_text' | 'function_call' | 'reasoning';
  text?: string;
  annotations?: ResponseAnnotation[];
}

/**
 * Router interface
 */
export interface IRouter {
  chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  response(request: ResponseRequest): Promise<ResponseResponse>;
  listModels(provider?: string): Promise<ModelInfo[]>;
  getAvailableProviders(): string[];
  hasProvider(providerId: string): boolean;
}

// Keep IGateway as alias for backward compatibility
export type IGateway = IRouter;
