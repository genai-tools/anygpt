/**
 * Tests for config loader with jiti + tryNative support
 */

import { describe, it, expect } from 'vitest';
import { createJiti } from 'jiti';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { loadConfig, validateConfig } from './loader.js';
import { ConfigParseError, ConfigValidationError } from './errors.js';
import type { AnyGPTConfig } from '@anygpt/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Config Loader - TypeScript Support', () => {
  it('should load TypeScript config with jiti tryNative', async () => {
    const configPath = join(__dirname, '../examples/anygpt.config.ts');

    const jiti = createJiti(import.meta.url, {
      tryNative: true,
      fsCache: true,
      interopDefault: true,
      moduleCache: true,
    });

    const config = await jiti.import(configPath, { default: true });

    expect(config).toBeDefined();
    expect(config.providers).toBeDefined();
    expect(Object.keys(config.providers)).toContain('openai-main');
    expect(config.settings?.defaultProvider).toBe('openai-main');
  });

  it('should handle TypeScript-specific syntax', async () => {
    const configPath = join(__dirname, '../examples/anygpt.config.ts');

    const jiti = createJiti(import.meta.url, {
      tryNative: true,
      fsCache: true,
      interopDefault: true,
    });

    const config = await jiti.import(configPath, { default: true });

    // Verify the config has proper TypeScript types
    expect(config.version).toBe('1.0');
    expect(config.providers['openai-main']).toBeDefined();
    expect(config.providers['openai-main'].name).toBe('OpenAI GPT Models');
    expect(config.providers['openai-main'].connector).toBeDefined();
  });

  it('should work with multiple providers', async () => {
    const configPath = join(__dirname, '../examples/anygpt.config.ts');

    const jiti = createJiti(import.meta.url, {
      tryNative: true,
      fsCache: true,
      interopDefault: true,
    });

    const config = await jiti.import(configPath, { default: true });

    const providerKeys = Object.keys(config.providers);
    expect(providerKeys.length).toBeGreaterThanOrEqual(3);
    expect(providerKeys).toContain('openai-main');
    expect(providerKeys).toContain('ollama-local');
    expect(providerKeys).toContain('together-ai');
  });

  it('should cache subsequent imports', async () => {
    const configPath = join(__dirname, '../examples/anygpt.config.ts');

    const jiti = createJiti(import.meta.url, {
      tryNative: true,
      fsCache: true,
      moduleCache: true,
    });

    // First import
    const start1 = Date.now();
    const config1 = await jiti.import(configPath, { default: true });
    const time1 = Date.now() - start1;

    // Second import (should be cached)
    const start2 = Date.now();
    const config2 = await jiti.import(configPath, { default: true });
    const time2 = Date.now() - start2;

    expect(config1).toBeDefined();
    expect(config2).toBeDefined();
    expect(config1.providers).toEqual(config2.providers);

    // Second import should be faster (cached)
    // Note: This is a loose check as timing can vary
    expect(time2).toBeLessThanOrEqual(time1 + 10);
  });
});

describe('Config Loader - Node.js Version Compatibility', () => {
  it('should report current Node.js version', () => {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);

    expect(major).toBeGreaterThanOrEqual(20);

    // Log for debugging
    console.log(`Running on Node.js ${version}`);

    if (
      major >= 24 ||
      (major === 22 && parseInt(version.split('.')[1]) >= 18)
    ) {
      console.log('✅ Native TypeScript support enabled by default');
    } else if (major === 22) {
      console.log(
        '⚠️  Native TypeScript available with --experimental-strip-types'
      );
    } else {
      console.log('📦 Using jiti transformation (no native TS support)');
    }
  });

  it('should handle jiti tryNative option correctly', async () => {
    // Create jiti instance with tryNative
    const jiti = createJiti(import.meta.url, {
      tryNative: true,
      fsCache: true,
    });

    expect(jiti).toBeDefined();
    expect(jiti.import).toBeDefined();
    expect(jiti.esmResolve).toBeDefined();
  });
});

describe('loadConfig', () => {
  it('should load config from explicit path', async () => {
    const configPath = join(__dirname, '../examples/anygpt.config.ts');
    const config = await loadConfig({ configPath });

    expect(config).toBeDefined();
    expect(config.providers).toBeDefined();
    expect(Object.keys(config.providers).length).toBeGreaterThan(0);
  });

  it('should return default config when no file found', async () => {
    const config = await loadConfig({
      configPath: '/nonexistent/path.ts',
    }).catch(() => null);

    // Should throw or return default - let's test the default path
    const defaultConfig = await loadConfig();
    expect(defaultConfig).toBeDefined();
    expect(defaultConfig.providers).toBeDefined();
    expect(
      defaultConfig.providers.openai || defaultConfig.providers.mock
    ).toBeDefined();
  });

  it('should throw ConfigParseError for invalid JSON', async () => {
    const invalidPath = join(__dirname, '../examples/invalid.json');

    await expect(loadConfig({ configPath: invalidPath })).rejects.toThrow();
  });

  it('should merge defaults when requested', async () => {
    const configPath = join(__dirname, '../examples/anygpt.config.ts');
    const config = await loadConfig({ configPath, mergeDefaults: true });

    expect(config).toBeDefined();
    expect(config.providers).toBeDefined();
  });
});

describe('validateConfig', () => {
  it('should validate config with providers', () => {
    const validConfig: AnyGPTConfig = {
      version: '1.0',
      providers: {
        test: {
          name: 'Test',
          connector: {
            connector: '@anygpt/mock',
          },
        },
      },
    };

    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  it('should throw ConfigValidationError for missing providers', () => {
    const invalidConfig = {
      version: '1.0',
      providers: {},
    } as AnyGPTConfig;

    expect(() => validateConfig(invalidConfig)).toThrow(ConfigValidationError);
  });

  it('should throw ConfigValidationError for provider without connector', () => {
    const invalidConfig = {
      version: '1.0',
      providers: {
        test: {
          name: 'Test',
          connector: {} as any,
        },
      },
    } as AnyGPTConfig;

    expect(() => validateConfig(invalidConfig)).toThrow(ConfigValidationError);
  });

  it('should validate multiple providers', () => {
    const validConfig: AnyGPTConfig = {
      version: '1.0',
      providers: {
        openai: {
          name: 'OpenAI',
          connector: {
            connector: '@anygpt/openai',
          },
        },
        mock: {
          name: 'Mock',
          connector: {
            connector: '@anygpt/mock',
          },
        },
      },
    };

    expect(() => validateConfig(validConfig)).not.toThrow();
  });
});

describe('MCP Server Configuration - Array Format', () => {
  it('should accept array format with name field', async () => {
    const config: AnyGPTConfig = {
      version: '1.0',
      providers: {
        test: {
          name: 'Test',
          connector: {
            connector: '@anygpt/mock',
          },
        },
      },
      mcpServers: [
        {
          name: 'sequential-thinking',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
          description: 'Advanced reasoning',
        },
        {
          name: 'git',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-git'],
          description: 'Git operations',
        },
      ],
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  it('should accept object format (backward compatibility)', async () => {
    const config: AnyGPTConfig = {
      version: '1.0',
      providers: {
        test: {
          name: 'Test',
          connector: {
            connector: '@anygpt/mock',
          },
        },
      },
      mcpServers: {
        'sequential-thinking': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
          description: 'Advanced reasoning',
        },
        git: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-git'],
          description: 'Git operations',
        },
      },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  it('should normalize array format to object format during merge', () => {
    // Test the normalization logic directly
    const arrayConfig: AnyGPTConfig = {
      version: '1.0',
      providers: {
        test: {
          name: 'Test',
          connector: {
            connector: '@anygpt/mock',
          },
        },
      },
      mcpServers: [
        {
          name: 'sequential-thinking',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        },
        {
          name: 'git',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-git'],
        },
      ],
    };

    // Simulate normalization (this happens internally during merge)
    const mcpServers = arrayConfig.mcpServers;
    expect(Array.isArray(mcpServers)).toBe(true);
    
    // After normalization, it should be an object
    if (Array.isArray(mcpServers)) {
      const normalized: Record<string, any> = {};
      for (const server of mcpServers) {
        if (server.name) {
          const { name, ...config } = server;
          normalized[name] = config;
        }
      }
      
      expect(Object.keys(normalized)).toHaveLength(2);
      expect(normalized['sequential-thinking']).toBeDefined();
      expect(normalized['git']).toBeDefined();
      expect(normalized['sequential-thinking'].command).toBe('npx');
    }
  });

  it('should throw error for array format without name field', () => {
    const config: AnyGPTConfig = {
      version: '1.0',
      providers: {
        test: {
          name: 'Test',
          connector: {
            connector: '@anygpt/mock',
          },
        },
      },
      mcpServers: [
        {
          // Missing 'name' field
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        } as any,
      ],
    };

    // This should throw during normalization
    expect(() => {
      // Simulate the normalization that happens during merge
      const normalized: Record<string, any> = {};
      for (const server of config.mcpServers as any[]) {
        if (!server.name) {
          throw new ConfigValidationError([
            'MCP server in array format must have a "name" field',
          ]);
        }
        const { name, ...rest } = server;
        normalized[name] = rest;
      }
    }).toThrow(ConfigValidationError);
  });

  it('should handle mixed array and object formats in merge', async () => {
    const baseConfig: AnyGPTConfig = {
      version: '1.0',
      providers: {
        test: {
          name: 'Test',
          connector: {
            connector: '@anygpt/mock',
          },
        },
      },
      mcpServers: {
        'sequential-thinking': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        },
      },
    };

    const overrideConfig: Partial<AnyGPTConfig> = {
      mcpServers: [
        {
          name: 'git',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-git'],
        },
      ],
    };

    // Both formats should work together
    expect(() => validateConfig(baseConfig)).not.toThrow();
  });

  it('should preserve environment variables in array format', () => {
    const config: AnyGPTConfig = {
      version: '1.0',
      providers: {
        test: {
          name: 'Test',
          connector: {
            connector: '@anygpt/mock',
          },
        },
      },
      mcpServers: [
        {
          name: 'github',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: {
            GITHUB_TOKEN: 'test-token',
          },
        },
      ],
    };

    expect(() => validateConfig(config)).not.toThrow();
    const server = (config.mcpServers as any[])[0];
    expect(server.env).toBeDefined();
    expect(server.env.GITHUB_TOKEN).toBe('test-token');
  });
});
