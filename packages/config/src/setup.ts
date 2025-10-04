/**
 * Convenience functions for setting up router with configuration
 */

import { GenAIRouter } from '@anygpt/router';
import { loadConfig } from './loader.js';
import { loadConnectors } from './connector-loader.js';
import type { AnyGPTConfig, ConfigLoadOptions } from '@anygpt/types';
import type { ConnectorConfig as AnyConnectorConfig, Logger } from '@anygpt/types';
import type {
  ProviderConfig as RouterProviderConfig,
  ConnectorConfig as RouterConnectorConfig
} from '@anygpt/router';
import type { FactoryConfig } from './factory.js';

type ExtendedConnectorConfig = AnyConnectorConfig & {
  type?: string;
  options?: Record<string, unknown>;
};

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
  const routerProviders: Record<string, RouterProviderConfig> = {};
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
    providers: routerProviders
  });

  // Register each connector directly with the router
  for (const [providerId, providerConfig] of Object.entries(factoryConfig.providers)) {
    const factory = {
      getProviderId: () => providerId,
      create: (routerConfig: RouterConnectorConfig) => {
        // For factory configs, ignore normalized config and reuse supplied connector instance
        void routerConfig;
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
function convertToRouterProviders(config: AnyGPTConfig): Record<string, RouterProviderConfig> {
  const routerProviders: Record<string, RouterProviderConfig> = {};
  
  for (const [providerId, providerConfig] of Object.entries(config.providers)) {
    // Extract connector type from package name
    // e.g., "@anygpt/openai" -> "openai"
    const connectorConfig = providerConfig.connector as ExtendedConnectorConfig;
    const connectorPackage = connectorConfig.type || connectorConfig.connector;
    const connectorType = connectorPackage
      .split('/')
      .pop()
      ?.replace('@anygpt/', '') || 'unknown';
    
    // Support both old format (config) and new format (options)
    const connectorOptions = (connectorConfig.options ?? connectorConfig.config ?? {}) as Record<string, unknown>;
    const baseURL = typeof connectorOptions['baseURL'] === 'string' ? connectorOptions['baseURL'] : '';
    const apiKey = typeof connectorOptions['apiKey'] === 'string' ? connectorOptions['apiKey'] : '';
    const timeout = typeof connectorOptions['timeout'] === 'number' ? connectorOptions['timeout'] : undefined;
    const maxRetries = typeof connectorOptions['maxRetries'] === 'number' ? connectorOptions['maxRetries'] : undefined;

    routerProviders[providerId] = {
      type: connectorType,
      api: {
        url: baseURL,
        token: apiKey,
        headers: {}
      },
      timeout,
      maxRetries
    };
  }
  
  return routerProviders;
}
