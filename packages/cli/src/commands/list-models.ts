import type { CLIContext } from '../utils/cli-context.js';

interface ListModelsOptions {
  provider?: string;
  json?: boolean;
}

export async function listModelsCommand(
  context: CLIContext,
  options: ListModelsOptions
) {
  // Determine which provider to use
  const providerId = options.provider || context.defaults.provider;
  
  if (!providerId) {
    throw new Error('No provider specified. Use --provider or configure a default provider.');
  }
  
  try {
    const models = await context.router.listModels(providerId);
    
    if (options.json) {
      console.log(JSON.stringify(models, null, 2));
    } else {
      console.log(`\n📋 Available models from provider '${providerId}':\n`);
      
      if (models.length === 0) {
        console.log('  No models available');
      } else {
        // Find max lengths for table formatting
        const maxIdLength = Math.max(...models.map(m => m.id.length), 10);
        const maxOwnerLength = Math.max(
          ...models.map(m => {
            const owner = m.description?.replace('Owner: ', '') || '';
            return owner.length;
          }),
          10
        );
        
        // Print table header
        console.log(`  ${'Model ID'.padEnd(maxIdLength)}  ${'Owner'.padEnd(maxOwnerLength)}`);
        console.log(`  ${'─'.repeat(maxIdLength)}  ${'─'.repeat(maxOwnerLength)}`);
        
        // Print table rows
        for (const model of models) {
          const owner = model.description?.replace('Owner: ', '') || '-';
          console.log(`  ${model.id.padEnd(maxIdLength)}  ${owner.padEnd(maxOwnerLength)}`);
        }
      }
      
      console.log(`\n✅ Found ${models.length} model${models.length !== 1 ? 's' : ''}\n`);
    }
    
  } catch (error) {
    throw new Error(`Failed to list models: ${error instanceof Error ? error.message : error}`);
  }
}
