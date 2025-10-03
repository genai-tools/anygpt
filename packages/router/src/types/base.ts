/**
 * Base types for the GenAI Router connector system
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
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
    structured?: boolean;      // JSON mode
    function_calling?: boolean;
    streaming?: boolean;
    verbosity_control?: boolean;  // OpenAI verbosity
  };
  /** Reasoning features */
  reasoning?: {
    enabled: boolean;
    effort_control?: boolean;   // OpenAI reasoning effort
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

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface ConnectorConfig {
  timeout?: number;
  maxRetries?: number;
  logger?: Logger;
  [key: string]: any; // Allow provider-specific config
}
