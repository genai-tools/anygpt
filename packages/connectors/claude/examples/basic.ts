import { claudeAgent } from '../src/index.js';

/**
 * Basic example of using Claude Agent connector
 */
async function main() {
  // Create connector with API key
  const connector = claudeAgent({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4',
    maxTokens: 4096,
  });

  // Simple chat completion
  const response = await connector.chatCompletion({
    messages: [
      { role: 'user', content: 'Hello! Can you help me understand what you can do?' }
    ],
    model: 'claude-sonnet-4',
  });

  console.log('Response:', response.choices[0].message.content);
  console.log('Usage:', response.usage);
}

main().catch(console.error);
