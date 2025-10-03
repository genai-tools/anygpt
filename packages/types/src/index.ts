/**
 * @anygpt/types - Pure type definitions for the AnyGPT ecosystem
 * 
 * This package contains ONLY type definitions with no runtime dependencies.
 * Use with `import type` for zero runtime overhead.
 */

// Chat types
export type {
  ChatMessage,
  ChatCompletionRequest as BaseChatCompletionRequest,
  ChatCompletionResponse as BaseChatCompletionResponse
} from './chat.js';

// Model types
export type {
  ModelInfo,
  ModelCapabilities
} from './models.js';

// Common utility types
export type {
  ConnectorConfig as BaseConnectorConfig
} from './common.js';

// Logger interface
export type { Logger } from './logger.js';

// API configuration types
export type {
  ApiConfig,
  ProviderConfig as RouterProviderConfig
} from './api.js';

// Response API types
export type {
  ResponseRequest,
  ResponseResponse,
  ResponseOutput,
  ResponseContent,
  ResponseAnnotation,
  Tool,
  ToolChoice
} from './responses.js';

// Router types
export type {
  RouterConfig,
  GatewayConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  IRouter,
  IGateway
} from './routing.js';

// Connector types
export type {
  IConnector,
  ConnectorFactory,
  IConnectorRegistry
} from './connector.js';

// Re-export all types
export * from './config.js';
export * from './connector.js';

// Configuration types
export type {
  ConnectorConfig,
  ProviderConfig,
} from './config.js';
