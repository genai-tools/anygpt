import { openai } from '@anygpt/openai';
import type { OpenAIConnector, OpenAIConnectorConfig } from '@anygpt/openai';
import type { CodyConnectorConfig } from './types.js';

/**
 * Read Cody configuration from the standard config file
 */
async function readCodyConfig(): Promise<Partial<CodyConnectorConfig>> {
  try {
    const os = await import('os');
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const configPath = path.join(os.homedir(), '.config', 'Cody-nodejs', 'config.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    // Extract relevant configuration
    const codyConfig: Partial<CodyConnectorConfig> = {};
    
    // Get access token
    if (config.config?.auth?.credentials?.token) {
      codyConfig.accessToken = config.config.auth.credentials.token;
    }
    
    // Get endpoint
    if (config.config?.auth?.serverEndpoint) {
      codyConfig.endpoint = config.config.auth.serverEndpoint;
    }
    
    return codyConfig;
  } catch (error) {
    // If we can't read the config file, return empty config
    // User will need to provide via environment variables or config
    return {};
  }
}

/**
 * Create configuration for OpenAI connector to work with Sourcegraph Cody API
 */
async function createCodyOpenAIConfig(config: CodyConnectorConfig = {}): Promise<OpenAIConnectorConfig> {
  // Try to read from Cody config file first
  const codyFileConfig = await readCodyConfig();
  
  // Merge configs: default < env vars < file config < explicit config
  const mergedConfig = {
    endpoint: 'https://sourcegraph.com/',
    ...(process.env['SRC_ENDPOINT'] && { endpoint: process.env['SRC_ENDPOINT'] }),
    ...(process.env['SRC_ACCESS_TOKEN'] && { accessToken: process.env['SRC_ACCESS_TOKEN'] }),
    ...codyFileConfig,
    ...config
  };
  
  // Ensure endpoint ends with /
  const baseURL = mergedConfig.endpoint?.endsWith('/') 
    ? `${mergedConfig.endpoint}.api/llm` 
    : `${mergedConfig.endpoint}/.api/llm`;
  
  if (!mergedConfig.accessToken) {
    throw new Error('Access token is required. Set accessToken in config or SRC_ACCESS_TOKEN environment variable.');
  }
  
  // Create OpenAI-compatible configuration
  return {
    apiKey: mergedConfig.accessToken,
    baseURL,
    timeout: mergedConfig.timeout || 60000,
    maxRetries: mergedConfig.maxRetries || 3,
    defaultHeaders: {
      'X-Requested-With': 'cody 5.5.21',
      'X-Sourcegraph-API-Client-Name': 'cody',
      'X-Sourcegraph-API-Client-Version': '5.5.21',
      'User-Agent': `cody/5.5.21 (Node.js ${process.version})`
    }
  };
}

/**
 * Create an OpenAI connector configured for Sourcegraph Cody API
 * 
 * This function creates an OpenAI connector that can communicate with
 * Sourcegraph's OpenAI-compatible API endpoints, automatically handling
 * authentication and required headers.
 * 
 * @param config - Optional Cody-specific configuration
 * @returns Promise that resolves to an OpenAI connector configured for Cody
 * 
 * @example
 * ```typescript
 * // Use with automatic config from ~/.config/Cody-nodejs/config.json
 * const connector = await createCodyConnector();
 * 
 * // Or with explicit configuration
 * const connector = await createCodyConnector({
 *   endpoint: 'https://sourcegraph.example.com/',
 *   accessToken: 'sgp_your-token'
 * });
 * 
 * // List available models
 * const models = await connector.listModels();
 * 
 * // Chat completion
 * const response = await connector.chatCompletion({
 *   model: 'anthropic::2024-10-22::claude-3-5-sonnet-latest',
 *   messages: [{ role: 'user', content: 'Hello' }]
 * });
 * ```
 */
export async function createCodyConnector(config: CodyConnectorConfig = {}): Promise<OpenAIConnector> {
  const openaiConfig = await createCodyOpenAIConfig(config);
  return openai(openaiConfig, 'cody');
}

/**
 * Synchronous version that creates a factory function
 * Use this when you need to create the connector later or in a factory pattern
 * 
 * @param config - Cody-specific configuration
 * @returns Function that creates the connector when called
 * 
 * @example
 * ```typescript
 * const factory = codyConnectorFactory({
 *   endpoint: 'https://sourcegraph.example.com/',
 *   accessToken: 'sgp_your-token'
 * });
 * 
 * // Later...
 * const connector = await factory();
 * ```
 */
export function codyConnectorFactory(config: CodyConnectorConfig = {}) {
  return () => createCodyConnector(config);
}

/**
 * Legacy compatibility: create a factory function with sync interface
 * This matches the existing cody() function signature for drop-in replacement
 */
export function codyLoader(config: CodyConnectorConfig = {}) {
  return createCodyConnector(config);
}