/**
 * Model rule resolver - matches model IDs against rules and resolves configuration
 */

import { matchesGlobPatterns } from './glob-matcher.js';
import type { ModelRule, FactoryProviderConfig, ReasoningConfig } from './factory.js';

export interface ResolvedModelConfig {
  tags?: string[];
  reasoning?: ReasoningConfig;
  enabled?: boolean;
}

/**
 * Resolve model configuration by matching against rules
 * Priority: explicit model metadata > provider rules > global rules
 * Tags are accumulated (merged), other properties use first-match-wins
 * 
 * @param modelId - The model ID to resolve config for
 * @param provider - Provider ID
 * @param providerConfig - Provider configuration
 * @param globalRules - Global model rules from defaults
 * @returns Resolved model configuration
 */
export function resolveModelConfig(
  modelId: string,
  provider: string,
  providerConfig: FactoryProviderConfig,
  globalRules?: ModelRule[]
): ResolvedModelConfig {
  const resolved: ResolvedModelConfig = {};
  const accumulatedTags: Set<string> = new Set();

  // Priority 1: Check explicit model metadata (highest priority)
  const modelMetadata = providerConfig.models?.[modelId];
  if (modelMetadata) {
    if (modelMetadata.tags) {
      modelMetadata.tags.forEach(tag => accumulatedTags.add(tag));
    }
    if (modelMetadata.reasoning) {
      resolved.reasoning = modelMetadata.reasoning;
    }
  }

  // Priority 2: Check provider-level rules
  let providerRuleMatched = false;
  if (providerConfig.modelRules) {
    for (const rule of providerConfig.modelRules) {
      if (matchesGlobPatterns(modelId, rule.pattern)) {
        providerRuleMatched = true;
        // Accumulate tags
        if (rule.tags) {
          rule.tags.forEach(tag => accumulatedTags.add(tag));
        }
        // Apply reasoning if not already set
        if (!resolved.reasoning && rule.reasoning) {
          // Normalize reasoning value to object form
          if (rule.reasoning === true) {
            resolved.reasoning = { effort: 'medium' };
          } else if (typeof rule.reasoning === 'string') {
            resolved.reasoning = { effort: rule.reasoning };
          } else {
            resolved.reasoning = rule.reasoning;
          }
        }
        // Apply enabled flag if explicitly set (first match wins)
        if (resolved.enabled === undefined && rule.enabled !== undefined) {
          resolved.enabled = rule.enabled;
        }
      }
    }
  }

  // Priority 3: Check global rules (only if no provider rule matched)
  if (!providerRuleMatched && globalRules) {
    for (const rule of globalRules) {
      if (matchesGlobPatterns(modelId, rule.pattern)) {
        // Accumulate tags
        if (rule.tags) {
          rule.tags.forEach(tag => accumulatedTags.add(tag));
        }
        // Apply reasoning if not already set
        if (!resolved.reasoning && rule.reasoning) {
          // Normalize reasoning value to object form
          if (rule.reasoning === true) {
            resolved.reasoning = { effort: 'medium' };
          } else if (typeof rule.reasoning === 'string') {
            resolved.reasoning = { effort: rule.reasoning };
          } else {
            resolved.reasoning = rule.reasoning;
          }
        }
        // Apply enabled flag if explicitly set (first match wins)
        if (resolved.enabled === undefined && rule.enabled !== undefined) {
          resolved.enabled = rule.enabled;
        }
      }
    }
  }

  // Convert accumulated tags to array
  if (accumulatedTags.size > 0) {
    resolved.tags = Array.from(accumulatedTags);
  }

  return resolved;
}
