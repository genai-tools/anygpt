import type {
  IConnector,
  ConnectorFactory,
  BaseConnectorConfig,
  BaseChatCompletionRequest,
  BaseChatCompletionResponse,
  ChatMessage,
  ResponseRequest,
  ResponseResponse
} from '@anygpt/types';
import type { OpenAIConnector } from '@anygpt/openai';
import { createCodyConnector } from './loader.js';
import type { CodyConnectorConfig } from './types.js';

// Re-export types
export type { CodyConnectorConfig } from './types.js';

// Export the new loader functions
export { createCodyConnector, codyConnectorFactory, codyLoader } from './loader.js';

export class CodyConnector implements IConnector {
  static readonly packageName = '@anygpt/cody';
  private config: CodyConnectorConfig;
  private openaiConnector: OpenAIConnector | null = null;
  public readonly providerId: string = 'cody';

  constructor(config: CodyConnectorConfig = {}) {
    this.config = {
      endpoint: 'https://sourcegraph.com/',
      timeout: 60000, // Cody can take longer
      maxRetries: 3,
      ...config
    };
  }

  private async getConnector(): Promise<OpenAIConnector> {
    if (!this.openaiConnector) {
      this.openaiConnector = await createCodyConnector(this.config);
    }
    return this.openaiConnector;
  }

  async chatCompletion(request: BaseChatCompletionRequest): Promise<BaseChatCompletionResponse> {
    const connector = await this.getConnector();
    return connector.chatCompletion(request);
  }

  async response(request: ResponseRequest): Promise<ResponseResponse> {
    const connector = await this.getConnector();
    return connector.response(request);
  }

  async listModels() {
    const connector = await this.getConnector();
    return connector.listModels();
  }

  validateRequest(request: BaseChatCompletionRequest): BaseChatCompletionRequest {
    // Let the OpenAI connector handle validation
    return request;
  }

  isInitialized(): boolean {
    return true; // Always initialized since we create connector on-demand
  }

  getProviderId(): string {
    return this.providerId;
  }

  getConfig(): BaseConnectorConfig {
    return { ...this.config };
  }
}

// Factory for the connector registry
export class CodyConnectorFactory implements ConnectorFactory {
  // Make CLI config display as "@anygpt/cody" instead of "@anygpt/codyfactory"
  static readonly packageName = '@anygpt/cody';

  getProviderId(): string {
    return 'cody';
  }

  create(config: BaseConnectorConfig): IConnector {
    return new CodyConnector(config as CodyConnectorConfig);
  }
}

export default CodyConnectorFactory;

/**
 * Factory function for cleaner syntax
 */
export function cody(config: CodyConnectorConfig = {}): CodyConnector {
  return new CodyConnector(config);
}

/**
 * Provider factory for use in AnyGPT config files
 * This creates a provider object that can be used directly in config
 *
 * @example
 * ```typescript
 * import { provider as cody } from '@anygpt/cody';
 *
 * export default config({
 *   providers: {
 *     cody  // Uses the provider factory
 *   }
 * });
 * ```
 */
export const provider = {
  name: 'Sourcegraph Cody',
  connector: new CodyConnectorFactory()
};
