/**
 * Chat-related types and interfaces
 */

/**
 * Provider-specific extra body parameters
 * Used for provider-specific features like Anthropic's thinking parameter
 */
export type ExtraBodyParams = Record<string, unknown>;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  // Maximum tokens for completion
  // Parameter name depends on API mode and legacy flags
  max_tokens?: number;
  // Capability flags from config - determines API mode and parameter names
  // Internal use only, not sent to API
  useLegacyCompletionAPI?: boolean; // true = Chat Completions API directly, false/undefined = Responses API (default)
  fallbackToChatCompletion?: boolean; // true = fallback to Chat Completions if Responses fails (404/400)
  useLegacyMaxTokens?: boolean; // Only for Chat Completions: true = max_tokens (Anthropic), false = max_completion_tokens (OpenAI)
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  // Reasoning support (OpenAI o1/o3, Anthropic Claude extended thinking)
  reasoning?: {
    // OpenAI o1/o3 models: reasoning_effort parameter
    effort?: 'minimal' | 'low' | 'medium' | 'high';
    // Anthropic extended thinking models: thinking parameter
    thinking?: {
      type: 'enabled';
      budget_tokens?: number;
    };
  };
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
