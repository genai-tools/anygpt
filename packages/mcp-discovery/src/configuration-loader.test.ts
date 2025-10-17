import { describe, it, expect } from 'vitest';
import { ConfigurationLoader } from './configuration-loader.js';
import type { DiscoveryConfig } from './types.js';

describe('ConfigurationLoader', () => {
  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const loader = new ConfigurationLoader();
      const config = loader.getDefaultConfig();

      expect(config).toEqual({
        enabled: true,
        cache: {
          enabled: true,
          ttl: 3600
        },
        sources: [],
        toolRules: []
      });
    });
  });

  describe('validate', () => {
    it('should validate correct configuration', () => {
      const loader = new ConfigurationLoader();
      const config: DiscoveryConfig = {
        enabled: true,
        cache: {
          enabled: true,
          ttl: 3600
        },
        toolRules: [
          {
            pattern: ['*github*'],
            enabled: true,
            tags: ['github']
          }
        ]
      };

      const result = loader.validate(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject configuration with invalid enabled field', () => {
      const loader = new ConfigurationLoader();
      const config = {
        enabled: 'yes' // Should be boolean
      } as any;

      const result = loader.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('enabled must be a boolean');
    });

    it('should reject configuration with invalid cache ttl', () => {
      const loader = new ConfigurationLoader();
      const config: DiscoveryConfig = {
        enabled: true,
        cache: {
          enabled: true,
          ttl: -1 // Should be positive
        }
      };

      const result = loader.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('cache.ttl must be a positive number');
    });

    it('should reject configuration with invalid tool rule pattern', () => {
      const loader = new ConfigurationLoader();
      const config: DiscoveryConfig = {
        enabled: true,
        toolRules: [
          {
            pattern: 'not-an-array' as any, // Should be array
            enabled: true
          }
        ]
      };

      const result = loader.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('toolRules[0].pattern must be an array');
    });

    it('should allow configuration without optional fields', () => {
      const loader = new ConfigurationLoader();
      const config: DiscoveryConfig = {
        enabled: true
      };

      const result = loader.validate(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('mergeWithDefaults', () => {
    it('should merge partial config with defaults', () => {
      const loader = new ConfigurationLoader();
      const partial: Partial<DiscoveryConfig> = {
        enabled: false
      };

      const merged = loader.mergeWithDefaults(partial);

      expect(merged).toEqual({
        enabled: false,
        cache: {
          enabled: true,
          ttl: 3600
        },
        sources: [],
        toolRules: []
      });
    });

    it('should override default cache settings', () => {
      const loader = new ConfigurationLoader();
      const partial: Partial<DiscoveryConfig> = {
        cache: {
          enabled: false,
          ttl: 7200
        }
      };

      const merged = loader.mergeWithDefaults(partial);

      expect(merged.cache).toEqual({
        enabled: false,
        ttl: 7200
      });
    });

    it('should preserve tool rules', () => {
      const loader = new ConfigurationLoader();
      const partial: Partial<DiscoveryConfig> = {
        toolRules: [
          {
            pattern: ['*test*'],
            enabled: true,
            tags: ['test']
          }
        ]
      };

      const merged = loader.mergeWithDefaults(partial);

      expect(merged.toolRules).toEqual([
        {
          pattern: ['*test*'],
          enabled: true,
          tags: ['test']
        }
      ]);
    });
  });
});
