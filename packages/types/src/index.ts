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
  ChatCompletionResponse as BaseChatCompletionResponse,
  ExtraBodyParams,
} from './chat.js';

// Model types
export type { ModelInfo, ModelCapabilities } from './models.js';

// Common utility types
export type { ConnectorConfig as BaseConnectorConfig } from './common.js';

// Logger interface
export type { Logger } from './logger.js';

// Note: Router has its own ProviderConfig in @anygpt/router package
// No API types needed here anymore

// Response API types
export type {
  ResponseRequest,
  ResponseResponse,
  ResponseOutput,
  ResponseContent,
  ResponseAnnotation,
  Tool,
  ToolChoice,
} from './responses.js';

// Note: Router package defines its own types (RouterConfig, ProviderConfig, etc.)
// No routing types exported from here - Router is self-contained

// Connector types
export type {
  IConnector,
  ConnectorFactory,
  IConnectorRegistry,
} from './connector.js';

// MCP types
export type {
  MCPServerConfig,
  MCPServerRuleTarget,
  MCPToolRuleTarget,
  MCPDiscoverySource,
  MCPDiscoveryCache,
  MCPDiscoveryConfig,
  MCPConfig,
} from './mcp.js';

// Configuration types (v3.0+ - clean, unified)
export type {
  ReasoningEffort,
  ReasoningConfig,
  BaseModelConfig,
  ModelMetadata,
  ModelRule,
  ModelAlias,
  ProviderConfig,
  Config,
  ConfigLoadOptions,
} from './anygpt-config.js';
