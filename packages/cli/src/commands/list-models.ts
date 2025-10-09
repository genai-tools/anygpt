import type { CLIContext } from '../utils/cli-context.js';
import { resolveModelConfig } from '@anygpt/config';
import type {
  ConnectorConfig,
  IConnector,
  ConnectorFactory,
  ModelInfo,
} from '@anygpt/router';

interface ListModelsOptions {
  provider?: string;
  json?: boolean;
  tags?: boolean;
  filterTags?: string; // Comma-separated tags, use ! prefix for exclusion
  enabled?: boolean; // Filter by enabled status
}

/**
 * Create default config from generic environment variables
 */
function createDefaultConfig(): Partial<ConnectorConfig> {
  const config: Partial<ConnectorConfig> = {};

  // Generic environment variables that connectors may use
  if (process.env.SRC_ACCESS_TOKEN) {
    config.accessToken = process.env.SRC_ACCESS_TOKEN;
  }
  if (process.env.SRC_ENDPOINT) {
    config.endpoint = process.env.SRC_ENDPOINT;
  }
  if (process.env.OPENAI_API_KEY) {
    (config as Record<string, unknown>).apiKey = process.env.OPENAI_API_KEY;
  }
  if (process.env.OPENAI_API_URL) {
    (config as Record<string, unknown>).apiUrl = process.env.OPENAI_API_URL;
  }

  return config;
}

/**
 * Dynamically import and create a connector from a package name
 */
async function createConnectorFromPackage(
  packageName: string,
  config?: Partial<ConnectorConfig>
): Promise<IConnector> {
  try {
    // Import the package
    const module = await import(packageName);

    // Try to get the default export (should be a factory or connector)
    const defaultExport = module.default;

    if (!defaultExport) {
      throw new Error(`Package ${packageName} has no default export`);
    }

    // Merge provided config with defaults from environment variables
    const finalConfig = { ...createDefaultConfig(), ...config };

    // If it's a factory class, create the connector
    if (typeof defaultExport === 'function') {
      // Check if it looks like a connector factory (has create method)
      if (
        defaultExport.prototype &&
        typeof defaultExport.prototype.create === 'function'
      ) {
        const factory = new defaultExport() as ConnectorFactory;
        return factory.create(finalConfig);
      }
      // Otherwise assume it's a direct factory function
      return defaultExport(finalConfig) as IConnector;
    }

    // If it's already a connector instance
    if (typeof defaultExport === 'object' && 'listModels' in defaultExport) {
      return defaultExport as IConnector;
    }

    throw new Error(
      `Package ${packageName} does not export a valid connector or factory`
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Cannot resolve module')
    ) {
      throw new Error(
        `Package ${packageName} is not installed. Install it with: npm install ${packageName}`
      );
    }
    throw error;
  }
}

/**
 * Check if a string looks like a package name (contains @ or / or starts with a letter)
 */
function isPackageName(provider: string): boolean {
  return (
    provider.includes('@') || provider.includes('/') || /^[a-z]/.test(provider)
  );
}

export async function listModelsCommand(
  context: CLIContext,
  options: ListModelsOptions
) {
  // Determine which provider to use
  const providerSpec = options.provider || context.defaults.provider;

  if (!providerSpec) {
    throw new Error(
      'No provider specified. Use --provider or configure a default provider.'
    );
  }

  try {
    let models: ModelInfo[];
    let providerId: string;

    // First, try to use the provider from the router (configured providers)
    // Only fall back to package import if the provider is not configured
    try {
      models = await context.router.listModels(providerSpec);
      providerId = providerSpec;
    } catch (routerError) {
      // If router fails and the provider looks like a package name, try importing it
      if (isPackageName(providerSpec)) {
        console.log(`📦 Importing connector from package: ${providerSpec}`);

        // Try to import and create the connector
        const connector = await createConnectorFromPackage(providerSpec);

        // Call listModels directly on the connector
        models = await connector.listModels();
        providerId = providerSpec;
      } else {
        // Re-throw the router error if it's not a package name
        throw routerError;
      }
    }

    // Resolve tags and enabled status
    type ModelWithMetadata = ModelInfo & {
      resolvedTags?: string[];
      enabled: boolean;
    };
    let modelsWithTags: ModelWithMetadata[] = models;
    const providerConfig = context.providers[providerId];
    const globalRules = context.defaults?.modelRules;

    // Always resolve enabled status, resolve tags only if needed
    modelsWithTags = models.map((model) => {
      const config = resolveModelConfig(
        model.id,
        providerId,
        providerConfig,
        globalRules
      );
      return {
        ...model,
        resolvedTags:
          options.tags || options.filterTags ? config.tags || [] : undefined,
        enabled: config.enabled !== false, // enabled is true by default (undefined means enabled)
      };
    });

    if (options.tags || options.filterTags) {
      // Apply tag filtering if specified
      if (options.filterTags) {
        const filters = options.filterTags.split(',').map((t) => t.trim());
        const includeTags = filters
          .filter((t) => !t.startsWith('!'))
          .map((t) => t.toLowerCase());
        const excludeTags = filters
          .filter((t) => t.startsWith('!'))
          .map((t) => t.substring(1).toLowerCase());

        modelsWithTags = modelsWithTags.filter((model) => {
          const modelTags = (model.resolvedTags || []).map((t) =>
            t.toLowerCase()
          );

          // Check exclusions first
          for (const excludeTag of excludeTags) {
            if (modelTags.includes(excludeTag)) {
              return false; // Exclude this model
            }
          }

          // If there are include filters, model must have at least one
          if (includeTags.length > 0) {
            return includeTags.some((includeTag) =>
              modelTags.includes(includeTag)
            );
          }

          return true; // No include filters or passed exclusions
        });
      }
    }

    // Apply enabled filtering if specified
    if (options.enabled !== undefined) {
      modelsWithTags = modelsWithTags.filter(
        (model) => model.enabled === options.enabled
      );
    }

    if (options.json) {
      console.log(JSON.stringify(modelsWithTags, null, 2));
    } else {
      console.log(`\n📋 Available models from provider '${providerId}':\n`);

      if (modelsWithTags.length === 0) {
        console.log('  No models available');
      } else if (options.tags) {
        // Show models with tags and enabled status
        for (const model of modelsWithTags) {
          const statusIcon = model.enabled ? '✅' : '❌';
          console.log(`  ${statusIcon} ${model.id}`);
          if (model.resolvedTags && model.resolvedTags.length > 0) {
            console.log(`    Tags: ${model.resolvedTags.join(', ')}`);
          } else {
            console.log(`    Tags: (none)`);
          }
          console.log();
        }
      } else {
        // Find max lengths for table formatting
        const maxIdLength = Math.max(
          ...modelsWithTags.map((m) => m.id.length),
          10
        );
        const maxProviderLength = Math.max(
          ...modelsWithTags.map((m) => (m.provider || '').length),
          10
        );
        const maxDisplayLength = Math.max(
          ...modelsWithTags.map((m) => (m.display_name || '').length),
          15
        );

        // Print table header with Enabled column
        console.log(
          `  ${'✓'.padEnd(3)}  ${'Model ID'.padEnd(
            maxIdLength
          )}  ${'Provider'.padEnd(maxProviderLength)}  ${'Display Name'.padEnd(
            maxDisplayLength
          )}`
        );
        console.log(
          `  ${'─'.repeat(3)}  ${'─'.repeat(maxIdLength)}  ${'─'.repeat(
            maxProviderLength
          )}  ${'─'.repeat(maxDisplayLength)}`
        );

        // Print table rows
        for (const model of modelsWithTags) {
          const statusIcon = model.enabled ? '✅' : '❌';
          const provider = model.provider || '-';
          const displayName = model.display_name || '-';
          console.log(
            `  ${statusIcon.padEnd(3)}  ${model.id.padEnd(
              maxIdLength
            )}  ${provider.padEnd(maxProviderLength)}  ${displayName.padEnd(
              maxDisplayLength
            )}`
          );
        }
      }

      // Count enabled and disabled models
      const enabledCount = modelsWithTags.filter((m) => m.enabled).length;
      const disabledCount = modelsWithTags.length - enabledCount;

      console.log(
        `\n✅ Found ${modelsWithTags.length} model${
          modelsWithTags.length !== 1 ? 's' : ''
        } (${enabledCount} enabled, ${disabledCount} disabled)\n`
      );
    }
  } catch (error) {
    throw new Error(
      `Failed to list models: ${error instanceof Error ? error.message : error}`
    );
  }
}
