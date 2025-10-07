import { cody } from '../src/index.js';

async function main() {
  console.log('🤖 Cody Connector Example\n');

  // Create a Cody connector instance
  const connector = cody({
    model: 'claude-3-5-sonnet-20241022',
    // Uncomment to use custom settings:
    // workingDirectory: process.cwd(),
    // showContext: true,
    // debug: true,
  });

  console.log('Provider ID:', connector.getProviderId());
  console.log('Initialized:', connector.isInitialized());
  console.log();

  // Example 1: Simple chat completion
  console.log('📝 Example 1: Simple Chat\n');
  try {
    const response1 = await connector.chatCompletion({
      messages: [
        { role: 'user', content: 'Hello! Can you introduce yourself briefly?' }
      ]
    });

    console.log('Response:', response1.choices[0].message.content);
    console.log('Tokens used:', response1.usage.total_tokens);
    console.log();
  } catch (error) {
    console.error('Error:', error);
  }

  // Example 2: Chat with system message
  console.log('📝 Example 2: Chat with System Message\n');
  try {
    const response2 = await connector.chatCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful coding assistant.' },
        { role: 'user', content: 'What is TypeScript?' }
      ]
    });

    console.log('Response:', response2.choices[0].message.content);
    console.log();
  } catch (error) {
    console.error('Error:', error);
  }

  // Example 3: List available models
  console.log('📋 Example 3: List Models\n');
  try {
    const models = await connector.listModels();
    console.log('Available models:');
    models.forEach(model => {
      console.log(`  - ${model.id} (${model.display_name})`);
    });
    console.log();
  } catch (error) {
    console.error('Error:', error);
  }

  // Example 4: Using Response API
  console.log('📝 Example 4: Response API\n');
  try {
    const response4 = await connector.response({
      model: 'claude-3-5-sonnet-20241022',
      input: 'What is the capital of France?'
    });

    console.log('Response:', response4.output[0].content?.[0].text);
    console.log('Status:', response4.status);
    console.log();
  } catch (error) {
    console.error('Error:', error);
  }

  console.log('✅ Examples completed!');
}

main().catch(console.error);
