import { cody } from '../dist/index.js';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

async function main() {
  console.log('🤖 Cody Connector Test (with authentication)\n');

  // Load config from Cody CLI config file
  const configPath = join(homedir(), '.config/Cody-nodejs/config.json');
  let endpoint, accessToken;
  
  try {
    const configData = JSON.parse(readFileSync(configPath, 'utf-8'));
    endpoint = configData.config.auth.serverEndpoint;
    accessToken = configData.config.auth.credentials.token;
    console.log('✓ Loaded credentials from:', configPath);
    console.log('  Endpoint:', endpoint);
    console.log('  Token:', accessToken.substring(0, 20) + '...\n');
  } catch (error) {
    console.error('✗ Could not load Cody config:', error.message);
    process.exit(1);
  }

  // Create connector with authentication
  const connector = cody({
    endpoint,
    accessToken
  });

  console.log('Provider ID:', connector.getProviderId());
  console.log('Initialized:', connector.isInitialized());
  console.log();

  // Test 1: List models from actual Sourcegraph instance
  console.log('📋 Test 1: List Models from Sourcegraph\n');
  try {
    const models = await connector.listModels();
    console.log(`✓ Found ${models.length} models:`);
    models.forEach(model => {
      console.log(`  - ${model.id}`);
      console.log(`    Display: ${model.display_name}`);
    });
    console.log();
  } catch (error) {
    console.error('✗ Error listing models:', error.message);
    console.log();
  }

  // Test 2: Simple chat
  console.log('📝 Test 2: Chat Completion\n');
  try {
    const response = await connector.chatCompletion({
      messages: [
        { role: 'user', content: 'Say hello in one sentence!' }
      ]
    });

    console.log('✓ Response:', response.choices[0].message.content);
    console.log('  Model:', response.model);
    console.log('  Tokens used:', response.usage.total_tokens);
    console.log();
  } catch (error) {
    console.error('✗ Error:', error.message);
  }

  console.log('✅ Tests completed!');
}

main().catch(console.error);
