import { BaseChatCompletionRequest, BaseChatCompletionResponse, BaseConnector, ConnectorConfig, ConnectorFactory, ModelInfo, ResponseRequest, ResponseResponse } from "@anygpt/router";

//#region src/index.d.ts

/**
 * Configuration for Claude Agent SDK connector
 */
interface ClaudeAgentConnectorConfig extends ConnectorConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  mcpServers?: Record<string, unknown>;
  permissions?: Record<string, string>;
}
/**
 * Connector for Claude Agent SDK
 * Provides agentic capabilities with built-in tool support
 */
declare class ClaudeAgentConnector extends BaseConnector {
  static readonly packageName = "@anygpt/claude-agent";
  protected config: ClaudeAgentConnectorConfig;
  private client;
  constructor(config?: ClaudeAgentConnectorConfig);
  /**
   * List available models from Anthropic API
   */
  listModels(): Promise<ModelInfo[]>;
  /**
   * Response method (not supported by Agent SDK)
   */
  response(_request: ResponseRequest): Promise<ResponseResponse>;
  /**
   * Chat completion using Claude Agent SDK
   * Converts OpenAI-style messages to Agent SDK format
   */
  chatCompletion(request: BaseChatCompletionRequest): Promise<BaseChatCompletionResponse>;
}
/**
 * Factory for creating Claude Agent connectors
 */
declare class ClaudeAgentConnectorFactory implements ConnectorFactory {
  getProviderId(): string;
  create(config: ConnectorConfig): ClaudeAgentConnector;
}
/**
 * Factory function for cleaner syntax
 */
declare function claudeAgent(config?: ClaudeAgentConnectorConfig | string, providerId?: string): ClaudeAgentConnector;
//#endregion
export { ClaudeAgentConnector, ClaudeAgentConnectorConfig, ClaudeAgentConnectorFactory, ClaudeAgentConnectorFactory as default, claudeAgent };
//# sourceMappingURL=index.d.ts.map