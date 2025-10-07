/**
 * Example demonstrating different connection modes for Cody connector
 * 
 * This example shows how to use API, CLI, and Auto modes
 */

import { createCodyConnector } from '../src/index.js';

async function main() {
  console.log('=== Cody Connection Modes Demo ===\n');

  // ============================================
  // 1. API Mode (Default) - Fastest
  // ============================================
  console.log('1. API Mode (Direct API calls)');
  const apiConnector = await createCodyConnector({
    connectionMode: 'api',
    endpoint: process.env.SRC_ENDPOINT || 'https://sourcegraph.com/',
    accessToken: process.env.SRC_ACCESS_TOKEN,
  });

  try {
    const apiResponse = await apiConnector.chatCompletion({
      model: 'anthropic::2024-10-22::claude-3-5-sonnet-latest',
      messages: [{ role: 'user', content: 'Say hello in one sentence' }]
    });
    console.log('✅ API Response:', apiResponse.choices[0].message.content);
  } catch (error) {
    console.error('❌ API Error:', error instanceof Error ? error.message : String(error));
  }
  console.log();

  // ============================================
  // 2. CLI Mode - Uses Cody CLI
  // ============================================
  console.log('2. CLI Mode (Uses Cody CLI)');
  const cliConnector = await createCodyConnector({
    connectionMode: 'cli',
    endpoint: process.env.SRC_ENDPOINT || 'https://sourcegraph.com/',
    accessToken: process.env.SRC_ACCESS_TOKEN,
    showContext: false,
  });

  try {
    const cliResponse = await cliConnector.chatCompletion({
      model: 'anthropic::2024-10-22::claude-3-5-sonnet-latest',
      messages: [{ role: 'user', content: 'Say hello in one sentence' }]
    });
    console.log('✅ CLI Response:', cliResponse.choices[0].message.content);
  } catch (error) {
    console.error('❌ CLI Error:', error instanceof Error ? error.message : String(error));
  }
  console.log();

  // ============================================
  // 3. Auto Mode - API with CLI fallback
  // ============================================
  console.log('3. Auto Mode (API with CLI fallback)');
  const autoConnector = await createCodyConnector({
    connectionMode: 'auto',
    endpoint: process.env.SRC_ENDPOINT || 'https://sourcegraph.com/',
    accessToken: process.env.SRC_ACCESS_TOKEN,
  });

  try {
    const autoResponse = await autoConnector.chatCompletion({
      model: 'anthropic::2024-10-22::claude-3-5-sonnet-latest',
      messages: [{ role: 'user', content: 'Say hello in one sentence' }]
    });
    console.log('✅ Auto Response:', autoResponse.choices[0].message.content);
  } catch (error) {
    console.error('❌ Auto Error:', error instanceof Error ? error.message : String(error));
  }
  console.log();

  // ============================================
  // 4. List Models (Always uses API)
  // ============================================
  console.log('4. List Available Models');
  try {
    const models = await apiConnector.listModels();
    console.log(`✅ Found ${models.length} models:`);
    models.slice(0, 5).forEach(model => {
      console.log(`   - ${model.id} (${model.display_name})`);
    });
    if (models.length > 5) {
      console.log(`   ... and ${models.length - 5} more`);
    }
  } catch (error) {
    console.error('❌ List Models Error:', error instanceof Error ? error.message : String(error));
  }
}

main().catch(console.error);
