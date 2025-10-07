import type { CLIContext } from '../utils/cli-context.js';
import type { FactoryProviderConfig } from '@anygpt/config';

interface ChatOptions {
  provider?: string;
  type?: 'openai' | 'anthropic' | 'google';
  url?: string;
  token?: string;
  model?: string;
  usage?: boolean;
}

/**
 * Search for a model by tag in provider configs
 * Returns { provider, model } or null if not found
 */
function findModelByTag(
  tag: string,
  providers: Record<string, FactoryProviderConfig>,
  preferredProvider?: string
): { provider: string; model: string } | null {
  // First, try the preferred provider if specified
  if (preferredProvider && providers[preferredProvider]?.models) {
    const providerModels = providers[preferredProvider].models!;
    for (const [modelName, metadata] of Object.entries(providerModels)) {
      if (metadata.tags.includes(tag)) {
        return { provider: preferredProvider, model: modelName };
      }
    }
  }
  
  // Search all providers
  for (const [providerId, providerConfig] of Object.entries(providers)) {
    if (!providerConfig.models) continue;
    
    for (const [modelName, metadata] of Object.entries(providerConfig.models)) {
      if (metadata.tags.includes(tag)) {
        return { provider: providerId, model: modelName };
      }
    }
  }
  
  return null;
}

/**
 * Resolve a model name using hybrid approach:
 * 1. Check central aliases (can reference tags or direct models)
 * 2. Search per-provider tags
 * 3. Return null if not found (treat as direct model name)
 */
function resolveModel(
  modelName: string,
  context: CLIContext,
  preferredProvider?: string
): { provider: string; model: string } | null {
  // Step 1: Check central aliases
  if (context.defaults.aliases?.[modelName]) {
    const aliasList = context.defaults.aliases[modelName];
    
    // Try preferred provider first
    if (preferredProvider) {
      const match = aliasList.find(a => a.provider === preferredProvider);
      if (match) {
        // If alias references a tag, resolve it
        if (match.tag) {
          const tagResult = findModelByTag(match.tag, context.providers, match.provider);
          if (tagResult) return tagResult;
        }
        // Otherwise use direct model
        if (match.model) {
          return { provider: match.provider, model: match.model };
        }
      }
    }
    
    // Use first alias
    const firstAlias = aliasList[0];
    if (firstAlias.tag) {
      const tagResult = findModelByTag(firstAlias.tag, context.providers, firstAlias.provider);
      if (tagResult) return tagResult;
    }
    if (firstAlias.model) {
      return { provider: firstAlias.provider, model: firstAlias.model };
    }
  }
  
  // Step 2: Search per-provider tags
  const tagResult = findModelByTag(modelName, context.providers, preferredProvider);
  if (tagResult) return tagResult;
  
  // Step 3: Not found - treat as direct model name
  return null;
}

export async function chatCommand(
  context: CLIContext,
  message: string,
  options: ChatOptions
) {
  // Determine which provider to use (might be overridden by alias resolution)
  let providerId = options.provider || context.defaults.provider;
  
  if (!providerId) {
    throw new Error('No provider specified. Use --provider or configure a default provider.');
  }
  
  // Get model with priority: CLI option > per-provider default > global default
  let modelId = options.model 
    || context.defaults.providers?.[providerId]?.model 
    || context.defaults.model;
  
  if (!modelId) {
    throw new Error(`No model specified. Use --model or configure a default model for provider '${providerId}'.`);
  }
  
  // Check if the model is an alias/tag and resolve it
  const resolution = resolveModel(modelId, context, providerId);
  if (resolution) {
    // Use the resolved provider and model
    providerId = resolution.provider;
    modelId = resolution.model;
    
    if (options.model) {
      // Log resolution info (only shown with --verbose)
      context.logger.info(`🔗 Resolved '${options.model}' → ${providerId}/${modelId}`);
    }
  }
  
  // Verbose mode: show request metrics
  context.logger.info(`📤 Request: provider=${providerId}, model=${modelId}`);
  context.logger.info(`💬 Message length: ${message.length} chars`);
  context.logger.info(''); // Empty line before response
  
  try {
    const startTime = Date.now();
    
    const response = await context.router.chatCompletion({
      provider: providerId,
      model: modelId,
      messages: [{ role: 'user', content: message }]
    });
    
    const duration = Date.now() - startTime;
    
    const reply = response.choices[0]?.message?.content;
    
    // Print the actual response (clearly visible)
    if (reply) {
      console.log(reply);
    } else {
      console.log('No response received');
    }
    
    // Verbose mode: show response metrics after the response
    context.logger.info(''); // Empty line after response
    context.logger.info(`⏱️  Response time: ${duration}ms`);
    if (response.usage) {
      context.logger.info(`📊 Tokens: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} total`);
    }
    if (response.model) {
      context.logger.info(`🤖 Model used: ${response.model}`);
    }
    if (reply) {
      context.logger.info(`📝 Response length: ${reply.length} chars`);
    }
    
    // Show usage info only if --usage flag is provided (for non-verbose mode)
    if (options.usage && response.usage && !context.logger.info) {
      console.log('');
      console.log(`📊 Usage: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output = ${response.usage.total_tokens} tokens`);
    }
    
  } catch (error) {
    throw new Error(`Chat request failed: ${error instanceof Error ? error.message : error}`);
  }
}
