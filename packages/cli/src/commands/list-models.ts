import type { CLIContext } from '../utils/cli-context.js';
import { resolveModelConfig } from '@anygpt/config';

interface ListModelsOptions {
  provider?: string;
  json?: boolean;
  tags?: boolean;
  filterTags?: string;  // Comma-separated tags, use ! prefix for exclusion
}

/**
 * Read Cody configuration from the standard config file
 */
async function readCodyConfig(): Promise<any> {
  try {
    const os = await import('os');
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const configPath = path.join(os.homedir(), '.config', 'Cody-nodejs', 'config.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    // Extract relevant configuration
    const codyConfig: any = {};
    
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
    // User will need to provide via environment variables
    return {};
  }
}

/**
 * Create default config for known connectors based on environment variables and config files
 */
async function createDefaultConfig(packageName: string): Promise<any> {
  const config: any = {};
  
  // Common environment variables
  if (process.env.SRC_ACCESS_TOKEN) {
    config.accessToken = process.env.SRC_ACCESS_TOKEN;
  }
  if (process.env.SRC_ENDPOINT) {
    config.endpoint = process.env.SRC_ENDPOINT;
  }
  
  // Package-specific defaults
  switch (packageName) {
    case '@anygpt/cody': {
      // Try to read from Cody config file first
      const codyConfig = await readCodyConfig();
      Object.assign(config, codyConfig);
      
      // Fallback to environment variables and defaults
      config.endpoint = config.endpoint || 'https://sourcegraph.com/';
      break;
    }
    case '@anygpt/openai': {
      // OpenAI-specific defaults
      if (process.env.OPENAI_API_KEY) {
        config.apiKey = process.env.OPENAI_API_KEY;
      }
      config.apiUrl = config.apiUrl || process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
      break;
    }
  }
  
  return config;
}

/**
 * Dynamically import and create a connector from a package name
 */
async function createConnectorFromPackage(packageName: string, config?: any): Promise<any> {
  try {
    // Import the package
    const module = await import(packageName);
    
    // Try to get the default export (should be a factory or connector)
    const defaultExport = module.default;
    
    if (!defaultExport) {
      throw new Error(`Package ${packageName} has no default export`);
    }
    
    // Merge provided config with defaults from environment and config files
    const finalConfig = { ...(await createDefaultConfig(packageName)), ...config };
    
    // If it's a factory, create the connector
    if (typeof defaultExport === 'function') {
      // Check if it looks like a connector factory (has create method)
      if (defaultExport.prototype && typeof defaultExport.prototype.create === 'function') {
        const factory = new defaultExport();
        return factory.create(finalConfig);
      }
      // Otherwise assume it's a direct factory function
      return defaultExport(finalConfig);
    }
    
    // If it's already a connector instance
    if (typeof defaultExport === 'object' && defaultExport.listModels) {
      return defaultExport;
    }
    
    throw new Error(`Package ${packageName} does not export a valid connector or factory`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot resolve module')) {
      throw new Error(`Package ${packageName} is not installed. Install it with: npm install ${packageName}`);
    }
    throw error;
  }
}

/**
 * Check if a string looks like a package name (contains @ or / or starts with a letter)
 */
function isPackageName(provider: string): boolean {
  return provider.includes('@') || provider.includes('/') || /^[a-z]/.test(provider);
}

export async function listModelsCommand(
  context: CLIContext,
  options: ListModelsOptions
) {
  // Determine which provider to use
  const providerSpec = options.provider || context.defaults.provider;
  
  if (!providerSpec) {
    throw new Error('No provider specified. Use --provider or configure a default provider.');
  }
  
  try {
    let models: any[];
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
    
    // Resolve tags if requested or if filtering by tags
    let modelsWithTags = models;
    if (options.tags || options.filterTags) {
      const providerConfig = context.providers[providerId];
      const globalRules = context.defaults.modelRules;
      
      modelsWithTags = models.map(model => {
        const config = resolveModelConfig(model.id, providerId, providerConfig, globalRules);
        return {
          ...model,
          resolvedTags: config.tags || []
        };
      });
      
      // Apply tag filtering if specified
      if (options.filterTags) {
        const filters = options.filterTags.split(',').map(t => t.trim());
        const includeTags = filters.filter(t => !t.startsWith('!')).map(t => t.toLowerCase());
        const excludeTags = filters.filter(t => t.startsWith('!')).map(t => t.substring(1).toLowerCase());
        
        modelsWithTags = modelsWithTags.filter(model => {
          const modelTags = (model.resolvedTags || []).map(t => t.toLowerCase());
          
          // Check exclusions first
          for (const excludeTag of excludeTags) {
            if (modelTags.includes(excludeTag)) {
              return false;  // Exclude this model
            }
          }
          
          // If there are include filters, model must have at least one
          if (includeTags.length > 0) {
            return includeTags.some(includeTag => modelTags.includes(includeTag));
          }
          
          return true;  // No include filters or passed exclusions
        });
      }
    }
    
    if (options.json) {
      console.log(JSON.stringify(modelsWithTags, null, 2));
    } else {
      console.log(`\n📋 Available models from provider '${providerId}':\n`);
      
      if (modelsWithTags.length === 0) {
        console.log('  No models available');
      } else if (options.tags) {
        // Show models with tags
        for (const model of modelsWithTags) {
          console.log(`  ${model.id}`);
          if (model.resolvedTags && model.resolvedTags.length > 0) {
            console.log(`    Tags: ${model.resolvedTags.join(', ')}`);
          } else {
            console.log(`    Tags: (none)`);
          }
          console.log();
        }
      } else {
        // Find max lengths for table formatting
        const maxIdLength = Math.max(...modelsWithTags.map(m => m.id.length), 10);
        const maxProviderLength = Math.max(
          ...modelsWithTags.map(m => m.provider || ''),
          10
        );
        const maxDisplayLength = Math.max(
          ...modelsWithTags.map(m => m.display_name || ''),
          15
        );
        
        // Print table header
        console.log(`  ${'Model ID'.padEnd(maxIdLength)}  ${'Provider'.padEnd(maxProviderLength)}  ${'Display Name'.padEnd(maxDisplayLength)}`);
        console.log(`  ${'─'.repeat(maxIdLength)}  ${'─'.repeat(maxProviderLength)}  ${'─'.repeat(maxDisplayLength)}`);
        
        // Print table rows
        for (const model of modelsWithTags) {
          const provider = model.provider || '-';
          const displayName = model.display_name || '-';
          console.log(`  ${model.id.padEnd(maxIdLength)}  ${provider.padEnd(maxProviderLength)}  ${displayName.padEnd(maxDisplayLength)}`);
        }
      }
      
      console.log(`\n✅ Found ${modelsWithTags.length} model${modelsWithTags.length !== 1 ? 's' : ''}\n`);
    }
    
  } catch (error) {
    throw new Error(`Failed to list models: ${error instanceof Error ? error.message : error}`);
  }
}
