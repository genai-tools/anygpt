/**
 * Connector Resolution - Support both direct instances and module references
 *
 * This enables:
 * - TypeScript configs: Direct IConnector instances
 * - JSON/YAML configs: Module references with dynamic loading
 */

import type { IConnector, Logger } from '@anygpt/types';

/**
 * Resolve a connector from either direct instance or module reference
 *
 * @param providerConfig - Provider configuration (direct or module)
 * @param providerId - Provider identifier (for error messages)
 * @param logger - Optional logger
 * @returns Resolved IConnector instance
 */
export async function resolveConnector(
  providerConfig: {
    connector?: IConnector;
    module?: string;
    config?: Record<string, unknown>;
  },
  providerId: string,
  logger?: Logger
): Promise<IConnector> {
  // Format 1: Direct instance (TypeScript/JavaScript configs)
  if (providerConfig.connector) {
    logger?.debug?.(
      `Using direct connector instance for provider: ${providerId}`
    );
    return providerConfig.connector;
  }

  // Format 2: Module reference (JSON/YAML configs)
  if (providerConfig.module) {
    logger?.debug?.(
      `Loading connector module for provider: ${providerId} from ${providerConfig.module}`
    );
    return await loadConnectorFromModule(
      providerConfig.module,
      providerConfig.config || {},
      providerId
    );
  }

  throw new Error(
    `Provider '${providerId}' must specify either 'connector' (IConnector instance) or 'module' (string reference)`
  );
}

/**
 * Dynamically load and instantiate a connector from a module
 *
 * @param moduleName - NPM package name (e.g., '@anygpt/openai')
 * @param config - Connector configuration
 * @param providerId - Provider identifier (for error messages)
 * @returns IConnector instance
 */
async function loadConnectorFromModule(
  moduleName: string,
  config: Record<string, unknown>,
  providerId: string
): Promise<IConnector> {
  try {
    // Dynamic import of the connector package
    const connectorModule = await import(moduleName);

    // Look for factory function
    // Most connectors export a factory function: openai(), anthropic(), etc.
    const factory =
      connectorModule.default || connectorModule[getFactoryName(moduleName)];

    if (!factory) {
      throw new Error(
        `No factory function found in module '${moduleName}'. ` +
          `Expected default export or named export matching package name.`
      );
    }

    if (typeof factory !== 'function') {
      throw new Error(
        `Module '${moduleName}' does not export a factory function. ` +
          `Expected a function that returns an IConnector instance.`
      );
    }

    // Call factory to create connector instance
    const connector = factory(config);

    // Validate connector interface
    if (!connector || typeof connector !== 'object') {
      throw new Error(
        `Factory from module '${moduleName}' did not return a valid connector instance.`
      );
    }

    if (
      !connector.chatCompletion ||
      typeof connector.chatCompletion !== 'function'
    ) {
      throw new Error(
        `Connector from module '${moduleName}' is missing required 'chatCompletion' method.`
      );
    }

    return connector as IConnector;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Cannot find module')
    ) {
      throw new Error(
        `Failed to load connector module '${moduleName}' for provider '${providerId}'. ` +
          `Make sure the package is installed: npm install ${moduleName}`
      );
    }
    throw error;
  }
}

/**
 * Extract factory function name from module name
 *
 * @example
 * '@anygpt/openai' -> 'openai'
 * '@anygpt/anthropic' -> 'anthropic'
 * 'my-connector' -> 'myConnector'
 */
function getFactoryName(moduleName: string): string {
  // Extract last part of scoped package name
  const parts = moduleName.split('/');
  const name = parts[parts.length - 1];

  // Convert kebab-case to camelCase
  return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
