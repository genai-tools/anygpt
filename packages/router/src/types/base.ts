/**
 * Base types for the GenAI Router connector system
 */

import type { Logger } from '@anygpt/types';

// Re-export Logger so it can be imported from this module
export type { Logger };

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Provider-specific extra parameters that can be passed in extra_body
 */
export interface ExtraBodyParams {
  // Anthropic extended thinking parameter
  thinking?: {
    type: 'enabled';
    budget_tokens?: number;
  };
  // Allow any other provider-specific parameters
  [key: string]: unknown;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  // API mode flag: determines which OpenAI API to use
  // - true: Use Chat Completions API directly (skip Responses API entirely)
  // - false/undefined: Try Responses API (default, modern API)
  useLegacyCompletionAPI?: boolean;
  // Fallback flag: only applies when using Responses API
  // - true: If Responses API fails (404/400), fallback to Chat Completions API
  // - false/undefined: No fallback, raise error
  fallbackToChatCompletion?: boolean;
  // Token parameter flag: only applies to Chat Completions API
  // - true: use max_tokens parameter (Anthropic/Cody style)
  // - false/undefined: use max_completion_tokens parameter (OpenAI style, default)
  useLegacyMaxTokens?: boolean;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  // Reasoning support (OpenAI o1/o3)
  reasoning?: {
    // OpenAI o1/o3 models: reasoning_effort parameter
    effort?: 'minimal' | 'low' | 'medium' | 'high';
  };
  // Provider-specific extra parameters that will be merged into the API request body
  extra_body?: ExtraBodyParams;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  provider: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelCapabilities {
  /** Input types supported */
  input: {
    text: boolean;
    image?: boolean;
    audio?: boolean;
  };
  /** Output features supported */
  output: {
    text: boolean;
    structured?: boolean; // JSON mode
    function_calling?: boolean;
    streaming?: boolean;
    verbosity_control?: boolean; // OpenAI verbosity
  };
  /** Reasoning features */
  reasoning?: {
    enabled: boolean;
    effort_control?: boolean; // OpenAI reasoning effort
  };
}

export interface ModelInfo {
  /** Unique model identifier */
  id: string;
  /** Provider name (openai, anthropic, etc.) */
  provider: string;
  /** Human-readable model name */
  display_name: string;
  /** What this model can do - only features that affect API calls */
  capabilities: ModelCapabilities;
}

export interface ConnectorConfig {
  timeout?: number;
  maxRetries?: number;
  logger?: Logger;
  [key: string]: unknown; // Allow provider-specific config
}
