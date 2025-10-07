/**
 * Shared model resolution logic for CLI and MCP
 * Supports: aliases, tags, and direct model names
 */

import type { FactoryProviderConfig, ModelAlias } from './factory.js';

export interface ModelResolutionContext {
  providers: Record<string, FactoryProviderConfig>;
  aliases?: Record<string, ModelAlias[]>;
  defaultProvider?: string;
}

export interface ModelResolution {
  provider: string;
  model: string;
}

/**
 * Search for a model by tag in provider configs
 * Returns { provider, model } or null if not found
 */
export function findModelByTag(
  tag: string,
  providers: Record<string, FactoryProviderConfig>,
  preferredProvider?: string
): ModelResolution | null {
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
export function resolveModel(
  modelName: string,
  context: ModelResolutionContext,
  preferredProvider?: string
): ModelResolution | null {
  // Step 1: Check central aliases
  if (context.aliases?.[modelName]) {
    const aliasList = context.aliases[modelName];
    
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
  
  // Step 3: Not found - return null (caller should treat as direct model name)
  return null;
}
