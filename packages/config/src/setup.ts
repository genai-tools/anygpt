/**
 * Convenience functions for setting up router with configuration
 */

import { GenAIRouter } from '@anygpt/router';
import { loadConfig } from './loader.js';
import { loadConnectors } from './connector-loader.js';
import type { AnyGPTConfig, ConfigLoadOptions } from './types.js';
import type { ConnectorConfig, Logger } from '@anygpt/types';
import type { FactoryConfig } from './factory.js';

/**
 * Create and configure a router from configuration
 */
export async function setupRouter(
  options: ConfigLoadOptions = {},
  logger?: Logger
): Promise<{ router: GenAIRouter; config: AnyGPTConfig }> {
  // Load configuration
  const config = await loadConfig(options);
  
  // Create router with converted config
  const router = new GenAIRouter({
    timeout: config.settings?.timeout,
    maxRetries: config.settings?.maxRetries,
    providers: convertToRouterProviders(config)
  });
  
  // Load and register connectors with logger
  await loadConnectors(router, config, logger);
  
  return { router, config };
}

/**
 * Create router from factory config with direct connector instances
 */
export async function setupRouterFromFactory(factoryConfig: FactoryConfig): Promise<{ router: GenAIRouter; config: FactoryConfig }> {
  // Convert factory providers to router provider format for validation
  const routerProviders: Record<string, { type: string; api: { url: string; token: string; headers: Record<string, string> } }> = {};
  for (const providerId of Object.keys(factoryConfig.providers)) {
    routerProviders[providerId] = {
      type: providerId, // Use provider ID as type for factory configs
      api: {
        url: '',
        token: '',
        headers: {}
      }
    };
  }

  // Create router with basic settings and provider configs for validation
  const router = new GenAIRouter({
    timeout: factoryConfig.defaults?.timeout || 30000,
    maxRetries: factoryConfig.defaults?.maxRetries || 3,
    providers: routerProviders as unknown as Record<string, any> // Include providers for validation
  });

  // Register each connector directly with the router
  for (const [providerId, providerConfig] of Object.entries(factoryConfig.providers)) {
    const factory = {
      getProviderId: () => providerId,
      create: (_config: ConnectorConfig) => {
        // For factory configs, ignore normalized config and reuse supplied connector instance
        return providerConfig.connector;
      },
    };

    router.registerConnector(factory);
  }

  return { router, config: factoryConfig };
}
/**
 * Convert AnyGPT config providers to router format
 */
function convertToRouterProviders(config: AnyGPTConfig): Record<string, any> {
  const routerProviders: Record<string, any> = {};
  
  for (const [providerId, providerConfig] of Object.entries(config.providers)) {
    // Extract connector type from package name
    // e.g., "@anygpt/openai" -> "openai"
    const connectorPackage = providerConfig.connector.type || providerConfig.connector.connector;
    const connectorType = connectorPackage
      .split('/')
      .pop()
      ?.replace('@anygpt/', '') || 'unknown';
    
    // Support both old format (config) and new format (options)
    const connectorOptions = providerConfig.connector.options || providerConfig.connector.config || {};
    
    routerProviders[providerId] = {
      type: connectorType,
      api: {
        url: connectorOptions.baseURL || '',
        token: connectorOptions.apiKey || '',
        headers: {}
      },
      timeout: connectorOptions.timeout,
      maxRetries: connectorOptions.maxRetries
    };
  }
  
  return routerProviders;
}
