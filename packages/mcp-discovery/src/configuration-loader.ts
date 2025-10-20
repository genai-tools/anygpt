import type { DiscoveryConfig } from './types.js';

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether configuration is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
}

/**
 * Configuration loader for discovery engine
 */
export class ConfigurationLoader {
  /**
   * Get default configuration
   */
  getDefaultConfig(): DiscoveryConfig {
    return {
      enabled: true,
      cache: {
        enabled: true,
        ttl: 3600, // 1 hour
      },
      sources: [],
      serverRules: [],
      toolRules: [],
    };
  }

  /**
   * Validate discovery configuration
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate(config: any): ValidationResult {
    const errors: string[] = [];

    // Validate enabled field
    if (typeof config.enabled !== 'boolean') {
      errors.push('enabled must be a boolean');
    }

    // Validate cache configuration
    if (config.cache !== undefined) {
      if (typeof config.cache !== 'object' || config.cache === null) {
        errors.push('cache must be an object');
      } else {
        if (typeof config.cache.enabled !== 'boolean') {
          errors.push('cache.enabled must be a boolean');
        }
        if (typeof config.cache.ttl !== 'number' || config.cache.ttl <= 0) {
          errors.push('cache.ttl must be a positive number');
        }
      }
    }

    // Validate sources
    if (config.sources !== undefined) {
      if (!Array.isArray(config.sources)) {
        errors.push('sources must be an array');
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config.sources.forEach((source: any, index: number) => {
          if (typeof source.type !== 'string') {
            errors.push(`sources[${index}].type must be a string`);
          }
          if (typeof source.path !== 'string') {
            errors.push(`sources[${index}].path must be a string`);
          }
        });
      }
    }

    // Validate rules (basic check - detailed validation handled by RuleEngine)
    if (config.serverRules !== undefined) {
      if (!Array.isArray(config.serverRules)) {
        errors.push('serverRules must be an array');
      }
    }

    if (config.toolRules !== undefined) {
      if (!Array.isArray(config.toolRules)) {
        errors.push('toolRules must be an array');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge partial configuration with defaults
   */
  mergeWithDefaults(partial: Partial<DiscoveryConfig>): DiscoveryConfig {
    const defaults = this.getDefaultConfig();

    return {
      enabled: partial.enabled ?? defaults.enabled,
      cache: partial.cache ?? defaults.cache,
      sources: partial.sources ?? defaults.sources,
      serverRules: partial.serverRules ?? defaults.serverRules,
      toolRules: partial.toolRules ?? defaults.toolRules,
    };
  }
}
