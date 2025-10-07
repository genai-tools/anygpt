/**
 * MCP Tools - The actual functions that can be called
 */

import type { ChatCompletionRequest, ChatMessage, ModelInfo as TypesModelInfo } from "@anygpt/types";
import { resolveModel as resolveModelShared, type FactoryProviderConfig, type ModelAlias } from "@anygpt/config";

export type ChatCompletionToolArgs = {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
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
export function listTools(context: { defaultModel?: string; defaultProvider?: string }) {
  const modelDefault = context.defaultModel ? { default: context.defaultModel } : {};
  const providerDefault = context.defaultProvider ? { default: context.defaultProvider } : {};

  return {
    tools: [
      {
        name: "anygpt_chat_completion",
        description: "Send a chat completion request to AI providers via the gateway. Supports smart model resolution: you can specify just the model name (e.g., 'opus', 'gpt-4') and the server will find the right provider automatically.",
        inputSchema: {
          type: "object",
          properties: {
            messages: {
              type: "array",
              description: "Array of chat messages",
              items: {
                type: "object",
                properties: {
                  role: {
                    type: "string",
                    enum: ["system", "user", "assistant"],
                    description: "The role of the message sender"
                  },
                  content: {
                    type: "string",
                    description: "The content of the message"
                  }
                },
                required: ["role", "content"]
              }
            },
            model: {
              type: "string",
              description: `The model to use. Can be a full model name (e.g., 'gpt-4', 'claude-opus-4') or a shorthand (e.g., 'opus', 'gpt'). Server will auto-detect the provider.${context.defaultModel ? ` (default: ${context.defaultModel})` : ''}`,
              ...modelDefault
            },
            provider: {
              type: "string",
              description: `Optional: Explicitly specify the AI provider. If omitted, server will auto-detect based on model name.${context.defaultProvider ? ` (default: ${context.defaultProvider})` : ''}`,
              ...providerDefault
            },
            temperature: {
              type: "number",
              description: "Sampling temperature (0-2)",
              minimum: 0,
              maximum: 2
            },
            max_tokens: {
              type: "number",
              description: "Maximum number of tokens to generate",
              minimum: 1
            }
          },
          required: ["messages"]
        }
      },
      {
        name: "anygpt_list_models",
        description: "List available models from AI providers",
        inputSchema: {
          type: "object",
          properties: {
            provider: {
              type: "string",
              description: `The AI provider to list models from${context.defaultProvider ? ` (default: ${context.defaultProvider})` : ''}`,
              ...providerDefault
            }
          }
        }
      },
      {
        name: "anygpt_list_providers",
        description: "List all configured AI providers and their types. Use this to discover what providers are available before calling list_models or chat_completion.",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
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
    configuredProviders: Record<string, FactoryProviderConfig>;
    aliases?: Record<string, ModelAlias[]>;
  }
) {
  try {
    if (!Array.isArray(args.messages) || args.messages.length === 0) {
      throw new Error("messages array is required");
    }

    const messages: ChatMessage[] = args.messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    // Get model name (from args or default)
    const modelName = args.model || context.defaultModel || 'gpt-3.5-turbo';
    
    // Resolve provider and model using shared config resolution
    const resolution = resolveModelShared(modelName, {
      providers: context.configuredProviders,
      aliases: context.aliases,
      defaultProvider: context.defaultProvider
    }, args.provider);
    
    // Use resolved values or fall back to defaults
    const providerId = resolution?.provider || args.provider || context.defaultProvider || 'openai';
    const resolvedModel = resolution?.model || modelName;

    const request: ChatCompletionRequest = {
      messages,
      model: resolvedModel,
      temperature: args.temperature,
      max_tokens: args.max_tokens,
      provider: providerId,
    };

    const response = await context.router.chatCompletion(request);
    return response;
  } catch (error) {
    throw new Error(`Chat completion failed: ${error instanceof Error ? error.message : String(error)}`);
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
  }
): Promise<{ provider: string; models: TypesModelInfo[] }> {
  try {
    const providerId = args.provider || context.defaultProvider || 'openai';
    const models = await context.router.listModels(providerId);
    return {
      models,
      provider: providerId,
    };
  } catch (error) {
    throw new Error(`Failed to list models: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handle list providers tool call
 */
export function handleListProviders(context: {
  configuredProviders: Record<string, FactoryProviderConfig>;
  defaultProvider?: string;
}): { providers: ProviderInfo[]; default_provider?: string } {
  const providers: ProviderInfo[] = Object.entries(context.configuredProviders).map(([id, config]) => ({
    id,
    type: config.connector.providerId,
    isDefault: id === context.defaultProvider,
  }));

  return {
    providers,
    default_provider: context.defaultProvider,
  };
}

/**
 * Get all available models across all providers for sampling
 */
export function getAllAvailableModels(context: {
  configuredProviders: Record<string, FactoryProviderConfig>;
  aliases?: Record<string, ModelAlias[]>;
}): ModelInfo[] {
  const models: ModelInfo[] = [];
  
  // Add models from each provider
  for (const [providerId, providerConfig] of Object.entries(context.configuredProviders)) {
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
