import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelInfo,
  ConnectorConfig,
  Logger
} from '../../types/base.js';
import type { IConnector } from '../../types/connector.js';
import type { ResponseRequest, ResponseResponse } from '../../types/router.js';

// Default no-op logger for when none is provided
class NoOpLogger implements Logger {
  debug(): void {
    // No-op logger - intentionally empty
  }
  info(): void {
    // No-op logger - intentionally empty
  }
  warn(): void {
    // No-op logger - intentionally empty
  }
  error(): void {
    // No-op logger - intentionally empty
  }
}

export abstract class BaseConnector {
  protected config: ConnectorConfig;
  protected userConfig: ConnectorConfig; // Original user-provided config
  protected logger: Logger;
  
  // Static property that each connector must define
  static readonly packageName: string;

  constructor(config: ConnectorConfig = {}) {
    // Keep the original user config separate
    this.userConfig = { ...config };
    
    // Merge with defaults for internal use
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      ...config
    };
    // Use provided logger or no-op logger
    this.logger = config.logger || new NoOpLogger();
  }

  // Expose user config for inspection (without defaults)
  getUserConfig(): ConnectorConfig {
    return { ...this.userConfig };
  }

  // Expose effective config (with defaults)
  getEffectiveConfig(): ConnectorConfig {
    return { ...this.config };
  }

  // Abstract methods that must be implemented by concrete connectors
  abstract chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  abstract response(request: ResponseRequest): Promise<ResponseResponse>;
  abstract listModels(): Promise<ModelInfo[]>;

  // Optional methods with default implementations
  validateRequest(request: ChatCompletionRequest): ChatCompletionRequest {
    const validated = { ...request };

    // Basic validation - can be overridden by specific connectors
    if (validated.temperature !== undefined) {
      validated.temperature = Math.max(0, Math.min(2, validated.temperature));
    }

    if (validated.top_p !== undefined) {
      validated.top_p = Math.max(0, Math.min(1, validated.top_p));
    }

    if (validated.frequency_penalty !== undefined) {
      validated.frequency_penalty = Math.max(-2, Math.min(2, validated.frequency_penalty));
    }

    if (validated.presence_penalty !== undefined) {
      validated.presence_penalty = Math.max(-2, Math.min(2, validated.presence_penalty));
    }

    return validated;
  }

  isInitialized(): boolean {
    return true;
  }

  getProviderId(): string {
    return this.providerId;
  }

  getConfig(): ConnectorConfig {
    return { ...this.config };
  }

  // Utility method for error handling
  protected handleError(error: unknown, operation: string): never {
    if (error instanceof Error) {
      throw new Error(`${this.providerId} ${operation} failed: ${error.message}`);
    }
    throw new Error(`${this.providerId} ${operation} failed: Unknown error`);
  }

  // Utility method for async delays (useful for mocking)
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Re-export types that other connectors need
export type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelInfo,
  ConnectorConfig,
  Logger
} from '../../types/base.js';

export default BaseConnector;
