/**
 * Tag Registry - Pre-computed tag-to-model mappings
 *
 * This registry is built at config load time by:
 * 1. Fetching model lists from providers
 * 2. Applying modelRules patterns to actual models
 * 3. Creating a fast lookup map: tag -> [{ provider, model }]
 */

import type { FactoryProviderConfig, ModelRule } from './factory.js';
import { minimatch } from 'minimatch';

export interface TagMapping {
  provider: string;
  model: string;
  source: 'explicit' | 'provider-rule' | 'global-rule';
}

export interface TagRegistry {
  // Map: tag -> array of {provider, model, source}
  tags: Map<string, TagMapping[]>;

  // Lookup: given a tag and optional preferred provider, return best match
  resolve(tag: string, preferredProvider?: string): TagMapping | null;
}

/**
 * Build tag registry from providers and their model lists
 */
export async function buildTagRegistry(
  providers: Record<string, FactoryProviderConfig>,
  globalModelRules?: ModelRule[]
): Promise<TagRegistry> {
  const tags = new Map<string, TagMapping[]>();

  // Helper to add a tag mapping
  const addTag = (
    tag: string,
    provider: string,
    model: string,
    source: TagMapping['source']
  ) => {
    const existing = tags.get(tag);
    if (existing) {
      existing.push({ provider, model, source });
    } else {
      tags.set(tag, [{ provider, model, source }]);
    }
  };

  // Process each provider
  for (const [providerId, providerConfig] of Object.entries(providers)) {
    // Step 1: Collect tags from explicit models
    if (providerConfig.models) {
      for (const [modelName, metadata] of Object.entries(
        providerConfig.models
      )) {
        if (metadata.tags) {
          for (const tag of metadata.tags) {
            addTag(tag, providerId, modelName, 'explicit');
          }
        }
      }
    }

    // Step 2: Fetch actual model list from provider
    let actualModels: string[] = [];
    try {
      const connector = providerConfig.connector;
      const modelInfos = await connector.listModels();
      actualModels = modelInfos.map((m) => m.id);
    } catch {
      // Failed to fetch models - continue with explicit models only
      // Error will be visible when user tries to use the provider
    }

    // Step 3: Apply provider-level modelRules to actual models
    if (providerConfig.modelRules && actualModels.length > 0) {
      for (const rule of providerConfig.modelRules) {
        if (!rule.tags) continue;

        // Find models matching this rule's patterns
        const matchingModels = actualModels.filter((modelId) =>
          matchesPatterns(modelId, rule.pattern)
        );

        // Add tags for all matching models
        for (const tag of rule.tags) {
          for (const modelId of matchingModels) {
            addTag(tag, providerId, modelId, 'provider-rule');
          }
        }
      }
    }

    // Step 4: Apply global modelRules to actual models
    if (globalModelRules && actualModels.length > 0) {
      for (const rule of globalModelRules) {
        if (!rule.tags) continue;

        const matchingModels = actualModels.filter((modelId) =>
          matchesPatterns(modelId, rule.pattern)
        );

        for (const tag of rule.tags) {
          for (const modelId of matchingModels) {
            addTag(tag, providerId, modelId, 'global-rule');
          }
        }
      }
    }
  }

  // Create registry with resolve function
  const registry: TagRegistry = {
    tags,
    resolve(tag: string, preferredProvider?: string): TagMapping | null {
      const mappings = tags.get(tag);
      if (!mappings || mappings.length === 0) {
        return null;
      }

      // If preferred provider specified, try to find a match
      if (preferredProvider) {
        const match = mappings.find((m) => m.provider === preferredProvider);
        if (match) return match;
      }

      // Return first mapping (priority: explicit > provider-rule > global-rule)
      const sorted = [...mappings].sort((a, b) => {
        const priority = { explicit: 0, 'provider-rule': 1, 'global-rule': 2 };
        return priority[a.source] - priority[b.source];
      });

      return sorted[0];
    },
  };

  return registry;
}

/**
 * Check if a model ID matches any of the patterns
 * Supports glob patterns, regex strings, and RegExp objects
 */
function matchesPatterns(
  modelId: string,
  patterns: (string | RegExp)[]
): boolean {
  for (const pattern of patterns) {
    if (typeof pattern === 'string') {
      // Check if it's a regex string (starts with /)
      if (pattern.startsWith('/')) {
        const regexMatch = pattern.match(/^\/(.+?)\/([gimuy]*)$/);
        if (regexMatch) {
          const regex = new RegExp(regexMatch[1], regexMatch[2]);
          if (regex.test(modelId)) return true;
        }
      } else {
        // Treat as glob pattern
        if (minimatch(modelId, pattern)) return true;
      }
    } else if (pattern instanceof RegExp) {
      if (pattern.test(modelId)) return true;
    }
  }
  return false;
}
