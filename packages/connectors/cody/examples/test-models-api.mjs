#!/usr/bin/env node

import { CodyConnector } from '../dist/index.js';

async function testCodyModelsAPI() {
  console.log('Testing Cody connector with direct API access...');
  
  const connector = new CodyConnector({
    endpoint: 'https://sourcegraph.example.com/',
    accessToken: process.env.SRC_ACCESS_TOKEN || 'sgp_your-token-here'
  });

  try {
    console.log('Fetching models...');
    const models = await connector.listModels();
    
    console.log(`Found ${models.length} models:`);
    models.forEach(model => {
      console.log(`- ${model.id} (${model.display_name})`);
      console.log(`  Context: ${model.capabilities.context_length}, Max tokens: ${model.capabilities.max_output_tokens}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testCodyModelsAPI();