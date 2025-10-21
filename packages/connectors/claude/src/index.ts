import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Options, SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import Anthropic from '@anthropic-ai/sdk';
import {
  BaseConnector,
  type ConnectorConfig,
  type ModelInfo,
  type BaseChatCompletionRequest,
  type BaseChatCompletionResponse,
  type ConnectorFactory,
  type ResponseResponse,
} from '@anygpt/router';

/**
 * Configuration for Claude Agent SDK connector
 */
export interface ClaudeAgentConnectorConfig extends ConnectorConfig {
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
export class ClaudeAgentConnector extends BaseConnector {
  static override readonly packageName = '@anygpt/claude-agent';
  protected override config: ClaudeAgentConnectorConfig;
  private client: Anthropic;

  constructor(config: ClaudeAgentConnectorConfig = {}) {
    super('claude-agent', config);
    this.config = config;
    
    // Initialize Anthropic client for model listing
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env['ANTHROPIC_API_KEY'] || '',
      baseURL: config.baseURL || process.env['ANTHROPIC_BASE_URL'],
    });
  }

  /**
   * List available models from Anthropic API
   */
  override async listModels(): Promise<ModelInfo[]> {
    try {
      this.logger.debug('[Claude Agent] Fetching models from API...');
      
      // Fetch models from Anthropic API
      const response = await this.client.models.list();
      
      this.logger.debug('[Claude Agent] Models fetched:', {
        count: response.data.length,
      });

      // Convert to ModelInfo format
      return response.data.map((model) => ({
        id: model.id,
        provider: this.providerId,
        display_name: model.display_name || model.id,
        capabilities: {
          input: { text: true },
          output: { 
            text: true, 
            function_calling: true, 
            streaming: false,
          },
        },
      }));
    } catch (error) {
      // If API call fails, return default models
      this.logger.debug(
        `[${this.providerId}] Failed to fetch models from API: ${
          error instanceof Error ? error.message : String(error)
        }. Will use default models.`
      );
      
      return [
        {
          id: 'claude-sonnet-4',
          provider: this.providerId,
          display_name: 'Claude Sonnet 4',
          capabilities: {
            input: { text: true },
            output: { text: true, function_calling: true, streaming: false },
          },
        },
        {
          id: 'claude-opus-4',
          provider: this.providerId,
          display_name: 'Claude Opus 4',
          capabilities: {
            input: { text: true },
            output: { text: true, function_calling: true, streaming: false },
          },
        },
      ];
    }
  }

  /**
   * Response method (not supported by Agent SDK)
   */
  override async response(): Promise<ResponseResponse> {
    throw new Error('Response method not supported by Claude Agent SDK. Use chatCompletion instead.');
  }

  /**
   * Chat completion using Claude Agent SDK
   * Converts OpenAI-style messages to Agent SDK format
   */
  override async chatCompletion(
    request: BaseChatCompletionRequest
  ): Promise<BaseChatCompletionResponse> {
    const { messages, model, max_tokens, temperature } = request;

    // Build prompt from messages
    // Agent SDK expects a string prompt or async iterable of user messages
    const prompt = messages
      .map((msg) => {
        if (msg.role === 'system') {
          return `System: ${msg.content}`;
        } else if (msg.role === 'user') {
          return `User: ${msg.content}`;
        } else {
          return `Assistant: ${msg.content}`;
        }
      })
      .join('\n\n');

    // Configure Agent SDK options
    const options: Options = {
      apiKey: this.config.apiKey || process.env['ANTHROPIC_API_KEY'],
      model: model || this.config.model || 'claude-sonnet-4',
      max_tokens: max_tokens || this.config.maxTokens || 4096,
      temperature: temperature ?? this.config.temperature,
      system_prompt: this.config.systemPrompt,
      mcp_servers: this.config.mcpServers as Record<string, unknown> | undefined,
      permissions: this.config.permissions as Record<string, string> | undefined,
      // Pass baseURL and apiKey via environment variables (SDK spawns CLI process)
      env: {
        ...process.env,
        ...(this.config.baseURL && { ANTHROPIC_BASE_URL: this.config.baseURL }),
        ...(this.config.apiKey && { ANTHROPIC_API_KEY: this.config.apiKey }),
      },
    } as Options;

    this.logger.debug('[Claude Agent] Starting query execution with options:', {
      model: options.model,
      maxTokens: max_tokens || this.config.maxTokens,
      hasMcpServers: !!this.config.mcpServers,
    });

    // Execute query() for agentic capabilities
    const queryGenerator = query({ prompt, options });
    const collectedMessages: SDKMessage[] = [];
    let finalContent = '';

    try {
      for await (const message of queryGenerator) {
        collectedMessages.push(message);
        
        // Extract text content from assistant messages
        if (message.type === 'assistant' && 'content' in message) {
          const content = message.content;
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'text' && 'text' in block) {
                finalContent += block.text;
              }
            }
          } else if (typeof content === 'string') {
            finalContent += content;
          }
        }
      }
    } catch (error) {
      this.logger.error('[Claude Agent] Tool execution failed:', error);
      throw error;
    }

    this.logger.debug('[Claude Agent] Tool execution completed:', {
      messageCount: collectedMessages.length,
      contentLength: finalContent.length,
    });

    // Return in OpenAI ChatCompletionResponse format
    return {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || this.config.model || 'claude-sonnet-4',
      provider: this.providerId,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: finalContent || 'No response generated',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 0, // Agent SDK doesn't expose token counts
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }
}

/**
 * Factory for creating Claude Agent connectors
 */
export class ClaudeAgentConnectorFactory implements ConnectorFactory {
  getProviderId(): string {
    return 'claude-agent';
  }

  create(config: ConnectorConfig): ClaudeAgentConnector {
    return new ClaudeAgentConnector(config as ClaudeAgentConnectorConfig);
  }
}

export default ClaudeAgentConnectorFactory;

/**
 * Factory function for cleaner syntax
 */
export function claudeAgent(
  config: ClaudeAgentConnectorConfig | string = {},
  providerId?: string
): ClaudeAgentConnector {
  // If string is passed, treat it as apiKey
  const finalConfig = typeof config === 'string' ? { apiKey: config } : config;

  const connector = new ClaudeAgentConnector(finalConfig);

  // Override provider ID if specified
  if (providerId) {
    Object.defineProperty(connector, 'providerId', {
      value: providerId,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }

  return connector;
}
