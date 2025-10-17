import type { DiscoveryConfig, ToolRule, CacheConfig } from './types.js';

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
        ttl: 3600 // 1 hour
      },
      sources: [],
      toolRules: []
    };
  }

  /**
   * Validate discovery configuration
   */
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

    // Validate tool rules
    if (config.toolRules !== undefined) {
      if (!Array.isArray(config.toolRules)) {
        errors.push('toolRules must be an array');
      } else {
        config.toolRules.forEach((rule: any, index: number) => {
          if (!Array.isArray(rule.pattern)) {
            errors.push(`toolRules[${index}].pattern must be an array`);
          }
          if (rule.server !== undefined && typeof rule.server !== 'string') {
            errors.push(`toolRules[${index}].server must be a string`);
          }
          if (rule.enabled !== undefined && typeof rule.enabled !== 'boolean') {
            errors.push(`toolRules[${index}].enabled must be a boolean`);
          }
          if (rule.tags !== undefined && !Array.isArray(rule.tags)) {
            errors.push(`toolRules[${index}].tags must be an array`);
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
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
      toolRules: partial.toolRules ?? defaults.toolRules
    };
  }
}
