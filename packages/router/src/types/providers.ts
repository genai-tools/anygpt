/**
 * Provider-specific types and configurations
 */

import type { ConnectorConfig } from './base.js';

/**
 * OpenAI-specific configuration
 */
export interface OpenAIConnectorConfig extends ConnectorConfig {
  apiKey?: string;
}

/**
 * Mock connector configuration for testing
 */
export interface MockConnectorConfig extends ConnectorConfig {
  delay?: number; // Simulate API delay in ms
  failureRate?: number; // 0-1, probability of failure
  customResponses?: Record<string, any>;
}

/**
 * Anthropic configuration (for future implementation)
 */
export interface AnthropicConnectorConfig extends ConnectorConfig {
  apiKey?: string;
  version?: string;
}

/**
 * Local model configuration (for future implementation)
 */
export interface LocalModelConfig extends ConnectorConfig {
  modelPath?: string;
  endpoint?: string;
  modelType?: 'ollama' | 'llamacpp' | 'custom';
}
