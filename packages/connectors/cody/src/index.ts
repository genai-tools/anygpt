import type {
  IConnector,
  ConnectorFactory,
  BaseConnectorConfig,
  BaseChatCompletionRequest,
  BaseChatCompletionResponse,
  ResponseRequest,
  ResponseResponse
} from '@anygpt/types';
import { BaseConnector } from '@anygpt/router';
import type { OpenAIConnector } from '@anygpt/openai';
import { createCodyConnector, readCodyConfigSync } from './loader.js';
import { executeCodyChat } from './executor.js';
import type { CodyConnectorConfig } from './types.js';

// Re-export types
export type { CodyConnectorConfig, CodyConnectionMode } from './types.js';

// Export the new loader functions
export { createCodyConnector, codyConnectorFactory, codyLoader } from './loader.js';

export class CodyConnector extends BaseConnector implements IConnector {
  static override readonly packageName = '@anygpt/cody';
  private codyConfig: CodyConnectorConfig;
  private openaiConnector: OpenAIConnector | null = null;

  constructor(config: CodyConnectorConfig = {}) {
    // Pass to BaseConnector for getUserConfig support
    super('cody', config);
    
    // Load global config and merge with user config
    const globalConfig = readCodyConfigSync();
    
    // Store Cody-specific config with defaults
    // Merge: defaults < global config < user config
    this.codyConfig = {
      endpoint: 'https://sourcegraph.com/',
      timeout: 60000, // Cody can take longer
      maxRetries: 3,
      connectionMode: 'api', // Default to API mode
      ...globalConfig,  // Apply global config
      ...config  // User config takes precedence
    };
  }

  private async getConnector(): Promise<OpenAIConnector> {
    if (!this.openaiConnector) {
      this.openaiConnector = await createCodyConnector(this.codyConfig);
    }
    return this.openaiConnector;
  }

  /**
   * Override getUserConfig to return only user-provided config
   * (no defaults, no global config)
   */
  override getUserConfig(): CodyConnectorConfig {
    // Just return the user config from BaseConnector
    // Don't include global config since it wasn't explicitly set by user
    return super.getUserConfig() as CodyConnectorConfig;
  }

  /**
   * Chat completion with mode switching support
   */
  override async chatCompletion(request: BaseChatCompletionRequest): Promise<BaseChatCompletionResponse> {
    const mode = this.codyConfig.connectionMode || 'api';

    switch (mode) {
      case 'cli':
        return this.chatCompletionViaCLI(request);
      
      case 'auto':
        try {
          return await this.chatCompletionViaAPI(request);
        } catch (error) {
          console.warn('API mode failed, falling back to CLI:', error instanceof Error ? error.message : String(error));
          return this.chatCompletionViaCLI(request);
        }
      
      case 'api':
      default:
        return this.chatCompletionViaAPI(request);
    }
  }

  /**
   * Chat completion via API (using OpenAI connector)
   */
  private async chatCompletionViaAPI(request: BaseChatCompletionRequest): Promise<BaseChatCompletionResponse> {
    const connector = await this.getConnector();
    return connector.chatCompletion(request);
  }

  /**
   * Chat completion via CLI (using Cody CLI)
   */
  private async chatCompletionViaCLI(request: BaseChatCompletionRequest): Promise<BaseChatCompletionResponse> {
    // Convert messages to a single prompt for CLI
    const prompt = request.messages
      .map(msg => {
        if (msg.role === 'system') return `System: ${msg.content}`;
        if (msg.role === 'user') return msg.content;
        if (msg.role === 'assistant') return `Assistant: ${msg.content}`;
        return msg.content;
      })
      .join('\n\n');

    const cliResponse = await executeCodyChat(prompt, this.codyConfig, request.model);

    // Convert CLI response to standard format
    return {
      id: `cody-cli-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model || this.codyConfig.model || 'cody-default',
      provider: this.providerId,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: cliResponse
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }

  override async response(request: ResponseRequest): Promise<ResponseResponse> {
    const connector = await this.getConnector();
    return connector.response(request);
  }

  override async listModels() {
    const connector = await this.getConnector();
    return connector.listModels();
  }

  override validateRequest(request: BaseChatCompletionRequest): BaseChatCompletionRequest {
    // Let the OpenAI connector handle validation
    return request;
  }

  override isInitialized(): boolean {
    return true; // Always initialized since we create connector on-demand
  }

  override getConfig(): BaseConnectorConfig {
    return { ...this.codyConfig };
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
  connector: new CodyConnector()
};
