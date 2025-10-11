/**
 * Model rule resolver - matches model IDs against rules and resolves configuration
 */

import { matchesGlobPatterns } from './glob-matcher.js';
import type {
  ModelRule,
  FactoryProviderConfig,
  ReasoningConfig,
  BaseModelConfig,
} from './factory.js';

/**
 * Resolved model configuration with normalized reasoning (always ReasoningConfig object form)
 */
export interface ResolvedModelConfig
  extends Omit<BaseModelConfig, 'reasoning'> {
  reasoning?: ReasoningConfig;
}

/**
 * Normalize reasoning value to ReasoningConfig object form
 */
function normalizeReasoning(
  reasoning: ModelRule['reasoning']
): ReasoningConfig | undefined {
  if (reasoning === true) {
    return { effort: 'medium' };
  } else if (typeof reasoning === 'string') {
    return { effort: reasoning };
  } else if (typeof reasoning === 'object') {
    return reasoning as ReasoningConfig;
  }
  return undefined;
}

/**
 * Apply a single rule to the resolved configuration
 * @param rule - The rule to apply
 * @param resolved - The resolved configuration being built
 * @param accumulatedTags - Set of accumulated tags
 * @param priority - Priority level: 'global' | 'provider' | 'metadata'
 * @param locked - Set of property names that are locked (from higher priority sources)
 */
function applyRule(
  rule: ModelRule,
  resolved: ResolvedModelConfig,
  accumulatedTags: Set<string>,
  priority: 'global' | 'provider',
  locked: Set<string>
): void {
  // Accumulate tags (always)
  if (rule.tags) {
    rule.tags.forEach((tag) => accumulatedTags.add(tag));
  }

  // Apply or override reasoning
  if (rule.reasoning !== undefined && !locked.has('reasoning')) {
    if (priority === 'provider') {
      // Provider rules can override global rules
      resolved.reasoning =
        rule.reasoning === false
          ? undefined
          : normalizeReasoning(rule.reasoning);
      locked.add('reasoning'); // Lock after first provider rule match
    } else if (!resolved.reasoning) {
      // Global rules only apply if not already set
      resolved.reasoning = normalizeReasoning(rule.reasoning);
    }
  }

  // Apply or override max_tokens
  if (rule.max_tokens !== undefined && !locked.has('max_tokens')) {
    if (priority === 'provider') {
      // Provider rules can override global rules
      resolved.max_tokens = rule.max_tokens;
      locked.add('max_tokens'); // Lock after first provider rule match
    } else if (resolved.max_tokens === undefined) {
      // Global rules only apply if not already set
      resolved.max_tokens = rule.max_tokens;
    }
  }

  // Apply or override useLegacyMaxTokens capability
  if (
    rule.useLegacyMaxTokens !== undefined &&
    !locked.has('useLegacyMaxTokens')
  ) {
    if (priority === 'provider') {
      // Provider rules can override global rules
      resolved.useLegacyMaxTokens = rule.useLegacyMaxTokens;
      locked.add('useLegacyMaxTokens'); // Lock after first provider rule match
    } else if (resolved.useLegacyMaxTokens === undefined) {
      // Global rules only apply if not already set
      resolved.useLegacyMaxTokens = rule.useLegacyMaxTokens;
    }
  }

  // Merge extra_body (later rules can add to it, never locked)
  if (rule.extra_body) {
    resolved.extra_body = { ...resolved.extra_body, ...rule.extra_body };
  }

  // Apply or override enabled flag
  if (rule.enabled !== undefined && !locked.has('enabled')) {
    if (priority === 'provider') {
      // Provider rules can override global rules
      resolved.enabled = rule.enabled;
      locked.add('enabled'); // Lock after first provider rule match
    } else if (resolved.enabled === undefined) {
      // Global rules only apply if not already set
      resolved.enabled = rule.enabled;
    }
  }
}

/**
 * Apply matching rules from a rule set
 */
function applyMatchingRules(
  modelId: string,
  rules: ModelRule[] | undefined,
  resolved: ResolvedModelConfig,
  accumulatedTags: Set<string>,
  priority: 'global' | 'provider',
  locked: Set<string>
): void {
  if (!rules) return;

  for (const rule of rules) {
    if (matchesGlobPatterns(modelId, rule.pattern)) {
      applyRule(rule, resolved, accumulatedTags, priority, locked);
    }
  }
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
  const locked: Set<string> = new Set(); // Track properties locked by higher priority sources

  // Check if whitelist mode is active (any rule has enabled: true)
  const hasWhitelistRules =
    providerConfig.modelRules?.some((rule) => rule.enabled === true) ||
    globalRules?.some((rule) => rule.enabled === true);

  // Priority 1: Check explicit model metadata (highest priority)
  const modelMetadata = providerConfig.models?.[modelId];
  if (modelMetadata) {
    if (modelMetadata.tags) {
      modelMetadata.tags.forEach((tag) => accumulatedTags.add(tag));
    }
    if (modelMetadata.reasoning) {
      // Normalize reasoning value to object form
      if (typeof modelMetadata.reasoning === 'string') {
        resolved.reasoning = { effort: modelMetadata.reasoning };
      } else {
        resolved.reasoning = modelMetadata.reasoning;
      }
      locked.add('reasoning'); // Lock reasoning from model metadata
    }
    if (modelMetadata.max_tokens !== undefined) {
      resolved.max_tokens = modelMetadata.max_tokens;
      locked.add('max_tokens'); // Lock max_tokens from model metadata
    }
    if (modelMetadata.useLegacyMaxTokens !== undefined) {
      resolved.useLegacyMaxTokens = modelMetadata.useLegacyMaxTokens;
      locked.add('useLegacyMaxTokens'); // Lock capability from model metadata
    }
    if (modelMetadata.extra_body !== undefined) {
      resolved.extra_body = { ...modelMetadata.extra_body };
      // extra_body is never locked - it can be merged
    }
  }

  // Priority 2: Apply global rules (lower priority)
  // Tags are always accumulated; other properties only set if not already defined
  applyMatchingRules(
    modelId,
    globalRules,
    resolved,
    accumulatedTags,
    'global',
    locked
  );

  // Priority 3: Apply provider-level rules (higher priority, can override global rules)
  // Tags are accumulated; other properties can override values from global rules
  // First provider rule match locks the property (first-match-wins within provider rules)
  applyMatchingRules(
    modelId,
    providerConfig.modelRules,
    resolved,
    accumulatedTags,
    'provider',
    locked
  );

  // Convert accumulated tags to array
  if (accumulatedTags.size > 0) {
    resolved.tags = Array.from(accumulatedTags);
  }

  // Whitelist mode: if any rule has enabled: true, default to disabled
  // unless explicitly enabled by a matching rule
  if (hasWhitelistRules && resolved.enabled === undefined) {
    resolved.enabled = false;
  }

  return resolved;
}
