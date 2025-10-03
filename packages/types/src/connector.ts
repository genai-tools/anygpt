/**
 * Connector-related types and interfaces
 */

import type { 
  ChatCompletionRequest, 
  ChatCompletionResponse
} from './chat.js';
import type { ModelInfo } from './models.js';
import type { ConnectorConfig } from './common.js';
import type {
  ResponseRequest,
  ResponseResponse
} from './responses.js';

/**
 * Base interface that all connectors must implement
 */
export interface IConnector {
  readonly providerId: string;
  
  chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  response(request: ResponseRequest): Promise<ResponseResponse>;
  listModels(): Promise<ModelInfo[]>;
  isInitialized(): boolean;
  validateRequest(request: ChatCompletionRequest): ChatCompletionRequest;
  getProviderId(): string;
  getConfig(): ConnectorConfig;
}

/**
 * Factory interface for creating connectors
 */
export interface ConnectorFactory {
  create(config: ConnectorConfig): IConnector;
  getProviderId(): string;
}

/**
 * Registry interface for managing connectors
 */
export interface IConnectorRegistry {
  registerConnector(factory: ConnectorFactory): void;
  createConnector(providerId: string, config?: ConnectorConfig): IConnector;
  getConnector(providerId: string, config?: ConnectorConfig): IConnector;
  hasConnector(providerId: string): boolean;
  getAvailableProviders(): string[];
  unregisterConnector(providerId: string): boolean;
  clear(): void;
}
