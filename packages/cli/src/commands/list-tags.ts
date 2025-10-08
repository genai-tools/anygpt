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
    defaultProvider: context.defaults.provider
  });
  
  // Filter by provider if specified
  const filteredTags = options.provider 
    ? result.tags.filter(t => t.provider === options.provider)
    : result.tags;
  
  const filteredAliases = options.provider
    ? result.aliases.filter(a => a.provider === options.provider)
    : result.aliases;
  
  if (options.json) {
    console.log(JSON.stringify({
      providers: result.providers,
      tags: filteredTags,
      aliases: filteredAliases
    }, null, 2));
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
  
  // Show tags grouped by provider
  console.log('🏷️  Tags:');
  for (const [providerId, tags] of tagsByProvider) {
    const provider = result.providers.find(p => p.id === providerId);
    const providerName = provider?.name || providerId;
    const defaultMarker = provider?.isDefault ? ' (default)' : '';
    
    console.log(`\n  ${providerName}${defaultMarker}:`);
    
    // Group by tag to show all models for each tag
    const modelsByTag = new Map<string, string[]>();
    for (const tagInfo of tags) {
      if (!modelsByTag.has(tagInfo.tag)) {
        modelsByTag.set(tagInfo.tag, []);
      }
      const tagModels = modelsByTag.get(tagInfo.tag);
      if (tagModels) {
        tagModels.push(tagInfo.model);
      }
    }
    
    for (const [tag, models] of modelsByTag) {
      if (models.length === 1) {
        console.log(`    • ${tag} → ${models[0]}`);
      } else {
        console.log(`    • ${tag} → [${models.length} models]`);
        for (const model of models) {
          console.log(`        - ${model}`);
        }
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
        console.log(`  • ${alias.alias} → ${providerName}:${alias.tag} (${alias.resolvedModel})`);
      } else if (alias.tag) {
        console.log(`  • ${alias.alias} → ${providerName}:${alias.tag}`);
      }
    }
  }
  
  console.log('\n💡 Usage Examples:');
  console.log('  # Use a tag directly:');
  console.log('  anygpt chat --model sonnet "Hello"');
  console.log('  anygpt chat --model opus "Hello"');
  console.log('  # Specify provider explicitly:');
  console.log('  anygpt chat --provider provider1 --model sonnet "Hello"');
  console.log('  anygpt chat --provider provider2 --model sonnet "Hello"');
  console.log();
  console.log('  # Use provider:tag syntax (resolved automatically):');
  console.log('  anygpt chat --provider provider1 --model sonnet "Hello"');
  console.log('  anygpt chat --model provider1:opus "Hello"');
  console.log();
  
  const totalTags = new Set(filteredTags.map(t => t.tag)).size;
  console.log(`✅ Found ${totalTags} unique tag${totalTags !== 1 ? 's' : ''} across ${tagsByProvider.size} provider${tagsByProvider.size !== 1 ? 's' : ''}\n`);
}
