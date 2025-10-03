/**
 * Convenience functions for setting up router with configuration
 */

import { GenAIRouter } from '@anygpt/router';
import { loadConfig, validateConfig } from './loader.js';
import { loadConnectors } from './connector-loader.js';
import type { AnyGPTConfig, ConfigLoadOptions } from './types.js';

/**
 * Create and configure a router from configuration
 */
export async function setupRouter(options: ConfigLoadOptions = {}): Promise<{ router: GenAIRouter; config: AnyGPTConfig }> {
  // Load configuration
  const config = await loadConfig(options);
  
  // Validate configuration
  validateConfig(config);
  
  // Create router with global settings
  const router = new GenAIRouter({
    timeout: config.settings?.timeout,
    maxRetries: config.settings?.maxRetries,
    providers: convertToRouterProviders(config)
  });
  
  // Load and register connectors
  await loadConnectors(router, config);
  
  return { router, config };
}

/**
 * Convert AnyGPT config providers to router format
 */
function convertToRouterProviders(config: AnyGPTConfig): Record<string, any> {
  const routerProviders: Record<string, any> = {};
  
  for (const [providerId, providerConfig] of Object.entries(config.providers)) {
    // Extract connector type from package name
    // e.g., "@anygpt/openai" -> "openai"
    const connectorType = providerConfig.connector.connector
      .split('/')
      .pop()
      ?.replace('@anygpt/', '') || 'unknown';
    
    routerProviders[providerId] = {
      type: connectorType,
      api: {
        url: providerConfig.connector.config?.baseURL || '',
        token: providerConfig.connector.config?.apiKey || '',
        headers: {}
      },
      timeout: providerConfig.connector.config?.timeout,
      maxRetries: providerConfig.connector.config?.maxRetries
    };
  }
  
  return routerProviders;
}
