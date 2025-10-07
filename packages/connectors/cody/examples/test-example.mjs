import { cody } from '../dist/index.js';

async function main() {
  console.log('🤖 Cody Connector Test\n');

  // Create a Cody connector instance
  // Don't specify a model - let Cody use its default
  const connector = cody();

  console.log('Provider ID:', connector.getProviderId());
  console.log('Initialized:', connector.isInitialized());
  console.log();

  // Test 1: List models (from actual CLI)
  console.log('📋 Test 1: List Models (from Cody CLI)\n');
  try {
    const models = await connector.listModels();
    console.log(`✓ Found ${models.length} models from Cody CLI:`);
    models.forEach(model => {
      console.log(`  - ${model.id} (${model.display_name})`);
    });
    console.log();
  } catch (error) {
    console.log('✗ Could not fetch models from CLI (this is expected if not authenticated)');
    console.log('  Error:', error.message);
    console.log('  Note: Models are now fetched dynamically from Cody CLI, not hardcoded!');
    console.log();
  }

  // Test 2: Simple chat
  console.log('📝 Test 2: Simple Chat\n');
  try {
    const response = await connector.chatCompletion({
      messages: [
        { role: 'user', content: 'Say hello in one sentence!' }
      ]
    });

    console.log('Response:', response.choices[0].message.content);
    console.log('Tokens used:', response.usage.total_tokens);
    console.log();
  } catch (error) {
    console.error('Error:', error.message);
  }

  console.log('✅ Tests completed!');
}

main().catch(console.error);
