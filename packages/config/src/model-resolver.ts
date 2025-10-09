/**
 * Shared model resolution logic for CLI and MCP
 * Supports: aliases, tags, and direct model names
 */

import type { FactoryProviderConfig, ModelAlias, ModelRule } from './factory.js';

export interface ModelResolutionContext {
  providers: Record<string, FactoryProviderConfig>;
  aliases?: Record<string, ModelAlias[]>;
  defaultProvider?: string;
  globalModelRules?: ModelRule[];
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

export interface TagInfo {
  tag: string;
  provider: string;
  providerName?: string;
  model: string;
  isDefault?: boolean;
}

export interface AliasInfo {
  alias: string;
  provider: string;
  providerName?: string;
  model?: string;
  tag?: string;
  resolvedModel?: string;
}

export interface AvailableTagsResult {
  tags: TagInfo[];
  aliases: AliasInfo[];
  providers: Array<{ id: string; name?: string; isDefault: boolean }>;
}

/**
 * List all available tags, aliases, and their model mappings from configuration
 * This makes tag resolution discoverable for users and external agents
 * Now includes tags from both explicit models AND modelRules
 */
export function listAvailableTags(
  context: ModelResolutionContext
): AvailableTagsResult {
  const tags: TagInfo[] = [];
  const aliases: AliasInfo[] = [];
  const providers: Array<{ id: string; name?: string; isDefault: boolean }> = [];
  
  // Collect provider information
  for (const [providerId, providerConfig] of Object.entries(context.providers)) {
    providers.push({
      id: providerId,
      name: providerConfig.name,
      isDefault: providerId === context.defaultProvider
    });
  }
  
  // Collect all tags from explicit provider models
  for (const [providerId, providerConfig] of Object.entries(context.providers)) {
    if (!providerConfig.models) continue;
    
    for (const [modelName, metadata] of Object.entries(providerConfig.models)) {
      if (metadata.tags) {
        for (const tag of metadata.tags) {
          tags.push({
            tag,
            provider: providerId,
            providerName: providerConfig.name,
            model: modelName,
            isDefault: providerId === context.defaultProvider && 
                       modelName === providerConfig.settings?.defaultModel
          });
        }
      }
    }
  }
  
  // Collect tags from provider-level modelRules (pattern-based)
  for (const [providerId, providerConfig] of Object.entries(context.providers)) {
    if (!providerConfig.modelRules) continue;
    
    for (const rule of providerConfig.modelRules) {
      if (rule.tags) {
        for (const tag of rule.tags) {
          // Add tag with pattern info
          tags.push({
            tag,
            provider: providerId,
            providerName: providerConfig.name,
            model: `[pattern: ${rule.pattern.join(', ')}]`,
            isDefault: false
          });
        }
      }
    }
  }
  
  // Collect tags from global modelRules (apply to all providers)
  if (context.globalModelRules) {
    for (const rule of context.globalModelRules) {
      if (rule.tags) {
        for (const tag of rule.tags) {
          // Add tag for each provider since global rules apply to all
          for (const [providerId, providerConfig] of Object.entries(context.providers)) {
            tags.push({
              tag,
              provider: providerId,
              providerName: providerConfig.name,
              model: `[global pattern: ${rule.pattern.join(', ')}]`,
              isDefault: false
            });
          }
        }
      }
    }
  }
  
  // Collect all aliases
  if (context.aliases) {
    for (const [aliasName, aliasList] of Object.entries(context.aliases)) {
      for (const alias of aliasList) {
        const aliasInfo: AliasInfo = {
          alias: aliasName,
          provider: alias.provider,
          providerName: context.providers[alias.provider]?.name,
          model: alias.model,
          tag: alias.tag
        };
        
        // Resolve the alias to get the actual model
        if (alias.tag) {
          const resolution = findModelByTag(alias.tag, context.providers, alias.provider);
          if (resolution) {
            aliasInfo.resolvedModel = resolution.model;
          }
        }
        
        aliases.push(aliasInfo);
      }
    }
  }
  
  return { tags, aliases, providers };
}
