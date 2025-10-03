/**
 * Dynamically import types
 */
import type { ConnectorFactory, Logger } from '@anygpt/types';
import type { AnyGPTConfig, ProviderConfig } from '@anygpt/types';

/**
 * Minimal router interface needed for connector loading
 */
interface RouterLike {
  registerConnector(factory: ConnectorFactory): void;
}

/**
 * Cache for loaded connector factories
 */
const connectorCache = new Map<string, ConnectorFactory>();

/**
 * Dynamically import and create a connector factory
 */
async function loadConnectorFactory(packageName: string): Promise<ConnectorFactory> {
  // Check cache first
  if (connectorCache.has(packageName)) {
    return connectorCache.get(packageName)!;
  }

  try {
    // Dynamic import of the connector package
    const connectorModule = await import(packageName);
    
    // Look for factory exports (try multiple common patterns)
    let factory: ConnectorFactory;
    
    if (connectorModule.default && typeof connectorModule.default === 'function') {
      // Default export is a factory constructor
      factory = new connectorModule.default();
    } else if (connectorModule.default) {
      // Default export is already a factory instance
      factory = connectorModule.default;
    } else {
      // Look for named exports ending with 'Factory'
      const factoryExports = Object.keys(connectorModule).filter(key => 
        key.endsWith('Factory') && typeof connectorModule[key] === 'function'
      );
      
      if (factoryExports.length === 0) {
        throw new Error(`No connector factory found in package '${packageName}'`);
      }
      
      // Use the first factory found
      const FactoryClass = connectorModule[factoryExports[0]];
      factory = new FactoryClass();
    }
    
    // Validate factory interface
    if (!factory.getProviderId || !factory.create) {
      throw new Error(`Invalid connector factory in package '${packageName}': missing getProviderId or create methods`);
    }
    
    // Cache the factory
    connectorCache.set(packageName, factory);
    
    return factory;
  } catch (error) {
    throw new Error(`Failed to load connector from package '${packageName}': ${error}`);
  }
}

/**
 * Load and register all connectors from configuration
 */
export async function loadConnectors(
  router: RouterLike, 
  config: AnyGPTConfig,
  logger?: Logger
): Promise<void> {
  // Create loading promises for all providers
  const loadPromises = Object.entries(config.providers).map(([providerId, providerConfig]) =>
    loadConnectorForProvider(router, providerId, providerConfig, logger)
  );
  
  // Load all connectors in parallel
  await Promise.all(loadPromises);
}

/**
 * Load and register a single connector
 */
async function loadConnectorForProvider(
  router: RouterLike, 
  providerId: string, 
  providerConfig: ProviderConfig,
  logger?: Logger
): Promise<void> {
  try {
    const { connector: connectorConfig } = providerConfig;
    const connectorPackage = connectorConfig.type || connectorConfig.connector;
    const factory = await loadConnectorFactory(connectorPackage);
    
    // Register the connector factory with the router
    router.registerConnector(factory);
    
    // Use logger facade - CLI provides console logger, MCP provides no-op
    logger?.info(`✓ Loaded connector '${connectorPackage}' for provider '${providerId}'`);
  } catch (error) {
    logger?.error(`✗ Failed to load connector for provider '${providerId}':`, error);
    throw error;
  }
}

/**
 * Get connector configuration for a provider
 */
export function getConnectorConfig(config: AnyGPTConfig, providerId: string): any {
  const provider = config.providers[providerId];
  if (!provider) {
    throw new Error(`Provider '${providerId}' not found in configuration`);
  }
  
  // Support both old format (config) and new format (options)
  const connectorOptions = provider.connector.options || provider.connector.config || {};
  
  return {
    ...connectorOptions,
    // Add any global settings that might be relevant
    timeout: config.settings?.timeout,
    maxRetries: config.settings?.maxRetries
  };
}

/**
 * Clear connector cache (useful for testing)
 */
export function clearConnectorCache(): void {
  connectorCache.clear();
}
