import type { CLIContext } from '../utils/cli-context.js';
import { listAvailableTags } from '@anygpt/config';

interface ListTagsOptions {
  json?: boolean;
  provider?: string;
}

/**
 * List all available tags and their model mappings from configuration
 * This makes tag resolution discoverable without calling provider APIs
 */
export async function listTagsCommand(
  context: CLIContext,
  options: ListTagsOptions
) {
  const result = listAvailableTags({
    providers: context.providers,
    aliases: context.defaults.aliases,
    defaultProvider: context.defaults.provider,
    globalModelRules: context.defaults.modelRules,
  });

  // Filter by provider if specified
  const filteredTags = options.provider
    ? result.tags.filter((t) => t.provider === options.provider)
    : result.tags;

  const filteredAliases = options.provider
    ? result.aliases.filter((a) => a.provider === options.provider)
    : result.aliases;

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          providers: result.providers,
          tags: filteredTags,
          aliases: filteredAliases,
        },
        null,
        2
      )
    );
    return;
  }

  // Human-readable output
  console.log('\n🏷️  Available Tags and Model Mappings\n');

  // Show providers
  console.log('📦 Configured Providers:');
  for (const provider of result.providers) {
    const defaultMarker = provider.isDefault ? ' (default)' : '';
    const name = provider.name ? ` - ${provider.name}` : '';
    console.log(`  • ${provider.id}${name}${defaultMarker}`);
  }
  console.log();

  // Group tags by provider
  const tagsByProvider = new Map<string, typeof filteredTags>();
  for (const tag of filteredTags) {
    if (!tagsByProvider.has(tag.provider)) {
      tagsByProvider.set(tag.provider, []);
    }
    const providerTags = tagsByProvider.get(tag.provider);
    if (providerTags) {
      providerTags.push(tag);
    }
  }

  // Group tags across all providers to show each tag once
  console.log('🏷️  Tags (showing unique tags with provider mappings):');

  // Build a map: tag -> array of {provider, providerName, model}
  const tagToProviders = new Map<
    string,
    Array<{
      provider: string;
      providerName: string;
      model: string;
      isDefault: boolean;
    }>
  >();

  for (const tagInfo of filteredTags) {
    if (!tagToProviders.has(tagInfo.tag)) {
      tagToProviders.set(tagInfo.tag, []);
    }
    const providers = tagToProviders.get(tagInfo.tag);
    if (providers) {
      providers.push({
        provider: tagInfo.provider,
        providerName: tagInfo.providerName || tagInfo.provider,
        model: tagInfo.model,
        isDefault: tagInfo.isDefault || false,
      });
    }
  }

  // Sort tags alphabetically
  const sortedTags = Array.from(tagToProviders.keys()).sort();

  for (const tag of sortedTags) {
    const providers = tagToProviders.get(tag);
    if (!providers) continue;

    if (providers.length === 1) {
      // Single provider - show inline with provider:tag syntax
      const p = providers[0];
      const defaultMarker = p.isDefault ? ' ⭐' : '';
      const providerTag = `${p.provider}:${tag}`;
      console.log(
        `  • ${tag.padEnd(15)} (${providerTag.padEnd(20)}) → ${
          p.providerName
        }${defaultMarker}: ${p.model}`
      );
    } else {
      // Multiple providers - show as list with provider:tag syntax
      console.log(`  • ${tag.padEnd(15)} → [${providers.length} providers]`);
      for (const p of providers) {
        const defaultMarker = p.isDefault ? ' ⭐' : '';
        const providerTag = `${p.provider}:${tag}`;
        console.log(
          `      - ${providerTag.padEnd(20)} → ${
            p.providerName
          }${defaultMarker}: ${p.model}`
        );
      }
    }
  }

  // Show aliases if any
  if (filteredAliases.length > 0) {
    console.log('\n🔗 Aliases:');
    for (const alias of filteredAliases) {
      const providerName = alias.providerName || alias.provider;
      if (alias.model) {
        console.log(`  • ${alias.alias} → ${providerName}:${alias.model}`);
      } else if (alias.tag && alias.resolvedModel) {
        console.log(
          `  • ${alias.alias} → ${providerName}:${alias.tag} (${alias.resolvedModel})`
        );
      } else if (alias.tag) {
        console.log(`  • ${alias.alias} → ${providerName}:${alias.tag}`);
      }
    }
  }

  console.log('\n💡 Usage Examples:');
  console.log('  # Use a tag (with resolution):');
  console.log('  anygpt chat --tag sonnet "Hello"');
  console.log('  anygpt chat --tag opus "Hello"');
  console.log();
  console.log('  # Use provider:tag syntax (recommended for clarity):');
  console.log('  anygpt chat --tag provider1:sonnet "Hello"');
  console.log('  anygpt chat --tag provider2:gemini "Hello"');
  console.log();
  console.log('  # Or specify provider separately:');
  console.log('  anygpt chat --provider provider1 --tag sonnet "Hello"');
  console.log();
  console.log('  # Use direct model name (no resolution):');
  console.log(
    '  anygpt chat --model "ml-asset:static-model/claude-sonnet-4-5" "Hello"'
  );
  console.log();

  const totalTags = new Set(filteredTags.map((t) => t.tag)).size;
  console.log(
    `✅ Found ${totalTags} unique tag${totalTags !== 1 ? 's' : ''} across ${
      tagsByProvider.size
    } provider${tagsByProvider.size !== 1 ? 's' : ''}\n`
  );
}
