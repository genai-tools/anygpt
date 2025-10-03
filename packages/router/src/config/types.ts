/**
 * Gateway Configuration System - Similar to Kilocode's approach
 * Allows users to define presets with URL, model, and parameters
 */

export interface GatewayProfile {
  /** Unique identifier for the profile */
  slug: string;
  /** Human-readable name */
  name: string;
  /** Description of what this profile is for */
  description?: string;
  /** Provider configuration */
  provider: ProviderConfig;
  /** Model-specific settings */
  model: ModelConfig;
  /** Request parameters */
  parameters?: RequestParameters;
  /** Context settings */
  context?: ContextConfig;
}

export interface ProviderConfig {
  /** Provider type (openai, anthropic, local, etc.) */
  type: 'openai' | 'anthropic' | 'local' | 'custom';
  /** API endpoint URL */
  baseURL?: string;
  /** API key (can be env var reference) */
  apiKey?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Timeout settings */
  timeout?: number;
  /** Retry settings */
  maxRetries?: number;
}

export interface ModelConfig {
  /** Model identifier */
  id: string;
  /** Model display name override */
  displayName?: string;
  /** Model prefix for custom endpoints */
  prefix?: string;
}

export interface RequestParameters {
  /** Temperature (0-2) */
  temperature?: number;
  /** Max tokens to generate */
  maxTokens?: number;
  /** Top-p sampling */
  topP?: number;
  /** Frequency penalty */
  frequencyPenalty?: number;
  /** Presence penalty */
  presencePenalty?: number;
  /** Enable streaming */
  streaming?: boolean;
  /** Verbosity level (OpenAI) */
  verbosity?: 'low' | 'medium' | 'high';
  /** Reasoning effort (OpenAI) */
  reasoningEffort?: 'low' | 'medium' | 'high';
}

export interface ContextConfig {
  /** System prompt */
  systemPrompt?: string;
  /** Context window size */
  contextWindow?: number;
  /** Memory/conversation history settings */
  memory?: {
    enabled: boolean;
    maxMessages?: number;
    summarizeAfter?: number;
  };
}

export interface GatewayConfig {
  /** Configuration format version */
  version: string;
  /** List of profiles */
  profiles: GatewayProfile[];
  /** Default profile to use */
  defaultProfile?: string;
  /** Global settings */
  global?: {
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics?: boolean;
  };
}
