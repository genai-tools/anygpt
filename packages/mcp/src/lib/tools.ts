/**
 * MCP Tools - The actual functions that can be called
 */

import type {
  BaseChatCompletionRequest as ChatCompletionRequest,
  ModelInfo as TypesModelInfo,
} from '@anygpt/types';
import {
  resolveModel as resolveModelShared,
  listAvailableTags,
  type ProviderConfig,
  type ModelAlias,
  type AvailableTagsResult,
} from '@anygpt/config';

export type ChatCompletionToolArgs = {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  provider?: string;
  temperature?: number;
  max_tokens?: number;
};

export type ListModelsToolArgs = {
  provider?: string;
};

export type ProviderInfo = {
  id: string;
  type: string;
  isDefault: boolean;
};

export type ModelInfo = {
  id: string;
  provider: string;
  tags?: string[];
};

/**
 * List all available tools with their schemas
 */
export function listTools(context: {
  defaultModel?: string;
  defaultProvider?: string;
}) {
  const modelDefault = context.defaultModel
    ? { default: context.defaultModel }
    : {};
  const providerDefault = context.defaultProvider
    ? { default: context.defaultProvider }
    : {};

  return {
    tools: [
      {
        name: 'anygpt_chat_completion',
        description:
          "Send a chat completion request to AI providers via the gateway. Supports flexible model specification: use full model IDs (e.g., 'ml-asset:static-model/claude-sonnet-4-5', 'anthropic::2024-10-22::claude-opus-4-latest') or common aliases (e.g., 'opus', 'sonnet', 'gpt-4'). The server will automatically detect the provider based on the model name if the 'provider' parameter is omitted. Use 'anygpt_list_models' to see available models and their aliases for each provider.\n\nIMPORTANT: If the response has 'finish_reason: length', it means the output was truncated due to reaching the max_tokens limit. Increase max_tokens to get a complete response.",
        inputSchema: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              description: 'Array of chat messages',
              items: {
                type: 'object',
                properties: {
                  role: {
                    type: 'string',
                    enum: ['system', 'user', 'assistant'],
                    description: 'The role of the message sender',
                  },
                  content: {
                    type: 'string',
                    description: 'The content of the message',
                  },
                },
                required: ['role', 'content'],
              },
            },
            model: {
              type: 'string',
              description: `The model to use. Accepts: (1) Full model IDs (e.g., 'ml-asset:static-model/claude-sonnet-4-5', 'anthropic::2024-10-22::claude-opus-4-latest'), (2) Tags for easier reference (e.g., 'opus', 'sonnet', 'gemini', 'gpt5'). When using tags, the server resolves them to actual model IDs. Use 'anygpt_list_tags' to discover available tags and their mappings. For direct model IDs, use 'anygpt_list_models'.${
                context.defaultModel
                  ? ` (default: ${context.defaultModel})`
                  : ''
              }`,
              ...modelDefault,
            },
            provider: {
              type: 'string',
              description: `Optional: Explicitly specify the AI provider (e.g., 'provider1', 'provider2'). If omitted, the server will auto-detect by: (1) checking the default provider first, (2) searching all configured providers for a model matching the 'model' parameter. Specifying the provider ensures you get the exact model from the intended source. Use 'anygpt_list_providers' to see available providers.${
                context.defaultProvider
                  ? ` (default: ${context.defaultProvider})`
                  : ''
              }`,
              ...providerDefault,
            },
            temperature: {
              type: 'number',
              description: 'Sampling temperature (0-2)',
              minimum: 0,
              maximum: 2,
            },
            max_tokens: {
              type: 'number',
              description:
                "Maximum number of tokens to generate. Default: 4096. If the response is truncated (finish_reason='length'), increase this value. Guidelines: Short answers (100-500), Medium responses (500-2000), Long/comprehensive outputs (2000-4096+). Higher values increase latency and cost but prevent truncation.",
              minimum: 1,
              default: 4096,
            },
          },
          required: ['messages'],
        },
      },
      {
        name: 'anygpt_list_models',
        description:
          "List available models from AI providers. Returns model IDs, display names, and common aliases (tags) for each model. Use this to discover which models are available and what aliases you can use in 'anygpt_chat_completion'. If no provider is specified, lists models from the default provider.",
        inputSchema: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              description: `The AI provider to list models from${
                context.defaultProvider
                  ? ` (default: ${context.defaultProvider})`
                  : ''
              }`,
              ...providerDefault,
            },
          },
        },
      },
      {
        name: 'anygpt_list_providers',
        description:
          'List all configured AI providers and their types. Use this to discover what providers are available before calling list_models or chat_completion.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'anygpt_list_tags',
        description:
          "List all available tags and their model mappings from configuration. This shows how tags like 'opus', 'sonnet', 'gpt5' resolve to specific models across providers. Use this to discover available tags without making API calls. Returns tags grouped by provider, showing which models each tag maps to. This is essential for understanding model resolution and choosing the right model/tag for your needs.",
        inputSchema: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              description:
                'Optional: Filter results to show only tags from a specific provider',
            },
          },
        },
      },
    ],
  };
}

/**
 * Handle chat completion tool call
 */
export async function handleChatCompletion(
  args: ChatCompletionToolArgs,
  context: {
    router: any;
    defaultProvider?: string;
    defaultModel?: string;
    configuredProviders: Record<string, ProviderConfig>;
    aliases?: Record<string, ModelAlias[]>;
    defaultProviders?: Record<string, { tag?: string; model?: string }>;
  }
) {
  try {
    if (!Array.isArray(args.messages) || args.messages.length === 0) {
      throw new Error('messages array is required');
    }

    // Get model name (from args or default)
    // If no model specified, use default model or default tag from default provider
    let modelName = args.model || context.defaultModel;

    if (!modelName) {
      // No model specified - use default provider's default tag/model if available
      const targetProvider = args.provider || context.defaultProvider;
      if (targetProvider && context.defaultProviders?.[targetProvider]) {
        const providerDefaults = context.defaultProviders[targetProvider];
        // Prefer tag over model (tag is more flexible)
        modelName = providerDefaults.tag || providerDefaults.model;
      }
      // Error if still no model - don't fallback to hardcoded model
      if (!modelName) {
        throw new Error(
          'No model specified and no default model configured. ' +
            'Please specify a model or configure defaults.model or defaults.providers[provider].tag in your config.'
        );
      }
    }

    // Resolve provider and model using shared config resolution
    const resolution = resolveModelShared(
      modelName,
      {
        providers: context.configuredProviders,
        aliases: context.aliases,
        defaultProvider: context.defaultProvider,
      },
      args.provider
    );

    // Use resolved values or fall back to defaults
    const providerId =
      resolution?.provider || args.provider || context.defaultProvider;

    if (!providerId) {
      throw new Error(
        'No provider could be determined. ' +
          'Please specify a provider or configure defaults.provider in your config.'
      );
    }

    const resolvedModel = resolution?.model || modelName;

    const request = {
      messages: args.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      model: resolvedModel,
      temperature: args.temperature,
      max_tokens: args.max_tokens || 4096, // Default to 4096 tokens if not specified
      provider: providerId,
    } as ChatCompletionRequest & { provider: string };

    const response = await context.router.chatCompletion(request);
    return response;
  } catch (error) {
    throw new Error(
      `Chat completion failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Handle list models tool call
 */
export async function handleListModels(
  args: ListModelsToolArgs,
  context: {
    router: any;
    defaultProvider?: string;
    configuredProviders: Record<string, ProviderConfig>;
    defaultProviders?: Record<string, { tag?: string; model?: string }>;
  }
): Promise<{ provider: string; models: TypesModelInfo[] }> {
  try {
    const providerId = args.provider || context.defaultProvider;
    if (!providerId) {
      throw new Error(
        'No provider specified and no default provider configured. ' +
          'Please specify a provider or configure defaults.provider in your config.'
      );
    }
    const models = await context.router.listModels(providerId);

    // Enrich models with tags/aliases from configuration
    const providerConfig = context.configuredProviders[providerId];
    const enrichedModels = models.map((model: TypesModelInfo) => {
      const modelConfig = providerConfig?.models?.[model.id];
      if (modelConfig?.tags) {
        return {
          ...model,
          tags: modelConfig.tags,
        };
      }
      return model;
    });

    return {
      models: enrichedModels,
      provider: providerId,
    };
  } catch (error) {
    throw new Error(
      `Failed to list models: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Handle list providers tool call
 */
export function handleListProviders(context: {
  configuredProviders: Record<string, ProviderConfig>;
  defaultProvider?: string;
}): { providers: ProviderInfo[]; default_provider?: string } {
  const providers = Object.entries(context.configuredProviders).map(
    ([id, config]) => ({
      id,
      type:
        typeof config.connector === 'string'
          ? config.connector
          : config.connector.providerId,
      isDefault: id === context.defaultProvider,
    })
  );

  return {
    providers,
    default_provider: context.defaultProvider,
  };
}

/**
 * Handle list tags tool call
 */
export function handleListTags(
  args: { provider?: string },
  context: {
    configuredProviders: Record<string, ProviderConfig>;
    aliases?: Record<string, ModelAlias[]>;
    defaultProvider?: string;
  }
): AvailableTagsResult {
  const result = listAvailableTags({
    providers: context.configuredProviders,
    aliases: context.aliases,
    defaultProvider: context.defaultProvider,
  });

  // Filter by provider if specified
  if (args.provider) {
    return {
      providers: result.providers.filter((p) => p.id === args.provider),
      tags: result.tags.filter((t) => t.provider === args.provider),
      aliases: result.aliases.filter((a) => a.provider === args.provider),
    };
  }

  return result;
}

/**
 * Get all available models across all providers for sampling
 */
export function getAllAvailableModels(context: {
  configuredProviders: Record<string, ProviderConfig>;
  aliases?: Record<string, ModelAlias[]>;
}): ModelInfo[] {
  const models: ModelInfo[] = [];

  // Add models from each provider
  for (const [providerId, providerConfig] of Object.entries(
    context.configuredProviders
  )) {
    if (providerConfig.models) {
      for (const [modelId, metadata] of Object.entries(providerConfig.models)) {
        models.push({
          id: modelId,
          provider: providerId,
          tags: metadata.tags,
        });
      }
    }
  }

  // Add aliases as virtual models
  if (context.aliases) {
    for (const [aliasName] of Object.entries(context.aliases)) {
      models.push({
        id: aliasName,
        provider: 'alias',
        tags: ['alias'],
      });
    }
  }

  return models;
}
