/**
 * Router configuration and interface types
 */

import type { 
  ChatMessage, 
  ChatCompletionRequest as BaseChatRequest,
  ChatCompletionResponse as BaseChatResponse
} from './chat.js';
import type { ModelInfo } from './models.js';
import type { ProviderConfig } from './api.js';
import type { ResponseRequest, ResponseResponse } from './responses.js';

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
