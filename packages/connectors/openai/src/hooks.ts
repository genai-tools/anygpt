import type OpenAI from 'openai';
import type { BaseChatCompletionRequest as ChatCompletionRequest } from '@anygpt/router';

/**
 * Hook context passed to transform functions
 */
export interface TransformContext {
  /** The validated request from the router */
  request: ChatCompletionRequest;
  /** Provider ID (e.g., 'openai', 'booking') */
  providerId: string;
  /** API type being used */
  apiType: 'chat' | 'responses';
}

/**
 * Hook for transforming Chat Completions API request body
 */
export type ChatCompletionBodyTransform = (
  body: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  context: TransformContext
) => OpenAI.Chat.ChatCompletionCreateParamsNonStreaming;

/**
 * Hook for transforming Responses API request body
 */
export type ResponsesBodyTransform = (
  body: OpenAI.Responses.ResponseCreateParamsNonStreaming,
  context: TransformContext
) => OpenAI.Responses.ResponseCreateParamsNonStreaming;

/**
 * Hook for transforming response before returning
 */
export type ResponseTransform = (
  response: any,
  context: TransformContext
) => any;

/**
 * Collection of hooks that can be registered
 */
export interface ConnectorHooks {
  /** Transform Chat Completions API request body */
  'chat:request'?: ChatCompletionBodyTransform[];
  /** Transform Responses API request body */
  'responses:request'?: ResponsesBodyTransform[];
  /** Transform response before returning */
  response?: ResponseTransform[];
}

/**
 * Hook manager for registering and executing transforms
 */
export class HookManager {
  private hooks: ConnectorHooks = {};

  /**
   * Register a hook
   */
  on(event: 'chat:request', handler: ChatCompletionBodyTransform): void;
  on(event: 'responses:request', handler: ResponsesBodyTransform): void;
  on(event: 'response', handler: ResponseTransform): void;
  on(event: keyof ConnectorHooks, handler: any): void {
    if (!this.hooks[event]) {
      this.hooks[event] = [] as any;
    }
    (this.hooks[event] as any[]).push(handler);
  }

  /**
   * Execute all hooks for an event
   */
  async execute<K extends keyof ConnectorHooks>(
    event: K,
    initialValue: any,
    context: TransformContext
  ): Promise<any> {
    const handlers = this.hooks[event] || [];
    let result = initialValue;

    for (const handler of handlers) {
      result = await (handler as any)(result, context);
    }

    return result;
  }

  /**
   * Check if any hooks are registered for an event
   */
  has(event: keyof ConnectorHooks): boolean {
    return !!this.hooks[event]?.length;
  }

  /**
   * Clear all hooks
   */
  clear(): void {
    this.hooks = {};
  }
}

/**
 * Built-in transform: Handle token parameter variations
 * Respects the useLegacyMaxTokens flag for backwards compatibility
 */
export const tokenParameterTransform: ChatCompletionBodyTransform = (
  body,
  context
) => {
  // This transform is now handled by request-builders.ts
  // Kept here for backwards compatibility but does nothing
  return body;
};
