/**
 * Model selection logic for benchmarking
 */

import { resolveModelConfig } from '@anygpt/config';
import type { CLIContext } from '../../utils/cli-context.js';
import type { BenchmarkOptions, ModelToTest } from './types.js';

/**
 * Select models to benchmark based on options
 */
export async function selectModels(
  context: CLIContext,
  options: BenchmarkOptions
): Promise<ModelToTest[]> {
  const { router, providers } = context;

  if (options.models) {
    return selectFromModelsList(options);
  } else if (options.model && options.provider) {
    return selectSingleModel(options);
  } else if (options.provider) {
    return await selectFromProvider(context, options);
  } else if (options.all) {
    return await selectFromAllProviders(context, options);
  } else {
    // No provider specified: use default provider (same as --provider=<default>)
    return await selectDefaultModels(context, options);
  }
}

/**
 * Parse --models flag (comma-separated list)
 */
function selectFromModelsList(options: BenchmarkOptions): ModelToTest[] {
  const modelsToTest: ModelToTest[] = [];

  if (options.provider) {
    // If --provider is also specified, treat --models as comma-separated model IDs for that provider
    const modelIds = options.models!.split(',').map((m) => m.trim());
    return modelIds.map((modelId) => ({
      provider: options.provider!,
      model: modelId,
    }));
  } else {
    // Parse comma-separated list of model specs: "provider:model,provider:model"
    // Note: model IDs can contain colons (e.g., anthropic::2024-10-22::claude-sonnet-4-latest)
    // So we split on comma first, then split on FIRST colon only
    const modelSpecs = options.models!.split(',');
    for (const spec of modelSpecs) {
      const trimmed = spec.trim();
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const provider = trimmed.substring(0, colonIndex);
        const model = trimmed.substring(colonIndex + 1);
        modelsToTest.push({ provider, model });
      }
    }
  }

  return modelsToTest;
}

/**
 * Select single model (--model and --provider)
 */
function selectSingleModel(options: BenchmarkOptions): ModelToTest[] {
  return [{ provider: options.provider!, model: options.model! }];
}

/**
 * Select all models from a specific provider
 */
async function selectFromProvider(
  context: CLIContext,
  options: BenchmarkOptions
): Promise<ModelToTest[]> {
  const { router, providers } = context;
  const provider = options.provider!;

  try {
    let models = await router.listModels(provider);
    const providerConfig = providers[provider];
    const globalRules = context.defaults?.modelRules;

    // Fallback: If connector returned no models, use config-defined models
    if (models.length === 0 && providerConfig.models) {
      context.logger.info(
        `[verbose] Provider '${provider}' connector returned no models. Using ${
          Object.keys(providerConfig.models).length
        } models from config.`
      );
      models = Object.keys(providerConfig.models).map((id) => ({
        id,
        provider,
        display_name: id,
        capabilities: {
          input: { text: true },
          output: { text: true },
        },
      }));
    }

    // Error if still no models available
    if (models.length === 0) {
      throw new Error(
        `No models available for provider '${provider}'. ` +
          `The connector does not support listing models and no models are defined in the config. ` +
          `Please add models to your config under providers.${provider}.models`
      );
    }

    // Filter models by enabled status and tags
    const modelsToTest = models
      .filter((m) => {
        const config = resolveModelConfig(
          m.id,
          provider,
          providerConfig,
          globalRules
        );
        // enabled is true by default (undefined means enabled)
        if (config.enabled === false) return false;

        // Apply tag filtering if specified
        return applyTagFilter(config.tags || [], options.filterTags);
      })
      .map((m) => ({
        provider,
        model: m.id,
      }));

    if (!options.json) {
      const filterMsg = options.filterTags
        ? ` (filtered by tags: ${options.filterTags})`
        : '';
      console.log(
        `🔍 Filtered to ${modelsToTest.length} enabled models${filterMsg}`
      );
    }

    return modelsToTest;
  } catch (error) {
    console.error(`Error listing models for provider ${provider}:`, error);
    process.exit(1);
  }
}

/**
 * Select models from all providers
 */
async function selectFromAllProviders(
  context: CLIContext,
  options: BenchmarkOptions
): Promise<ModelToTest[]> {
  const { router, providers } = context;
  const providerNames = Object.keys(providers);
  const globalRules = context.defaults?.modelRules;
  const modelsToTest: ModelToTest[] = [];

  for (const provider of providerNames) {
    try {
      const models = await router.listModels(provider);
      const providerConfig = providers[provider];

      for (const model of models) {
        // Check if model is enabled via modelRules
        const config = resolveModelConfig(
          model.id,
          provider,
          providerConfig,
          globalRules
        );
        if (config.enabled === false) continue;

        // Apply tag filtering if specified
        if (!applyTagFilter(config.tags || [], options.filterTags)) continue;

        modelsToTest.push({ provider, model: model.id });
      }
    } catch (error) {
      console.error(`Skipping provider ${provider}: ${error}`);
    }
  }

  return modelsToTest;
}

/**
 * Select models from the default provider
 * Behaves exactly like --provider=<default_provider>
 */
async function selectDefaultModels(
  context: CLIContext,
  options: BenchmarkOptions
): Promise<ModelToTest[]> {
  const { providers } = context;
  const defaultProvider = context.defaults?.provider;

  if (!defaultProvider) {
    console.error('No default provider configured');
    return [];
  }

  if (!providers[defaultProvider]) {
    console.error(`Default provider '${defaultProvider}' not found in config`);
    return [];
  }

  // Behave exactly like --provider=<default_provider>
  return await selectFromProvider(context, { ...options, provider: defaultProvider });
}

/**
 * Apply tag filtering to a model
 */
function applyTagFilter(modelTags: string[], filterTags?: string): boolean {
  if (!filterTags) return true;

  const filters = filterTags.split(',').map((t) => t.trim());
  const includeTags = filters
    .filter((t) => !t.startsWith('!'))
    .map((t) => t.toLowerCase());
  const excludeTags = filters
    .filter((t) => t.startsWith('!'))
    .map((t) => t.substring(1).toLowerCase());
  const tags = modelTags.map((t) => t.toLowerCase());

  // Check exclusions first
  for (const excludeTag of excludeTags) {
    if (tags.includes(excludeTag)) {
      return false; // Exclude this model
    }
  }

  // If there are include filters, model must have at least one
  if (includeTags.length > 0) {
    return includeTags.some((includeTag) => tags.includes(includeTag));
  }

  return true;
}
