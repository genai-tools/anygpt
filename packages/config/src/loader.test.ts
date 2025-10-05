/**
 * Tests for config loader with jiti + tryNative support
 */

import { describe, it, expect } from 'vitest';
import { createJiti } from 'jiti';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Config Loader - TypeScript Support', () => {
  it('should load TypeScript config with jiti tryNative', async () => {
    const configPath = join(__dirname, '../examples/anygpt.config.ts');
    
    const jiti = createJiti(import.meta.url, {
      tryNative: true,
      fsCache: true,
      interopDefault: true,
      moduleCache: true
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
      interopDefault: true
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
      interopDefault: true
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
      moduleCache: true
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
    
    if (major >= 24 || (major === 22 && parseInt(version.split('.')[1]) >= 18)) {
      console.log('✅ Native TypeScript support enabled by default');
    } else if (major === 22) {
      console.log('⚠️  Native TypeScript available with --experimental-strip-types');
    } else {
      console.log('📦 Using jiti transformation (no native TS support)');
    }
  });

  it('should handle jiti tryNative option correctly', async () => {
    // Create jiti instance with tryNative
    const jiti = createJiti(import.meta.url, {
      tryNative: true,
      fsCache: true
    });
    
    expect(jiti).toBeDefined();
    expect(jiti.import).toBeDefined();
    expect(jiti.esmResolve).toBeDefined();
  });
});
