/**
 * Convenience functions for setting up router with configuration
 */

import { GenAIRouter } from '@anygpt/router';
import {
  loadConfig,
  normalizeMCPServers,
  type ConfigLoadOptions,
} from './loader.js';
import { resolveConnector } from './connector-resolver.js';
import type { Config } from './types.js';
import type { Logger } from '@anygpt/types';
import type {
  ProviderConfig as RouterProviderConfig,
  ConnectorConfig as RouterConnectorConfig,
} from '@anygpt/router';

/**
 * Create and configure a router from configuration
 *
 * This is the main entry point for setting up a router with Config.
 * It loads the config, creates the router, and registers all connectors.
 */
export async function setupRouter(
  options: ConfigLoadOptions = {},
  logger?: Logger
): Promise<{ router: GenAIRouter; config: Config }> {
  // Load configuration
  const config = await loadConfig(options);

  // Normalize mcp if present (convert array format to object format)
  const normalizedConfig = {
    ...config,
    mcp: config.mcp?.servers
      ? normalizeMCPServers(config.mcp.servers)
      : undefined,
  };

  // Convert factory providers to router provider format for validation
  const routerProviders: Record<string, RouterProviderConfig> = {};
  for (const providerId of Object.keys(normalizedConfig.providers || {})) {
    routerProviders[providerId] = {
      type: providerId, // Use provider ID as type for factory configs
      api: {
        url: '',
        token: '',
        headers: {},
      },
    };
  }

  // Create router with basic settings and provider configs for validation
  const router = new GenAIRouter({
    timeout: normalizedConfig.settings?.timeout || 30000,
    maxRetries: normalizedConfig.settings?.maxRetries || 3,
    providers: routerProviders,
  });

  // Register each connector with the router
  for (const [providerId, providerConfig] of Object.entries(
    normalizedConfig.providers || {}
  )) {
    // Resolve connector (handles both direct instances and module references)
    const connector = await resolveConnector(
      providerConfig,
      providerId,
      logger
    );

    // Inject logger into connector if provided
    if (logger) {
      // Override the logger property
      // Cast to access protected property - this is intentional for logger injection
      type ConnectorWithLogger = typeof connector & { logger: Logger };
      try {
        (connector as ConnectorWithLogger).logger = logger;
      } catch {
        // If direct assignment fails (property might be read-only), use defineProperty
        Object.defineProperty(connector, 'logger', {
          value: logger,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }

    const factory = {
      getProviderId: () => providerId,
      create: (routerConfig: RouterConnectorConfig) => {
        // Ignore router config and reuse resolved connector instance
        void routerConfig;
        return connector;
      },
    };

    router.registerConnector(factory);
  }

  return { router, config: normalizedConfig };
}

/**
 * @deprecated Use setupRouter instead (same functionality, cleaner name)
 */
export const setupRouterFromFactory = setupRouter;
