/**
 * Centralized type exports for the GenAI Gateway
 */

// Base types
export type {
  ChatMessage,
  ChatCompletionRequest as BaseChatCompletionRequest,
  ChatCompletionResponse as BaseChatCompletionResponse,
  ModelInfo,
  ConnectorConfig
} from './base.js';

// Connector types
export type {
  IConnector,
  ConnectorFactory,
  IConnectorRegistry
} from './connector.js';

// Router types
export type {
  RouterConfig,
  GatewayConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ResponseRequest,
  ResponseResponse,
  ResponseOutput,
  ResponseContent,
  ResponseAnnotation,
  Tool,
  ToolChoice,
  IRouter,
  IGateway
} from './router.js';

// Provider-specific types
export type {
  OpenAIConnectorConfig,
  MockConnectorConfig,
  AnthropicConnectorConfig,
  LocalModelConfig
} from './providers.js';
