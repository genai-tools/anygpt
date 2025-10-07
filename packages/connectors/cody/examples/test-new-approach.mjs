#!/usr/bin/env node

import { CodyConnector, createCodyConnector } from '../dist/index.js';

async function testNewApproach() {
  console.log('🧪 Testing new Cody connector approach (OpenAI-based)...\n');
  
  try {
    // Test 1: Direct loader function
    console.log('1️⃣ Testing createCodyConnector()...');
    const directConnector = await createCodyConnector({
      endpoint: 'https://sourcegraph.example.com/'
    });
    
    const directModels = await directConnector.listModels();
    console.log(`   ✅ Direct connector: Found ${directModels.length} models`);
    console.log(`   📝 First 3 models: ${directModels.slice(0, 3).map(m => m.id).join(', ')}`);
    
    // Test 2: Legacy CodyConnector class
    console.log('\n2️⃣ Testing CodyConnector class...');
    const legacyConnector = new CodyConnector({
      endpoint: 'https://sourcegraph.example.com/'
    });
    
    const legacyModels = await legacyConnector.listModels();
    console.log(`   ✅ Legacy connector: Found ${legacyModels.length} models`);
    console.log(`   📝 First 3 models: ${legacyModels.slice(0, 3).map(m => m.id).join(', ')}`);
    
    // Test 3: Chat completion
    console.log('\n3️⃣ Testing chat completion...');
    const chatResponse = await directConnector.chatCompletion({
      model: 'anthropic::2024-10-22::claude-3-5-sonnet-latest',
      messages: [{ role: 'user', content: 'What is 1+1?' }]
    });
    
    console.log(`   ✅ Chat response: ${chatResponse.choices[0]?.message.content?.substring(0, 50)}...`);
    console.log(`   📊 Usage: ${chatResponse.usage?.prompt_tokens} prompt + ${chatResponse.usage?.completion_tokens} completion = ${chatResponse.usage?.total_tokens} total tokens`);
    
    console.log('\n🎉 All tests passed! New approach working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testNewApproach();