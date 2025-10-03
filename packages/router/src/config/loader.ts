/**
 * Configuration loader - loads from files, environment, or presets
 */

import type { GatewayConfig, GatewayProfile } from './types.js';
import { BUILTIN_PRESETS, getPreset, createCustomPreset } from './presets.js';

export class ConfigLoader {
  /**
   * Load configuration from JSON file
   */
  static async loadFromFile(filePath: string): Promise<GatewayConfig> {
    try {
      // In a real implementation, use fs.readFile
      const content = await import(filePath);
      return this.validateConfig(content.default || content);
    } catch (error) {
      throw new Error(`Failed to load config from ${filePath}: ${error}`);
    }
  }

  /**
   * Load configuration from environment variables
   */
  static loadFromEnv(): GatewayConfig {
    const profiles: GatewayProfile[] = [];
    
    // Check for preset-based config
    const presetName = process.env.GATEWAY_PRESET;
    if (presetName) {
      const preset = getPreset(presetName);
      if (preset) {
        profiles.push(this.resolveEnvVars(preset));
      }
    }

    // Check for custom config via env vars
    const customProfile = this.createProfileFromEnv();
    if (customProfile) {
      profiles.push(customProfile);
    }

    return {
      version: '1.0',
      profiles,
      defaultProfile: profiles[0]?.slug,
      global: {
        logLevel: (process.env.GATEWAY_LOG_LEVEL as any) || 'info',
        enableMetrics: process.env.GATEWAY_METRICS === 'true'
      }
    };
  }

  /**
   * Create a profile from environment variables
   */
  private static createProfileFromEnv(): GatewayProfile | null {
    const baseURL = process.env.GATEWAY_BASE_URL;
    const modelId = process.env.GATEWAY_MODEL;
    const apiKey = process.env.GATEWAY_API_KEY;

    if (!baseURL || !modelId) {
      return null;
    }

    return {
      slug: 'env-config',
      name: 'Environment Configuration',
      description: 'Configuration loaded from environment variables',
      provider: {
        type: 'custom',
        baseURL,
        apiKey,
        timeout: parseInt(process.env.GATEWAY_TIMEOUT || '30000'),
        maxRetries: parseInt(process.env.GATEWAY_MAX_RETRIES || '3')
      },
      model: {
        id: modelId,
        displayName: process.env.GATEWAY_MODEL_NAME || modelId
      },
      parameters: {
        temperature: parseFloat(process.env.GATEWAY_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.GATEWAY_MAX_TOKENS || '4096'),
        streaming: process.env.GATEWAY_STREAMING === 'true'
      }
    };
  }

  /**
   * Resolve environment variable references in config
   */
  private static resolveEnvVars(profile: GatewayProfile): GatewayProfile {
    const resolved = JSON.parse(JSON.stringify(profile));
    
    // Resolve ${VAR_NAME} patterns
    const resolveString = (str: string): string => {
      return str.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        return process.env[varName] || match;
      });
    };

    if (resolved.provider.apiKey) {
      resolved.provider.apiKey = resolveString(resolved.provider.apiKey);
    }
    if (resolved.provider.baseURL) {
      resolved.provider.baseURL = resolveString(resolved.provider.baseURL);
    }

    return resolved;
  }

  /**
   * Create a custom configuration by extending a preset
   */
  static createCustomConfig(
    basePreset: string,
    customizations: {
      baseURL?: string;
      modelId?: string;
      modelPrefix?: string;
      parameters?: Record<string, any>;
    }
  ): GatewayProfile {
    const overrides: Partial<GatewayProfile> = {};

    if (customizations.baseURL) {
      overrides.provider = { 
        type: 'custom',
        baseURL: customizations.baseURL 
      };
    }

    if (customizations.modelId || customizations.modelPrefix) {
      overrides.model = { id: '' };
      if (customizations.modelId) {
        overrides.model.id = customizations.modelId;
      }
      if (customizations.modelPrefix) {
        const base = getPreset(basePreset);
        if (base) {
          overrides.model.id = `${customizations.modelPrefix}${base.model.id}`;
        }
      }
    }

    if (customizations.parameters) {
      overrides.parameters = customizations.parameters;
    }

    return createCustomPreset(basePreset, overrides);
  }

  /**
   * Validate configuration structure
   */
  private static validateConfig(config: any): GatewayConfig {
    if (!config.version) {
      throw new Error('Config must have a version field');
    }
    
    if (!Array.isArray(config.profiles)) {
      throw new Error('Config must have a profiles array');
    }

    for (const profile of config.profiles) {
      this.validateProfile(profile);
    }

    return config;
  }

  /**
   * Validate individual profile
   */
  private static validateProfile(profile: any): void {
    const required = ['slug', 'name', 'provider', 'model'];
    for (const field of required) {
      if (!profile[field]) {
        throw new Error(`Profile missing required field: ${field}`);
      }
    }

    if (!profile.provider.type) {
      throw new Error('Provider must have a type');
    }

    if (!profile.model.id) {
      throw new Error('Model must have an id');
    }
  }

  /**
   * Get all available presets
   */
  static getAvailablePresets(): Record<string, GatewayProfile> {
    return BUILTIN_PRESETS;
  }

  /**
   * Generate example configuration file
   */
  static generateExampleConfig(): GatewayConfig {
    return {
      version: '1.0',
      profiles: [
        BUILTIN_PRESETS['openai-gpt-4o'],
        BUILTIN_PRESETS['openai-o1'],
        BUILTIN_PRESETS['openai-coding-assistant']
      ],
      defaultProfile: 'openai-gpt-4o',
      global: {
        logLevel: 'info',
        enableMetrics: false
      }
    };
  }
}
